import asyncio
import pymysql
from sqlalchemy import select, text
from app.core.config import settings
from app.core.database import AsyncSessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models.user import User, RoleEnum
from app.models.settings import AdminSettings


def clean_mysql_database():
    """
    Removes all mock/dummy student, faculty, course, room, session, and leave data
    from the MySQL database while preserving administrative users and settings.
    """
    print(f"Connecting to MySQL '{settings.MYSQL_DATABASE}' on {settings.MYSQL_HOST}:{settings.MYSQL_PORT}...")
    conn = pymysql.connect(
        host=settings.MYSQL_HOST,
        port=settings.MYSQL_PORT,
        user=settings.MYSQL_USER,
        password=settings.MYSQL_PASSWORD,
        database=settings.MYSQL_DATABASE,
    )
    cursor = conn.cursor()

    # Disable foreign key checks for clean truncation/deletion
    cursor.execute("SET FOREIGN_KEY_CHECKS = 0;")

    tables_to_clear = [
        "attendance_records",
        "attendance_sessions",
        "faculty_leave_requests",
        "leave_requests",
        "section_subject_faculty",
        "timetable_slots",
        "class_sections",
        "courses",
        "rooms",
        "students",
        "faculty",
        "audit_logs",
    ]

    for tbl in tables_to_clear:
        try:
            cursor.execute(f"DELETE FROM `{tbl}`;")
            print(f"[CLEARED] Table '{tbl}' wiped.")
        except Exception as e:
            print(f"[INFO] Notice on table '{tbl}': {e}")

    # Remove non-admin users
    cursor.execute("DELETE FROM `users` WHERE LOWER(`role`) != 'admin' AND `email` != 'admin@campus.edu';")
    print("[CLEARED] All non-admin user records removed.")

    cursor.execute("SET FOREIGN_KEY_CHECKS = 1;")
    conn.commit()
    conn.close()
    print("[OK] Foreign key constraints restored and transactions committed.")


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
    clean_mysql_database()
    from seed import seed_database
    await seed_database()
    print("\n[SUCCESS] MySQL cleaned and institutional/demo accounts verified!")


if __name__ == "__main__":
    asyncio.run(main())
