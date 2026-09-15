import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from app.core.deps import get_db, require_role
from app.models.user import User, Student, Faculty, RoleEnum
from app.models.academic import TimetableSlot, Course, Room, ClassSection
from app.models.attendance import AttendanceSession, AttendanceRecord
from app.models.leave import LeaveRequest
from app.models.settings import AdminSettings
from app.schemas.student import (
    StudentHomeResponse,
    StudentVerifyRequest,
    StudentVerifyResponse,
    StudentLeaveCreateRequest,
    FaceEnrollmentRequest,
)
from app.schemas.common import TimetableSlotSchema, BleSessionSchema, LeaveRequestSchema, AttendanceRecordSchema
from app.services.ble_verification import verify_proximity, verify_session_token
from app.websockets.session_manager import ws_manager

router = APIRouter(prefix="/student", tags=["Student App"])


@router.get("/home", response_model=StudentHomeResponse)
async def get_student_home(
    current_user: User = Depends(require_role([RoleEnum.STUDENT, RoleEnum.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    # Fetch student profile
    student = (await db.execute(select(Student).where(Student.user_id == current_user.id))).scalar_one_or_none()
    if not student:
        # Fallback to demo student if admin is impersonating
        student = (await db.execute(select(Student))).scalars().first()
        if not student:
            raise HTTPException(status_code=404, detail="Student profile not found")

    # 1. Fetch Today's periods (Mon-Sat, default to current day e.g. Mon)
    from sqlalchemy import or_
    import re
    current_day = datetime.now().strftime("%a")
    slots_res = await db.execute(
        select(TimetableSlot, Course, Faculty, User, Room, ClassSection)
        .outerjoin(Course, or_(TimetableSlot.course_id == Course.id, TimetableSlot.course_id == Course.code, TimetableSlot.course_id == Course.name))
        .outerjoin(Faculty, or_(TimetableSlot.faculty_id == Faculty.id, TimetableSlot.faculty_id == Faculty.employee_id, TimetableSlot.faculty_id == Faculty.user_id))
        .outerjoin(User, or_(Faculty.user_id == User.id, TimetableSlot.faculty_id == User.id, TimetableSlot.faculty_id == User.name))
        .outerjoin(Room, or_(TimetableSlot.room_id == Room.id, TimetableSlot.room_id == Room.name))
        .outerjoin(ClassSection, or_(TimetableSlot.section_id == ClassSection.id, TimetableSlot.section_id == ClassSection.name, TimetableSlot.section_id == ClassSection.section))
        .where(TimetableSlot.day_of_week == current_day)
        .order_by(TimetableSlot.start_time)
    )
    rows = slots_res.all()

    # Fallback to all slots if current day has no classes scheduled (e.g. Sunday or off-day)
    if not rows:
        fallback_res = await db.execute(
            select(TimetableSlot, Course, Faculty, User, Room, ClassSection)
            .outerjoin(Course, or_(TimetableSlot.course_id == Course.id, TimetableSlot.course_id == Course.code, TimetableSlot.course_id == Course.name))
            .outerjoin(Faculty, or_(TimetableSlot.faculty_id == Faculty.id, TimetableSlot.faculty_id == Faculty.employee_id, TimetableSlot.faculty_id == Faculty.user_id))
            .outerjoin(User, or_(Faculty.user_id == User.id, TimetableSlot.faculty_id == User.id, TimetableSlot.faculty_id == User.name))
            .outerjoin(Room, or_(TimetableSlot.room_id == Room.id, TimetableSlot.room_id == Room.name))
            .outerjoin(ClassSection, or_(TimetableSlot.section_id == ClassSection.id, TimetableSlot.section_id == ClassSection.name, TimetableSlot.section_id == ClassSection.section))
            .order_by(TimetableSlot.day_of_week, TimetableSlot.start_time)
        )
        rows = fallback_res.all()
    
    slots_data = []
    for slot, course, fac, fac_user, room, section in rows:
        raw_fac_name = fac_user.name if fac_user else (slot.faculty_id or "Faculty Staff")
        clean_fac_name = re.sub(r'^[.\s,]+', '', str(raw_fac_name)).strip() or "Faculty Staff"
        slots_data.append(
            TimetableSlotSchema(
                id=slot.id,
                day=slot.day_of_week,
                startTime=slot.start_time,
                endTime=slot.end_time,
                subjectId=course.id if course else (slot.course_id or ""),
                subjectCode=course.code if course else (slot.course_id or "SUB"),
                subjectName=course.name if course else (slot.course_id or "Class Lecture"),
                facultyId=fac.id if fac else (slot.faculty_id or ""),
                facultyName=clean_fac_name,
                classSectionId=section.id if section else (slot.section_id or ""),
                classSectionName=section.name if section else (slot.section_id or "Class Section"),
                room=room.name if room else (slot.room_id or "LH-201"),
                color=slot.color or "indigo",
            )
        )

    # 2. Check for active BLE attendance session in range
    active_sess_res = await db.execute(
        select(AttendanceSession, Course, Faculty, User, Room, ClassSection)
        .outerjoin(Course, AttendanceSession.course_id == Course.id)
        .outerjoin(Faculty, AttendanceSession.faculty_id == Faculty.id)
        .outerjoin(User, Faculty.user_id == User.id)
        .outerjoin(Room, or_(AttendanceSession.room_id == Room.id, AttendanceSession.room_id == Room.name))
        .outerjoin(ClassSection, or_(AttendanceSession.section_id == ClassSection.id, AttendanceSession.section_id == ClassSection.name))
        .where(AttendanceSession.status == "broadcasting")
        .order_by(AttendanceSession.started_at.desc())
    )
    active_row = active_sess_res.first()
    active_session_schema = None
    if active_row:
        sess, crs, fac, fuser, rm, csec = active_row
        # Get checked-in student ids
        records_res = await db.execute(select(AttendanceRecord.student_id).where(AttendanceRecord.session_id == sess.id))
        checked_in_ids = [r[0] for r in records_res.all()]

        active_session_schema = BleSessionSchema(
            id=sess.id,
            facultyId=fac.id if fac else "",
            facultyName=fuser.name if fuser else "Faculty Staff",
            classSectionId=csec.id if csec else (sess.section_id or ""),
            classSectionName=csec.name if csec else (sess.section_id or "Section"),
            subjectId=crs.id if crs else (sess.course_id or ""),
            subjectName=crs.name if crs else "Class Lecture",
            room=rm.name if rm else (sess.room_id or "LH-201"),
            status=sess.status,
            durationMinutes=sess.duration_minutes,
            faceVerificationRequired=sess.face_verification_required,
            startedAt=sess.started_at.isoformat(),
            checkedInStudentIds=checked_in_ids,
            capacity=sess.capacity
        )

    return StudentHomeResponse(
        studentName=current_user.name,
        rollNumber=student.roll_number,
        attendanceRate=student.attendance_rate,
        streakDays=14,
        activeSessionInRange=active_session_schema,
        todayPeriods=slots_data
    )


@router.get("/timetable", response_model=List[TimetableSlotSchema])
async def get_student_timetable(
    section_id: Optional[str] = None,
    current_user: User = Depends(require_role([RoleEnum.STUDENT, RoleEnum.ADMIN, RoleEnum.FACULTY])),
    db: AsyncSession = Depends(get_db)
):
    from sqlalchemy import or_
    import re
    query = (
        select(TimetableSlot, Course, Faculty, User, Room, ClassSection)
        .outerjoin(Course, or_(TimetableSlot.course_id == Course.id, TimetableSlot.course_id == Course.code, TimetableSlot.course_id == Course.name))
        .outerjoin(Faculty, or_(TimetableSlot.faculty_id == Faculty.id, TimetableSlot.faculty_id == Faculty.employee_id, TimetableSlot.faculty_id == Faculty.user_id))
        .outerjoin(User, or_(Faculty.user_id == User.id, TimetableSlot.faculty_id == User.id, TimetableSlot.faculty_id == User.name))
        .outerjoin(Room, or_(TimetableSlot.room_id == Room.id, TimetableSlot.room_id == Room.name))
        .outerjoin(ClassSection, or_(TimetableSlot.section_id == ClassSection.id, TimetableSlot.section_id == ClassSection.name, TimetableSlot.section_id == ClassSection.section))
    )
    if section_id and section_id.lower() != "all":
        query = query.where(or_(TimetableSlot.section_id == section_id, ClassSection.name == section_id))

    query = query.order_by(TimetableSlot.day_of_week, TimetableSlot.start_time)
    slots_res = await db.execute(query)
    results = []
    for slot, course, fac, fac_user, room, section in slots_res.all():
        raw_fac_name = fac_user.name if fac_user else (slot.faculty_id or "Faculty Staff")
        clean_fac_name = re.sub(r'^[.\s,]+', '', str(raw_fac_name)).strip() or "Faculty Staff"
        results.append(
            TimetableSlotSchema(
                id=slot.id,
                day=slot.day_of_week,
                startTime=slot.start_time,
                endTime=slot.end_time,
                subjectId=course.id if course else (slot.course_id or ""),
                subjectCode=course.code if course else (slot.course_id or "SUB"),
                subjectName=course.name if course else (slot.course_id or "Class Lecture"),
                facultyId=fac.id if fac else (slot.faculty_id or ""),
                facultyName=clean_fac_name,
                classSectionId=section.id if section else (slot.section_id or ""),
                classSectionName=section.name if section else (slot.section_id or "Class Section"),
                room=room.name if room else (slot.room_id or "LH-201"),
                color=slot.color or "indigo",
            )
        )
    return results


@router.post("/attendance/verify", response_model=StudentVerifyResponse)
async def verify_student_attendance(
    req: StudentVerifyRequest,
    current_user: User = Depends(require_role([RoleEnum.STUDENT, RoleEnum.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    student = (await db.execute(select(Student).where(Student.user_id == current_user.id))).scalar_one_or_none()
    if not student:
        student = (await db.execute(select(Student))).scalars().first()
        if not student:
            raise HTTPException(status_code=404, detail="Student record not found")

    session = await db.get(AttendanceSession, req.sessionId)
    if not session:
        raise HTTPException(status_code=404, detail="Attendance session not found")

    if session.status != "broadcasting":
        raise HTTPException(status_code=400, detail="Attendance session is not currently open for check-in")

    # 1. Check if already checked in
    existing_checkin = (await db.execute(
        select(AttendanceRecord).where(
            and_(
                AttendanceRecord.session_id == session.id,
                AttendanceRecord.student_id == student.id
            )
        )
    )).scalar_one_or_none()

    if existing_checkin:
        return StudentVerifyResponse(
            success=True,
            message="Already checked in for this session",
            recordId=existing_checkin.id,
            markedAt=existing_checkin.marked_at.isoformat(),
            attendanceRate=student.attendance_rate
        )

    # 2. Get global settings
    settings_rec = (await db.execute(select(AdminSettings))).scalar_one_or_none()
    rssi_thresh = settings_rec.ble_rssi_threshold if settings_rec else -75.0
    max_range = settings_rec.ble_signal_range if settings_rec else 15.0
    conf_thresh = settings_rec.face_confidence_threshold if settings_rec else 85.0

    # 3. Server-side BLE proximity check
    if req.rssi is not None:
        prox_ok, prox_msg, _ = verify_proximity(req.rssi, max_range, rssi_thresh)
        if not prox_ok:
            raise HTTPException(status_code=400, detail=prox_msg)

    # 4. Rolling Token Verification
    token_ok, token_msg = verify_session_token(session.rolling_token, req.bleToken, session.expires_at)
    if not token_ok:
        raise HTTPException(status_code=400, detail=token_msg)

    # 5. Face Biometric Confidence validation
    if session.face_verification_required and req.faceConfidenceScore < conf_thresh:
        raise HTTPException(
            status_code=400,
            detail=f"Face verification score ({req.faceConfidenceScore}%) is below the institutional threshold ({conf_thresh}%)."
        )

    # 6. Record attendance
    record_id = f"att-{uuid.uuid4().hex[:10]}"
    now_dt = datetime.now(timezone.utc)
    new_record = AttendanceRecord(
        id=record_id,
        session_id=session.id,
        student_id=student.id,
        marked_at=now_dt,
        confidence_score=req.faceConfidenceScore,
        method=req.method,
        face_verified=req.faceVerified,
        marked_by="system"
    )
    db.add(new_record)

    # Update student attendance rate
    student.attendance_rate = min(100.0, round(student.attendance_rate + 0.5, 1))
    await db.commit()

    # 7. Real-time broadcast to WebSocket
    await ws_manager.broadcast_checkin(
        session_id=session.id,
        student_data={
            "id": new_record.id,
            "studentId": student.id,
            "studentName": current_user.name,
            "rollNumber": student.roll_number,
            "department": student.department,
            "markedAt": now_dt.strftime("%I:%M %p"),
            "method": req.method,
            "faceVerified": req.faceVerified,
            "confidenceScore": req.faceConfidenceScore
        }
    )

    return StudentVerifyResponse(
        success=True,
        message="Attendance recorded and verified successfully",
        recordId=new_record.id,
        markedAt=now_dt.isoformat(),
        attendanceRate=student.attendance_rate
    )


@router.get("/attendance/history", response_model=List[AttendanceRecordSchema])
async def get_student_history(
    current_user: User = Depends(require_role([RoleEnum.STUDENT, RoleEnum.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    student = (await db.execute(select(Student).where(Student.user_id == current_user.id))).scalar_one_or_none()
    if not student:
        student = (await db.execute(select(Student))).scalars().first()
        if not student:
            return []

    records_res = await db.execute(
        select(AttendanceRecord)
        .where(AttendanceRecord.student_id == student.id)
        .order_by(AttendanceRecord.marked_at.desc())
    )
    results = []
    for rec in records_res.scalars().all():
        results.append(
            AttendanceRecordSchema(
                id=rec.id,
                sessionId=rec.session_id,
                studentId=rec.student_id,
                studentName=current_user.name,
                rollNumber=student.roll_number,
                department=student.department,
                markedAt=rec.marked_at.strftime("%Y-%m-%d %I:%M %p"),
                method=rec.method,
                faceVerified=rec.face_verified,
                overrideReason=rec.override_reason
            )
        )
    return results


@router.post("/enrollment/face")
async def enroll_face(
    req: FaceEnrollmentRequest,
    current_user: User = Depends(require_role([RoleEnum.STUDENT, RoleEnum.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    student = (await db.execute(select(Student).where(Student.user_id == current_user.id))).scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")

    student.face_id_status = "enrolled"
    student.face_template_id = req.faceTemplateId
    await db.commit()

    return {"status": "enrolled", "message": "Biometric face template registered successfully"}


@router.post("/leave", response_model=LeaveRequestSchema)
async def create_student_leave(
    req: StudentLeaveCreateRequest,
    current_user: User = Depends(require_role([RoleEnum.STUDENT, RoleEnum.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    student = (await db.execute(select(Student).where(Student.user_id == current_user.id))).scalar_one_or_none()
    if not student:
        student = (await db.execute(select(Student))).scalars().first()
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")

    # Find mentor:
    mentor = None
    mentor_user = None

    # 1. If mentorId was sent from frontend
    if req.mentorId:
        mentor = await db.get(Faculty, req.mentorId)
        if not mentor:
            # Check if mentorId was an employeeId or user_id
            mentor = (await db.execute(select(Faculty).where(
                or_(Faculty.employee_id == req.mentorId, Faculty.user_id == req.mentorId)
            ))).scalar_one_or_none()

    # 2. Check student's registered mentor_id
    if not mentor and student.mentor_id:
        mentor = await db.get(Faculty, student.mentor_id)

    # 3. Check by mentorName if supplied
    if not mentor and req.mentorName:
        mentor = (await db.execute(
            select(Faculty).join(User, Faculty.user_id == User.id)
            .where(User.name.ilike(f"%{req.mentorName.strip()}%"))
        )).scalars().first()

    # 4. Fallback to any faculty in the same department
    if not mentor and student.department:
        mentor = (await db.execute(
            select(Faculty).where(Faculty.department == student.department)
        )).scalars().first()

    # 5. Fallback to any active faculty
    if not mentor:
        mentor = (await db.execute(select(Faculty))).scalars().first()

    if mentor:
        mentor_user = await db.get(User, mentor.user_id)
        # Ensure student has mentor_id associated in DB for future requests
        if not student.mentor_id:
            student.mentor_id = mentor.id

    mentor_name = mentor_user.name if mentor_user else (req.mentorName or "Faculty Mentor")
    mentor_id = mentor.id if mentor else None

    leave_id = f"leave-{uuid.uuid4().hex[:8]}"
    new_leave = LeaveRequest(
        id=leave_id,
        student_id=student.id,
        mentor_id=mentor_id,
        leave_type=req.leaveType,
        start_date=req.startDate,
        start_session=req.startSession or "FN",
        end_date=req.endDate,
        end_session=req.endSession or "AN",
        days_count=float(req.daysCount) if req.daysCount is not None else 1.0,
        is_half_day=bool(req.isHalfDay) if req.isHalfDay is not None else False,
        reason=req.reason,
        document_url=req.documentUrl,
        status="pending"
    )
    db.add(new_leave)
    await db.commit()
    await db.refresh(new_leave)

    return LeaveRequestSchema(
        id=new_leave.id,
        studentId=student.id,
        studentName=current_user.name,
        rollNumber=student.roll_number,
        department=student.department,
        mentorId=mentor_id or "",
        mentorName=mentor_name,
        leaveType=new_leave.leave_type,
        startDate=new_leave.start_date,
        startSession=new_leave.start_session,
        endDate=new_leave.end_date,
        endSession=new_leave.end_session,
        daysCount=new_leave.days_count,
        isHalfDay=new_leave.is_half_day,
        reason=new_leave.reason,
        status=new_leave.status,
        appliedAt=new_leave.applied_at.isoformat()
    )


@router.get("/leave", response_model=List[LeaveRequestSchema])
async def get_student_leaves(
    current_user: User = Depends(require_role([RoleEnum.STUDENT, RoleEnum.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    student = (await db.execute(select(Student).where(Student.user_id == current_user.id))).scalar_one_or_none()
    if not student:
        student = (await db.execute(select(Student))).scalars().first()
        if not student:
            return []

    leaves_res = await db.execute(
        select(LeaveRequest)
        .where(LeaveRequest.student_id == student.id)
        .order_by(LeaveRequest.applied_at.desc())
    )
    results = []
    for leave in leaves_res.scalars().all():
        mentor_user = None
        if leave.mentor_id:
            m_fac = await db.get(Faculty, leave.mentor_id)
            if m_fac:
                mentor_user = await db.get(User, m_fac.user_id)

        results.append(
            LeaveRequestSchema(
                id=leave.id,
                studentId=student.id,
                studentName=current_user.name,
                rollNumber=student.roll_number,
                department=student.department,
                mentorId=leave.mentor_id or "",
                mentorName=mentor_user.name if mentor_user else "Faculty Mentor",
                leaveType=leave.leave_type,
                startDate=leave.start_date,
                startSession=leave.start_session,
                endDate=leave.end_date,
                endSession=leave.end_session,
                daysCount=leave.days_count,
                reason=leave.reason,
                status=leave.status,
                appliedAt=leave.applied_at.isoformat(),
                reviewComment=leave.review_comment
            )
        )
    return results
