import io
import re
import uuid
import logging
from typing import Dict, Any, List, Optional, Tuple, Set
from datetime import datetime, timezone
import urllib.parse

import pandas as pd
import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, or_

from app.models.academic import Department, Course, Room, ClassSection, SectionSubjectFaculty, TimetableSlot
from app.models.user import User, Faculty, RoleEnum
from app.models.sheet_sync import SheetConfig
from app.services.audit_service import log_audit_event
from app.services.sheet_sync import validate_and_normalize_sheet_url, fetch_sheet_csv
from app.core.security import get_password_hash

logger = logging.getLogger("timetable_sync")

TIMETABLE_COLUMNS = [
    {"header": "Day", "key": "day", "required": True, "example": "Mon"},
    {"header": "Start Time", "key": "start_time", "required": True, "example": "09:00"},
    {"header": "End Time", "key": "end_time", "required": True, "example": "10:00"},
    {"header": "Course Code", "key": "course_code", "required": True, "example": "CS301"},
    {"header": "Course Name", "key": "course_name", "required": False, "example": "Machine Learning"},
    {"header": "Department", "key": "department", "required": True, "example": "CSE"},
    {"header": "Year", "key": "year", "required": True, "example": "3"},
    {"header": "Section", "key": "section", "required": True, "example": "A"},
    {"header": "Faculty", "key": "faculty_identifier", "required": True, "example": "FAC-CSE-001"},
    {"header": "Room", "key": "room_name", "required": True, "example": "LH-204"},
    {"header": "Color", "key": "color", "required": False, "example": "indigo"},
]

COLOR_PALETTE = [
    "indigo", "emerald", "amber", "rose", "sky", "violet", "teal", "cyan", "fuchsia", "orange"
]

VALID_DAYS = {
    "mon": "Mon", "monday": "Mon",
    "tue": "Tue", "tues": "Tue", "tuesday": "Tue",
    "wed": "Wed", "wednesday": "Wed",
    "thu": "Thu", "thur": "Thu", "thurs": "Thu", "thursday": "Thu",
    "fri": "Fri", "friday": "Fri",
    "sat": "Sat", "saturday": "Sat",
}


def _normalize_header(h: str) -> str:
    cleaned = re.sub(r"[\*\(].*?[\)]", "", str(h))
    cleaned = cleaned.replace("*", "").strip().lower()
    cleaned = re.sub(r"[\s\-_]+", "_", cleaned)
    return cleaned


def normalize_day(day_str: str) -> Optional[str]:
    clean = str(day_str).strip().lower()
    return VALID_DAYS.get(clean)


def normalize_time_str(time_val: Any) -> Optional[str]:
    """
    Normalizes arbitrary time formats into 24-hour HH:MM strings (e.g. '09:00', '13:30').
    Handles '9:00', '09:00 AM', '1:00 PM', '13:00', etc.
    """
    if pd.isna(time_val) or time_val is None:
        return None
    s = str(time_val).strip()
    if not s or s.lower() == "nan":
        return None

    # Try standard time formats
    formats = [
        "%H:%M", "%H:%M:%S",
        "%I:%M %p", "%I:%M%p",
        "%I %p", "%I%p",
    ]
    for fmt in formats:
        try:
            dt = datetime.strptime(s.upper(), fmt)
            return dt.strftime("%H:%M")
        except ValueError:
            pass

    # Regex fallback for '9' or '09'
    m = re.match(r"^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$", s, re.IGNORECASE)
    if m:
        hr = int(m.group(1))
        mn = int(m.group(2) or 0)
        meridiem = (m.group(3) or "").lower()
        if meridiem == "pm" and hr < 12:
            hr += 12
        elif meridiem == "am" and hr == 12:
            hr = 0
        if 0 <= hr <= 23 and 0 <= mn <= 59:
            return f"{hr:02d}:{mn:02d}"

    return None


def parse_grid_time_range(s: Any) -> Tuple[Optional[str], Optional[str]]:
    """
    Parses a time range string such as '8:45 AM - 9:35 AM', '8.45 - 9.35', or '09:00 to 10:00'.
    Handles periods, colons, en-dashes, em-dashes, and 'to'.
    """
    if not s or pd.isna(s):
        return None, None
    raw_str = str(s).strip()
    # Normalize dot-separated times: e.g. '8.45' -> '8:45'
    cleaned_time = re.sub(r'(\d{1,2})\.(\d{2})', r'\1:\2', raw_str)
    m = re.search(r'(\d{1,2}(?::\d{2})?\s*(?:[AP]M)?)\s*(?:[-–—to]+|\s+to\s+)\s*(\d{1,2}(?::\d{2})?\s*(?:[AP]M)?)', cleaned_time, re.IGNORECASE)
    if m:
        t1, t2 = m.group(1).strip(), m.group(2).strip()
        n1 = normalize_time_str(t1)
        n2 = normalize_time_str(t2)
        return n1, n2
    return None, None


def parse_grid_timetable_cell(raw: Any) -> Optional[Dict[str, Any]]:
    """
    Parses an Indian college timetable grid cell:
    e.g. '22IT305 SOFTWARE ENGINEERING Mrs.SANTHIYA B (SEC A) (A-201)'
    or 'S3 IT 22HS005- SOFTSKILLS AND EFFECTIVE COMMUNICATION Dr:SHOBANA (SEC D) (A-206)'
    """
    text = re.sub(r'[\r\n]+', ' ', str(raw)).strip()
    if not text or text.lower() == 'nan' or text == '-' or text.lower() == 'nil' or text.lower() == 'free':
        return None

    # 1. Extract room from parenthetical at end: (A-201) or [A-201] or Room 201
    room = 'LH-101'
    m_room = re.search(r'[\(\[]([A-Z0-9\-\s]+)[\)\]]\s*$', text, re.IGNORECASE)
    if m_room:
        room = m_room.group(1).strip()
        text = text[:m_room.start()].strip()

    # 2. Extract section: (SEC A) or (SEC B) or (Section C)
    section = 'A'
    m_sec = re.search(r'[\(\[](?:SEC(?:TION)?)\s*([A-Z0-9]+)[\)\]]', text, re.IGNORECASE)
    if m_sec:
        section = m_sec.group(1).strip()
        text = text[:m_sec.start()] + ' ' + text[m_sec.end():]
        text = text.strip()

    # 3. Extract prefix semester/dept if present (e.g. S3 IT)
    sem_year = 3
    dept_prefix = None
    m_sem = re.search(r'\bS([1-8])\s+([A-Za-z]+)\b', text, re.IGNORECASE)
    if m_sem:
        sem_num = int(m_sem.group(1))
        sem_year = max(1, min(4, (sem_num + 1) // 2))
        dept_prefix = m_sem.group(2).upper()
        text = text[:m_sem.start()] + ' ' + text[m_sem.end():]
        text = text.strip()

    # 4. Extract Faculty with titles: Dr, Mr, Mrs, Ms, Prof
    faculty = ''
    fac_pattern = r'\b((?:Dr|Prof|Mr|Mrs|Ms)[.:\s]+[A-Za-z\s\.\']+?)(?=\s*[\(\[]|$)'
    m_fac = re.search(fac_pattern, text, re.IGNORECASE)
    if m_fac:
        faculty = m_fac.group(1).strip()
        faculty = re.sub(r'^(Dr|Prof|Mr|Mrs|Ms)[.:\s]+', r'\1. ', faculty, flags=re.IGNORECASE)
        faculty = re.sub(r'^(Dr\.|Prof\.|Mr\.|Mrs\.|Ms\.)\s*[.\s]+', r'\1 ', faculty, flags=re.IGNORECASE)
        faculty = re.sub(r'\s+', ' ', faculty).strip()
        text = text[:m_fac.start()] + ' ' + text[m_fac.end():]
        text = text.strip()

    # 5. Extract Course Code: e.g. 22IT305, 22HS004, CS301
    course_code = ''
    m_code = re.search(r'\b([0-9]{2}[A-Z]{2,4}[0-9]{3,4}[A-Z]?|[A-Z]{2,4}[0-9]{3,4}[A-Z]?)\b', text)
    if m_code:
        course_code = m_code.group(1).upper()
        text = text[:m_code.start()] + ' ' + text[m_code.end():]
        text = text.strip()

    # 6. Remaining is Course Name
    course_name = re.sub(r'^[-\s]+|[-\s]+$', '', text).strip()
    course_name = re.sub(r'\s+', ' ', course_name)
    if not course_name:
        course_name = course_code or "Academic Course"

    dept = dept_prefix
    if not dept and course_code:
        m_d = re.search(r'[0-9]*([A-Z]{2,4})[0-9]+', course_code)
        if m_d:
            dept = m_d.group(1)
            if dept == 'HS':
                dept = 'HUMANITIES'
    if not dept:
        dept = 'Information Technology'

    return {
        'course_code': course_code or 'CRS-101',
        'course_name': course_name,
        'faculty_identifier': faculty or 'Faculty Instructor',
        'section': section,
        'room_name': room,
        'department': dept,
        'year': str(sem_year)
    }


def is_grid_timetable_format(df: pd.DataFrame) -> bool:
    """
    Detects if the DataFrame is in Matrix/Grid Timetable format.
    """
    if df.empty:
        return False
    df_cols_norm = [_normalize_header(c) for c in df.columns]
    tabular_indicators = {"day", "start_time", "course_code"}
    matched = sum(1 for ind in tabular_indicators if ind in df_cols_norm)
    if matched >= 2:
        return False
    return True


def convert_grid_df_to_standard(df: pd.DataFrame) -> pd.DataFrame:
    """
    Converts a matrix/grid timetable DataFrame into the standard tabular DataFrame:
    [Day, Start Time, End Time, Course Code, Course Name, Department, Year, Section, Faculty, Room, Color]
    Supports both Days-as-Rows and Days-as-Columns grid structures.
    """
    records = []

    # Check if days are arranged as columns: e.g. Columns = [Period/Time, Mon, Tue, Wed, Thu, Fri]
    day_col_map: Dict[int, str] = {}
    for c_idx, col in enumerate(df.columns):
        col_clean = str(col).strip().lower()
        if col_clean in VALID_DAYS:
            day_col_map[c_idx] = VALID_DAYS[col_clean]

    if len(day_col_map) >= 3:
        # Days are columns, rows are periods/timings
        default_periods = [
            ("08:45", "09:35"),
            ("09:35", "10:25"),
            ("10:40", "11:30"),
            ("11:30", "12:20"),
            ("13:30", "15:10"),
            ("15:30", "16:25"),
            ("16:30", "17:20")
        ]
        for r_idx in range(len(df)):
            row = df.iloc[r_idx]
            st, et = None, None
            for c in range(min(2, len(row))):
                st, et = parse_grid_time_range(row.iloc[c])
                if st and et:
                    break
            if not st or not et:
                if r_idx < len(default_periods):
                    st, et = default_periods[r_idx]
                else:
                    continue

            for c_idx, day_name in day_col_map.items():
                cell_val = row.iloc[c_idx]
                parsed = parse_grid_timetable_cell(cell_val)
                if parsed and parsed["course_code"]:
                    records.append({
                        "Day": day_name,
                        "Start Time": st,
                        "End Time": et,
                        "Course Code": parsed["course_code"],
                        "Course Name": parsed["course_name"],
                        "Department": parsed["department"],
                        "Year": parsed["year"],
                        "Section": parsed["section"],
                        "Faculty": parsed["faculty_identifier"],
                        "Room": parsed["room_name"],
                        "Color": "indigo",
                    })

        if records:
            return pd.DataFrame(records)

    # Standard Days-as-Rows layout
    timing_col_map: Dict[int, Tuple[str, str]] = {}
    day_row_indices: List[Tuple[int, str, int]] = []

    # 1. Check if column headers contain time ranges
    for c_idx, col in enumerate(df.columns):
        st, et = parse_grid_time_range(col)
        if st and et:
            timing_col_map[c_idx] = (st, et)

    # 2. Check first 4 rows for time ranges if not in headers
    if not timing_col_map:
        for r_idx in range(min(4, len(df))):
            row_vals = df.iloc[r_idx]
            detected = {}
            for c_idx in range(len(row_vals)):
                st, et = parse_grid_time_range(row_vals.iloc[c_idx])
                if st and et:
                    detected[c_idx] = (st, et)
            if len(detected) >= 2:
                timing_col_map = detected
                break

    # 3. Fallback to standard period schedule if no explicit times
    if not timing_col_map:
        default_periods = [
            ("08:45", "09:35"),
            ("09:35", "10:25"),
            ("10:40", "11:30"),
            ("11:30", "12:20"),
            ("13:30", "15:10"),
            ("15:30", "16:25"),
            ("16:30", "17:20")
        ]
        for c_idx in range(1, len(df.columns)):
            p_idx = c_idx - 1
            if p_idx < len(default_periods):
                timing_col_map[c_idx] = default_periods[p_idx]

    # 4. Find day rows
    for r_idx in range(len(df)):
        row_vals = df.iloc[r_idx]
        for c_idx in range(min(3, len(row_vals))):
            val_clean = str(row_vals.iloc[c_idx]).strip().lower()
            if val_clean in VALID_DAYS:
                day_row_indices.append((r_idx, VALID_DAYS[val_clean], c_idx))
                break

    for r_idx, day_name, day_col_idx in day_row_indices:
        for c_idx, (st, et) in timing_col_map.items():
            if c_idx <= day_col_idx or c_idx >= df.shape[1]:
                continue
            cell_val = df.iat[r_idx, c_idx]
            parsed = parse_grid_timetable_cell(cell_val)
            if parsed and parsed['course_code']:
                records.append({
                    "Day": day_name,
                    "Start Time": st,
                    "End Time": et,
                    "Course Code": parsed["course_code"],
                    "Course Name": parsed["course_name"],
                    "Department": parsed["department"],
                    "Year": parsed["year"],
                    "Section": parsed["section"],
                    "Faculty": parsed["faculty_identifier"],
                    "Room": parsed["room_name"],
                    "Color": "indigo",
                })

    if not records:
        raise ValueError(
            "Could not parse timetable slots from the provided grid layout. "
            "Please ensure Day names (Mon, Tue, ...) and period timings are present."
        )

    return pd.DataFrame(records)


def generate_timetable_csv_template() -> str:
    """Generates official timetable CSV template in grid format matching university schedules."""
    rows = [
        ["Period", "I", "II", "III", "IV", "V", "VI"],
        ["Day / Timings", "8:45 AM - 9:35 AM", "9:35 AM - 10:25 AM", "10:40 AM - 11:30 AM", "11:30AM - 12:20 PM", "1:30 PM - 3:10 PM", "3:30PM - 4:25PM"],
        ["MON", "22IT305 SOFTWARE ENGINEERING Mrs.SANTHIYA B (SEC A) (A-201)", "22HS004 HUMAN VALUES AND ETHICS Mr.Stephen (SEC E) (A-202)", "22IT302 DATA STRUCTURES I Dr.Ramya (SEC C) (A-203)", "22IT301 PROBABILITY STATISTICS AND QUEUING THEORY Mrs. PRIYA (SEC F) (A-204)", "22IT303 COMPUTER ORGANIZATION AND ARCHITECTURE Mrs. VENILA (SEC B) (A-205)", "S3 IT 22HS005- SOFTSKILLS AND EFFECTIVE COMMUNICATION Dr.SHOBANA (SEC D) (A-206)"],
        ["TUE", "22IT301 PROBABILITY STATISTICS AND QUEUING THEORY Mrs.PRIYA (SEC F) (A-204)", "22IT303 COMPUTER ORGANIZATION AND ARCHITECTURE Mrs.VENILA (SEC B) (A-205)", "22IT302 DATA STRUCTURES I Dr.Ramya (SEC C) (A-203)", "S3 IT 22HS005- SOFTSKILLS AND EFFECTIVE COMMUNICATION Dr.SHOBANA (SEC D) (A-206)", "22HS004 HUMAN VALUES AND ETHICS Mr.Stephen (SEC E) (A-202)", "22IT305 SOFTWARE ENGINEERING Mrs.SANTHIYA (SEC A) (A-201)"],
        ["WED", "22HS004 HUMAN VALUES AND ETHICS Mr.Stephen (SEC E) (A-202)", "22IT305 SOFTWARE ENGINEERING Mrs.SANTHIYA (SEC A) (A-201)", "22IT302 DATA STRUCTURES I Dr.Ramya (SEC C) (A-203)", "22IT301 PROBABILITY STATISTICS AND QUEUING THEORY Mrs. PRIYA (SEC F) (A-204)", "S3 IT 22HS005- SOFTSKILLS AND EFFECTIVE COMMUNICATION Dr.SHOBANA (SEC D) (A-206)", "22IT303 COMPUTER ORGANIZATION AND ARCHITECTURE Mrs.VENILA (SEC B) (A-205)"],
        ["THU", "22IT302 DATA STRUCTURES I Dr.Ramya (SEC C) (A-203)", "22IT301 PROBABILITY STATISTICS AND QUEUING THEORY Mrs. PRIYA (SEC F) (A-204)", "22IT305 SOFTWARE ENGINEERING Mrs.SANTHIYA (SEC A) (A-201)", "22HS004 HUMAN VALUES AND ETHICS Mr.Stephen (SEC E) (A-202)", "22IT303 COMPUTER ORGANIZATION AND ARCHITECTURE Mrs.VENILA (SEC B) (A-205)", "S3 IT 22HS005- SOFTSKILLS AND EFFECTIVE COMMUNICATION Dr.SHOBANA (SEC D) (A-206)"],
        ["FRI", "22IT303 COMPUTER ORGANIZATION AND ARCHITECTURE Mrs.VENILA (SEC B) (A-205)", "22IT302 DATA STRUCTURES I Dr.Ramya (SEC C) (A-203)", "22HS004 HUMAN VALUES AND ETHICS Mr.Stephen (SEC E) (A-202)", "S3 IT 22HS005- SOFTSKILLS AND EFFECTIVE COMMUNICATION Dr.SHOBANA (SEC D) (A-206)", "22IT301 PROBABILITY STATISTICS AND QUEUING THEORY Mrs. PRIYA (SEC F) (A-204)", "22IT305 SOFTWARE ENGINEERING Mrs.SANTHIYA (SEC A) (A-201)"],
    ]
    output = io.StringIO()
    df = pd.DataFrame(rows[1:], columns=rows[0])
    df.to_csv(output, index=False)
    return output.getvalue()


async def parse_and_validate_timetable(
    df: pd.DataFrame,
    db: AsyncSession
) -> Dict[str, Any]:
    """
    Parses timetable DataFrame, resolves courses, rooms, class sections, and faculty,
    runs cross-period collision detection (room, faculty, section overlaps),
    and structures preview rows with status and conflict warnings.
    Seamlessly supports both Matrix/Grid Timetables and Tabular Timetables.
    """
    if df.empty:
        return {
            "total_slots": 0,
            "valid_slots_count": 0,
            "warning_slots_count": 0,
            "error_slots_count": 0,
            "conflict_count": 0,
            "preview_rows": [],
            "conflicts": [],
            "unique_sections": [],
            "unique_faculty": [],
            "unique_courses": [],
            "headers": [c["header"] for c in TIMETABLE_COLUMNS],
        }

    # Auto-detect and convert Matrix/Grid format
    if is_grid_timetable_format(df):
        df = convert_grid_df_to_standard(df)

    # Normalize column names in dataframe
    df_cols_normalized = [_normalize_header(c) for c in df.columns]
    df.columns = df_cols_normalized

    alias_dict = {
        "day": ["day_of_week", "day_name", "weekday"],
        "start_time": ["start", "from", "begin", "period_start", "start_hour"],
        "end_time": ["end", "to", "period_end", "end_hour"],
        "course_code": ["course", "subject_code", "course_id", "code"],
        "course_name": ["subject_name", "subject", "title", "course_title"],
        "department": ["dept", "branch"],
        "year": ["class_year", "study_year", "sem_year"],
        "section": ["sec", "class_section", "batch"],
        "faculty_identifier": ["faculty", "faculty_email", "faculty_id", "instructor", "teacher", "emp_id", "employee_id"],
        "room_name": ["room", "classroom", "hall", "room_no", "location"],
        "color": ["slot_color", "badge_color", "theme"],
    }

    # Rename matched aliases
    for c in TIMETABLE_COLUMNS:
        norm_key = _normalize_header(c["header"])
        if norm_key not in df_cols_normalized:
            aliases = alias_dict.get(c["key"], [])
            matched = next((a for a in aliases if a in df_cols_normalized), None)
            if matched:
                df.rename(columns={matched: norm_key}, inplace=True)
                df_cols_normalized = list(df.columns)

    # Check required columns
    missing_required = []
    for c in TIMETABLE_COLUMNS:
        norm_key = _normalize_header(c["header"])
        if c["required"] and norm_key not in df_cols_normalized:
            missing_required.append(c["header"])

    if missing_required:
        raise ValueError(
            f"Timetable sheet is missing required columns: {', '.join(missing_required)}. "
            f"Please download and use the official timetable template."
        )

    # Fetch database reference entities
    # 1. Departments
    depts = (await db.execute(select(Department))).scalars().all()
    dept_map = {}
    for d in depts:
        dept_map[d.code.upper().strip()] = d
        dept_map[d.name.lower().strip()] = d

    # 2. Courses
    courses = (await db.execute(select(Course))).scalars().all()
    course_by_code = {c.code.upper().strip(): c for c in courses}
    course_by_name = {c.name.lower().strip(): c for c in courses}

    # 3. Rooms
    rooms = (await db.execute(select(Room))).scalars().all()
    room_by_name = {r.name.lower().strip(): r for r in rooms}

    # 4. Class Sections
    sections = (await db.execute(select(ClassSection))).scalars().all()
    # Key by (dept_normalized, year, section_upper)
    section_map = {}
    for s in sections:
        dept_key = s.department.lower().strip()
        section_map[(dept_key, s.year, s.section.upper().strip())] = s

    # 5. Faculty & Users
    fac_user_res = await db.execute(
        select(Faculty, User).join(User, Faculty.user_id == User.id)
    )
    fac_user_list = fac_user_res.all()
    fac_by_empid = {}
    fac_by_email = {}
    fac_by_name = {}
    for f, u in fac_user_list:
        if f.employee_id:
            fac_by_empid[f.employee_id.upper().strip()] = (f, u)
        if u.email:
            fac_by_email[u.email.lower().strip()] = (f, u)
        if u.name:
            fac_by_name[u.name.lower().strip()] = (f, u)

    parsed_rows = []
    unique_sections_set: Set[str] = set()
    unique_faculty_set: Set[str] = set()
    unique_courses_set: Set[str] = set()

    for row_idx, row in df.iterrows():
        row_num = int(row_idx) + 2

        # Ignore totally blank rows
        row_vals = [str(v).strip() for v in row.values if pd.notna(v) and str(v).strip() != ""]
        if not row_vals:
            continue

        def get_val(key_name: str) -> str:
            # find column corresponding to key_name
            target_col = next((c["header"] for c in TIMETABLE_COLUMNS if c["key"] == key_name), key_name)
            norm_k = _normalize_header(target_col)
            v = str(row.get(norm_k, "")).strip() if pd.notna(row.get(norm_k)) else ""
            return "" if v.lower() == "nan" else v

        day_raw = get_val("day")
        start_raw = get_val("start_time")
        end_raw = get_val("end_time")
        course_code_raw = get_val("course_code")
        course_name_raw = get_val("course_name")
        dept_raw = get_val("department")
        year_raw = get_val("year")
        section_raw = get_val("section")
        faculty_raw = get_val("faculty_identifier")
        room_raw = get_val("room_name")
        color_raw = get_val("color")

        row_errors: List[str] = []
        row_warnings: List[str] = []

        # Validate Day
        day_norm = normalize_day(day_raw)
        if not day_norm:
            row_errors.append(f"Invalid Day '{day_raw}'. Allowed: Mon, Tue, Wed, Thu, Fri, Sat.")
            day_norm = day_raw or "Mon"

        # Validate Time
        start_norm = normalize_time_str(start_raw)
        end_norm = normalize_time_str(end_raw)
        if not start_norm:
            row_errors.append(f"Invalid Start Time '{start_raw}'. Expected format HH:MM (e.g. 09:00).")
            start_norm = "09:00"
        if not end_norm:
            row_errors.append(f"Invalid End Time '{end_raw}'. Expected format HH:MM (e.g. 10:00).")
            end_norm = "10:00"

        if start_norm and end_norm and start_norm >= end_norm:
            row_errors.append(f"Start Time '{start_norm}' must be earlier than End Time '{end_norm}'.")

        # Validate Department
        dept_matched_name = dept_raw
        if not dept_raw:
            row_errors.append("Department is required.")
        else:
            dept_obj = dept_map.get(dept_raw.upper()) or dept_map.get(dept_raw.lower())
            if not dept_obj:
                # Substring match
                for d_code, d_o in dept_map.items():
                    if dept_raw.lower() in d_o.name.lower() or dept_raw.upper() in d_o.code.upper():
                        dept_obj = d_o
                        break
            if dept_obj:
                dept_matched_name = dept_obj.name
            else:
                row_warnings.append(f"Department '{dept_raw}' not previously registered; will use as given.")

        # Validate Year & Section
        year_num = 3
        if not year_raw:
            row_errors.append("Year is required (e.g. 3).")
        else:
            digits = re.findall(r"\d+", str(year_raw))
            if digits:
                year_num = max(1, min(4, int(digits[0])))
            else:
                row_errors.append(f"Invalid Year '{year_raw}'. Expected 1, 2, 3, or 4.")

        section_clean = section_raw.strip().upper()
        if not section_clean:
            row_errors.append("Section is required (e.g. A).")
        else:
            sec_match = re.search(r"([A-Za-z0-9]+)$", section_clean)
            if sec_match:
                section_clean = sec_match.group(1).upper()

        section_display = f"{dept_raw} Yr {year_num} Sec {section_clean}"
        unique_sections_set.add(section_display)

        # Validate Course
        clean_code = course_code_raw.strip().upper().replace(" ", "")
        if not clean_code:
            row_errors.append("Course Code is required.")
            resolved_course_name = course_name_raw or "Unknown Course"
        else:
            unique_courses_set.add(clean_code)
            matched_c = course_by_code.get(clean_code)
            if not matched_c:
                matched_c = course_by_name.get(course_name_raw.strip().lower())
            if matched_c:
                clean_code = matched_c.code
                resolved_course_name = matched_c.name
            else:
                resolved_course_name = course_name_raw.strip() if course_name_raw else clean_code
                row_warnings.append(f"Course '{clean_code}' will be registered automatically.")

        # Validate Faculty
        clean_fac = faculty_raw.strip()
        faculty_resolved_id = None
        faculty_resolved_name = clean_fac
        if not clean_fac:
            row_errors.append("Faculty identifier (Email, Employee ID, or Name) is required.")
        else:
            fac_match = (
                fac_by_empid.get(clean_fac.upper())
                or fac_by_email.get(clean_fac.lower())
                or fac_by_name.get(clean_fac.lower())
            )
            if fac_match:
                f_obj, u_obj = fac_match
                faculty_resolved_id = f_obj.id
                faculty_resolved_name = u_obj.name
                unique_faculty_set.add(faculty_resolved_name)
            else:
                unique_faculty_set.add(clean_fac)
                row_warnings.append(f"Faculty '{clean_fac}' will be registered automatically.")

        # Validate Room
        clean_room = room_raw.strip()
        if not clean_room:
            row_errors.append("Room is required.")
            clean_room = "TBD"
        else:
            matched_r = room_by_name.get(clean_room.lower())
            if matched_r:
                clean_room = matched_r.name
            else:
                row_warnings.append(f"Room '{clean_room}' will be registered automatically.")

        # Color
        color_choice = color_raw.strip().lower() if color_raw else ""
        if color_choice not in COLOR_PALETTE:
            # Deterministic color from course code
            color_choice = COLOR_PALETTE[abs(hash(clean_code)) % len(COLOR_PALETTE)]

        status = "error" if row_errors else ("warning" if row_warnings else "valid")

        parsed_rows.append({
            "row_number": row_num,
            "day": day_norm,
            "start_time": start_norm,
            "end_time": end_norm,
            "course_code": clean_code,
            "course_name": resolved_course_name,
            "department": dept_matched_name,
            "year": year_num,
            "section": section_clean,
            "faculty_identifier": clean_fac,
            "faculty_name": faculty_resolved_name,
            "faculty_id": faculty_resolved_id,
            "room_name": clean_room,
            "color": color_choice,
            "status": status,
            "errors": row_errors,
            "warnings": row_warnings,
        })

    # =========================================================================
    # Collision Detection Engine
    # Checks Room Double-Booking, Faculty Collisions, and Section Collisions
    # =========================================================================
    conflicts: List[Dict[str, Any]] = []

    def intervals_overlap(s1: str, e1: str, s2: str, e2: str) -> bool:
        return max(s1, s2) < min(e1, e2)

    n = len(parsed_rows)
    for i in range(n):
        row_a = parsed_rows[i]
        for j in range(i + 1, n):
            row_b = parsed_rows[j]

            # Same Day check
            if row_a["day"] != row_b["day"]:
                continue

            # Time overlap check
            s1, e1 = row_a["start_time"], row_a["end_time"]
            s2, e2 = row_b["start_time"], row_b["end_time"]
            if not intervals_overlap(s1, e1, s2, e2):
                continue

            overlap_time = f"{max(s1, s2)} - {min(e1, e2)}"

            # 1. Room Double-Booking Collision
            if row_a["room_name"].lower() == row_b["room_name"].lower() and row_a["room_name"].lower() != "tbd":
                msg = (
                    f"Room '{row_a['room_name']}' is double-booked on {row_a['day']} "
                    f"between {overlap_time} (Rows {row_a['row_number']} & {row_b['row_number']})."
                )
                conflicts.append({
                    "conflict_type": "room_collision",
                    "message": msg,
                    "day": row_a["day"],
                    "time": overlap_time,
                    "affected_entity": f"Room {row_a['room_name']}",
                    "row_numbers": [row_a["row_number"], row_b["row_number"]],
                })
                row_a["warnings"].append(f"Collision: Room '{row_a['room_name']}' is also assigned in Row {row_b['row_number']}.")
                row_b["warnings"].append(f"Collision: Room '{row_b['room_name']}' is also assigned in Row {row_a['row_number']}.")
                if row_a["status"] == "valid": row_a["status"] = "warning"
                if row_b["status"] == "valid": row_b["status"] = "warning"

            # 2. Faculty Collision
            fac_match_a = row_a.get("faculty_id") or row_a.get("faculty_name", "").lower()
            fac_match_b = row_b.get("faculty_id") or row_b.get("faculty_name", "").lower()
            if fac_match_a and fac_match_b and fac_match_a == fac_match_b:
                fac_display = row_a["faculty_name"]
                msg = (
                    f"Faculty '{fac_display}' is scheduled concurrently on {row_a['day']} "
                    f"between {overlap_time} (Rows {row_a['row_number']} & {row_b['row_number']})."
                )
                conflicts.append({
                    "conflict_type": "faculty_collision",
                    "message": msg,
                    "day": row_a["day"],
                    "time": overlap_time,
                    "affected_entity": fac_display,
                    "row_numbers": [row_a["row_number"], row_b["row_number"]],
                })
                row_a["warnings"].append(f"Collision: Faculty '{fac_display}' is also scheduled in Row {row_b['row_number']}.")
                row_b["warnings"].append(f"Collision: Faculty '{fac_display}' is also scheduled in Row {row_a['row_number']}.")
                if row_a["status"] == "valid": row_a["status"] = "warning"
                if row_b["status"] == "valid": row_b["status"] = "warning"

            # 3. Class Section Collision
            sec_key_a = (row_a["department"].lower(), row_a["year"], row_a["section"])
            sec_key_b = (row_b["department"].lower(), row_b["year"], row_b["section"])
            if sec_key_a == sec_key_b:
                sec_disp = f"{row_a['department']} Yr {row_a['year']} Sec {row_a['section']}"
                msg = (
                    f"Class section '{sec_disp}' has overlapping periods on {row_a['day']} "
                    f"between {overlap_time} (Rows {row_a['row_number']} & {row_b['row_number']})."
                )
                conflicts.append({
                    "conflict_type": "section_collision",
                    "message": msg,
                    "day": row_a["day"],
                    "time": overlap_time,
                    "affected_entity": sec_disp,
                    "row_numbers": [row_a["row_number"], row_b["row_number"]],
                })
                row_a["warnings"].append(f"Collision: Class section '{sec_disp}' has overlapping period in Row {row_b['row_number']}.")
                row_b["warnings"].append(f"Collision: Class section '{sec_disp}' has overlapping period in Row {row_a['row_number']}.")
                if row_a["status"] == "valid": row_a["status"] = "warning"
                if row_b["status"] == "valid": row_b["status"] = "warning"

    valid_count = sum(1 for r in parsed_rows if r["status"] == "valid")
    warning_count = sum(1 for r in parsed_rows if r["status"] == "warning")
    error_count = sum(1 for r in parsed_rows if r["status"] == "error")

    return {
        "total_slots": len(parsed_rows),
        "valid_slots_count": valid_count,
        "warning_slots_count": warning_count,
        "error_slots_count": error_count,
        "conflict_count": len(conflicts),
        "preview_rows": parsed_rows,
        "conflicts": conflicts,
        "unique_sections": sorted(list(unique_sections_set)),
        "unique_faculty": sorted(list(unique_faculty_set)),
        "unique_courses": sorted(list(unique_courses_set)),
        "headers": [c["header"] for c in TIMETABLE_COLUMNS],
    }


async def apply_timetable_sync_rows(
    rows: List[Dict[str, Any]],
    replace_existing: bool,
    actor_id: str,
    actor_role: str,
    db: AsyncSession
) -> Dict[str, Any]:
    """
    Applies validated timetable rows into the database:
    - Resolves or auto-creates Courses, Rooms, and ClassSections.
    - If replace_existing is True, clears timetable slots for affected sections before inserting.
    - Creates TimetableSlot entries.
    - Ensures SectionSubjectFaculty links exist for faculty assignment.
    - Writes immutable audit log and updates SheetConfig.
    """
    # 1. Fetch DB caches
    courses = (await db.execute(select(Course))).scalars().all()
    course_by_code = {c.code.upper().strip(): c for c in courses}

    rooms = (await db.execute(select(Room))).scalars().all()
    room_by_name = {r.name.lower().strip(): r for r in rooms}

    sections = (await db.execute(select(ClassSection))).scalars().all()
    section_map = {}
    for s in sections:
        dept_k = s.department.lower().strip()
        section_map[(dept_k, s.year, s.section.upper().strip())] = s

    fac_user_res = await db.execute(
        select(Faculty, User).join(User, Faculty.user_id == User.id)
    )
    fac_by_id = {f.id: (f, u) for f, u in fac_user_res.all()}
    fac_by_email = {u.email.lower().strip(): f.id for f, u in fac_by_id.values() if u.email}
    fac_by_empid = {f.employee_id.upper().strip(): f.id for f, u in fac_by_id.values() if f.employee_id}
    fac_by_name = {u.name.lower().strip(): f.id for f, u in fac_by_id.values() if u.name}

    # Track distinct sections and faculty assigned
    affected_section_ids: Set[str] = set()
    assigned_faculty_ids: Set[str] = set()
    mapped_course_ids: Set[str] = set()
    valid_row_items = [r for r in rows if r.get("status") in ("valid", "warning")]

    if not valid_row_items:
        return {
            "imported_slots": 0,
            "sections_assigned": 0,
            "faculty_assigned": 0,
            "courses_mapped": 0,
            "message": "No valid timetable slots to apply.",
        }

    # Pre-resolve / auto-create entities needed by the valid rows
    for r in valid_row_items:
        # Resolve Course
        c_code = r.get("course_code", "").strip().upper()
        c_name = r.get("course_name", "").strip() or c_code
        c_dept = r.get("department", "Computer Science").strip()

        if c_code not in course_by_code:
            new_course = Course(
                id=f"crs-{c_code.lower()}-{uuid.uuid4().hex[:4]}",
                code=c_code,
                name=c_name,
                department=c_dept,
                credits=3,
            )
            db.add(new_course)
            course_by_code[c_code] = new_course

        # Resolve Room
        r_name = r.get("room_name", "").strip()
        if r_name.lower() not in room_by_name:
            new_room = Room(
                id=f"room-{uuid.uuid4().hex[:8]}",
                name=r_name,
                beacon_uuid=f"beacon-{uuid.uuid4().hex[:8]}",
                capacity=60,
                default_tx_power=-59.0,
            )
            db.add(new_room)
            room_by_name[r_name.lower()] = new_room

        # Resolve ClassSection
        sec_dept = r.get("department", "Computer Science").strip()
        sec_yr = int(r.get("year", 3))
        sec_code = r.get("section", "A").strip().upper()
        sec_key = (sec_dept.lower(), sec_yr, sec_code)

        if sec_key not in section_map:
            new_sec = ClassSection(
                id=f"sec-{sec_dept.lower()[:3]}-{sec_yr}{sec_code.lower()}-{uuid.uuid4().hex[:4]}",
                name=f"{sec_dept} - Year {sec_yr} - Section {sec_code}",
                department=sec_dept,
                year=sec_yr,
                section=sec_code,
                student_count=45,
            )
            db.add(new_sec)
            section_map[sec_key] = new_sec

    # Flush so generated IDs are available
    await db.flush()

    # Determine affected sections
    for r in valid_row_items:
        sec_dept = r.get("department", "Computer Science").strip().lower()
        sec_yr = int(r.get("year", 3))
        sec_code = r.get("section", "A").strip().upper()
        sec_obj = section_map.get((sec_dept, sec_yr, sec_code))
        if sec_obj:
            affected_section_ids.add(sec_obj.id)

    # If replace_existing, clear previous slots for affected sections
    if replace_existing and affected_section_ids:
        await db.execute(
            delete(TimetableSlot).where(TimetableSlot.section_id.in_(affected_section_ids))
        )

    # Insert Timetable Slots & Map SectionSubjectFaculty
    existing_ssf = (await db.execute(select(SectionSubjectFaculty))).scalars().all()
    ssf_keys = {(s.class_section_id, s.course_id, s.faculty_id) for s in existing_ssf}

    imported_slots = 0
    for r in valid_row_items:
        c_code = r.get("course_code", "").strip().upper()
        course_obj = course_by_code[c_code]

        r_name = r.get("room_name", "").strip().lower()
        room_obj = room_by_name[r_name]

        sec_dept = r.get("department", "Computer Science").strip().lower()
        sec_yr = int(r.get("year", 3))
        sec_code = r.get("section", "A").strip().upper()
        sec_obj = section_map[(sec_dept, sec_yr, sec_code)]

        # Resolve Faculty ID
        fac_ident = r.get("faculty_identifier", "").strip()
        fac_id = (
            r.get("faculty_id")
            or fac_by_empid.get(fac_ident.upper())
            or fac_by_email.get(fac_ident.lower())
            or fac_by_name.get(fac_ident.lower())
        )
        if not fac_id:
            # Auto-provision new Faculty & User
            raw_f_name = r.get("faculty_name", "").strip() or fac_ident or "Faculty Member"
            fac_clean_name = re.sub(r'^(Dr|Prof|Mr|Mrs|Ms)[.:\s]+', r'\1. ', raw_f_name, flags=re.IGNORECASE)
            fac_clean_name = re.sub(r'^(Dr\.|Prof\.|Mr\.|Mrs\.|Ms\.)\s*[.\s]+', r'\1 ', fac_clean_name, flags=re.IGNORECASE)
            fac_clean_name = re.sub(r'^[.\s,]+', '', fac_clean_name).strip()
            new_uid = f"usr-fac-{uuid.uuid4().hex[:6]}"
            sanitized_email = f"{re.sub(r'[^a-zA-Z0-9]', '', fac_clean_name).lower()[:12] or 'fac'}@campus.edu"
            if sanitized_email in fac_by_email:
                sanitized_email = f"{sanitized_email.split('@')[0]}_{uuid.uuid4().hex[:4]}@campus.edu"

            dept_name = course_obj.department or "Information Technology"
            new_u = User(
                id=new_uid,
                name=fac_clean_name,
                email=sanitized_email,
                password_hash=get_password_hash("Campus@123"),
                role=RoleEnum.FACULTY,
                department=dept_name,
            )
            db.add(new_u)
            await db.flush()

            new_f = Faculty(
                id=f"fac-{uuid.uuid4().hex[:6]}",
                user_id=new_u.id,
                department=dept_name,
                employee_id=f"EMP-{uuid.uuid4().hex[:4].upper()}",
                active=True,
            )
            db.add(new_f)
            await db.flush()

            fac_id = new_f.id
            fac_by_name[fac_clean_name.lower().strip()] = fac_id
            fac_by_email[sanitized_email.lower().strip()] = fac_id
            fac_by_empid[new_f.employee_id.upper()] = fac_id

        slot_id = f"slot-{uuid.uuid4().hex[:8]}"
        color = r.get("color", "indigo")

        new_slot = TimetableSlot(
            id=slot_id,
            section_id=sec_obj.id,
            course_id=course_obj.id,
            faculty_id=fac_id,
            room_id=room_obj.id,
            day_of_week=r.get("day", "Mon"),
            start_time=r.get("start_time", "09:00"),
            end_time=r.get("end_time", "10:00"),
            color=color,
        )
        db.add(new_slot)
        imported_slots += 1

        assigned_faculty_ids.add(fac_id)
        mapped_course_ids.add(course_obj.id)

        # Upsert SectionSubjectFaculty
        ssf_key = (sec_obj.id, course_obj.id, fac_id)
        if ssf_key not in ssf_keys:
            new_ssf = SectionSubjectFaculty(
                id=f"ssf-{uuid.uuid4().hex[:8]}",
                class_section_id=sec_obj.id,
                course_id=course_obj.id,
                faculty_id=fac_id,
            )
            db.add(new_ssf)
            ssf_keys.add(ssf_key)

    # Log to audit_logs
    await log_audit_event(
        db=db,
        actor_id=actor_id,
        actor_role=actor_role,
        action_type="timetable_sync_apply",
        target_entity="timetable_slots",
        metadata={
            "imported_slots": imported_slots,
            "sections_assigned": len(affected_section_ids),
            "faculty_assigned": len(assigned_faculty_ids),
            "courses_mapped": len(mapped_course_ids),
            "replace_existing": replace_existing,
        }
    )

    # Update SheetConfig record for timetable
    cfg_stmt = select(SheetConfig).where(SheetConfig.id == "sheet-config-timetable")
    cfg_res = await db.execute(cfg_stmt)
    cfg = cfg_res.scalar_one_or_none()
    if not cfg:
        cfg = SheetConfig(
            id="sheet-config-timetable",
            sheet_type="timetable",
            sync_interval_minutes=0,
            auto_apply=False,
            last_sync_status="success",
            last_synced_at=datetime.now(timezone.utc),
            last_sync_summary={
                "slots": imported_slots,
                "sections": len(affected_section_ids),
                "faculty": len(assigned_faculty_ids),
                "courses": len(mapped_course_ids),
            }
        )
        db.add(cfg)
    else:
        cfg.last_synced_at = datetime.now(timezone.utc)
        cfg.last_sync_status = "success"
        cfg.last_sync_summary = {
            "slots": imported_slots,
            "sections": len(affected_section_ids),
            "faculty": len(assigned_faculty_ids),
            "courses": len(mapped_course_ids),
        }
        cfg.pending_preview = None

    await db.commit()

    return {
        "imported_slots": imported_slots,
        "sections_assigned": len(affected_section_ids),
        "faculty_assigned": len(assigned_faculty_ids),
        "courses_mapped": len(mapped_course_ids),
        "message": f"Successfully applied {imported_slots} timetable periods across {len(affected_section_ids)} class sections.",
    }
