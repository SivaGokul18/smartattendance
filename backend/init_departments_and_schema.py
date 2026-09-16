import asyncio
import uuid
import sys
from sqlalchemy import text, select
from app.core.database import engine, Base, AsyncSessionLocal
from app.models.academic import Department
from app.models.user import User

DEFAULT_DEPARTMENTS = [
    {"code": "CSE", "name": "Computer Science and Engineering"},
    {"code": "ECE", "name": "Electronics and Communication Engineering"},
    {"code": "IT", "name": "Information Technology"},
    {"code": "MECH", "name": "Mechanical Engineering"},
    {"code": "AIDS", "name": "Artificial Intelligence and Data Science"},
    {"code": "AIML", "name": "Artificial Intelligence and Machine Learning"},
    {"code": "CIVIL", "name": "Civil Engineering"},
    {"code": "EEE", "name": "Electrical and Electronics Engineering"},
    {"code": "ISE", "name": "Information Science and Engineering"},
    {"code": "CT", "name": "Computer Technology"},
]

async def migrate():
    print("[INFO] Starting schema update and department seeding...")
    async with engine.begin() as conn:
        # 1. Create any missing tables (including departments)
        await conn.run_sync(Base.metadata.create_all)
        print("[OK] Base metadata tables created/verified.")

        # 2. Check and add must_change_password column to users table if missing
        res = await conn.execute(text(
            "SELECT column_name FROM information_schema.columns "
            "WHERE table_name = 'users' AND column_name = 'must_change_password';"
        ))
        col = res.fetchone()
        if not col:
            print("[INFO] Adding must_change_password column to users table...")
            await conn.execute(text("ALTER TABLE users ADD COLUMN must_change_password BOOLEAN NOT NULL DEFAULT FALSE;"))
            print("[OK] must_change_password column added.")
        else:
            print("[OK] must_change_password column already exists.")

    # 3. Seed default departments
    async with AsyncSessionLocal() as session:
        for dept_data in DEFAULT_DEPARTMENTS:
            stmt = select(Department).where(
                (Department.code == dept_data["code"]) | (Department.name == dept_data["name"])
            )
            existing = (await session.execute(stmt)).scalar_one_or_none()
            if not existing:
                new_dept = Department(
                    id=f"dept-{dept_data['code'].lower()}",
                    code=dept_data["code"],
                    name=dept_data["name"],
                    active=True
                )
                session.add(new_dept)
                print(f"[OK] Seeded department: {dept_data['code']} - {dept_data['name']}")
            else:
                print(f"[OK] Department already exists: {existing.code} - {existing.name}")
        await session.commit()

    print("[SUCCESS] Schema update and department seeding completed successfully!")

if __name__ == "__main__":
    asyncio.run(migrate())
