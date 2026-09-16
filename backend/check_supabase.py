import asyncio
import os
import sys
import uuid
from datetime import datetime, timezone

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.config import settings
from app.core.database import AsyncSessionLocal, engine, Base
from app.models.user import User, Student, Faculty
from app.models.academic import Department, Course, ClassSection, Room, TimetableSlot
from app.models.audit import AuditLog
from sqlalchemy import text, select, func


async def verify_supabase():
    print("=" * 70)
    print("  Smart Attendance: Supabase PostgreSQL Diagnostics & Health Check")
    print("=" * 70)

    url = settings.DATABASE_URL
    masked_url = url.split('@')[-1] if '@' in url else url.split('://')[0]
    print(f"Target Database Host: {masked_url}")

    if "sqlite" in url:
        print("\n[NOTICE] Currently configured for local SQLite fallback.")
        print("To test Supabase, set DATABASE_URL in backend/.env with your Supabase credentials:")
        print("DATABASE_URL=postgresql://postgres:[PASSWORD]@db.gdvlwaiunaxtdnvzaxnv.supabase.co:5432/postgres")
        print("or connection pooler:")
        print("DATABASE_URL=postgresql://postgres.gdvlwaiunaxtdnvzaxnv:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres\n")
        return

    print("\n[1/4] Establishing async connection to PostgreSQL...")
    try:
        async with engine.connect() as conn:
            res = await conn.execute(text("SELECT version();"))
            version_str = res.scalar()
            print("      [SUCCESS] Connected to PostgreSQL engine!")
            print(f"      Version: {version_str[:75]}...")
    except Exception as e:
        print(f"      [ERROR] Connection failed: {e}\n")
        err_msg = str(e).lower()
        if "11001" in err_msg or "getaddrinfo" in err_msg:
            print("  --> [TROUBLESHOOTING TIP] DNS/IPv6 Resolution Issue Detected:")
            print("      Direct connection 'db.[REF].supabase.co:5432' uses IPv6-only addressing.")
            print("      If your local network or Windows host does not have IPv6 routing, switch")
            print("      to the Supabase Connection Pooler (which supports IPv4):")
            print("      Supabase Dashboard -> Project Settings -> Database -> Connection string -> Connection Pooler")
            print("      Use Session Mode (port 5432) or Transaction Mode (port 6543):")
            print("      postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres")
        return

    print("\n[2/4] Verifying and creating PostgreSQL schema on Supabase...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("      [OK] Schema tables verified/created on Supabase.")

    expected_tables = [
        "admin_settings", "departments", "users", "faculty", "students",
        "courses", "rooms", "class_sections", "section_subject_faculty",
        "timetable_slots", "attendance_sessions", "attendance_records",
        "leave_requests", "faculty_leave_requests", "audit_logs", "sheet_configs"
    ]

    async with engine.connect() as conn:
        res = await conn.execute(text(
            "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"
        ))
        existing_tables = [r[0] for r in res.fetchall()]

    print(f"      Found {len(existing_tables)} public tables in database.")
    for tbl in expected_tables:
        status = "[PRESENT]" if tbl in existing_tables else "[MISSING]"
        count = 0
        if tbl in existing_tables:
            async with engine.connect() as conn:
                cnt_res = await conn.execute(text(f'SELECT COUNT(*) FROM "{tbl}";'))
                count = cnt_res.scalar() or 0
        print(f"      - {tbl:28}: {status} ({count} rows)")

    print("\n[3/4] Running Functional Query Simulations...")
    async with AsyncSessionLocal() as db:
        # A. Read Test
        user_count = (await db.execute(select(func.count(User.id)))).scalar() or 0
        print(f"      [READ TEST] Counted {user_count} total users in 'users' table. [OK]")

        # B. Write & Commit Test (with native PostgreSQL JSONB)
        test_audit_id = f"test-audit-{uuid.uuid4().hex[:8]}"
        test_audit = AuditLog(
            id=test_audit_id,
            actor_id="system-diagnostic",
            actor_role="admin",
            action_type="supabase_migration_verification",
            target_entity="system_diagnostics",
            metadata_json={"diagnostic_run": True, "timestamp": datetime.now(timezone.utc).isoformat()},
            ip_address="127.0.0.1"
        )
        db.add(test_audit)
        await db.commit()
        print(f"      [WRITE TEST] Created test audit record with JSONB metadata: {test_audit_id} [OK]")

        # Verify readback
        fetched = await db.get(AuditLog, test_audit_id)
        assert fetched is not None, "Failed to read back created record"
        assert fetched.metadata_json.get("diagnostic_run") is True, "JSONB deserialization mismatch"
        print(f"      [VERIFY TEST] Successfully read back record & verified JSONB payload. [OK]")

        # Clean up test record
        await db.delete(fetched)
        await db.commit()
        print(f"      [CLEANUP TEST] Test record deleted successfully. [OK]")

        # C. Multi-Table Join Test
        join_stmt = (
            select(TimetableSlot, ClassSection.name, Course.name, Faculty.employee_id, Room.name)
            .join(ClassSection, TimetableSlot.section_id == ClassSection.id)
            .join(Course, TimetableSlot.course_id == Course.id)
            .join(Faculty, TimetableSlot.faculty_id == Faculty.id)
            .join(Room, TimetableSlot.room_id == Room.id)
            .limit(3)
        )
        join_results = (await db.execute(join_stmt)).all()
        print(f"      [JOIN TEST] Executed 4-table join (TimetableSlot + Section + Course + Faculty + Room): {len(join_results)} rows returned. [OK]")

    print("\n[4/4] Supabase PostgreSQL Database is 100% operational and healthy!")
    print("=" * 70 + "\n")


if __name__ == "__main__":
    asyncio.run(verify_supabase())
