import asyncio
import os
import sys
import pymysql

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.config import settings
from app.core.database import AsyncSessionLocal, engine
from app.models.user import User, Student, Faculty
from app.models.academic import Department, Course, ClassSection, Room, TimetableSlot, SectionSubjectFaculty
from app.models.attendance import AttendanceSession, AttendanceRecord
from app.models.leave import LeaveRequest, FacultyLeaveRequest
from app.models.audit import AuditLog
from app.models.settings import AdminSettings
from app.models.sheet_sync import SheetConfig
from sqlalchemy import select, func


def check_mysql():
    print("=" * 60)
    print("  SOURCE: LOCAL MYSQL DATABASE COUNTS")
    print("=" * 60)
    try:
        conn = pymysql.connect(
            host=os.getenv("MYSQL_HOST", "localhost"),
            port=int(os.getenv("MYSQL_PORT", "3306")),
            user=os.getenv("MYSQL_USER", "root"),
            password=os.getenv("MYSQL_PASSWORD", "SIVAGOKUL@2007"),
            database=os.getenv("MYSQL_DATABASE", "smart_attendance")
        )
        cur = conn.cursor()
        cur.execute("SHOW TABLES;")
        tables = cur.fetchall()
        print(f"Total MySQL Tables: {len(tables)}")
        for (t,) in tables:
            cur.execute(f"SELECT COUNT(*) FROM `{t}`;")
            cnt = cur.fetchone()[0]
            print(f"  - {t:<28}: {cnt} rows")
        conn.close()
    except Exception as e:
        print(f"  [NOTICE] Could not connect to local MySQL: {e}")


async def check_target_db():
    print("\n" + "=" * 60)
    db_name = settings.DATABASE_URL.split('@')[-1] if '@' in settings.DATABASE_URL else settings.DATABASE_URL.split('://')[0]
    print(f"  TARGET: {db_name.upper()} DATABASE COUNTS")
    print("=" * 60)

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

    try:
        async with AsyncSessionLocal() as db:
            for tbl, model in models_map:
                try:
                    cnt = (await db.execute(select(func.count()).select_from(model))).scalar() or 0
                    print(f"  - {tbl:<28}: {cnt} rows")
                except Exception as ex:
                    print(f"  - {tbl:<28}: [ERROR] {ex}")
    except Exception as e:
        print(f"  [ERROR] Could not connect to target database: {e}")


async def main():
    check_mysql()
    await check_target_db()


if __name__ == "__main__":
    asyncio.run(main())
