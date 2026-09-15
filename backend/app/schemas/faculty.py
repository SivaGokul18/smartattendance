from typing import List, Optional
from pydantic import BaseModel
from app.schemas.common import TimetableSlotSchema, BleSessionSchema, AttendanceRecordSchema, LeaveRequestSchema, FacultyLeaveRequestSchema


class SessionStartRequest(BaseModel):
    classSectionId: str
    classSectionName: Optional[str] = None
    subjectId: str
    subjectName: Optional[str] = None
    room: str
    durationMinutes: int = 50
    faceVerificationRequired: bool = True
    capacity: int = 45


class SessionStartResponse(BaseModel):
    sessionId: str
    rollingToken: str
    broadcastPower: float
    session: BleSessionSchema


class ManualCheckinRequest(BaseModel):
    studentId: str
    reason: str = "Faculty Manual Override"


class SessionEndResponse(BaseModel):
    sessionId: str
    presentCount: int
    totalCount: int
    attendanceRate: float
    message: str


class LeaveApprovalRequest(BaseModel):
    status: str  # "approved" | "rejected"
    comment: Optional[str] = None


class FacultyLeaveCreateRequest(BaseModel):
    leaveType: str
    startDate: str
    startSession: str = "FN"
    endDate: str
    endSession: str = "AN"
    reason: str
    daysCount: Optional[float] = 1.0
    isHalfDay: Optional[bool] = False
    affectedSubjects: Optional[List[str]] = []


class FacultyHomeResponse(BaseModel):
    facultyName: str
    employeeId: str
    department: str
    activeSession: Optional[BleSessionSchema] = None
    todayPeriods: List[TimetableSlotSchema] = []
    pendingApprovalsCount: int = 0
    activeFacultyCount: int = 0
