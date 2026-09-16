from datetime import datetime, timezone
import enum
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.core.database import Base


class RoleEnum(str, enum.Enum):
    ADMIN = "admin"
    FACULTY = "faculty"
    STUDENT = "student"


class User(Base):
    __tablename__ = "users"

    id = Column(String(64), primary_key=True, index=True)
    name = Column(String(128), nullable=False)
    email = Column(String(128), unique=True, index=True, nullable=False)
    password_hash = Column(String(256), nullable=False)
    role = Column(String(32), default=RoleEnum.STUDENT, nullable=False, index=True)
    department = Column(String(64), nullable=False, default="General")
    phone = Column(String(32), nullable=True)
    photo_url = Column(String(512), nullable=True)
    must_change_password = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    student_profile = relationship("Student", back_populates="user", uselist=False, cascade="all, delete-orphan")
    faculty_profile = relationship("Faculty", back_populates="user", uselist=False, cascade="all, delete-orphan", foreign_keys="[Faculty.user_id]")


class Student(Base):
    __tablename__ = "students"

    id = Column(String(64), primary_key=True, index=True)
    user_id = Column(String(64), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    roll_number = Column(String(64), unique=True, index=True, nullable=False)
    department = Column(String(64), nullable=False)
    year = Column(Integer, default=3, nullable=False)
    section = Column(String(16), default="A", nullable=False)
    attendance_rate = Column(Float, default=92.0, nullable=False)
    face_id_status = Column(String(32), default="pending", nullable=False)  # enrolled | pending
    face_template_id = Column(String(128), nullable=True)
    mentor_id = Column(String(64), ForeignKey("faculty.id", ondelete="SET NULL"), nullable=True)

    # Relationships
    user = relationship("User", back_populates="student_profile")
    mentor = relationship("Faculty", foreign_keys=[mentor_id])
    attendance_records = relationship("AttendanceRecord", back_populates="student", cascade="all, delete-orphan")
    leave_requests = relationship("LeaveRequest", back_populates="student", cascade="all, delete-orphan")


class Faculty(Base):
    __tablename__ = "faculty"

    id = Column(String(64), primary_key=True, index=True)
    user_id = Column(String(64), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    employee_id = Column(String(64), unique=True, index=True, nullable=False)
    department = Column(String(64), nullable=False)
    designation = Column(String(128), nullable=True, default="Faculty")
    active = Column(Boolean, default=True, nullable=False)
    is_mentor = Column(Boolean, default=False, nullable=False)
    mentor_group = Column(String(64), nullable=True)

    # Relationships
    user = relationship("User", back_populates="faculty_profile", foreign_keys=[user_id])
    sessions = relationship("AttendanceSession", back_populates="faculty")
    timetable_slots = relationship("TimetableSlot", back_populates="faculty")
