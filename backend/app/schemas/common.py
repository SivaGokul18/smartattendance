from typing import List, Optional
from pydantic import BaseModel, ConfigDict


class BaseSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)


class StudentSchema(BaseSchema):
    id: str
    name: str
    rollNumber: str
    department: str
    year: int
    section: str
    email: str
    phone: str
    faceIdStatus: str  # "enrolled" | "pending"
    photoUrl: Optional[str] = None
    attendanceRate: float
    mentorId: Optional[str] = None
    mentorName: Optional[str] = None


class FacultySchema(BaseSchema):
    id: str
    name: str
    employeeId: str
    department: str
    email: str
    phone: str
    subjects: List[str] = []
    active: bool = True
    designation: Optional[str] = None
    isMentor: Optional[bool] = None
    mentorGroup: Optional[str] = None
    photoUrl: Optional[str] = None


class SubjectSchema(BaseSchema):
    id: str
    name: str
    code: str
    credits: int
    department: str
    assignedFacultyIds: List[str] = []
    assignedClassIds: List[str] = []


class SubjectFacultyMap(BaseSchema):
    subjectId: str
    facultyId: str


class ClassSectionSchema(BaseSchema):
    id: str
    name: str
    department: str
    year: int
    section: str
    studentCount: int
    subjectFacultyMap: List[SubjectFacultyMap] = []


class TimetableSlotSchema(BaseSchema):
    id: str
    day: str  # "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat"
    startTime: str  # "09:00"
    endTime: str    # "10:00"
    subjectId: str
    facultyId: str
    classSectionId: str
    room: str
    color: Optional[str] = "indigo"
    subjectCode: Optional[str] = None
    subjectName: Optional[str] = None
    facultyName: Optional[str] = None
    classSectionName: Optional[str] = None


class BleSessionSchema(BaseSchema):
    id: str
    facultyId: str
    facultyName: str
    classSectionId: str
    classSectionName: str
    subjectId: str
    subjectName: str
    room: str
    status: str  # "idle" | "broadcasting" | "ended"
    durationMinutes: int
    faceVerificationRequired: bool = True
    startedAt: Optional[str] = None
    checkedInStudentIds: List[str] = []
    capacity: int = 60


class AttendanceRecordSchema(BaseSchema):
    id: str
    sessionId: str
    studentId: str
    studentName: str
    rollNumber: str
    department: str
    markedAt: str
    method: str  # "ble+face" | "manual_override"
    faceVerified: bool = True
    overrideReason: Optional[str] = None


class LeaveRequestSchema(BaseSchema):
    id: str
    studentId: str
    studentName: str
    rollNumber: str
    department: str
    mentorId: str
    mentorName: str
    leaveType: str
    startDate: str
    startSession: Optional[str] = "FN"
    endDate: str
    endSession: Optional[str] = "AN"
    daysCount: Optional[float] = 1.0
    isHalfDay: Optional[bool] = False
    reason: str
    status: str  # "pending" | "approved" | "rejected"
    appliedAt: str
    reviewComment: Optional[str] = None


class FacultyLeaveRequestSchema(BaseSchema):
    id: str
    facultyId: str
    facultyName: str
    employeeId: str
    department: str
    leaveType: str
    startDate: str
    startSession: str
    endDate: str
    endSession: str
    daysCount: float
    isHalfDay: Optional[bool] = False
    reason: str
    status: str  # "pending" | "approved" | "rejected"
    appliedAt: str
    substituteFacultyId: Optional[str] = None
    substituteFacultyName: Optional[str] = None
    affectedSubjects: Optional[List[str]] = []
    reviewComment: Optional[str] = None


class AdminSettingsSchema(BaseSchema):
    bleSignalRange: float = 15.0
    bleRssiThreshold: float = -75.0
    faceConfidenceThreshold: float = 85.0
    livenessCheckEnabled: bool = True
    autoSyncOffline: bool = True
    facultyManualOverrideAllowed: bool = True
