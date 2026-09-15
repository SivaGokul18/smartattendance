from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from app.schemas.common import StudentSchema, FacultySchema, SubjectSchema, AdminSettingsSchema


class AdminDashboardResponse(BaseModel):
    totalStudents: int
    enrolledBiometricsCount: int
    totalFaculty: int
    activeFacultyCount: int
    isBroadcasting: bool
    activeSessionsCount: int
    pendingStudentLeaves: int
    pendingFacultyLeaves: int
    totalPendingLeaves: int
    totalLeavesCount: int
    avgAttendance: float
    departmentData: List[Dict[str, Any]]


class UserCreateRequest(BaseModel):
    name: str
    email: str
    password: Optional[str] = "admin123"
    role: str  # student | faculty | admin
    department: str
    phone: Optional[str] = None
    rollNumber: Optional[str] = None
    employeeId: Optional[str] = None
    year: Optional[int] = 3
    section: Optional[str] = "A"


class UserUpdateRequest(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    department: Optional[str] = None
    phone: Optional[str] = None
    active: Optional[bool] = None
    faceIdStatus: Optional[str] = None
    rollNumber: Optional[str] = None
    year: Optional[int] = None
    section: Optional[str] = None
    attendanceRate: Optional[float] = None
    mentorId: Optional[str] = None
    mentorName: Optional[str] = None
    employeeId: Optional[str] = None
    designation: Optional[str] = None
    isMentor: Optional[bool] = None
    mentorGroup: Optional[str] = None


class SubstituteAssignRequest(BaseModel):
    status: str  # "approved" | "rejected"
    substituteFacultyId: Optional[str] = None
    substituteFacultyName: Optional[str] = None
    comment: Optional[str] = None


class CourseCreateRequest(BaseModel):
    code: str
    name: str
    department: str
    credits: int = 3


class RoomCreateRequest(BaseModel):
    name: str
    beaconUuid: str
    capacity: int = 60
    defaultTxPower: float = -59.0


class AuditLogSchema(BaseModel):
    id: str
    actorId: str
    actorRole: str
    actionType: str
    targetEntity: str
    metadata: Optional[Dict[str, Any]] = None
    ipAddress: Optional[str] = None
    createdAt: str


class DepartmentSchema(BaseModel):
    id: str
    code: str
    name: str
    active: bool


class ImportPreviewRow(BaseModel):
    row_number: int
    data: Dict[str, Any]
    action: Optional[str] = "create"  # "create" | "update"
    status: str  # "valid" | "warning" | "error"
    errors: List[str]


class ImportPreviewResponse(BaseModel):
    import_type: str
    total_rows: int
    valid_rows_count: int
    warning_rows_count: int
    error_rows_count: int
    preview_rows: List[ImportPreviewRow]
    headers: List[str]


class BulkImportConfirmRequest(BaseModel):
    import_type: str  # "student" | "faculty"
    rows: List[Dict[str, Any]]


class CredentialItem(BaseModel):
    name: str
    email: str
    identifier: str
    role: str
    temporaryPassword: str
    department: str


class BulkImportConfirmResponse(BaseModel):
    imported: int
    updated: int = 0
    skipped: int
    errors: List[Dict[str, Any]]
    credentials: List[CredentialItem]
    message: str


class CourseUpdateRequest(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    department: Optional[str] = None
    credits: Optional[int] = None
    assignedFacultyIds: Optional[List[str]] = None
    assignedClassIds: Optional[List[str]] = None


class SectionCreateRequest(BaseModel):
    name: str
    department: str
    year: int = 3
    section: str = "A"
    studentCount: int = 45


class SectionUpdateRequest(BaseModel):
    name: Optional[str] = None
    department: Optional[str] = None
    year: Optional[int] = None
    section: Optional[str] = None
    studentCount: Optional[int] = None


class RoomSchema(BaseModel):
    id: str
    name: str
    beaconUuid: str
    capacity: int
    defaultTxPower: float


class RoomUpdateRequest(BaseModel):
    name: Optional[str] = None
    beaconUuid: Optional[str] = None
    capacity: Optional[int] = None
    defaultTxPower: Optional[float] = None


class SubjectFacultyMapRequest(BaseModel):
    classSectionId: str
    courseId: str
    facultyId: str


class TimetableSlotCreateRequest(BaseModel):
    sectionId: str
    courseId: str
    facultyId: str
    roomId: str
    dayOfWeek: str
    startTime: str
    endTime: str
    color: Optional[str] = "indigo"

