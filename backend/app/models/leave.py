from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base


class LeaveRequest(Base):
    __tablename__ = "leave_requests"
    __table_args__ = {
        'mysql_engine': 'InnoDB',
        'mysql_charset': 'utf8mb4',
        'mysql_collate': 'utf8mb4_unicode_ci'
    }

    id = Column(String(64), primary_key=True, index=True)
    student_id = Column(String(64), ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    mentor_id = Column(String(64), ForeignKey("faculty.id", ondelete="SET NULL"), nullable=True)
    
    leave_type = Column(String(64), nullable=False)  # "Medical Leave", "On-Duty (OD)", etc.
    start_date = Column(String(32), nullable=False)
    start_session = Column(String(8), default="FN", nullable=False)  # FN | AN
    end_date = Column(String(32), nullable=False)
    end_session = Column(String(8), default="AN", nullable=False)    # FN | AN
    days_count = Column(Float, default=1.0, nullable=False)
    is_half_day = Column(Boolean, default=False, nullable=False)
    reason = Column(Text, nullable=False)
    document_url = Column(String(512), nullable=True)
    status = Column(String(32), default="pending", nullable=False, index=True)  # pending | approved | rejected
    review_comment = Column(Text, nullable=True)
    applied_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    student = relationship("Student", back_populates="leave_requests")
    mentor = relationship("Faculty", foreign_keys=[mentor_id])


class FacultyLeaveRequest(Base):
    __tablename__ = "faculty_leave_requests"
    __table_args__ = {
        'mysql_engine': 'InnoDB',
        'mysql_charset': 'utf8mb4',
        'mysql_collate': 'utf8mb4_unicode_ci'
    }

    id = Column(String(64), primary_key=True, index=True)
    faculty_id = Column(String(64), ForeignKey("faculty.id", ondelete="CASCADE"), nullable=False, index=True)
    substitute_faculty_id = Column(String(64), ForeignKey("faculty.id", ondelete="SET NULL"), nullable=True)

    leave_type = Column(String(64), nullable=False)  # "Casual Leave", "Medical Leave", "On-Duty (OD)", etc.
    start_date = Column(String(32), nullable=False)
    start_session = Column(String(8), default="FN", nullable=False)  # FN | AN
    end_date = Column(String(32), nullable=False)
    end_session = Column(String(8), default="AN", nullable=False)    # FN | AN
    days_count = Column(Float, default=1.0, nullable=False)
    is_half_day = Column(Boolean, default=False, nullable=False)
    reason = Column(Text, nullable=False)
    status = Column(String(32), default="pending", nullable=False, index=True)  # pending | approved | rejected
    review_comment = Column(Text, nullable=True)
    affected_subjects_json = Column(Text, nullable=True)
    applied_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    faculty = relationship("Faculty", foreign_keys=[faculty_id])
    substitute_faculty = relationship("Faculty", foreign_keys=[substitute_faculty_id])
