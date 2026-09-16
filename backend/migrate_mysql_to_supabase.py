import asyncio
import json
import os
import sys
import pymysql
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.config import settings
from app.core.database import AsyncSessionLocal, engine, Base
from app.models.user import User, Student, Faculty, RoleEnum
from app.models.academic import Department, Course, ClassSection, Room, TimetableSlot, SectionSubjectFaculty
from app.models.attendance import AttendanceSession, AttendanceRecord
from app.models.leave import LeaveRequest, FacultyLeaveRequest
from app.models.audit import AuditLog
from app.models.settings import AdminSettings
from app.models.sheet_sync import SheetConfig
from sqlalchemy import select, func


def parse_json_field(val):
    if val is None:
        return None
    if isinstance(val, (dict, list)):
        return val
    if isinstance(val, str):
        try:
            return json.loads(val)
        except Exception:
            return val
    return val


def parse_bool_field(val):
    if val is None:
        return False
    if isinstance(val, bool):
        return val
    if isinstance(val, int):
        return bool(val)
    if isinstance(val, str):
        return val.lower() in ("1", "true", "yes")
    return bool(val)


async def migrate():
    print("=" * 70)
    print("  Smart Attendance: Local MySQL -> Supabase (PostgreSQL) Migration")
    print("=" * 70)

    if "sqlite" in settings.DATABASE_URL:
        print("\n[ERROR] DATABASE_URL is pointing to SQLite fallback.")
        print("Please configure your Supabase connection string in backend/.env:")
        print("DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres")
        print("or connection pooler:")
        print("DATABASE_URL=postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres\n")
        return

    db_target = settings.DATABASE_URL.split('@')[-1] if '@' in settings.DATABASE_URL else 'PostgreSQL'
    print(f"\n[1/4] Target Database: {db_target}")

    # 1. Verify/Create tables on Supabase
    print("\n[2/4] Verifying and creating PostgreSQL schema on Supabase...")
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        print("      [OK] All 16 tables verified/created on Supabase.")
    except Exception as e:
        print(f"      [ERROR] Could not initialize Supabase schema: {e}")
        return

    # 2. Connect to local MySQL
    print("\n[3/4] Reading data from local MySQL database (smart_attendance)...")
    mysql_host = os.getenv("MYSQL_HOST", "localhost")
    mysql_port = int(os.getenv("MYSQL_PORT", "3306"))
    mysql_user = os.getenv("MYSQL_USER", "root")
    mysql_password = os.getenv("MYSQL_PASSWORD", "SIVAGOKUL@2007")
    mysql_db = os.getenv("MYSQL_DATABASE", "smart_attendance")

    try:
        mysql_conn = pymysql.connect(
            host=mysql_host,
            port=mysql_port,
            user=mysql_user,
            password=mysql_password,
            database=mysql_db,
            cursorclass=pymysql.cursors.DictCursor
        )
        print(f"      [OK] Connected to local MySQL at {mysql_host}:{mysql_port}")
    except Exception as e:
        print(f"      [NOTICE] Could not connect to local MySQL: {e}")
        print("      If your MySQL is stopped or password differs, set MYSQL_PASSWORD in environment.")
        print("      Falling back to auto-seeding fresh Supabase database...")
        from seed import seed_database
        await seed_database()
        return

    # Extract all tables from MySQL
    tables_data = {}
    table_names = [
        "admin_settings",
        "departments",
        "users",
        "faculty",
        "students",
        "courses",
        "rooms",
        "class_sections",
        "section_subject_faculty",
        "timetable_slots",
        "attendance_sessions",
        "attendance_records",
        "leave_requests",
        "faculty_leave_requests",
        "audit_logs",
        "sheet_configs"
    ]

    with mysql_conn.cursor() as cur:
        for tbl in table_names:
            try:
                cur.execute(f"SELECT * FROM `{tbl}`;")
                rows = cur.fetchall()
                tables_data[tbl] = rows
                print(f"      - {tbl:25}: {len(rows)} records extracted")
            except Exception as ex:
                tables_data[tbl] = []
                print(f"      - {tbl:25}: [NOTICE] {ex}")

    mysql_conn.close()

    # 3. Load into Supabase in strict Foreign Key order
    print("\n[4/4] Writing records to Supabase PostgreSQL...")
    async with AsyncSessionLocal() as db:
        # 1. Admin Settings
        for r in tables_data.get("admin_settings", []):
            if not await db.get(AdminSettings, r["id"]):
                r["liveness_check_enabled"] = parse_bool_field(r.get("liveness_check_enabled"))
                r["auto_sync_offline"] = parse_bool_field(r.get("auto_sync_offline"))
                r["faculty_manual_override_allowed"] = parse_bool_field(r.get("faculty_manual_override_allowed"))
                db.add(AdminSettings(**r))
        await db.commit()

        # 2. Departments
        for r in tables_data.get("departments", []):
            if not await db.get(Department, r["id"]):
                r["active"] = parse_bool_field(r.get("active"))
                db.add(Department(**r))
        await db.commit()

        # 3. Users
        for r in tables_data.get("users", []):
            if not await db.get(User, r["id"]):
                r["must_change_password"] = parse_bool_field(r.get("must_change_password"))
                db.add(User(**r))
        await db.commit()

        # 4. Faculty
        for r in tables_data.get("faculty", []):
            if not await db.get(Faculty, r["id"]):
                r["active"] = parse_bool_field(r.get("active"))
                r["is_mentor"] = parse_bool_field(r.get("is_mentor"))
                db.add(Faculty(**r))
        await db.commit()

        # 5. Students
        for r in tables_data.get("students", []):
            if not await db.get(Student, r["id"]):
                db.add(Student(**r))
        await db.commit()

        # 6. Courses
        for r in tables_data.get("courses", []):
            if not await db.get(Course, r["id"]):
                db.add(Course(**r))
        await db.commit()

        # 7. Rooms
        for r in tables_data.get("rooms", []):
            if not await db.get(Room, r["id"]):
                db.add(Room(**r))
        await db.commit()

        # 8. Class Sections
        for r in tables_data.get("class_sections", []):
            if not await db.get(ClassSection, r["id"]):
                db.add(ClassSection(**r))
        await db.commit()

        # 9. Section Subject Faculty
        for r in tables_data.get("section_subject_faculty", []):
            if not await db.get(SectionSubjectFaculty, r["id"]):
                db.add(SectionSubjectFaculty(**r))
        await db.commit()

        # 10. Timetable Slots
        for r in tables_data.get("timetable_slots", []):
            if not await db.get(TimetableSlot, r["id"]):
                db.add(TimetableSlot(**r))
        await db.commit()

        # 11. Attendance Sessions
        for r in tables_data.get("attendance_sessions", []):
            if not await db.get(AttendanceSession, r["id"]):
                r["face_verification_required"] = parse_bool_field(r.get("face_verification_required"))
                db.add(AttendanceSession(**r))
        await db.commit()

        # 12. Attendance Records
        for r in tables_data.get("attendance_records", []):
            if not await db.get(AttendanceRecord, r["id"]):
                r["face_verified"] = parse_bool_field(r.get("face_verified"))
                db.add(AttendanceRecord(**r))
        await db.commit()

        # 13. Student Leave Requests
        for r in tables_data.get("leave_requests", []):
            if not await db.get(LeaveRequest, r["id"]):
                r["is_half_day"] = parse_bool_field(r.get("is_half_day"))
                db.add(LeaveRequest(**r))
        await db.commit()

        # 14. Faculty Leave Requests
        for r in tables_data.get("faculty_leave_requests", []):
            if not await db.get(FacultyLeaveRequest, r["id"]):
                r["is_half_day"] = parse_bool_field(r.get("is_half_day"))
                db.add(FacultyLeaveRequest(**r))
        await db.commit()

        # 15. Audit Logs
        for r in tables_data.get("audit_logs", []):
            if not await db.get(AuditLog, r["id"]):
                r["metadata_json"] = parse_json_field(r.get("metadata_json"))
                db.add(AuditLog(**r))
        await db.commit()

        # 16. Sheet Configs
        for r in tables_data.get("sheet_configs", []):
            if not await db.get(SheetConfig, r["id"]):
                r["auto_apply"] = parse_bool_field(r.get("auto_apply"))
                r["last_sync_summary"] = parse_json_field(r.get("last_sync_summary"))
                r["pending_preview"] = parse_json_field(r.get("pending_preview"))
                db.add(SheetConfig(**r))
        await db.commit()

    # Final summary check
    print("\n" + "=" * 70)
    print(f"{'Table Name':<28} | {'MySQL Rows':<12} | {'Supabase Rows':<14} | {'Status':<8}")
    print("-" * 70)
    models_map = [
        ("admin_settings", AdminSettings),
        ("departments", Department),
        ("users", User),
        ("faculty", Faculty),
        ("students", Student),
        ("courses", Course),
        ("rooms", Room),
        ("class_sections", ClassSection),
        ("section_subject_faculty", SectionSubjectFaculty),
        ("timetable_slots", TimetableSlot),
        ("attendance_sessions", AttendanceSession),
        ("attendance_records", AttendanceRecord),
        ("leave_requests", LeaveRequest),
        ("faculty_leave_requests", FacultyLeaveRequest),
        ("audit_logs", AuditLog),
        ("sheet_configs", SheetConfig),
    ]

    async with AsyncSessionLocal() as db:
        for tbl, model in models_map:
            m_cnt = len(tables_data.get(tbl, []))
            s_cnt = (await db.execute(select(func.count()).select_from(model))).scalar() or 0
            status = "[OK]" if s_cnt >= m_cnt else "[WARN]"
            print(f"{tbl:<28} | {m_cnt:<12} | {s_cnt:<14} | {status:<8}")

    print("=" * 70)
    print("[SUCCESS] MySQL to Supabase migration completed successfully!")
    print("=" * 70 + "\n")


if __name__ == "__main__":
    asyncio.run(migrate())
