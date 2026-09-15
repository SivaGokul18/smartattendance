import uuid
import json
import csv
import io
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from app.core.deps import get_db, require_role
from app.core.security import get_password_hash
from app.models.user import User, Student, Faculty, RoleEnum
from app.models.academic import Department, Course, Room, ClassSection, SectionSubjectFaculty, TimetableSlot
from app.models.attendance import AttendanceSession, AttendanceRecord
from app.models.leave import LeaveRequest, FacultyLeaveRequest
from app.models.audit import AuditLog
from app.models.settings import AdminSettings
from app.schemas.admin import (
    AdminDashboardResponse,
    UserCreateRequest,
    UserUpdateRequest,
    SubstituteAssignRequest,
    CourseCreateRequest,
    CourseUpdateRequest,
    SectionCreateRequest,
    SectionUpdateRequest,
    RoomCreateRequest,
    RoomUpdateRequest,
    RoomSchema,
    SubjectFacultyMapRequest,
    TimetableSlotCreateRequest,
    AuditLogSchema,
    DepartmentSchema,
    ImportPreviewResponse,
    BulkImportConfirmRequest,
    BulkImportConfirmResponse,
)
from app.services.excel_import import generate_template, parse_and_validate_excel, process_bulk_import
from app.schemas.common import (
    StudentSchema,
    FacultySchema,
    SubjectSchema,
    ClassSectionSchema,
    TimetableSlotSchema,
    LeaveRequestSchema,
    FacultyLeaveRequestSchema,
    AdminSettingsSchema,
    BleSessionSchema,
)
from app.services.audit_service import log_audit_event
from app.websockets.session_manager import ws_manager

router = APIRouter(prefix="/admin", tags=["Admin Portal"])


@router.get("/dashboard", response_model=AdminDashboardResponse)
async def get_admin_dashboard(
    current_user: User = Depends(require_role([RoleEnum.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    # Total students
    students = (await db.execute(select(Student))).scalars().all()
    total_students = len(students)
    enrolled_bio = len([s for s in students if s.face_id_status == "enrolled"])

    # Faculty
    faculty_list = (await db.execute(select(Faculty))).scalars().all()
    total_faculty = len(faculty_list)
    active_faculty = len([f for f in faculty_list if f.active])

    # Active broadcasting sessions
    active_sessions = (await db.execute(select(AttendanceSession).where(AttendanceSession.status == "broadcasting"))).scalars().all()
    active_sessions_count = len(active_sessions)
    is_broadcasting = active_sessions_count > 0

    # Leave requests
    student_leaves = (await db.execute(select(LeaveRequest))).scalars().all()
    faculty_leaves = (await db.execute(select(FacultyLeaveRequest))).scalars().all()

    pending_stu_leaves = len([l for l in student_leaves if l.status == "pending"])
    pending_fac_leaves = len([l for l in faculty_leaves if l.status == "pending"])
    total_pending_leaves = pending_stu_leaves + pending_fac_leaves
    total_leaves_count = len(student_leaves) + len(faculty_leaves)

    # Average attendance
    avg_att = 0.0
    if students:
        avg_att = round(sum(s.attendance_rate for s in students) / len(students), 1)

    dept_data = []
    if students:
        dept_counts = {}
        for s in students:
            d_name = s.department or "General"
            if d_name not in dept_counts:
                dept_counts[d_name] = {"students": 0, "sum_rate": 0.0}
            dept_counts[d_name]["students"] += 1
            dept_counts[d_name]["sum_rate"] += (s.attendance_rate or 0.0)
        colors = ["amber", "emerald", "sky", "slate", "indigo"]
        for idx, (name, data) in enumerate(dept_counts.items()):
            rate = round(data["sum_rate"] / data["students"], 1) if data["students"] else 0.0
            dept_data.append({
                "name": name,
                "rate": rate,
                "students": data["students"],
                "trend": "0.0%",
                "color": colors[idx % len(colors)]
            })

    return AdminDashboardResponse(
        totalStudents=total_students,
        enrolledBiometricsCount=enrolled_bio,
        totalFaculty=total_faculty,
        activeFacultyCount=active_faculty,
        isBroadcasting=is_broadcasting,
        activeSessionsCount=active_sessions_count,
        pendingStudentLeaves=pending_stu_leaves,
        pendingFacultyLeaves=pending_fac_leaves,
        totalPendingLeaves=total_pending_leaves,
        totalLeavesCount=total_leaves_count,
        avgAttendance=avg_att,
        departmentData=dept_data
    )


@router.get("/students", response_model=List[StudentSchema])
async def list_students(
    current_user: User = Depends(require_role([RoleEnum.ADMIN, RoleEnum.FACULTY, RoleEnum.STUDENT])),
    db: AsyncSession = Depends(get_db)
):
    fac_stmt = select(Faculty.id, User.name).join(User, Faculty.user_id == User.id)
    fac_res = await db.execute(fac_stmt)
    faculty_names = {row[0]: row[1] for row in fac_res.all()}

    stmt = select(Student, User).join(User, Student.user_id == User.id).order_by(Student.roll_number)
    results = []
    for s, u in (await db.execute(stmt)).all():
        results.append(
            StudentSchema(
                id=s.id,
                name=u.name,
                rollNumber=s.roll_number,
                department=s.department,
                year=s.year,
                section=s.section,
                email=u.email,
                phone=u.phone or "",
                faceIdStatus=s.face_id_status,
                photoUrl=u.photo_url,
                attendanceRate=s.attendance_rate,
                mentorId=s.mentor_id,
                mentorName=faculty_names.get(s.mentor_id)
            )
        )
    return results


@router.get("/faculty", response_model=List[FacultySchema])
async def list_faculty(
    current_user: User = Depends(require_role([RoleEnum.ADMIN, RoleEnum.FACULTY, RoleEnum.STUDENT])),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Faculty, User).join(User, Faculty.user_id == User.id).order_by(Faculty.employee_id)
    results = []
    for f, u in (await db.execute(stmt)).all():
        # Get assigned subjects
        courses_res = await db.execute(
            select(Course.name)
            .join(SectionSubjectFaculty, SectionSubjectFaculty.course_id == Course.id)
            .where(SectionSubjectFaculty.faculty_id == f.id)
        )
        sub_names = [c[0] for c in courses_res.all()]
        if not sub_names:
            sub_names = ["Core Engineering"]

        results.append(
            FacultySchema(
                id=f.id,
                name=u.name,
                employeeId=f.employee_id,
                department=f.department,
                email=u.email,
                phone=u.phone or "",
                subjects=sub_names,
                active=f.active,
                designation=f.designation,
                isMentor=f.is_mentor,
                mentorGroup=f.mentor_group,
                photoUrl=u.photo_url
            )
        )
    return results


@router.get("/courses", response_model=List[SubjectSchema])
async def list_courses(
    current_user: User = Depends(require_role([RoleEnum.ADMIN, RoleEnum.FACULTY, RoleEnum.STUDENT])),
    db: AsyncSession = Depends(get_db)
):
    courses = (await db.execute(select(Course).order_by(Course.code))).scalars().all()
    results = []
    for c in courses:
        ssf_res = await db.execute(
            select(SectionSubjectFaculty.faculty_id, SectionSubjectFaculty.class_section_id)
            .where(SectionSubjectFaculty.course_id == c.id)
        )
        fac_ids = set()
        sec_ids = set()
        for f_id, s_id in ssf_res.all():
            if f_id:
                fac_ids.add(f_id)
            if s_id:
                sec_ids.add(s_id)

        slot_res = await db.execute(
            select(TimetableSlot.faculty_id, TimetableSlot.section_id)
            .where(TimetableSlot.course_id == c.id)
        )
        for f_id, s_id in slot_res.all():
            if f_id:
                fac_ids.add(f_id)
            if s_id:
                sec_ids.add(s_id)

        results.append(
            SubjectSchema(
                id=c.id,
                code=c.code,
                name=c.name,
                department=c.department,
                credits=c.credits,
                assignedFacultyIds=list(fac_ids),
                assignedClassIds=list(sec_ids),
            )
        )
    return results


@router.get("/sections", response_model=List[ClassSectionSchema])
async def list_sections(
    current_user: User = Depends(require_role([RoleEnum.ADMIN, RoleEnum.FACULTY, RoleEnum.STUDENT])),
    db: AsyncSession = Depends(get_db)
):
    sections = (await db.execute(select(ClassSection).order_by(ClassSection.name))).scalars().all()
    results = []
    for sec in sections:
        ssf_res = await db.execute(
            select(SectionSubjectFaculty.course_id, SectionSubjectFaculty.faculty_id)
            .where(SectionSubjectFaculty.class_section_id == sec.id)
        )
        pairs = set()
        for c_id, f_id in ssf_res.all():
            if c_id and f_id:
                pairs.add((c_id, f_id))

        slot_res = await db.execute(
            select(TimetableSlot.course_id, TimetableSlot.faculty_id)
            .where(TimetableSlot.section_id == sec.id)
        )
        for c_id, f_id in slot_res.all():
            if c_id and f_id:
                pairs.add((c_id, f_id))

        results.append(
            ClassSectionSchema(
                id=sec.id,
                name=sec.name,
                department=sec.department,
                year=sec.year,
                section=sec.section,
                studentCount=sec.student_count,
                subjectFacultyMap=[{"subjectId": c_id, "facultyId": f_id} for c_id, f_id in pairs],
            )
        )
    return results


@router.post("/courses", response_model=SubjectSchema)
async def create_course(
    req: CourseCreateRequest,
    current_user: User = Depends(require_role([RoleEnum.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    code_clean = req.code.strip().upper()
    existing = (await db.execute(select(Course).where(Course.code == code_clean))).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail=f"Course with code '{code_clean}' already exists")
    
    c_id = f"crs-{code_clean.lower()}-{uuid.uuid4().hex[:4]}"
    course = Course(
        id=c_id,
        code=code_clean,
        name=req.name.strip(),
        department=req.department.strip(),
        credits=req.credits
    )
    db.add(course)
    await log_audit_event(
        db=db,
        actor_id=current_user.id,
        actor_role=current_user.role,
        action_type="create_course",
        target_entity=f"course:{course.id}",
        metadata={"code": course.code, "name": course.name, "department": course.department}
    )
    await db.commit()
    return SubjectSchema(
        id=course.id,
        code=course.code,
        name=course.name,
        department=course.department,
        credits=course.credits,
        assignedFacultyIds=[],
        assignedClassIds=[]
    )


@router.put("/courses/{course_id}", response_model=SubjectSchema)
async def update_course(
    course_id: str,
    req: CourseUpdateRequest,
    current_user: User = Depends(require_role([RoleEnum.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    course = await db.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    if req.code is not None:
        course.code = req.code.strip().upper()
    if req.name is not None:
        course.name = req.name.strip()
    if req.department is not None:
        course.department = req.department.strip()
    if req.credits is not None:
        course.credits = req.credits

    await db.commit()
    await db.refresh(course)

    ssf_res = await db.execute(
        select(SectionSubjectFaculty.faculty_id, SectionSubjectFaculty.class_section_id)
        .where(SectionSubjectFaculty.course_id == course.id)
    )
    fac_ids = set()
    sec_ids = set()
    for f_id, s_id in ssf_res.all():
        if f_id:
            fac_ids.add(f_id)
        if s_id:
            sec_ids.add(s_id)

    slot_res = await db.execute(
        select(TimetableSlot.faculty_id, TimetableSlot.section_id)
        .where(TimetableSlot.course_id == course.id)
    )
    for f_id, s_id in slot_res.all():
        if f_id:
            fac_ids.add(f_id)
        if s_id:
            sec_ids.add(s_id)

    return SubjectSchema(
        id=course.id,
        code=course.code,
        name=course.name,
        department=course.department,
        credits=course.credits,
        assignedFacultyIds=list(fac_ids),
        assignedClassIds=list(sec_ids)
    )


@router.delete("/courses/{course_id}")
async def delete_course(
    course_id: str,
    current_user: User = Depends(require_role([RoleEnum.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    course = await db.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    await db.delete(course)
    await db.commit()
    return {"message": f"Course {course_id} deleted successfully"}


@router.post("/sections", response_model=ClassSectionSchema)
async def create_section(
    req: SectionCreateRequest,
    current_user: User = Depends(require_role([RoleEnum.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    dept_prefix = req.department[:3].lower()
    sec_id = f"sec-{dept_prefix}-{req.year}{req.section.lower()}-{uuid.uuid4().hex[:4]}"
    section = ClassSection(
        id=sec_id,
        name=req.name.strip(),
        department=req.department.strip(),
        year=req.year,
        section=req.section.strip().upper(),
        student_count=req.studentCount
    )
    db.add(section)
    await log_audit_event(
        db=db,
        actor_id=current_user.id,
        actor_role=current_user.role,
        action_type="create_class_section",
        target_entity=f"section:{section.id}",
        metadata={"name": section.name, "department": section.department}
    )
    await db.commit()
    return ClassSectionSchema(
        id=section.id,
        name=section.name,
        department=section.department,
        year=section.year,
        section=section.section,
        studentCount=section.student_count,
        subjectFacultyMap=[]
    )


@router.put("/sections/{section_id}", response_model=ClassSectionSchema)
async def update_section(
    section_id: str,
    req: SectionUpdateRequest,
    current_user: User = Depends(require_role([RoleEnum.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    section = await db.get(ClassSection, section_id)
    if not section:
        raise HTTPException(status_code=404, detail="Class section not found")
    
    if req.name is not None:
        section.name = req.name.strip()
    if req.department is not None:
        section.department = req.department.strip()
    if req.year is not None:
        section.year = req.year
    if req.section is not None:
        section.section = req.section.strip().upper()
    if req.studentCount is not None:
        section.student_count = req.studentCount

    await db.commit()
    await db.refresh(section)

    ssf_res = await db.execute(
        select(SectionSubjectFaculty.course_id, SectionSubjectFaculty.faculty_id)
        .where(SectionSubjectFaculty.class_section_id == section.id)
    )
    mapping = [
        {"subjectId": r[0], "facultyId": r[1]}
        for r in ssf_res.all()
    ]

    return ClassSectionSchema(
        id=section.id,
        name=section.name,
        department=section.department,
        year=section.year,
        section=section.section,
        studentCount=section.student_count,
        subjectFacultyMap=mapping
    )


@router.delete("/sections/{section_id}")
async def delete_section(
    section_id: str,
    current_user: User = Depends(require_role([RoleEnum.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    section = await db.get(ClassSection, section_id)
    if not section:
        raise HTTPException(status_code=404, detail="Class section not found")
    await db.delete(section)
    await db.commit()
    return {"message": f"Class section {section_id} deleted successfully"}


@router.get("/rooms", response_model=List[RoomSchema])
async def list_rooms(
    current_user: User = Depends(require_role([RoleEnum.ADMIN, RoleEnum.FACULTY, RoleEnum.STUDENT])),
    db: AsyncSession = Depends(get_db)
):
    rooms = (await db.execute(select(Room).order_by(Room.name))).scalars().all()
    return [
        RoomSchema(
            id=r.id,
            name=r.name,
            beaconUuid=r.beacon_uuid,
            capacity=r.capacity,
            defaultTxPower=r.default_tx_power
        )
        for r in rooms
    ]


@router.post("/rooms", response_model=RoomSchema)
async def create_room(
    req: RoomCreateRequest,
    current_user: User = Depends(require_role([RoleEnum.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    r_id = f"room-{req.name.lower().replace(' ', '-').replace('/', '-')[:12]}-{uuid.uuid4().hex[:4]}"
    room = Room(
        id=r_id,
        name=req.name.strip(),
        beacon_uuid=req.beaconUuid.strip(),
        capacity=req.capacity,
        default_tx_power=req.defaultTxPower
    )
    db.add(room)
    await db.commit()
    await db.refresh(room)
    return RoomSchema(
        id=room.id,
        name=room.name,
        beaconUuid=room.beacon_uuid,
        capacity=room.capacity,
        defaultTxPower=room.default_tx_power
    )


@router.put("/rooms/{room_id}", response_model=RoomSchema)
async def update_room(
    room_id: str,
    req: RoomUpdateRequest,
    current_user: User = Depends(require_role([RoleEnum.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    room = await db.get(Room, room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    if req.name is not None:
        room.name = req.name.strip()
    if req.beaconUuid is not None:
        room.beacon_uuid = req.beaconUuid.strip()
    if req.capacity is not None:
        room.capacity = req.capacity
    if req.defaultTxPower is not None:
        room.default_tx_power = req.defaultTxPower

    await db.commit()
    await db.refresh(room)
    return RoomSchema(
        id=room.id,
        name=room.name,
        beaconUuid=room.beacon_uuid,
        capacity=room.capacity,
        defaultTxPower=room.default_tx_power
    )


@router.delete("/rooms/{room_id}")
async def delete_room(
    room_id: str,
    current_user: User = Depends(require_role([RoleEnum.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    room = await db.get(Room, room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    await db.delete(room)
    await db.commit()
    return {"message": f"Room {room_id} deleted successfully"}


@router.post("/mapping/subject-faculty")
async def map_subject_faculty(
    req: SubjectFacultyMapRequest,
    current_user: User = Depends(require_role([RoleEnum.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    existing = (await db.execute(
        select(SectionSubjectFaculty).where(
            SectionSubjectFaculty.class_section_id == req.classSectionId,
            SectionSubjectFaculty.course_id == req.courseId
        )
    )).scalar_one_or_none()

    if existing:
        existing.faculty_id = req.facultyId
    else:
        mapping = SectionSubjectFaculty(
            id=f"ssf-{uuid.uuid4().hex[:8]}",
            class_section_id=req.classSectionId,
            course_id=req.courseId,
            faculty_id=req.facultyId
        )
        db.add(mapping)

    await db.commit()
    return {"message": "Subject-faculty-section mapping saved successfully"}


@router.post("/timetable/slot", response_model=TimetableSlotSchema)
async def create_timetable_slot(
    req: TimetableSlotCreateRequest,
    current_user: User = Depends(require_role([RoleEnum.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    # 1. Resolve Room
    rm = await db.get(Room, req.roomId)
    if not rm:
        rm = (await db.execute(select(Room).where(Room.name.ilike(req.roomId.strip())))).scalars().first()
    if not rm:
        clean_name = req.roomId.strip()
        rm = Room(
            id=f"room-{clean_name.lower().replace(' ', '-').replace('/', '-')[:12]}-{uuid.uuid4().hex[:4]}",
            name=clean_name,
            beacon_uuid=str(uuid.uuid4()),
            capacity=60,
            default_tx_power=-59.0
        )
        db.add(rm)
        await db.flush()

    # 2. Resolve Class Section
    sec = await db.get(ClassSection, req.sectionId)
    if not sec:
        sec = (await db.execute(select(ClassSection).where(ClassSection.name.ilike(req.sectionId.strip())))).scalars().first()
    if not sec:
        sec = (await db.execute(select(ClassSection))).scalars().first()
    resolved_section_id = sec.id if sec else req.sectionId

    # 3. Resolve Course
    crs = await db.get(Course, req.courseId)
    if not crs:
        crs = (await db.execute(select(Course).where(or_(Course.code.ilike(req.courseId.strip()), Course.name.ilike(req.courseId.strip()))))).scalars().first()
    if not crs:
        crs = (await db.execute(select(Course))).scalars().first()
    resolved_course_id = crs.id if crs else req.courseId

    # 4. Resolve Faculty
    fac = await db.get(Faculty, req.facultyId)
    if not fac:
        fac = (await db.execute(select(Faculty).where(Faculty.employee_id.ilike(req.facultyId.strip())))).scalars().first()
    if not fac:
        fac = (await db.execute(select(Faculty))).scalars().first()
    resolved_faculty_id = fac.id if fac else req.facultyId

    slot_id = f"slot-{uuid.uuid4().hex[:8]}"
    slot = TimetableSlot(
        id=slot_id,
        section_id=resolved_section_id,
        course_id=resolved_course_id,
        faculty_id=resolved_faculty_id,
        room_id=rm.id,
        day_of_week=req.dayOfWeek,
        start_time=req.startTime,
        end_time=req.endTime,
        color=req.color or "indigo"
    )
    db.add(slot)
    await db.commit()

    fac_user = await db.get(User, fac.user_id) if fac else None

    return TimetableSlotSchema(
        id=slot.id,
        day=slot.day_of_week,
        startTime=slot.start_time,
        endTime=slot.end_time,
        subjectId=slot.course_id,
        facultyId=slot.faculty_id,
        classSectionId=slot.section_id,
        room=rm.name,
        color=slot.color,
        subjectCode=crs.code if crs else None,
        subjectName=crs.name if crs else None,
        facultyName=fac_user.name if fac_user else None,
        classSectionName=sec.name if sec else None
    )


@router.delete("/timetable/slot/{slot_id}")
async def delete_timetable_slot(
    slot_id: str,
    current_user: User = Depends(require_role([RoleEnum.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    slot = await db.get(TimetableSlot, slot_id)
    if not slot:
        raise HTTPException(status_code=404, detail="Timetable slot not found")
    await db.delete(slot)
    await db.commit()
    return {"message": f"Timetable slot {slot_id} deleted successfully"}


@router.post("/users")
async def create_user(
    req: UserCreateRequest,
    current_user: User = Depends(require_role([RoleEnum.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    existing = (await db.execute(select(User).where(User.email == req.email.strip().lower()))).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists")

    user_id = f"usr-{uuid.uuid4().hex[:8]}"
    new_user = User(
        id=user_id,
        name=req.name,
        email=req.email.strip().lower(),
        password_hash=get_password_hash(req.password or "admin123"),
        role=req.role.lower(),
        department=req.department,
        phone=req.phone
    )
    db.add(new_user)
    await db.flush()

    if req.role.lower() == RoleEnum.STUDENT:
        roll = req.rollNumber or f"2026{req.department[:2].upper()}{uuid.uuid4().hex[:4].upper()}"
        student = Student(
            id=f"stu-{uuid.uuid4().hex[:8]}",
            user_id=new_user.id,
            roll_number=roll,
            department=req.department,
            year=req.year or 3,
            section=req.section or "A",
            attendance_rate=92.0,
            face_id_status="pending"
        )
        db.add(student)
    elif req.role.lower() == RoleEnum.FACULTY:
        emp = req.employeeId or f"FAC-{req.department[:3].upper()}-{uuid.uuid4().hex[:3].upper()}"
        fac = Faculty(
            id=f"fac-{uuid.uuid4().hex[:8]}",
            user_id=new_user.id,
            employee_id=emp,
            department=req.department,
            active=True
        )
        db.add(fac)

    await log_audit_event(
        db=db,
        actor_id=current_user.id,
        actor_role=current_user.role,
        action_type="create_user",
        target_entity=f"user:{new_user.id}",
        metadata={"role": req.role, "email": req.email, "name": req.name}
    )

    await db.commit()
    return {"id": new_user.id, "name": new_user.name, "role": new_user.role, "message": "User created successfully"}


@router.put("/users/{user_id}")
async def update_user(
    user_id: str,
    req: UserUpdateRequest,
    current_user: User = Depends(require_role([RoleEnum.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    clean_id = str(user_id).strip()
    user = await db.get(User, clean_id)
    if not user:
        user = (await db.execute(select(User).where(User.email == clean_id.lower()))).scalar_one_or_none()
    if not user:
        stu = await db.get(Student, clean_id)
        if not stu:
            stu = (await db.execute(select(Student).where(Student.roll_number == clean_id.upper()))).scalar_one_or_none()
        if stu:
            user = await db.get(User, stu.user_id)
        else:
            fac = await db.get(Faculty, clean_id)
            if not fac:
                fac = (await db.execute(select(Faculty).where(Faculty.employee_id == clean_id.upper()))).scalar_one_or_none()
            if fac:
                user = await db.get(User, fac.user_id)

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if req.name is not None:
        user.name = req.name.strip()
    if req.email is not None:
        user.email = req.email.strip().lower()
    if req.department is not None:
        user.department = req.department.strip()
    if req.phone is not None:
        user.phone = req.phone.strip()

    is_student = str(user.role).lower() == RoleEnum.STUDENT or str(user.role).lower() == "student"
    is_faculty = str(user.role).lower() == RoleEnum.FACULTY or str(user.role).lower() == "faculty"

    if is_student:
        stu = (await db.execute(select(Student).where(Student.user_id == user.id))).scalar_one_or_none()
        if stu:
            if req.rollNumber is not None:
                stu.roll_number = req.rollNumber.strip().upper()
            if req.department is not None:
                stu.department = req.department.strip()
            if req.year is not None:
                stu.year = req.year
            if req.section is not None:
                stu.section = req.section.strip().upper()
            if req.faceIdStatus is not None:
                stu.face_id_status = req.faceIdStatus
            if req.attendanceRate is not None:
                stu.attendance_rate = float(req.attendanceRate)
            if req.mentorId is not None:
                stu.mentor_id = req.mentorId
            elif req.mentorName is not None and req.mentorName.strip():
                m_fac = (await db.execute(
                    select(Faculty)
                    .join(User, Faculty.user_id == User.id)
                    .where(User.name.ilike(f"%{req.mentorName.strip()}%"))
                )).scalar_one_or_none()
                if m_fac:
                    stu.mentor_id = m_fac.id

    elif is_faculty:
        fac = (await db.execute(select(Faculty).where(Faculty.user_id == user.id))).scalar_one_or_none()
        if fac:
            if req.employeeId is not None:
                fac.employee_id = req.employeeId.strip().upper()
            if req.department is not None:
                fac.department = req.department.strip()
            if req.designation is not None:
                fac.designation = req.designation.strip()
            if req.isMentor is not None:
                fac.is_mentor = req.isMentor
            if req.mentorGroup is not None:
                fac.mentor_group = req.mentorGroup.strip()
            if req.active is not None:
                fac.active = req.active

    await log_audit_event(
        db=db,
        actor_id=current_user.id,
        actor_role=current_user.role,
        action_type="update_user",
        target_entity=f"user:{user.id}",
        metadata={"role": user.role, "email": user.email, "name": user.name}
    )

    await db.commit()
    return {"message": "User updated successfully"}


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    current_user: User = Depends(require_role([RoleEnum.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    clean_id = str(user_id).strip()
    user = await db.get(User, clean_id)
    if not user:
        user = (await db.execute(select(User).where(User.email == clean_id.lower()))).scalar_one_or_none()
    if not user:
        stu = await db.get(Student, clean_id)
        if not stu:
            stu = (await db.execute(select(Student).where(Student.roll_number == clean_id.upper()))).scalar_one_or_none()
        if stu:
            user = await db.get(User, stu.user_id)
        else:
            fac = await db.get(Faculty, clean_id)
            if not fac:
                fac = (await db.execute(select(Faculty).where(Faculty.employee_id == clean_id.upper()))).scalar_one_or_none()
            if fac:
                user = await db.get(User, fac.user_id)

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    await log_audit_event(
        db=db,
        actor_id=current_user.id,
        actor_role=current_user.role,
        action_type="delete_user",
        target_entity=f"user:{user.id}",
        metadata={"role": user.role, "email": user.email, "name": user.name}
    )

    await db.delete(user)
    await db.commit()
    return {"message": "User deleted successfully"}


@router.post("/users/bulk-import")
async def bulk_import_students(
    file: UploadFile = File(...),
    current_user: User = Depends(require_role([RoleEnum.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    content = await file.read()
    text = content.decode("utf-8-sig")
    csv_reader = csv.DictReader(io.StringIO(text))

    imported_count = 0
    for row in csv_reader:
        roll = row.get("roll_number") or row.get("rollNumber") or row.get("roll")
        name = row.get("name")
        email = row.get("email") or f"{roll.lower()}@campus.edu" if roll else f"user{uuid.uuid4().hex[:4]}@campus.edu"
        dept = row.get("department", "CSE")
        year = int(row.get("year", 3))
        sec = row.get("section", "A")

        if not name or not roll:
            continue

        existing_user = (await db.execute(select(User).where(User.email == email.strip().lower()))).scalar_one_or_none()
        if existing_user:
            continue

        u_id = f"usr-{uuid.uuid4().hex[:8]}"
        u = User(
            id=u_id,
            name=name,
            email=email.strip().lower(),
            password_hash=get_password_hash("student123"),
            role=RoleEnum.STUDENT,
            department=dept
        )
        db.add(u)
        await db.flush()

        s = Student(
            id=f"stu-{uuid.uuid4().hex[:8]}",
            user_id=u.id,
            roll_number=roll,
            department=dept,
            year=year,
            section=sec,
            attendance_rate=90.0,
            face_id_status="pending"
        )
        db.add(s)
        imported_count += 1

    await db.commit()
    return {"importedCount": imported_count, "message": f"Successfully imported {imported_count} students"}


@router.post("/sessions/{session_id}/force-end")
async def force_end_session(
    session_id: str,
    current_user: User = Depends(require_role([RoleEnum.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    session = await db.get(AttendanceSession, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    session.status = "ended"
    await log_audit_event(
        db=db,
        actor_id=current_user.id,
        actor_role=current_user.role,
        action_type="admin_force_end_session",
        target_entity=f"session:{session.id}",
        metadata={"sessionId": session.id}
    )
    await db.commit()

    await ws_manager.broadcast_session_status(
        session_id=session.id,
        status="ended",
        session_summary={"sessionId": session.id, "forceEndedByAdmin": True}
    )
    return {"message": "Attendance session terminated by institutional administrator"}


@router.get("/leave-oversight")
async def get_leave_oversight(
    current_user: User = Depends(require_role([RoleEnum.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    # 1. Student leaves
    stu_leaves = (await db.execute(
        select(LeaveRequest, Student, User)
        .outerjoin(Student, LeaveRequest.student_id == Student.id)
        .outerjoin(User, Student.user_id == User.id)
        .order_by(LeaveRequest.applied_at.desc())
    )).all()

    student_items = []
    for l, s, u in stu_leaves:
        mentor_name = "Assigned Mentor"
        if l.mentor_id:
            m_fac = await db.get(Faculty, l.mentor_id)
            if m_fac:
                m_user = await db.get(User, m_fac.user_id)
                if m_user:
                    mentor_name = m_user.name

        student_items.append({
            "id": l.id,
            "studentId": s.id if s else l.student_id,
            "studentName": u.name if u else "Student",
            "rollNumber": s.roll_number if s else "",
            "department": s.department if s else "General",
            "mentorId": l.mentor_id or "",
            "mentorName": mentor_name,
            "leaveType": l.leave_type,
            "startDate": l.start_date,
            "startSession": l.start_session,
            "endDate": l.end_date,
            "endSession": l.end_session,
            "daysCount": l.days_count,
            "isHalfDay": l.is_half_day,
            "reason": l.reason,
            "status": l.status,
            "appliedAt": l.applied_at.isoformat(),
            "reviewComment": l.review_comment
        })

    # 2. Faculty leaves
    fac_leaves = (await db.execute(
        select(FacultyLeaveRequest, Faculty, User)
        .outerjoin(Faculty, FacultyLeaveRequest.faculty_id == Faculty.id)
        .outerjoin(User, Faculty.user_id == User.id)
        .order_by(FacultyLeaveRequest.applied_at.desc())
    )).all()

    faculty_items = []
    for fl, f, u in fac_leaves:
        sub_name = None
        if fl.substitute_faculty_id:
            sub_fac = await db.get(Faculty, fl.substitute_faculty_id)
            if sub_fac:
                sub_u = await db.get(User, sub_fac.user_id)
                sub_name = sub_u.name if sub_u else None

        f_emp = f.employee_id if f else ""
        f_dept = f.department if f else "General"
        f_name = u.name if u else "Faculty Member"
        if not f and fl.faculty_id:
            f_db = await db.get(Faculty, fl.faculty_id)
            if f_db:
                f_emp = f_db.employee_id
                f_dept = f_db.department
                f_user = await db.get(User, f_db.user_id)
                if f_user:
                    f_name = f_user.name

        faculty_items.append({
            "id": fl.id,
            "facultyId": fl.faculty_id,
            "facultyName": f_name,
            "employeeId": f_emp,
            "department": f_dept,
            "leaveType": fl.leave_type,
            "startDate": fl.start_date,
            "startSession": fl.start_session,
            "endDate": fl.end_date,
            "endSession": fl.end_session,
            "daysCount": fl.days_count,
            "isHalfDay": fl.is_half_day,
            "reason": fl.reason,
            "status": fl.status,
            "appliedAt": fl.applied_at.isoformat(),
            "substituteFacultyId": fl.substitute_faculty_id,
            "substituteFacultyName": sub_name,
            "reviewComment": fl.review_comment
        })

    return {
        "studentLeaves": student_items,
        "facultyLeaves": faculty_items,
        "pendingCount": len([l for l in student_items if l["status"] == "pending"]) + len([l for l in faculty_items if l["status"] == "pending"])
    }


@router.post("/leave-oversight/{leave_id}/review")
async def review_leave_application(
    leave_id: str,
    req: SubstituteAssignRequest,
    is_faculty_leave: bool = False,
    current_user: User = Depends(require_role([RoleEnum.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    if is_faculty_leave:
        fl = await db.get(FacultyLeaveRequest, leave_id)
        if not fl:
            raise HTTPException(status_code=404, detail="Faculty leave request not found")

        fl.status = req.status
        fl.review_comment = req.comment
        if req.substituteFacultyId and req.substituteFacultyId.strip():
            sub_id = req.substituteFacultyId.strip()
            sub_fac = await db.get(Faculty, sub_id)
            if not sub_fac:
                sub_fac = (await db.execute(select(Faculty).where(
                    or_(Faculty.employee_id == sub_id, Faculty.user_id == sub_id)
                ))).scalar_one_or_none()
            fl.substitute_faculty_id = sub_fac.id if sub_fac else None
        else:
            fl.substitute_faculty_id = None

        await log_audit_event(
            db=db,
            actor_id=current_user.id,
            actor_role=current_user.role,
            action_type="faculty_leave_approval_with_substitute",
            target_entity=f"faculty_leave:{fl.id}",
            metadata={
                "status": req.status,
                "substituteFacultyId": req.substituteFacultyId,
                "substituteFacultyName": req.substituteFacultyName,
                "comment": req.comment
            }
        )
        await db.commit()
        return {"id": fl.id, "status": fl.status, "message": f"Faculty leave marked {req.status} with substitute assignment"}

    else:
        sl = await db.get(LeaveRequest, leave_id)
        if not sl:
            raise HTTPException(status_code=404, detail="Student leave request not found")

        sl.status = req.status
        sl.review_comment = req.comment
        await db.commit()
        return {"id": sl.id, "status": sl.status, "message": f"Student leave marked {req.status}"}


@router.get("/audit-logs", response_model=List[AuditLogSchema])
async def get_audit_logs(
    limit: int = 50,
    current_user: User = Depends(require_role([RoleEnum.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    logs_res = await db.execute(select(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit))
    results = []
    for al in logs_res.scalars().all():
        results.append(
            AuditLogSchema(
                id=al.id,
                actorId=al.actor_id,
                actorRole=al.actor_role,
                actionType=al.action_type,
                targetEntity=al.target_entity,
                metadata=al.metadata_json if isinstance(al.metadata_json, dict) else (json.loads(al.metadata_json) if isinstance(al.metadata_json, str) else {}),
                ipAddress=al.ip_address,
                createdAt=al.created_at.strftime("%Y-%m-%d %I:%M %p") if al.created_at else ""
            )
        )
    return results


@router.get("/settings", response_model=AdminSettingsSchema)
async def get_admin_settings(
    current_user: User = Depends(require_role([RoleEnum.ADMIN, RoleEnum.FACULTY])),
    db: AsyncSession = Depends(get_db)
):
    s = (await db.execute(select(AdminSettings))).scalar_one_or_none()
    if not s:
        s = AdminSettings()
        db.add(s)
        await db.commit()
        await db.refresh(s)

    return AdminSettingsSchema(
        bleSignalRange=s.ble_signal_range,
        bleRssiThreshold=s.ble_rssi_threshold,
        faceConfidenceThreshold=s.face_confidence_threshold,
        livenessCheckEnabled=s.liveness_check_enabled,
        autoSyncOffline=s.auto_sync_offline,
        facultyManualOverrideAllowed=s.faculty_manual_override_allowed
    )


@router.put("/settings", response_model=AdminSettingsSchema)
async def update_admin_settings(
    req: AdminSettingsSchema,
    current_user: User = Depends(require_role([RoleEnum.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    s = (await db.execute(select(AdminSettings))).scalar_one_or_none()
    if not s:
        s = AdminSettings()
        db.add(s)

    s.ble_signal_range = req.bleSignalRange
    s.ble_rssi_threshold = req.bleRssiThreshold
    s.face_confidence_threshold = req.faceConfidenceThreshold
    s.liveness_check_enabled = req.livenessCheckEnabled
    s.auto_sync_offline = req.autoSyncOffline
    s.faculty_manual_override_allowed = req.facultyManualOverrideAllowed

    await log_audit_event(
        db=db,
        actor_id=current_user.id,
        actor_role=current_user.role,
        action_type="update_institutional_settings",
        target_entity="settings:global",
        metadata=req.model_dump()
    )

    await db.commit()
    return req


@router.get("/departments", response_model=List[DepartmentSchema])
async def list_departments(
    current_user: User = Depends(require_role([RoleEnum.ADMIN, RoleEnum.FACULTY, RoleEnum.STUDENT])),
    db: AsyncSession = Depends(get_db)
):
    depts = (await db.execute(select(Department).order_by(Department.code))).scalars().all()
    return [
        DepartmentSchema(id=d.id, code=d.code, name=d.name, active=d.active)
        for d in depts
    ]


@router.get("/import/template/{import_type}")
async def download_import_template(
    import_type: str,
    current_user: User = Depends(require_role([RoleEnum.ADMIN]))
):
    """
    Downloads an Excel (.xlsx) template with preformatted headers, styling, and sample rows.
    import_type: 'student' | 'faculty'
    """
    import_type_clean = import_type.lower().strip()
    if import_type_clean not in ["student", "faculty"]:
        raise HTTPException(status_code=400, detail="Invalid template type. Use 'student' or 'faculty'.")

    stream = generate_template(import_type_clean)
    filename = f"{import_type_clean}_import_template.xlsx"

    return StreamingResponse(
        stream,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Access-Control-Expose-Headers": "Content-Disposition"
        }
    )


@router.post("/import/preview", response_model=ImportPreviewResponse)
async def preview_excel_import(
    file: UploadFile = File(...),
    import_type: str = Form("student"),
    current_user: User = Depends(require_role([RoleEnum.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    """
    Accepts uploaded .xlsx/.xls file, parses with pandas/openpyxl, validates each row
    against the schema (uniqueness, department existence, mentor email lookup),
    and returns preview with per-row status (valid, warning, error).
    Does NOT write to the database.
    """
    if not file.filename.lower().endswith((".xlsx", ".xls", ".csv")):
        raise HTTPException(status_code=400, detail="Only spreadsheet files (.xlsx, .xls, .csv) are supported.")

    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    try:
        preview_data = await parse_and_validate_excel(
            contents=contents,
            import_type=import_type.lower().strip(),
            db=db
        )
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse Excel file: {str(e)}")

    return ImportPreviewResponse(**preview_data)


@router.post("/import/confirm", response_model=BulkImportConfirmResponse)
async def confirm_excel_import(
    req: BulkImportConfirmRequest,
    current_user: User = Depends(require_role([RoleEnum.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    """
    Accepts validated rows, auto-generates temporary passwords (Welcome@<digits>),
    creates User and Student/Faculty records with must_change_password=True,
    logs to audit_logs, and returns summary and credentials list for manual distribution.
    """
    if req.import_type.lower().strip() not in ["student", "faculty"]:
        raise HTTPException(status_code=400, detail="Invalid import_type. Use 'student' or 'faculty'.")

    result = await process_bulk_import(
        import_type=req.import_type.lower().strip(),
        rows=req.rows,
        admin_user=current_user,
        db=db
    )

    return BulkImportConfirmResponse(**result)
