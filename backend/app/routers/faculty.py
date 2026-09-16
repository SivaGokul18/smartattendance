import uuid
from datetime import datetime, timezone, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from app.core.deps import get_db, require_role
from app.models.user import User, Student, Faculty, RoleEnum
from app.models.academic import TimetableSlot, Course, Room, ClassSection
from app.models.attendance import AttendanceSession, AttendanceRecord
from app.models.leave import LeaveRequest, FacultyLeaveRequest
from app.schemas.faculty import (
    FacultyHomeResponse,
    SessionStartRequest,
    SessionStartResponse,
    ManualCheckinRequest,
    SessionEndResponse,
    LeaveApprovalRequest,
    FacultyLeaveCreateRequest,
)
from app.schemas.common import (
    TimetableSlotSchema,
    BleSessionSchema,
    AttendanceRecordSchema,
    LeaveRequestSchema,
    FacultyLeaveRequestSchema,
)
from app.services.audit_service import log_audit_event
from app.websockets.session_manager import ws_manager

router = APIRouter(prefix="/faculty", tags=["Faculty App"])


@router.get("/home", response_model=FacultyHomeResponse)
async def get_faculty_home(
    current_user: User = Depends(require_role([RoleEnum.FACULTY, RoleEnum.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    faculty = (await db.execute(select(Faculty).where(Faculty.user_id == current_user.id))).scalar_one_or_none()
    if not faculty:
        faculty = (await db.execute(select(Faculty))).scalars().first()
        if not faculty:
            raise HTTPException(status_code=404, detail="Faculty profile not found")

    # 1. Today's periods taught by this faculty
    from sqlalchemy import or_
    current_day = datetime.now().strftime("%a")
    slots_res = await db.execute(
        select(TimetableSlot, Course, Room, ClassSection)
        .outerjoin(Course, TimetableSlot.course_id == Course.id)
        .outerjoin(Room, or_(TimetableSlot.room_id == Room.id, TimetableSlot.room_id == Room.name))
        .outerjoin(ClassSection, or_(TimetableSlot.section_id == ClassSection.id, TimetableSlot.section_id == ClassSection.name))
        .where(
            and_(
                TimetableSlot.faculty_id == faculty.id,
                TimetableSlot.day_of_week == current_day
            )
        )
        .order_by(TimetableSlot.start_time)
    )
    rows = slots_res.all()

    # Fallback to all periods taught by this faculty if none scheduled today
    if not rows:
        fallback_res = await db.execute(
            select(TimetableSlot, Course, Room, ClassSection)
            .outerjoin(Course, TimetableSlot.course_id == Course.id)
            .outerjoin(Room, or_(TimetableSlot.room_id == Room.id, TimetableSlot.room_id == Room.name))
            .outerjoin(ClassSection, or_(TimetableSlot.section_id == ClassSection.id, TimetableSlot.section_id == ClassSection.name))
            .where(TimetableSlot.faculty_id == faculty.id)
            .order_by(TimetableSlot.day_of_week, TimetableSlot.start_time)
        )
        rows = fallback_res.all()
    
    slots_data = []
    for slot, course, rm, csec in rows:
        slots_data.append(
            TimetableSlotSchema(
                id=slot.id,
                day=slot.day_of_week,
                startTime=slot.start_time,
                endTime=slot.end_time,
                subjectId=course.id if course else (slot.course_id or ""),
                subjectCode=course.code if course else (slot.course_id or "SUB"),
                subjectName=course.name if course else (slot.course_id or "Class Lecture"),
                facultyId=faculty.id,
                classSectionId=csec.id if csec else (slot.section_id or ""),
                classSectionName=csec.name if csec else (slot.section_id or "Class Section"),
                room=rm.name if rm else (slot.room_id or "LH-201"),
                color=slot.color or "indigo",
                facultyName=current_user.name
            )
        )

    # 2. Check for active broadcasting session
    active_sess_res = await db.execute(
        select(AttendanceSession, Course, Room, ClassSection)
        .outerjoin(Course, AttendanceSession.course_id == Course.id)
        .outerjoin(Room, or_(AttendanceSession.room_id == Room.id, AttendanceSession.room_id == Room.name))
        .outerjoin(ClassSection, or_(AttendanceSession.section_id == ClassSection.id, AttendanceSession.section_id == ClassSection.name))
        .where(
            and_(
                AttendanceSession.faculty_id == faculty.id,
                AttendanceSession.status == "broadcasting"
            )
        )
        .order_by(AttendanceSession.started_at.desc())
    )
    active_row = active_sess_res.first()
    active_session_schema = None
    if active_row:
        sess, crs, rm, csec = active_row
        records_res = await db.execute(select(AttendanceRecord.student_id).where(AttendanceRecord.session_id == sess.id))
        checked_in_ids = [r[0] for r in records_res.all()]

        active_session_schema = BleSessionSchema(
            id=sess.id,
            facultyId=faculty.id,
            facultyName=current_user.name,
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

    # 3. Pending approvals count
    approvals_res = await db.execute(
        select(LeaveRequest).where(
            and_(
                LeaveRequest.mentor_id == faculty.id,
                LeaveRequest.status == "pending"
            )
        )
    )
    pending_count = len(approvals_res.scalars().all())

    # 4. Total active faculty count
    total_active_fac = (await db.execute(select(Faculty).where(Faculty.active == True))).scalars().all()

    return FacultyHomeResponse(
        facultyName=current_user.name,
        employeeId=faculty.employee_id,
        department=faculty.department,
        activeSession=active_session_schema,
        todayPeriods=slots_data,
        pendingApprovalsCount=pending_count,
        activeFacultyCount=len(total_active_fac)
    )


@router.get("/timetable", response_model=List[TimetableSlotSchema])
async def get_faculty_timetable(
    faculty_id: Optional[str] = None,
    current_user: User = Depends(require_role([RoleEnum.FACULTY, RoleEnum.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    from sqlalchemy import or_
    target_faculty_id = faculty_id
    if not target_faculty_id:
        fac = (await db.execute(select(Faculty).where(Faculty.user_id == current_user.id))).scalar_one_or_none()
        if fac:
            target_faculty_id = fac.id

    query = (
        select(TimetableSlot, Course, Faculty, User, Room, ClassSection)
        .outerjoin(Course, TimetableSlot.course_id == Course.id)
        .outerjoin(Faculty, TimetableSlot.faculty_id == Faculty.id)
        .outerjoin(User, Faculty.user_id == User.id)
        .outerjoin(Room, or_(TimetableSlot.room_id == Room.id, TimetableSlot.room_id == Room.name))
        .outerjoin(ClassSection, or_(TimetableSlot.section_id == ClassSection.id, TimetableSlot.section_id == ClassSection.name))
    )
    if target_faculty_id:
        query = query.where(TimetableSlot.faculty_id == target_faculty_id)

    query = query.order_by(TimetableSlot.day_of_week, TimetableSlot.start_time)
    slots_res = await db.execute(query)
    results = []
    for slot, course, fac, fac_user, room, section in slots_res.all():
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
                facultyName=fac_user.name if fac_user else "Faculty Staff",
                classSectionId=section.id if section else (slot.section_id or ""),
                classSectionName=section.name if section else (slot.section_id or "Class Section"),
                room=room.name if room else (slot.room_id or "LH-201"),
                color=slot.color or "indigo",
            )
        )
    return results


@router.post("/session/start", response_model=SessionStartResponse)
async def start_attendance_session(
    req: SessionStartRequest,
    current_user: User = Depends(require_role([RoleEnum.FACULTY, RoleEnum.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    faculty = (await db.execute(select(Faculty).where(Faculty.user_id == current_user.id))).scalar_one_or_none()
    if not faculty:
        faculty = (await db.execute(select(Faculty))).scalars().first()
        if not faculty:
            raise HTTPException(status_code=404, detail="Faculty profile not found")

    # End any previously active session for this faculty
    past_active = (await db.execute(
        select(AttendanceSession).where(
            and_(
                AttendanceSession.faculty_id == faculty.id,
                AttendanceSession.status == "broadcasting"
            )
        )
    )).scalars().all()
    for s in past_active:
        s.status = "ended"

    # Find room
    room = (await db.execute(select(Room).where(Room.name == req.room))).scalar_one_or_none()
    if not room:
        room = (await db.execute(select(Room))).scalars().first()

    course = await db.get(Course, req.subjectId)
    if not course:
        course = (await db.execute(select(Course))).scalars().first()

    class_sec = await db.get(ClassSection, req.classSectionId)
    if not class_sec:
        class_sec = (await db.execute(select(ClassSection))).scalars().first()

    session_id = f"sess-{uuid.uuid4().hex[:8]}"
    now_dt = datetime.now(timezone.utc)
    expires_dt = now_dt + timedelta(minutes=req.durationMinutes)
    rolling_token = f"TOKEN-{course.code if course else 'GEN'}-{uuid.uuid4().hex[:6].upper()}"

    new_session = AttendanceSession(
        id=session_id,
        section_id=class_sec.id if class_sec else "sec-1",
        course_id=course.id if course else "sub-1",
        faculty_id=faculty.id,
        room_id=room.id if room else "room-1",
        started_at=now_dt,
        expires_at=expires_dt,
        status="broadcasting",
        broadcast_power=room.default_tx_power if room else -59.0,
        rolling_token=rolling_token,
        duration_minutes=req.durationMinutes,
        face_verification_required=req.faceVerificationRequired,
        capacity=req.capacity
    )
    db.add(new_session)
    await db.commit()
    await db.refresh(new_session)

    session_schema = BleSessionSchema(
        id=new_session.id,
        facultyId=faculty.id,
        facultyName=current_user.name,
        classSectionId=class_sec.id if class_sec else "",
        classSectionName=class_sec.name if class_sec else "Class Section",
        subjectId=course.id if course else "",
        subjectName=course.name if course else "Course",
        room=room.name if room else req.room,
        status=new_session.status,
        durationMinutes=new_session.duration_minutes,
        faceVerificationRequired=new_session.face_verification_required,
        startedAt=new_session.started_at.isoformat(),
        checkedInStudentIds=[],
        capacity=new_session.capacity
    )

    # Broadcast session start event to WebSockets
    await ws_manager.broadcast_session_status(
        session_id=new_session.id,
        status="broadcasting",
        session_summary=session_schema.model_dump()
    )

    return SessionStartResponse(
        sessionId=new_session.id,
        rollingToken=rolling_token,
        broadcastPower=new_session.broadcast_power,
        session=session_schema
    )


@router.post("/session/{session_id}/manual-checkin", response_model=AttendanceRecordSchema)
async def manual_checkin_student(
    session_id: str,
    req: ManualCheckinRequest,
    current_user: User = Depends(require_role([RoleEnum.FACULTY, RoleEnum.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    session = await db.get(AttendanceSession, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Attendance session not found")

    student = await db.get(Student, req.studentId)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    student_user = await db.get(User, student.user_id)

    # Check if already present
    existing = (await db.execute(
        select(AttendanceRecord).where(
            and_(
                AttendanceRecord.session_id == session.id,
                AttendanceRecord.student_id == student.id
            )
        )
    )).scalar_one_or_none()

    if existing:
        return AttendanceRecordSchema(
            id=existing.id,
            sessionId=existing.session_id,
            studentId=existing.student_id,
            studentName=student_user.name if student_user else "Student",
            rollNumber=student.roll_number,
            department=student.department,
            markedAt=existing.marked_at.strftime("%I:%M %p"),
            method=existing.method,
            faceVerified=existing.face_verified,
            overrideReason=existing.override_reason
        )

    record_id = f"att-override-{uuid.uuid4().hex[:8]}"
    now_dt = datetime.now(timezone.utc)
    new_record = AttendanceRecord(
        id=record_id,
        session_id=session.id,
        student_id=student.id,
        marked_at=now_dt,
        confidence_score=100.0,
        method="manual_override",
        face_verified=True,
        marked_by=current_user.email,
        override_reason=req.reason
    )
    db.add(new_record)
    student.attendance_rate = min(100.0, round(student.attendance_rate + 0.5, 1))

    # Log to audit trail
    await log_audit_event(
        db=db,
        actor_id=current_user.id,
        actor_role=current_user.role,
        action_type="manual_attendance_override",
        target_entity=f"student:{student.id}",
        metadata={
            "sessionId": session_id,
            "studentName": student_user.name if student_user else "",
            "rollNumber": student.roll_number,
            "reason": req.reason
        }
    )

    await db.commit()

    # Broadcast to live streams
    await ws_manager.broadcast_checkin(
        session_id=session.id,
        student_data={
            "id": new_record.id,
            "studentId": student.id,
            "studentName": student_user.name if student_user else "Student",
            "rollNumber": student.roll_number,
            "department": student.department,
            "markedAt": now_dt.strftime("%I:%M %p"),
            "method": "manual_override",
            "faceVerified": True,
            "overrideReason": req.reason
        }
    )

    return AttendanceRecordSchema(
        id=new_record.id,
        sessionId=new_record.session_id,
        studentId=student.id,
        studentName=student_user.name if student_user else "Student",
        rollNumber=student.roll_number,
        department=student.department,
        markedAt=now_dt.strftime("%I:%M %p"),
        method=new_record.method,
        faceVerified=new_record.face_verified,
        overrideReason=new_record.override_reason
    )


@router.post("/session/{session_id}/end", response_model=SessionEndResponse)
async def end_attendance_session(
    session_id: str,
    current_user: User = Depends(require_role([RoleEnum.FACULTY, RoleEnum.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    session = await db.get(AttendanceSession, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Attendance session not found")

    session.status = "ended"
    
    # Count attendees
    records_res = await db.execute(select(AttendanceRecord).where(AttendanceRecord.session_id == session.id))
    present_records = records_res.scalars().all()
    present_count = len(present_records)
    total_count = session.capacity or 45
    rate = round((present_count / total_count) * 100.0, 1) if total_count > 0 else 0.0

    await db.commit()

    # Broadcast session ended
    await ws_manager.broadcast_session_status(
        session_id=session.id,
        status="ended",
        session_summary={
            "sessionId": session.id,
            "presentCount": present_count,
            "totalCount": total_count,
            "attendanceRate": rate
        }
    )

    return SessionEndResponse(
        sessionId=session.id,
        presentCount=present_count,
        totalCount=total_count,
        attendanceRate=rate,
        message="Session finalized and archived successfully"
    )


@router.get("/history")
async def get_faculty_history(
    current_user: User = Depends(require_role([RoleEnum.FACULTY, RoleEnum.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    sessions_res = await db.execute(
        select(AttendanceSession, Course, ClassSection, Room)
        .join(Course, AttendanceSession.course_id == Course.id)
        .join(ClassSection, AttendanceSession.section_id == ClassSection.id)
        .join(Room, AttendanceSession.room_id == Room.id)
        .order_by(AttendanceSession.started_at.desc())
        .limit(20)
    )
    
    history_items = []
    for sess, course, csec, rm in sessions_res.all():
        recs = (await db.execute(select(AttendanceRecord).where(AttendanceRecord.session_id == sess.id))).scalars().all()
        present_count = len(recs)
        total_count = sess.capacity or 45
        rate = round((present_count / total_count) * 100) if total_count > 0 else 0

        history_items.append({
            "id": sess.id,
            "subjectName": course.name,
            "subjectCode": course.code,
            "className": csec.name,
            "date": sess.started_at.strftime("%d %b %Y"),
            "dateStr": sess.started_at.strftime("%Y-%m-%d"),
            "time": sess.started_at.strftime("%I:%M %p"),
            "room": rm.name,
            "presentCount": present_count,
            "totalCount": total_count,
            "attendanceRate": rate
        })
    return history_items


@router.get("/approvals", response_model=List[LeaveRequestSchema])
async def get_faculty_approvals(
    status_filter: Optional[str] = None,
    faculty_id: Optional[str] = None,
    current_user: User = Depends(require_role([RoleEnum.FACULTY, RoleEnum.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    faculty = (await db.execute(select(Faculty).where(Faculty.user_id == current_user.id))).scalar_one_or_none()
    
    # If faculty_id query param is supplied (e.g. from faculty switcher), find that faculty
    target_faculty = None
    if faculty_id:
        target_faculty = await db.get(Faculty, faculty_id)
        if not target_faculty:
            target_faculty = (await db.execute(select(Faculty).where(
                or_(Faculty.employee_id == faculty_id, Faculty.user_id == faculty_id)
            ))).scalar_one_or_none()
    
    active_faculty = target_faculty or faculty

    # Collect all faculty record IDs that belong to this mentor (supports personal SSO vs campus email)
    mentor_faculty_ids = set()
    if active_faculty:
        mentor_faculty_ids.add(active_faculty.id)
    if faculty:
        mentor_faculty_ids.add(faculty.id)

    clean_user_name = current_user.name.replace("Dr.", "").replace("Prof.", "").replace("Mr.", "").replace("Mrs.", "").replace("Ms.", "").strip().lower()
    if clean_user_name:
        matching_facs = (await db.execute(
            select(Faculty.id)
            .join(User, Faculty.user_id == User.id)
            .where(
                or_(
                    User.email == current_user.email,
                    User.name.ilike(f"%{clean_user_name}%"),
                    Faculty.employee_id == (active_faculty.employee_id if active_faculty else "")
                )
            )
        )).scalars().all()
        for fid in matching_facs:
            mentor_faculty_ids.add(fid)

    query = select(LeaveRequest, Student, User).join(Student, LeaveRequest.student_id == Student.id).join(User, Student.user_id == User.id)
    if mentor_faculty_ids and current_user.role == RoleEnum.FACULTY:
        dept = active_faculty.department if active_faculty else current_user.department
        query = query.where(
            or_(
                LeaveRequest.mentor_id.in_(list(mentor_faculty_ids)),
                Student.mentor_id.in_(list(mentor_faculty_ids)),
                and_(LeaveRequest.mentor_id == None, Student.department == dept)
            )
        )
    
    if status_filter and status_filter != "all":
        query = query.where(LeaveRequest.status == status_filter)

    query = query.order_by(LeaveRequest.applied_at.desc())
    results = []
    for leave, student, s_user in (await db.execute(query)).all():
        m_name = "Faculty Mentor"
        if leave.mentor_id:
            m_fac = await db.get(Faculty, leave.mentor_id)
            if m_fac:
                m_user = await db.get(User, m_fac.user_id)
                if m_user:
                    m_name = m_user.name
        elif active_faculty:
            act_user = await db.get(User, active_faculty.user_id)
            if act_user:
                m_name = act_user.name

        results.append(
            LeaveRequestSchema(
                id=leave.id,
                studentId=student.id,
                studentName=s_user.name,
                rollNumber=student.roll_number,
                department=student.department,
                mentorId=leave.mentor_id or (active_faculty.id if active_faculty else ""),
                mentorName=m_name,
                leaveType=leave.leave_type,
                startDate=leave.start_date,
                startSession=leave.start_session,
                endDate=leave.end_date,
                endSession=leave.end_session,
                daysCount=leave.days_count,
                isHalfDay=leave.is_half_day,
                reason=leave.reason,
                status=leave.status,
                appliedAt=leave.applied_at.isoformat(),
                reviewComment=leave.review_comment
            )
        )
    return results


@router.post("/approvals/{leave_id}")
async def review_student_leave(
    leave_id: str,
    req: LeaveApprovalRequest,
    current_user: User = Depends(require_role([RoleEnum.FACULTY, RoleEnum.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    leave = await db.get(LeaveRequest, leave_id)
    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found")

    leave.status = req.status
    leave.review_comment = req.comment

    # Log action
    await log_audit_event(
        db=db,
        actor_id=current_user.id,
        actor_role=current_user.role,
        action_type="student_leave_review",
        target_entity=f"leave:{leave.id}",
        metadata={"decision": req.status, "comment": req.comment}
    )

    await db.commit()
    return {"id": leave.id, "status": leave.status, "message": f"Leave request marked {req.status}"}


@router.get("/leave", response_model=List[FacultyLeaveRequestSchema])
async def get_faculty_leaves(
    current_user: User = Depends(require_role([RoleEnum.FACULTY, RoleEnum.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    faculty = (await db.execute(select(Faculty).where(Faculty.user_id == current_user.id))).scalar_one_or_none()
    if not faculty:
        faculty = (await db.execute(select(Faculty))).scalars().first()

    query = select(FacultyLeaveRequest).order_by(FacultyLeaveRequest.applied_at.desc())
    if faculty and current_user.role == RoleEnum.FACULTY:
        query = query.where(FacultyLeaveRequest.faculty_id == faculty.id)

    results = []
    for fl in (await db.execute(query)).scalars().all():
        fac = await db.get(Faculty, fl.faculty_id)
        fac_user = await db.get(User, fac.user_id) if fac else None

        sub_user = None
        if fl.substitute_faculty_id:
            sub_fac = await db.get(Faculty, fl.substitute_faculty_id)
            if sub_fac:
                sub_user = await db.get(User, sub_fac.user_id)

        results.append(
            FacultyLeaveRequestSchema(
                id=fl.id,
                facultyId=fl.faculty_id,
                facultyName=fac_user.name if fac_user else "Faculty",
                employeeId=fac.employee_id if fac else "",
                department=fac.department if fac else "CSE",
                leaveType=fl.leave_type,
                startDate=fl.start_date,
                startSession=fl.start_session,
                endDate=fl.end_date,
                endSession=fl.end_session,
                daysCount=fl.days_count,
                reason=fl.reason,
                status=fl.status,
                appliedAt=fl.applied_at.isoformat(),
                substituteFacultyId=fl.substitute_faculty_id,
                substituteFacultyName=sub_user.name if sub_user else None,
                reviewComment=fl.review_comment
            )
        )
    return results


@router.post("/leave", response_model=FacultyLeaveRequestSchema)
async def create_faculty_leave(
    req: FacultyLeaveCreateRequest,
    current_user: User = Depends(require_role([RoleEnum.FACULTY, RoleEnum.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    faculty = (await db.execute(select(Faculty).where(Faculty.user_id == current_user.id))).scalar_one_or_none()
    if not faculty:
        faculty = (await db.execute(select(Faculty))).scalars().first()
        if not faculty:
            raise HTTPException(status_code=404, detail="Faculty profile not found")

    leave_id = f"fac-leave-{uuid.uuid4().hex[:8]}"
    new_fl = FacultyLeaveRequest(
        id=leave_id,
        faculty_id=faculty.id,
        leave_type=req.leaveType,
        start_date=req.startDate,
        start_session=req.startSession,
        end_date=req.endDate,
        end_session=req.endSession,
        days_count=float(req.daysCount) if req.daysCount is not None else 1.0,
        is_half_day=bool(req.isHalfDay) if req.isHalfDay is not None else False,
        reason=req.reason,
        status="pending",
        affected_subjects_json=",".join(req.affectedSubjects or [])
    )
    db.add(new_fl)
    await db.commit()
    await db.refresh(new_fl)

    return FacultyLeaveRequestSchema(
        id=new_fl.id,
        facultyId=faculty.id,
        facultyName=current_user.name,
        employeeId=faculty.employee_id,
        department=faculty.department,
        leaveType=new_fl.leave_type,
        startDate=new_fl.start_date,
        startSession=new_fl.start_session,
        endDate=new_fl.end_date,
        endSession=new_fl.end_session,
        daysCount=new_fl.days_count,
        isHalfDay=new_fl.is_half_day,
        reason=new_fl.reason,
        status=new_fl.status,
        appliedAt=new_fl.applied_at.isoformat(),
        affectedSubjects=req.affectedSubjects
    )


@router.delete("/leave/{leave_id}")
async def cancel_faculty_leave(
    leave_id: str,
    current_user: User = Depends(require_role([RoleEnum.FACULTY, RoleEnum.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    leave = await db.get(FacultyLeaveRequest, leave_id)
    if not leave:
        raise HTTPException(status_code=404, detail="Faculty leave request not found")

    if leave.status != "pending":
        raise HTTPException(status_code=400, detail="Cannot cancel already approved/rejected leave request")

    await db.delete(leave)
    await db.commit()
    return {"message": "Faculty leave request cancelled successfully"}
