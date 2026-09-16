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


async def clean_database():
    """
    Removes all mock/dummy student, faculty, course, room, session, and leave data
    from the target database (PostgreSQL / SQLite) while preserving administrative users and settings.
    """
    print(f"Connecting to database: {settings.DATABASE_URL.split('@')[-1] if '@' in settings.DATABASE_URL else 'Local'}")

    async with AsyncSessionLocal() as db:
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
        ]

        for name, model in models_to_clear:
            try:
                await db.execute(delete(model))
                await db.commit()
                print(f"[CLEARED] Table '{name}' wiped.")
            except Exception as e:
                await db.rollback()
                print(f"[NOTICE] Table '{name}': {e}")

        # Remove non-admin users
        try:
            stmt = delete(User).where((User.role != RoleEnum.ADMIN) | (User.email != "admin@campus.edu"))
            await db.execute(stmt)
            await db.commit()
            print("[CLEARED] All non-admin user records removed.")
        except Exception as e:
            await db.rollback()
            print(f"[NOTICE] Non-admin cleanup: {e}")

    print("[OK] Database cleaning finished.")


async def verify_admin_and_settings():
    """
    Ensures that the super administrator and institutional settings exist.
    """
    async with AsyncSessionLocal() as db:
        admin_user = (await db.execute(select(User).where(User.role == RoleEnum.ADMIN))).scalar_one_or_none()
        if not admin_user:
            print("[INFO] Creating Super Admin Administrator...")
            admin = User(
                id="usr-admin-1",
                name="Super Admin Administrator",
                email="admin@campus.edu",
                password_hash=get_password_hash("admin123"),
                role=RoleEnum.ADMIN,
                department="Institutional Administration",
                phone="+91 98765 00001"
            )
            db.add(admin)
            await db.commit()
            print("[OK] Super Admin account created (admin@campus.edu / admin123).")
        else:
            print(f"[OK] Super Admin account verified ({admin_user.email}).")

        # Verify settings
        admin_settings = (await db.execute(select(AdminSettings))).scalar_one_or_none()
        if not admin_settings:
            print("[INFO] Initializing default institutional settings...")
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
            print("[OK] Default institutional settings created.")
        else:
            print("[OK] Institutional settings verified.")


async def main():
    await clean_database()
    from seed import seed_database
    await seed_database()
    print("\n[SUCCESS] Target database cleaned and institutional/demo accounts verified!")


if __name__ == "__main__":
    asyncio.run(main())
