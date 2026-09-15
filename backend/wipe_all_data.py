import asyncio
import os
import sqlite3
import pymysql
from sqlalchemy import select
from app.core.config import settings
from app.core.database import AsyncSessionLocal
from app.core.security import get_password_hash
from app.models.user import User, RoleEnum
from app.models.settings import AdminSettings


def wipe_mysql_database():
    """
    Wipes all student, faculty, course, room, class section, timetable,
    session, attendance, leave, audit, and sync data from the MySQL database.
    Retains only the admin user and default settings.
    """
    print(f"[1/3] Connecting to MySQL '{settings.MYSQL_DATABASE}' on {settings.MYSQL_HOST}:{settings.MYSQL_PORT}...")
    conn = pymysql.connect(
        host=settings.MYSQL_HOST,
        port=settings.MYSQL_PORT,
        user=settings.MYSQL_USER,
        password=settings.MYSQL_PASSWORD,
        database=settings.MYSQL_DATABASE,
    )
    cursor = conn.cursor()

    # Disable foreign key checks for clean truncation
    cursor.execute("SET FOREIGN_KEY_CHECKS = 0;")

    tables_to_wipe = [
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
        "sheet_configs",
    ]

    for tbl in tables_to_wipe:
        try:
            cursor.execute(f"DELETE FROM `{tbl}`;")
            print(f"  - [CLEARED] Table '{tbl}' completely wiped.")
        except Exception as e:
            print(f"  - [NOTICE] Table '{tbl}': {e}")

    # Remove all non-admin users (all students and faculty accounts)
    cursor.execute("DELETE FROM `users` WHERE `role` != 'ADMIN' AND `email` != 'admin@campus.edu';")
    print("  - [CLEARED] All student and faculty user accounts removed from 'users'.")

    cursor.execute("SET FOREIGN_KEY_CHECKS = 1;")
    conn.commit()
    conn.close()
    print("[OK] MySQL tables wiped and foreign key constraints restored.")


async def verify_admin_and_settings():
    """
    Ensures that the clean Super Administrator account and default settings exist.
    """
    print("[2/3] Verifying Super Admin and default configuration...")
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


def wipe_sqlite_database():
    """
    Wipes the local SQLite smart_attendance.db file if present.
    """
    print("[3/3] Checking SQLite smart_attendance.db...")
    db_path = os.path.join(os.path.dirname(__file__), "smart_attendance.db")
    if os.path.exists(db_path):
        try:
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            cursor.execute("PRAGMA foreign_keys = OFF;")
            tables = cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';").fetchall()
            for (tbl,) in tables:
                cursor.execute(f"DELETE FROM \"{tbl}\";")
                print(f"  - [SQLITE CLEARED] Table '{tbl}' wiped.")
            cursor.execute("PRAGMA foreign_keys = ON;")
            conn.commit()
            conn.close()
            print("[OK] SQLite smart_attendance.db wiped.")
        except Exception as e:
            print(f"[NOTICE] Error wiping SQLite database: {e}")
    else:
        print("  - No SQLite database file found.")


async def main():
    print("=" * 60)
    print("SMART ATTENDANCE: DATABASE DATA WIPE")
    print("=" * 60)
    wipe_mysql_database()
    await verify_admin_and_settings()
    wipe_sqlite_database()
    print("=" * 60)
    print("ALL DATA REMOVED SUCCESSFULLY - DATABASE IS COMPLETELY CLEAN")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
