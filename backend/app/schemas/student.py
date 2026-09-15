from typing import List, Optional
from pydantic import BaseModel
from app.schemas.common import TimetableSlotSchema, BleSessionSchema, LeaveRequestSchema


class StudentVerifyRequest(BaseModel):
    sessionId: str
    bleToken: Optional[str] = None
    rssi: Optional[float] = -65.0
    distanceMeters: Optional[float] = 2.5
    faceConfidenceScore: float = 94.0
    faceVerified: bool = True
    method: str = "ble+face"


class StudentVerifyResponse(BaseModel):
    success: bool
    message: str
    recordId: str
    markedAt: str
    attendanceRate: float


class StudentLeaveCreateRequest(BaseModel):
    leaveType: str
    startDate: str
    startSession: Optional[str] = "FN"
    endDate: str
    endSession: Optional[str] = "AN"
    reason: str
    mentorId: Optional[str] = None
    mentorName: Optional[str] = None
    daysCount: Optional[float] = 1.0
    isHalfDay: Optional[bool] = False
    documentUrl: Optional[str] = None


class FaceEnrollmentRequest(BaseModel):
    faceTemplateId: str = "FACE-TEMPLATE-ENROLLED-2026"


class StudentHomeResponse(BaseModel):
    studentName: str
    rollNumber: str
    attendanceRate: float
    streakDays: int = 14
    activeSessionInRange: Optional[BleSessionSchema] = None
    todayPeriods: List[TimetableSlotSchema] = []
