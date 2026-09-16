from sqlalchemy import Column, String, Integer, Float, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class Department(Base):
    __tablename__ = "departments"

    id = Column(String(64), primary_key=True, index=True)
    code = Column(String(32), unique=True, index=True, nullable=False)   # e.g. "CSE"
    name = Column(String(128), unique=True, nullable=False)             # e.g. "Computer Science and Engineering"
    active = Column(Boolean, default=True, nullable=False)


class Course(Base):
    __tablename__ = "courses"

    id = Column(String(64), primary_key=True, index=True)
    code = Column(String(32), unique=True, index=True, nullable=False)
    name = Column(String(128), nullable=False)
    department = Column(String(64), nullable=False)
    credits = Column(Integer, default=3, nullable=False)

    timetable_slots = relationship("TimetableSlot", back_populates="course")


class Room(Base):
    __tablename__ = "rooms"

    id = Column(String(64), primary_key=True, index=True)
    name = Column(String(64), nullable=False)  # e.g. "LH-204"
    beacon_uuid = Column(String(64), unique=True, index=True, nullable=False)
    capacity = Column(Integer, default=60, nullable=False)
    default_tx_power = Column(Float, default=-59.0, nullable=False)

    timetable_slots = relationship("TimetableSlot", back_populates="room")


class ClassSection(Base):
    __tablename__ = "class_sections"

    id = Column(String(64), primary_key=True, index=True)
    name = Column(String(128), nullable=False)  # "CSE - 3rd Year - Section A"
    department = Column(String(64), nullable=False)
    year = Column(Integer, default=3, nullable=False)
    section = Column(String(16), default="A", nullable=False)
    student_count = Column(Integer, default=45, nullable=False)

    timetable_slots = relationship("TimetableSlot", back_populates="class_section")


class SectionSubjectFaculty(Base):
    __tablename__ = "section_subject_faculty"

    id = Column(String(64), primary_key=True, index=True)
    class_section_id = Column(String(64), ForeignKey("class_sections.id", ondelete="CASCADE"), nullable=False)
    course_id = Column(String(64), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    faculty_id = Column(String(64), ForeignKey("faculty.id", ondelete="CASCADE"), nullable=False)


class TimetableSlot(Base):
    __tablename__ = "timetable_slots"

    id = Column(String(64), primary_key=True, index=True)
    section_id = Column(String(64), ForeignKey("class_sections.id", ondelete="CASCADE"), nullable=False)
    course_id = Column(String(64), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    faculty_id = Column(String(64), ForeignKey("faculty.id", ondelete="CASCADE"), nullable=False)
    room_id = Column(String(64), ForeignKey("rooms.id", ondelete="CASCADE"), nullable=False)
    day_of_week = Column(String(16), nullable=False)  # "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"
    start_time = Column(String(16), nullable=False)   # "09:00"
    end_time = Column(String(16), nullable=False)     # "10:00"
    color = Column(String(32), default="indigo", nullable=False)

    # Relationships
    class_section = relationship("ClassSection", back_populates="timetable_slots")
    course = relationship("Course", back_populates="timetable_slots")
    faculty = relationship("Faculty", back_populates="timetable_slots")
    room = relationship("Room", back_populates="timetable_slots")
