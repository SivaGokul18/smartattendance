import io
import re
import uuid
import random
import logging
from typing import Dict, Any, List, Tuple, Optional
from datetime import datetime, timezone
import urllib.parse

import pandas as pd
import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_

from app.core.security import get_password_hash
from app.models.user import User, Student, Faculty, RoleEnum
from app.models.academic import Department
from app.models.sheet_sync import SheetConfig
from app.services.audit_service import log_audit_event

logger = logging.getLogger("sheet_sync")

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")
ALLOWED_GOOGLE_DOMAINS = {"docs.google.com", "sheets.googleapis.com", "drive.google.com", "google.com"}
MAX_SHEET_BYTES = 5 * 1024 * 1024  # 5 MB

ROMAN_SEMESTERS = {
    "i": 1, "ii": 2, "iii": 3, "iv": 4, "v": 5,
    "vi": 6, "vii": 7, "viii": 8, "ix": 9, "x": 10
}

CANONICAL_HEADER_KEYWORDS = {
    "email", "mail", "user_email", "email_address",
    "name", "full_name", "student_name", "faculty_name", "staff_name", "fullname",
    "sno", "s_no", "sl_no", "serial_no", "sr_no",
    "dept", "department", "branch",
    "phone", "mobile", "mobile_no", "phone_number", "contact",
    "student_mobile_no", "faculty_mobile_no", "student_mobile", "faculty_mobile",
    "roll_no", "rollno", "roll_number", "roll", "reg_no", "registration_no", "registration_number", "register_no",
    "semester", "sem",
    "section", "sec",
    "mentor", "mentor_email", "mentor_name", "faculty_mentor", "guide",
    "employee_id", "emp_id", "empid", "faculty_id", "staff_id", "staffid",
    "designation", "role_title", "title", "designation_title",
    "assigned_courses", "courses", "subjects",
    "is_mentor",
}

STUDENT_COLUMNS = [
    {"header": "SNO", "key": "sno", "required": False, "example": "1"},
    {"header": "FULL NAME", "key": "full_name", "required": True, "example": "SIVAGOKUL C"},
    {"header": "EMAIL", "key": "email", "required": True, "example": "sivagokulc18@gmail.com"},
    {"header": "ROLL NO", "key": "roll_number", "required": True, "example": "7376242IT303"},
    {"header": "Dept", "key": "department", "required": True, "example": "Information Technology"},
    {"header": "SEMESTER", "key": "semester", "required": True, "example": "V"},
    {"header": "SECTION", "key": "section", "required": True, "example": "SEC A"},
    {"header": "FACULTY NAME", "key": "faculty_name", "required": False, "example": "santhiya"},
    {"header": "STUDENT MOBILE NO", "key": "phone_number", "required": False, "example": "9787380220"},
]

FACULTY_COLUMNS = [
    {"header": "SNO", "key": "sno", "required": False, "example": "1"},
    {"header": "FULL NAME", "key": "full_name", "required": True, "example": "Dr. Santhiya M"},
    {"header": "EMAIL", "key": "email", "required": True, "example": "santhiya.m@campus.edu"},
    {"header": "STAFF ID", "key": "employee_id", "required": True, "example": "STAFF-IT-101"},
    {"header": "Dept", "key": "department", "required": True, "example": "Information Technology"},
    {"header": "DESIGNATION", "key": "designation", "required": False, "example": "Associate Professor"},
    {"header": "FACULTY MOBILE NO", "key": "phone_number", "required": False, "example": "9876501234"},
    {"header": "IS MENTOR", "key": "is_mentor", "required": False, "example": "TRUE"},
]

STUDENT_KEY_ALIASES = {
    "full_name": ["full_name", "name", "student_name", "fullname"],
    "email": ["email", "email_address", "mail", "user_email"],
    "roll_number": ["roll_no", "rollno", "roll_number", "roll", "reg_no", "registration_no", "registration_number", "register_no"],
    "department": ["dept", "department", "branch", "department_name"],
    "semester": ["semester", "sem", "current_semester"],
    "section": ["section", "sec", "current_section", "class_section"],
    "faculty_name": ["faculty_name", "mentor_name", "faculty", "mentor", "mentor_email", "faculty_mentor", "guide"],
    "phone_number": ["student_mobile_no", "student_mobile", "mobile_no", "mobile", "phone", "contact", "phone_number", "student_phone"],
    "emergency_contact": ["emergency_contact", "emergency", "emergency_phone", "guardian_phone"],
    "sno": ["sno", "s_no", "sl_no", "serial_no", "sr_no"],
}

FACULTY_KEY_ALIASES = {
    "full_name": ["full_name", "name", "faculty_name", "staff_name", "fullname"],
    "email": ["email", "email_address", "mail", "user_email"],
    "employee_id": ["staff_id", "employee_id", "emp_id", "empid", "faculty_id", "staffid", "employee_no"],
    "department": ["dept", "department", "branch", "department_name"],
    "designation": ["designation", "title", "role_title", "designation_title"],
    "assigned_courses": ["assigned_courses", "courses", "subjects"],
    "is_mentor": ["is_mentor", "mentor"],
    "phone_number": ["faculty_mobile_no", "faculty_mobile", "mobile_no", "mobile", "phone", "contact", "phone_number", "faculty_phone"],
    "sno": ["sno", "s_no", "sl_no", "serial_no", "sr_no"],
}


def _normalize_header(h: Any) -> str:
    cleaned = re.sub(r"[\*\(].*?[\)]", "", str(h))
    cleaned = cleaned.replace("*", "").strip().lower()
    cleaned = re.sub(r"\s+", "_", cleaned)
    return cleaned


def parse_semester(val: Any) -> Tuple[int, int]:
    """Parses semester representation (Roman numeral or digit) to (semester_number, year_number)."""
    v_str = str(val).strip().lower()
    clean = re.sub(r"\b(semester|sem)\b", "", v_str).strip()
    if clean in ROMAN_SEMESTERS:
        sem_num = ROMAN_SEMESTERS[clean]
    else:
        digits = re.findall(r"\d+", clean)
        sem_num = int(digits[0]) if digits else 1
    sem_num = max(1, min(10, sem_num))
    year_num = max(1, min(4, (sem_num + 1) // 2))
    return sem_num, year_num


def parse_section(val: Any) -> str:
    """Normalizes section, stripping 'SEC ' or 'SECTION ' prefix (e.g. 'SEC A' -> 'A')."""
    s = str(val).strip()
    m = re.match(r"^(?:sec|section)[\s\-_]*(.+)$", s, re.IGNORECASE)
    if m:
        return m.group(1).strip().upper()
    return s.upper() if s else "A"


def detect_header_and_data(raw_df: pd.DataFrame) -> Tuple[pd.DataFrame, int]:
    """
    Scans the first 15 rows of raw_df to locate the true header row.
    Handles blank top rows, title rows, and institution headers.
    Returns (data_df_with_clean_columns, header_row_index_0_based).
    """
    if raw_df.empty:
        return raw_df, 0

    best_idx = 0
    max_score = -1

    for i in range(min(15, len(raw_df))):
        row_vals = [_normalize_header(c) for c in raw_df.iloc[i].dropna()]
        row_vals = [v for v in row_vals if v]
        score = sum(1 for v in row_vals if v in CANONICAL_HEADER_KEYWORDS)
        if score > max_score:
            max_score = score
            best_idx = i

    if max_score < 2:
        best_idx = 0

    header_values = [_normalize_header(c) for c in raw_df.iloc[best_idx].values]
    data_df = raw_df.iloc[best_idx + 1:].copy().reset_index(drop=True)
    data_df.columns = header_values
    return data_df, best_idx


async def resolve_or_create_department(
    dept_str: str,
    db: AsyncSession,
    all_depts: List[Department]
) -> Department:
    """
    Matches department by code, full name, acronym, or substring.
    Auto-registers the department if not found so imports never fail.
    """
    t_norm = dept_str.strip().lower()
    for d in all_depts:
        if d.code.lower() == t_norm or d.name.lower() == t_norm:
            return d

    words = [w for w in t_norm.split() if w not in {"and", "of", "&", "the"}]
    acronym = "".join(w[0] for w in words).upper()
    if acronym:
        for d in all_depts:
            if d.code.upper() == acronym:
                return d

    for d in all_depts:
        if t_norm in d.name.lower() or d.name.lower() in t_norm:
            return d

    new_code = (acronym[:8] if acronym else t_norm[:5]).upper()
    new_id = f"dept-{new_code.lower()}"
    new_dept = Department(
        id=new_id,
        code=new_code,
        name=dept_str.strip().title(),
        active=True
    )
    db.add(new_dept)
    await db.flush()
    all_depts.append(new_dept)
    return new_dept


async def resolve_or_provision_mentor(
    mentor_input: str,
    default_dept: str,
    db: AsyncSession,
    local_faculty_cache: Dict[str, Faculty],
    all_faculty_users: List[Tuple[User, Faculty]]
) -> Optional[Faculty]:
    """
    Finds existing faculty by email or name.
    If not found, auto-provisions an active faculty member so mentor linkage succeeds.
    """
    mentor_clean = mentor_input.strip()
    if not mentor_clean:
        return None

    m_lower = mentor_clean.lower()
    if m_lower in local_faculty_cache:
        return local_faculty_cache[m_lower]

    for u, f in all_faculty_users:
        if u.email.lower().strip() == m_lower:
            local_faculty_cache[m_lower] = f
            return f
        if u.name.lower().strip() == m_lower or m_lower in u.name.lower().strip():
            local_faculty_cache[m_lower] = f
            return f

    is_email = bool(EMAIL_REGEX.match(mentor_clean))
    slug = re.sub(r"[^a-zA-Z0-9]", "", mentor_clean.lower()) or "mentor"
    email = mentor_clean.lower() if is_email else f"{slug}.faculty@campus.edu"
    name = mentor_clean if not is_email else slug.title()
    employee_id = f"FAC-{slug.upper()[:8]}"

    temp_pw = f"Welcome@{random.randint(1000, 9999)}"
    user_id = f"usr-{uuid.uuid4().hex[:8]}"
    fac_id = f"fac-{uuid.uuid4().hex[:8]}"

    new_user = User(
        id=user_id,
        name=name.title(),
        email=email,
        password_hash=get_password_hash(temp_pw),
        role=RoleEnum.FACULTY,
        department=default_dept,
        must_change_password=True
    )
    new_faculty = Faculty(
        id=fac_id,
        user_id=user_id,
        employee_id=employee_id,
        department=default_dept,
        active=True,
        mentor_group=default_dept
    )
    db.add(new_user)
    db.add(new_faculty)
    await db.flush()

    all_faculty_users.append((new_user, new_faculty))
    local_faculty_cache[m_lower] = new_faculty
    local_faculty_cache[email] = new_faculty
    return new_faculty


# =====================================================================
# SSRF Protection & URL Normalization
# =====================================================================

def validate_and_normalize_sheet_url(raw_url: str) -> str:
    """
    Validates that raw_url is an allowed HTTPS Google Sheet URL (SSRF defense)
    and converts /edit... or published links to a downloadable CSV export URL.
    Supports docs.google.com, drive.google.com, multi-account /u/0/ links, and published web exports.
    """
    if not raw_url or not isinstance(raw_url, str):
        raise ValueError("A valid Google Sheet URL is required.")

    clean_url = raw_url.strip().strip("'\"<>")

    # Auto-prepend https:// if scheme was omitted by user (e.g. docs.google.com/spreadsheets/...)
    if not clean_url.startswith("http://") and not clean_url.startswith("https://"):
        clean_url = "https://" + clean_url

    try:
        parsed = urllib.parse.urlparse(clean_url)
    except Exception as e:
        raise ValueError(f"Invalid URL syntax: {str(e)}")

    # Enforce HTTPS
    if parsed.scheme.lower() != "https":
        clean_url = "https://" + clean_url[len(parsed.scheme) + 3:]
        parsed = urllib.parse.urlparse(clean_url)

    hostname = (parsed.hostname or "").lower()
    is_allowed_host = any(
        hostname == domain or hostname.endswith("." + domain)
        for domain in ALLOWED_GOOGLE_DOMAINS
    )
    if not is_allowed_host:
        raise ValueError(
            f"Access denied: Host '{hostname}' is not an authorized Google Docs/Sheets domain."
        )

    path = parsed.path
    query_params = urllib.parse.parse_qs(parsed.query)

    # 1. Google Drive share links: /file/d/{id}/... or ?id={id}
    if "drive.google.com" in hostname:
        m_file = re.search(r"/file/d/([a-zA-Z0-9-_]+)", path)
        if m_file:
            doc_id = m_file.group(1)
            return f"https://docs.google.com/spreadsheets/d/{doc_id}/export?format=csv"
        if "id" in query_params:
            doc_id = query_params["id"][0]
            return f"https://docs.google.com/spreadsheets/d/{doc_id}/export?format=csv"

    # 2. Check for published CSV link: /spreadsheets/d/e/.../pub?output=csv (or /pubhtml)
    if "/spreadsheets/d/e/" in path:
        clean_path = path.replace("/pubhtml", "/pub")
        query_params["output"] = ["csv"]
        new_query = urllib.parse.urlencode(query_params, doseq=True)
        return urllib.parse.urlunparse((parsed.scheme, parsed.netloc, clean_path, "", new_query, ""))

    # 3. Check for standard or user-scoped spreadsheet link: /spreadsheets/(?:u/\d+/)?d/{SPREADSHEET_ID}/...
    doc_id_match = re.search(r"/spreadsheets/(?:u/\d+/)?d/([a-zA-Z0-9-_]+)", path)
    if not doc_id_match:
        # Fallback to direct /d/{SPREADSHEET_ID}
        doc_id_match = re.search(r"/d/([a-zA-Z0-9-_]+)", path)

    if not doc_id_match:
        raise ValueError("Could not extract Google Spreadsheet ID from the provided URL.")

    doc_id = doc_id_match.group(1)

    gid = None
    if "gid" in query_params:
        gid = query_params["gid"][0]
    elif parsed.fragment:
        fragment_match = re.search(r"gid=(\d+)", parsed.fragment)
        if fragment_match:
            gid = fragment_match.group(1)

    # Handle standard sheet published via /pubhtml or /pub
    if "/pubhtml" in path or "/pub" in path:
        pub_params = {"output": "csv"}
        if gid:
            pub_params["gid"] = gid
            pub_params["single"] = "true"
        return f"https://docs.google.com/spreadsheets/d/{doc_id}/pub?{urllib.parse.urlencode(pub_params)}"

    export_path = f"/spreadsheets/d/{doc_id}/export"
    new_params = {"format": "csv"}
    if gid:
        new_params["gid"] = gid

    return urllib.parse.urlunparse((
        "https",
        "docs.google.com",
        export_path,
        "",
        urllib.parse.urlencode(new_params),
        ""
    ))


async def fetch_sheet_csv(url: str, max_bytes: int = MAX_SHEET_BYTES) -> str:
    """
    Streams CSV content from the normalized Google Sheet URL with strict size cap and timeout.
    Detects private sheet redirects to accounts.google.com and HTML error pages.
    """
    headers = {
        "User-Agent": "SmartAttendance-LiveSync/1.0",
        "Accept": "text/csv, text/plain, */*",
    }

    async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
        try:
            async with client.stream("GET", url, headers=headers) as response:
                redirect_host = (response.url.host or "").lower()
                
                # Check for Google sign-in redirect (private sheet)
                if "accounts.google.com" in redirect_host or "accounts.google.com" in str(response.url):
                    raise ValueError(
                        "The Google Sheet is private or requires Google account sign-in. "
                        "Please change sharing permissions to 'Anyone with the link can view' "
                        "or publish via File → Share → Publish to web → choose 'CSV'."
                    )

                is_valid_dest = any(
                    redirect_host == d or redirect_host.endswith("." + d)
                    for d in (ALLOWED_GOOGLE_DOMAINS | {"googleusercontent.com"})
                )
                if not is_valid_dest:
                    raise ValueError(f"SSRF violation: Redirected to unauthorized host '{redirect_host}'.")

                if response.status_code == 404:
                    raise ValueError("Google Sheet not found. Please verify the URL.")
                if response.status_code in (401, 403):
                    raise ValueError(
                        "Access denied to Google Sheet. Ensure the sheet is shared with "
                        "'Anyone with the link can view' or published to the web."
                    )
                if response.status_code != 200:
                    raise ValueError(f"Failed to fetch Google Sheet: HTTP status {response.status_code}")

                content_chunks = []
                total_bytes = 0
                async for chunk in response.aiter_bytes():
                    total_bytes += len(chunk)
                    if total_bytes > max_bytes:
                        raise ValueError(f"Sheet exceeds maximum allowed file size of {max_bytes // (1024*1024)}MB.")
                    content_chunks.append(chunk)

                raw_bytes = b"".join(content_chunks)
        except httpx.RequestError as exc:
            raise ValueError(f"Network error while connecting to Google Sheet: {str(exc)}")

    try:
        content_text = raw_bytes.decode("utf-8-sig")
    except UnicodeDecodeError:
        content_text = raw_bytes.decode("latin-1", errors="replace")

    first_strip = content_text.strip().lower()
    if (
        first_strip.startswith("<!doctype html")
        or "<html" in first_strip[:400]
        or "servicelogin" in first_strip[:1000]
        or "accounts.google.com" in first_strip[:1000]
    ):
        raise ValueError(
            "The Google Sheet is private or requires Google account sign-in. "
            "Please publish the sheet via 'File' → 'Share' → 'Publish to web' → choose 'CSV', "
            "or set sharing permissions to 'Anyone with the link can view'."
        )

    return content_text


def generate_csv_template(sheet_type: str) -> str:
    """Generates official CSV template string for students or faculty matching the institutional layout."""
    is_student = sheet_type.lower() == "student"
    cols = STUDENT_COLUMNS if is_student else FACULTY_COLUMNS
    headers = [c["header"] for c in cols]

    if is_student:
        sample_1 = ["1", "SIVAGOKUL C", "sivagokulc18@gmail.com", "7376242IT303", "Information Technology", "V", "SEC A", "santhiya", "9787380220"]
        sample_2 = ["2", "SIVANAGU", "sivanagu2006@gmail.com", "7376242IT304", "Information Technology", "V", "SEC A", "ramya", "8754124976"]
    else:
        sample_1 = ["1", "Dr. Santhiya M", "santhiya.m@campus.edu", "STAFF-IT-101", "Information Technology", "Associate Professor", "9876501234", "TRUE"]
        sample_2 = ["2", "Dr. Ramya K", "ramya.k@campus.edu", "STAFF-CS-102", "Computer Science and Engineering", "Assistant Professor", "9876505678", "TRUE"]

    output = io.StringIO()
    df = pd.DataFrame([sample_1, sample_2], columns=headers)
    df.to_csv(output, index=False)
    return output.getvalue()


# =====================================================================
# Validation & Diff Engine
# =====================================================================

async def validate_and_diff_sheet_data(
    csv_text: str,
    sheet_type: str,
    db: AsyncSession
) -> Dict[str, Any]:
    """
    Parses live Google Sheet CSV, correlates records by email, calculates granular diffs,
    supports smart header detection, Roman numeral semesters, section normalization,
    and returns preview with granular diffs.
    """
    is_student = sheet_type.lower() == "student"
    target_cols = STUDENT_COLUMNS if is_student else FACULTY_COLUMNS
    alias_dict = STUDENT_KEY_ALIASES if is_student else FACULTY_KEY_ALIASES

    try:
        raw_df = pd.read_csv(io.StringIO(csv_text), header=None, dtype=str)
    except Exception as e:
        raise ValueError(f"Could not parse Google Sheet CSV: {str(e)}")

    if raw_df is None or raw_df.empty:
        return {
            "sheet_type": sheet_type,
            "total_rows": 0,
            "valid_rows_count": 0,
            "warning_rows_count": 0,
            "error_rows_count": 0,
            "create_count": 0,
            "update_count": 0,
            "missing_count": 0,
            "preview_rows": [],
            "missing_rows": [],
            "headers": [c["header"] for c in target_cols],
        }

    # Smart header detection
    df, header_row_idx = detect_header_and_data(raw_df)
    df_cols_normalized = list(df.columns)

    # Column aliases
    for canonical_key, aliases in alias_dict.items():
        if canonical_key not in df.columns:
            matched = next((a for a in aliases if a in df_cols_normalized), None)
            if matched:
                df.rename(columns={matched: canonical_key}, inplace=True)
                df_cols_normalized = list(df.columns)

    missing_required = []
    for c in target_cols:
        key = c["key"]
        if c["required"] and key not in df.columns:
            missing_required.append(c["header"])

    if missing_required:
        raise ValueError(
            f"Google Sheet is missing required columns: {', '.join(missing_required)}. "
            f"Please verify headers match the template."
        )

    # 1. Fetch DB records for matching & diffing
    all_users = (await db.execute(select(User))).scalars().all()
    user_by_email = {u.email.lower().strip(): u for u in all_users if u.email}
    user_by_id = {u.id: u for u in all_users}

    student_by_user_id = {}
    if is_student:
        stu_res = await db.execute(select(Student))
        for s in stu_res.scalars().all():
            student_by_user_id[s.user_id] = s

    faculty_by_user_id = {}
    all_faculty = (await db.execute(select(Faculty))).scalars().all()
    for f in all_faculty:
        faculty_by_user_id[f.user_id] = f

    faculty_email_map = {}
    faculty_name_map = {}
    for f in all_faculty:
        u = next((usr for usr in all_users if usr.id == f.user_id), None)
        if u and u.email:
            faculty_email_map[u.email.lower().strip()] = (f.id, u.name)
        if u and u.name:
            faculty_name_map[u.name.lower().strip()] = (f.id, u.name)

    all_depts_list = list((await db.execute(select(Department))).scalars().all())

    existing_ident_map = {}
    if is_student:
        for s in student_by_user_id.values():
            if s.roll_number:
                existing_ident_map[s.roll_number.lower().strip()] = s.user_id
    else:
        for f in faculty_by_user_id.values():
            if f.employee_id:
                existing_ident_map[f.employee_id.lower().strip()] = f.user_id

    seen_file_emails = {}
    seen_file_ids = {}
    processed_emails_in_sheet = set()

    preview_rows = []
    valid_count = 0
    warning_count = 0
    error_count = 0
    create_count = 0
    update_count = 0

    # 2. Iterate rows
    for row_idx, row in df.iterrows():
        row_num = header_row_idx + 2 + int(row_idx)

        row_vals = [str(v).strip() for v in row.values if pd.notna(v) and str(v).strip() != ""]
        if not row_vals:
            continue

        row_data = {}
        for c in target_cols:
            k = c["key"]
            val = str(row.get(k, "")).strip() if pd.notna(row.get(k)) else ""
            if val.lower() == "nan":
                val = ""
            row_data[k] = val

        row_errors = []
        row_warnings = []
        row_changes = {}
        action = "create"

        # Validate Name
        name = row_data.get("full_name", "").strip()
        if not name:
            row_errors.append("Full Name is required.")

        # Validate Email
        email = row_data.get("email", "").strip().lower()
        matched_user: Optional[User] = None

        if not email:
            row_errors.append("Email is required.")
        elif not EMAIL_REGEX.match(email):
            row_errors.append(f"Invalid email format: '{email}'.")
        else:
            processed_emails_in_sheet.add(email)
            if email in seen_file_emails:
                row_errors.append(f"Duplicate email in sheet (row {seen_file_emails[email]} and row {row_num}).")
            else:
                seen_file_emails[email] = row_num

            if email in user_by_email:
                matched_user = user_by_email[email]
                expected_role = RoleEnum.STUDENT if is_student else RoleEnum.FACULTY
                if matched_user.role != expected_role:
                    row_errors.append(
                        f"Email '{email}' belongs to an existing user with role '{matched_user.role}', not '{expected_role}'."
                    )
                else:
                    action = "update"

        # Department Matching
        dept_str = row_data.get("department", "").strip()
        matched_dept_name = None
        if not dept_str:
            row_errors.append("Department is required.")
        else:
            t_norm = dept_str.lower()
            m_dept = next(
                (d for d in all_depts_list if d.code.lower() == t_norm or d.name.lower() == t_norm),
                None
            )
            if not m_dept:
                words = [w for w in t_norm.split() if w not in {"and", "of", "&", "the"}]
                acronym = "".join(w[0] for w in words).upper()
                if acronym:
                    m_dept = next((d for d in all_depts_list if d.code.upper() == acronym), None)
            if not m_dept:
                m_dept = next((d for d in all_depts_list if t_norm in d.name.lower() or d.name.lower() in t_norm), None)

            if m_dept:
                matched_dept_name = m_dept.name
                row_data["department"] = matched_dept_name
            else:
                matched_dept_name = dept_str.strip().title()
                row_data["department"] = matched_dept_name
                row_warnings.append(f"Department '{dept_str}' will be automatically created.")

        # Validate Identifier
        if is_student:
            roll = row_data.get("roll_number", "").strip().upper()
            if not roll:
                row_errors.append("Roll Number is required.")
            else:
                r_lower = roll.lower()
                if r_lower in seen_file_ids:
                    row_errors.append(f"Duplicate Roll Number '{roll}' in row {seen_file_ids[r_lower]} and row {row_num}.")
                else:
                    seen_file_ids[r_lower] = row_num

                if not matched_user and r_lower in existing_ident_map:
                    matched_user = user_by_id.get(existing_ident_map[r_lower])
                    if matched_user:
                        action = "update"

                if r_lower in existing_ident_map:
                    owner_user_id = existing_ident_map[r_lower]
                    if matched_user and matched_user.id != owner_user_id:
                        row_errors.append(f"Roll Number '{roll}' is already assigned to another student.")

            # Semester & Section
            sem_raw = row_data.get("semester", "").strip()
            if not sem_raw:
                row_errors.append("Semester is required (e.g. V or 5).")
            else:
                sem_num, year_num = parse_semester(sem_raw)
                row_data["semester"] = str(sem_num)
                row_data["year"] = year_num

            sec_raw = row_data.get("section", "").strip()
            if not sec_raw:
                row_errors.append("Section is required (e.g. SEC A or A).")
            else:
                row_data["section"] = parse_section(sec_raw)

            # Mentor resolution
            mentor_input = row_data.get("faculty_name", "").strip()
            if mentor_input:
                m_lower = mentor_input.lower()
                m_tuple = faculty_email_map.get(m_lower) or faculty_name_map.get(m_lower)
                if not m_tuple:
                    # check substring in name
                    m_tuple = next(
                        (v for k, v in faculty_name_map.items() if m_lower in k or k in m_lower),
                        None
                    )
                if not m_tuple:
                    row_warnings.append(f"Mentor account '{mentor_input}' will be auto-provisioned upon sync.")
        else:
            emp = row_data.get("employee_id", "").strip().upper()
            if not emp:
                row_errors.append("Employee ID is required.")
            else:
                e_lower = emp.lower()
                if e_lower in seen_file_ids:
                    row_errors.append(f"Duplicate Employee ID '{emp}' in row {seen_file_ids[e_lower]} and row {row_num}.")
                else:
                    seen_file_ids[e_lower] = row_num

                if not matched_user and e_lower in existing_ident_map:
                    matched_user = user_by_id.get(existing_ident_map[e_lower])
                    if matched_user:
                        action = "update"

                if e_lower in existing_ident_map:
                    owner_user_id = existing_ident_map[e_lower]
                    if matched_user and matched_user.id != owner_user_id:
                        row_errors.append(f"Employee ID '{emp}' is already assigned to another faculty member.")

        # Compute Diffs for existing records
        if action == "update" and matched_user:
            if name and name != matched_user.name:
                row_changes["name"] = {"old": matched_user.name, "new": name}
            if matched_dept_name and matched_dept_name != matched_user.department:
                row_changes["department"] = {"old": matched_user.department, "new": matched_dept_name}

            phone = row_data.get("phone_number", "").strip()
            if phone and phone != (matched_user.phone or ""):
                row_changes["phone"] = {"old": matched_user.phone or "", "new": phone}

            if is_student:
                stu_prof = student_by_user_id.get(matched_user.id)
                if stu_prof:
                    roll = row_data.get("roll_number", "").strip().upper()
                    if roll and roll != stu_prof.roll_number:
                        row_changes["roll_number"] = {"old": stu_prof.roll_number, "new": roll}

                    sec = row_data.get("section", "").strip().upper()
                    if sec and sec != (stu_prof.section or "").upper():
                        row_changes["section"] = {"old": stu_prof.section, "new": sec}

                    year_num = row_data.get("year")
                    if year_num and year_num != stu_prof.year:
                        row_changes["year"] = {"old": f"Year {stu_prof.year}", "new": f"Year {year_num}"}

                    mentor_input = row_data.get("faculty_name", "").strip()
                    if mentor_input:
                        m_lower = mentor_input.lower()
                        m_tuple = faculty_email_map.get(m_lower) or faculty_name_map.get(m_lower)
                        if not m_tuple:
                            m_tuple = next(
                                (v for k, v in faculty_name_map.items() if m_lower in k or k in m_lower),
                                None
                            )
                        new_fac_id = m_tuple[0] if m_tuple else None
                        if new_fac_id and new_fac_id != stu_prof.mentor_id:
                            old_fac_name = "None"
                            if stu_prof.mentor_id:
                                old_f = next((f for f in all_faculty if f.id == stu_prof.mentor_id), None)
                                if old_f:
                                    old_u = next((u for u in all_users if u.id == old_f.user_id), None)
                                    old_fac_name = old_u.name if old_u else "Assigned"
                            row_changes["mentor"] = {"old": old_fac_name, "new": m_tuple[1] if m_tuple else mentor_input}
            else:
                fac_prof = faculty_by_user_id.get(matched_user.id)
                if fac_prof:
                    emp = row_data.get("employee_id", "").strip().upper()
                    if emp and emp != fac_prof.employee_id:
                        row_changes["employee_id"] = {"old": fac_prof.employee_id, "new": emp}

                    desig = row_data.get("designation", "").strip()
                    if desig and desig.lower() != (fac_prof.designation or "").strip().lower():
                        row_changes["designation"] = {"old": fac_prof.designation or "None", "new": desig}

                    is_m_str = str(row_data.get("is_mentor", "")).strip().lower()
                    is_m = is_m_str in ["true", "1", "yes", "y"]
                    if is_m != bool(fac_prof.is_mentor):
                        row_changes["is_mentor"] = {"old": str(bool(fac_prof.is_mentor)), "new": str(is_m)}

            if not row_changes and not row_errors:
                action = "unchanged"

        # Determine Row Status
        if row_errors:
            status = "error"
            error_count += 1
        elif row_warnings:
            status = "warning"
            warning_count += 1
            if action == "create":
                create_count += 1
            elif action == "update":
                update_count += 1
        else:
            status = "valid"
            valid_count += 1
            if action == "create":
                create_count += 1
            elif action == "update":
                update_count += 1

        preview_rows.append({
            "row_number": row_num,
            "data": row_data,
            "action": action,
            "status": status,
            "errors": row_errors,
            "warnings": row_warnings,
            "changes": row_changes,
        })

    # Missing rows: active records in DB missing from sheet
    missing_rows = []
    target_role = RoleEnum.STUDENT if is_student else RoleEnum.FACULTY
    for email_key, u in user_by_email.items():
        if u.role == target_role and email_key not in processed_emails_in_sheet:
            ident = ""
            sec_val = ""
            if is_student and u.id in student_by_user_id:
                s = student_by_user_id[u.id]
                ident = s.roll_number
                sec_val = s.section
            elif not is_student and u.id in faculty_by_user_id:
                f = faculty_by_user_id[u.id]
                ident = f.employee_id

            missing_rows.append({
                "id": u.id,
                "name": u.name,
                "email": u.email,
                "identifier": ident,
                "department": u.department,
                "section": sec_val,
            })

    return {
        "sheet_type": sheet_type,
        "total_rows": len(preview_rows),
        "valid_rows_count": valid_count,
        "warning_rows_count": warning_count,
        "error_rows_count": error_count,
        "create_count": create_count,
        "update_count": update_count,
        "missing_count": len(missing_rows),
        "preview_rows": preview_rows,
        "missing_rows": missing_rows,
        "headers": [c["header"] for c in target_cols],
    }


# =====================================================================
# Apply Engine
# =====================================================================

async def apply_sheet_sync_rows(
    sheet_type: str,
    rows: List[Dict[str, Any]],
    actor_id: str,
    actor_role: str,
    db: AsyncSession
) -> Dict[str, Any]:
    """
    Applies validated row changes to MySQL database:
    - Automatically creates/resolves departments
    - Automatically links/provisions faculty mentors
    - Parses Roman numeral semesters and normalized sections
    - Generates welcome credentials for new accounts
    - Preserves all attendance and biometric data untouched
    """
    is_student = sheet_type.lower() == "student"

    all_users = (await db.execute(select(User))).scalars().all()
    user_by_email = {u.email.lower().strip(): u for u in all_users if u.email}

    student_by_user_id = {}
    if is_student:
        stu_res = await db.execute(select(Student))
        for s in stu_res.scalars().all():
            student_by_user_id[s.user_id] = s

    faculty_by_user_id = {}
    fac_res = await db.execute(select(Faculty))
    for f in fac_res.scalars().all():
        faculty_by_user_id[f.user_id] = f

    all_depts_list = list((await db.execute(select(Department))).scalars().all())

    faculty_users_raw = (
        await db.execute(
            select(User, Faculty).join(Faculty, Faculty.user_id == User.id)
        )
    ).all()
    all_faculty_users = list(faculty_users_raw)
    local_faculty_cache: Dict[str, Faculty] = {}

    imported_count = 0
    updated_count = 0
    skipped_count = 0
    skipped_errors = []
    generated_credentials = []

    for row_item in rows:
        row_num = row_item.get("row_number", "?")
        status = row_item.get("status", "valid")
        action = row_item.get("action", "create")
        data = row_item.get("data", {})

        if status == "error":
            skipped_count += 1
            skipped_errors.append({
                "row_number": row_num,
                "data": data,
                "reason": "; ".join(row_item.get("errors", ["Validation error"]))
            })
            continue

        email = data.get("email", "").strip().lower()
        name = data.get("full_name", "").strip()
        raw_dept = data.get("department", "Information Technology").strip()
        phone = data.get("phone_number", "").strip() or None

        # Resolve or auto-create department
        dept_obj = await resolve_or_create_department(raw_dept, db, all_depts_list)
        dept = dept_obj.name

        # Check if record exists (by email OR by identifier)
        target_user = user_by_email.get(email)
        if not target_user:
            if is_student:
                r_val = data.get("roll_number", "").strip().lower()
                target_stu = next((s for s in student_by_user_id.values() if s.roll_number.lower() == r_val), None)
                if target_stu:
                    target_user = user_by_id.get(target_stu.user_id)
            else:
                e_val = data.get("employee_id", "").strip().lower()
                target_fac = next((f for f in faculty_by_user_id.values() if f.employee_id.lower() == e_val), None)
                if target_fac:
                    target_user = user_by_id.get(target_fac.user_id)

        if target_user:
            user = target_user
            if name:
                user.name = name
            if dept:
                user.department = dept
            if phone is not None:
                user.phone = phone
            if email and user.email != email:
                user.email = email
                user_by_email[email] = user

            if is_student:
                stu = student_by_user_id.get(user.id)
                if stu:
                    roll = data.get("roll_number", "").strip().upper()
                    if roll:
                        stu.roll_number = roll
                    stu.department = dept

                    sec_raw = data.get("section", "").strip()
                    if sec_raw:
                        stu.section = parse_section(sec_raw)

                    sem_raw = data.get("semester", "")
                    if sem_raw:
                        sem_num, year_num = parse_semester(sem_raw)
                        stu.year = year_num

                    mentor_input = data.get("faculty_name", "").strip()
                    if mentor_input:
                        mentor_fac = await resolve_or_provision_mentor(
                            mentor_input=mentor_input,
                            default_dept=dept,
                            db=db,
                            local_faculty_cache=local_faculty_cache,
                            all_faculty_users=all_faculty_users
                        )
                        if mentor_fac:
                            stu.mentor_id = mentor_fac.id
            else:
                fac = faculty_by_user_id.get(user.id)
                if fac:
                    emp = data.get("employee_id", "").strip().upper()
                    if emp:
                        fac.employee_id = emp
                    fac.department = dept
                    desig = data.get("designation", "").strip()
                    if desig:
                        fac.designation = desig
                    is_m = str(data.get("is_mentor", "")).strip().lower() in ["true", "1", "yes", "y"]
                    fac.is_mentor = is_m
                    fac.mentor_group = dept if is_m else None

            updated_count += 1

        else:
            temp_password = f"Welcome@{random.randint(1000, 9999)}"
            hashed_password = get_password_hash(temp_password)
            user_role = RoleEnum.STUDENT if is_student else RoleEnum.FACULTY
            user_id = f"usr-{uuid.uuid4().hex[:8]}"

            new_user = User(
                id=user_id,
                name=name,
                email=email,
                password_hash=hashed_password,
                role=user_role,
                department=dept,
                phone=phone,
                must_change_password=True
            )
            db.add(new_user)
            user_by_email[email] = new_user

            identifier = ""
            if is_student:
                roll = data.get("roll_number", "").strip().upper()
                identifier = roll

                sem_num, year_num = parse_semester(data.get("semester", "5"))
                sec_str = parse_section(data.get("section", "A"))

                mentor_input = data.get("faculty_name", "").strip()
                mentor_fac = None
                if mentor_input:
                    mentor_fac = await resolve_or_provision_mentor(
                        mentor_input=mentor_input,
                        default_dept=dept,
                        db=db,
                        local_faculty_cache=local_faculty_cache,
                        all_faculty_users=all_faculty_users
                    )

                new_student = Student(
                    id=f"stu-{uuid.uuid4().hex[:8]}",
                    user_id=new_user.id,
                    roll_number=roll,
                    department=dept,
                    year=year_num,
                    section=sec_str,
                    attendance_rate=90.0,
                    face_id_status="pending",
                    mentor_id=mentor_fac.id if mentor_fac else None
                )
                db.add(new_student)
                student_by_user_id[new_user.id] = new_student
            else:
                emp = data.get("employee_id", "").strip().upper()
                identifier = emp
                is_m = str(data.get("is_mentor", "")).strip().lower() in ["true", "1", "yes", "y"]

                new_faculty = Faculty(
                    id=f"fac-{uuid.uuid4().hex[:8]}",
                    user_id=new_user.id,
                    employee_id=emp,
                    department=dept,
                    active=True,
                    mentor_group=dept if is_m else None
                )
                db.add(new_faculty)
                faculty_by_user_id[new_user.id] = new_faculty

            imported_count += 1
            generated_credentials.append({
                "name": name,
                "email": email,
                "identifier": identifier,
                "role": user_role,
                "temporaryPassword": temp_password,
                "department": dept
            })

    # Log to audit_logs
    await log_audit_event(
        db=db,
        actor_id=actor_id,
        actor_role=actor_role,
        action_type="sheet_sync_apply",
        target_entity=f"sheet_{sheet_type}",
        metadata={
            "sheet_type": sheet_type,
            "created_count": imported_count,
            "updated_count": updated_count,
            "skipped_count": skipped_count,
            "total_processed": len(rows),
        }
    )

    # Update SheetConfig record
    config_id = f"sheet-config-{sheet_type.lower()}"
    cfg_stmt = select(SheetConfig).where(SheetConfig.id == config_id)
    cfg_res = await db.execute(cfg_stmt)
    cfg = cfg_res.scalar_one_or_none()
    if cfg:
        cfg.last_synced_at = datetime.now(timezone.utc)
        cfg.last_sync_status = "success"
        cfg.last_sync_summary = {
            "total": len(rows),
            "created": imported_count,
            "updated": updated_count,
            "skipped": skipped_count,
        }
        cfg.pending_preview = None

    await db.commit()

    message = f"Applied successfully: {imported_count} created, {updated_count} updated, {skipped_count} skipped."
    return {
        "imported": imported_count,
        "updated": updated_count,
        "skipped": skipped_count,
        "errors": skipped_errors,
        "credentials": generated_credentials,
        "message": message,
    }


# =====================================================================
# Background Scheduler Runner
# =====================================================================

async def check_and_execute_scheduled_syncs(db: AsyncSession):
    """
    Periodic job invoked by APScheduler every minute.
    Checks due configs with sync_interval_minutes > 0.
    """
    stmt = select(SheetConfig).where(
        SheetConfig.url.isnot(None),
        SheetConfig.sync_interval_minutes > 0
    )
    result = await db.execute(stmt)
    configs = result.scalars().all()

    now = datetime.now(timezone.utc)
    for cfg in configs:
        if not cfg.url:
            continue

        is_due = False
        if not cfg.last_synced_at:
            is_due = True
        else:
            elapsed_minutes = (now - cfg.last_synced_at.replace(tzinfo=timezone.utc if cfg.last_synced_at.tzinfo is None else cfg.last_synced_at.tzinfo)).total_seconds() / 60
            if elapsed_minutes >= cfg.sync_interval_minutes:
                is_due = True

        if not is_due:
            continue

        logger.info(f"Triggering scheduled sync for {cfg.sheet_type} (URL: {cfg.url})...")
        try:
            norm_url = validate_and_normalize_sheet_url(cfg.url)
            csv_text = await fetch_sheet_csv(norm_url)

            if cfg.sheet_type.lower() == "timetable":
                from app.services.timetable_sync import parse_and_validate_timetable, apply_timetable_sync_rows
                df_tt = pd.read_csv(io.StringIO(csv_text), dtype=str, skip_blank_lines=True)
                preview = await parse_and_validate_timetable(df_tt, db)

                if cfg.auto_apply and preview["error_slots_count"] == 0:
                    logger.info(f"Auto-applying {len(preview['preview_rows'])} timetable slots...")
                    await apply_timetable_sync_rows(
                        rows=preview["preview_rows"],
                        replace_existing=True,
                        actor_id="system_scheduler",
                        actor_role="system",
                        db=db
                    )
                else:
                    cfg.pending_preview = preview
                    cfg.last_synced_at = now
                    cfg.last_sync_status = "pending_review" if preview["error_slots_count"] == 0 else "warning"
                    cfg.last_sync_summary = {
                        "total": preview["total_slots"],
                        "valid": preview["valid_slots_count"],
                        "warnings": preview["warning_slots_count"],
                        "errors": preview["error_slots_count"],
                        "conflicts": preview["conflict_count"],
                        "sections": len(preview["unique_sections"]),
                        "faculty": len(preview["unique_faculty"]),
                        "courses": len(preview["unique_courses"]),
                    }
                    await db.commit()
                    logger.info("Staged pending timetable preview for admin approval.")
            else:
                preview = await validate_and_diff_sheet_data(csv_text, cfg.sheet_type, db)

                if cfg.auto_apply and preview["error_rows_count"] == 0:
                    logger.info(f"Auto-applying {len(preview['preview_rows'])} rows for {cfg.sheet_type}...")
                    await apply_sheet_sync_rows(
                        sheet_type=cfg.sheet_type,
                        rows=preview["preview_rows"],
                        actor_id="system_scheduler",
                        actor_role="system",
                        db=db
                    )
                else:
                    cfg.pending_preview = preview
                    cfg.last_synced_at = now
                    cfg.last_sync_status = "pending_review" if preview["error_rows_count"] == 0 else "warning"
                    cfg.last_sync_summary = {
                        "total": preview["total_rows"],
                        "valid": preview["valid_rows_count"],
                        "warnings": preview["warning_rows_count"],
                        "errors": preview["error_rows_count"],
                        "created": preview["create_count"],
                        "updated": preview["update_count"],
                        "missing": preview["missing_count"],
                    }
                    await db.commit()
                    logger.info(f"Staged pending preview for {cfg.sheet_type} admin approval.")

        except Exception as e:
            logger.error(f"Scheduled sync failed for {cfg.sheet_type}: {e}", exc_info=True)
            cfg.last_synced_at = now
            cfg.last_sync_status = "error"
            cfg.last_sync_summary = {"error": str(e)}
            await db.commit()
