from typing import Optional, Union
from pydantic import BaseModel


class LoginRequest(BaseModel):
    identifier: str  # username, rollNumber, employeeId, or email
    password: str


class GoogleAuthRequest(BaseModel):
    credential: str  # Google ID Token
    target_role: Optional[str] = "student"  # 'student', 'faculty', or 'admin'



class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: str
    name: str
    email: str
    department: str
    phone: Optional[str] = None
    rollNumber: Optional[str] = None
    employeeId: Optional[str] = None
    year: Optional[Union[int, str]] = None
    section: Optional[str] = None
    attendanceRate: Optional[float] = None
    mentorId: Optional[str] = None
    mentorName: Optional[str] = None
    designation: Optional[str] = None
    isMentor: Optional[bool] = None
    mentorGroup: Optional[str] = None
    photoUrl: Optional[str] = None
    mustChangePassword: Optional[bool] = False


class ChangePasswordRequest(BaseModel):
    currentPassword: Optional[str] = None
    newPassword: str


class UserRegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    role: str  # student | faculty | admin
    department: str
    phone: Optional[str] = None
    rollNumber: Optional[str] = None
    employeeId: Optional[str] = None
    year: Optional[int] = 3
    section: Optional[str] = "A"


class UserOut(BaseModel):
    id: str
    name: str
    email: str
    role: str
    department: str
    phone: Optional[str] = None
    photoUrl: Optional[str] = None
    rollNumber: Optional[str] = None
    employeeId: Optional[str] = None
    year: Optional[int] = None
    section: Optional[str] = None
    attendanceRate: Optional[float] = None
    mentorId: Optional[str] = None
    mentorName: Optional[str] = None
    designation: Optional[str] = None
    isMentor: Optional[bool] = None
    mentorGroup: Optional[str] = None
    mustChangePassword: Optional[bool] = False

