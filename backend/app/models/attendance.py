from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class AttendanceSession(Base):
    __tablename__ = "attendance_sessions"

    id = Column(String(64), primary_key=True, index=True)
    section_id = Column(String(64), ForeignKey("class_sections.id", ondelete="CASCADE"), nullable=False)
    course_id = Column(String(64), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    faculty_id = Column(String(64), ForeignKey("faculty.id", ondelete="CASCADE"), nullable=False)
    room_id = Column(String(64), ForeignKey("rooms.id", ondelete="CASCADE"), nullable=False)
    
    started_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    status = Column(String(32), default="broadcasting", nullable=False, index=True)  # idle | broadcasting | ended
    broadcast_power = Column(Float, default=-59.0, nullable=False)
    rolling_token = Column(String(128), nullable=False)
    duration_minutes = Column(Integer, default=50, nullable=False)
    face_verification_required = Column(Boolean, default=True, nullable=False)
    capacity = Column(Integer, default=60, nullable=False)

    # Relationships
    faculty = relationship("Faculty", back_populates="sessions")
    records = relationship("AttendanceRecord", back_populates="session", cascade="all, delete-orphan")


class AttendanceRecord(Base):
    __tablename__ = "attendance_records"

    id = Column(String(64), primary_key=True, index=True)
    session_id = Column(String(64), ForeignKey("attendance_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(String(64), ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    
    marked_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    confidence_score = Column(Float, default=94.5, nullable=False)
    method = Column(String(32), default="ble+face", nullable=False)  # "ble+face" | "manual_override"
    face_verified = Column(Boolean, default=True, nullable=False)
    marked_by = Column(String(64), nullable=True)  # "system" or faculty employeeId
    override_reason = Column(String(256), nullable=True)

    # Relationships
    session = relationship("AttendanceSession", back_populates="records")
    student = relationship("Student", back_populates="attendance_records")
