from typing import List, Optional, Dict, Any
from pydantic import BaseModel


class TimetableConflictItem(BaseModel):
    conflict_type: str  # "room_collision" | "faculty_collision" | "section_collision"
    message: str
    day: str
    time: str
    affected_entity: str
    row_numbers: List[int]


class TimetablePreviewRow(BaseModel):
    row_number: int
    day: str
    start_time: str
    end_time: str
    course_code: str
    course_name: str
    department: str
    year: int
    section: str
    faculty_identifier: str
    faculty_name: str
    room_name: str
    color: str = "indigo"
    status: str  # "valid" | "warning" | "error"
    errors: List[str] = []
    warnings: List[str] = []


class TimetableSyncPreviewResponse(BaseModel):
    total_slots: int
    valid_slots_count: int
    warning_slots_count: int
    error_slots_count: int
    conflict_count: int
    preview_rows: List[TimetablePreviewRow]
    conflicts: List[TimetableConflictItem]
    unique_sections: List[str]
    unique_faculty: List[str]
    unique_courses: List[str]
    headers: List[str]
    applied_result: Optional[Dict[str, Any]] = None


class TimetableApplyRequest(BaseModel):
    rows: List[Dict[str, Any]]
    replace_existing: bool = True  # If true, clears previous timetable slots for the affected sections


class TimetableApplyResponse(BaseModel):
    imported_slots: int
    sections_assigned: int
    faculty_assigned: int
    courses_mapped: int
    message: str


class TimetableSlotDetail(BaseModel):
    id: str
    day: str
    startTime: str
    endTime: str
    subjectId: str
    subjectCode: str
    subjectName: str
    facultyId: str
    facultyName: str
    classSectionId: str
    classSectionName: str
    room: str
    color: str
