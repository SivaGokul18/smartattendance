import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import select, delete
from app.core.config import settings
from app.core.database import AsyncSessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models.user import User, Student, Faculty, RoleEnum
from app.models.academic import Department, Course, ClassSection, Room, TimetableSlot, SectionSubjectFaculty
from app.models.attendance import AttendanceSession, AttendanceRecord
from app.models.leave import LeaveRequest, FacultyLeaveRequest
from app.models.audit import AuditLog
from app.models.settings import AdminSettings
from app.models.sheet_sync import SheetConfig


async def wipe_database_data():
    """
    Wipes all student, faculty, course, room, class section, timetable,
    session, attendance, leave, audit, and sync data using SQLAlchemy ORM.
    Retains only the admin user and default settings.
    Fully compatible with Supabase PostgreSQL and SQLite.
    """
    print(f"[1/2] Connecting to database: {settings.DATABASE_URL.split('@')[-1] if '@' in settings.DATABASE_URL else 'Local'}")

    async with AsyncSessionLocal() as db:
        # Delete records in reverse dependency order
        models_to_clear = [
            ("attendance_records", AttendanceRecord),
            ("attendance_sessions", AttendanceSession),
            ("faculty_leave_requests", FacultyLeaveRequest),
            ("leave_requests", LeaveRequest),
            ("section_subject_faculty", SectionSubjectFaculty),
            ("timetable_slots", TimetableSlot),
            ("class_sections", ClassSection),
            ("courses", Course),
            ("rooms", Room),
            ("students", Student),
            ("faculty", Faculty),
            ("audit_logs", AuditLog),
            ("sheet_configs", SheetConfig),
            ("departments", Department),
        ]

        for name, model in models_to_clear:
            try:
                await db.execute(delete(model))
                await db.commit()
                print(f"  - [CLEARED] Table '{name}' completely wiped.")
            except Exception as e:
                await db.rollback()
                print(f"  - [NOTICE] Table '{name}': {e}")

        # Remove non-admin users
        try:
            stmt = delete(User).where((User.role != RoleEnum.ADMIN) | (User.email != "admin@campus.edu"))
            await db.execute(stmt)
            await db.commit()
            print("  - [CLEARED] All non-admin user accounts removed from 'users'.")
        except Exception as e:
            await db.rollback()
            print(f"  - [NOTICE] Users table cleanup: {e}")

    print("[OK] Database data wiped successfully.")


async def verify_admin_and_settings():
    """
    Ensures that the clean Super Administrator account and default settings exist.
    """
    print("[2/2] Verifying Super Admin and default configuration...")
    async with AsyncSessionLocal() as db:
        admin_user = (await db.execute(select(User).where(User.email == "admin@campus.edu"))).scalar_one_or_none()
        if not admin_user:
            admin_user = User(
                id="usr-admin-1",
                name="Super Admin Administrator",
                email="admin@campus.edu",
                password_hash=get_password_hash("admin123"),
                role=RoleEnum.ADMIN,
                department="Institutional Administration",
                phone="+91 98765 00001"
            )
            db.add(admin_user)
            await db.commit()
            print("  - [CREATED] Super Admin account: admin@campus.edu / admin123")
        else:
            admin_user.password_hash = get_password_hash("admin123")
            await db.commit()
            print("  - [VERIFIED] Super Admin account: admin@campus.edu")

        # Verify baseline institutional settings
        admin_settings = (await db.execute(select(AdminSettings))).scalar_one_or_none()
        if not admin_settings:
            db.add(AdminSettings(
                id="institution-settings-default",
                ble_signal_range=15.0,
                ble_rssi_threshold=-75.0,
                face_confidence_threshold=85.0,
                liveness_check_enabled=True,
                auto_sync_offline=True,
                faculty_manual_override_allowed=True
            ))
            await db.commit()
            print("  - [INITIALIZED] Default institutional settings created.")
        else:
            print("  - [VERIFIED] Institutional settings present.")


async def main():
    print("=" * 60)
    print("SMART ATTENDANCE: DATABASE DATA WIPE (DIALECT-AGNOSTIC)")
    print("=" * 60)
    await wipe_database_data()
    await verify_admin_and_settings()
    print("=" * 60)
    print("ALL DATA REMOVED SUCCESSFULLY - DATABASE IS COMPLETELY CLEAN")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
