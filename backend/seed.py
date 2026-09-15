import asyncio
from datetime import datetime, timezone
import pymysql
from sqlalchemy import select
from app.core.config import settings
from app.core.database import AsyncSessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models.user import User, Student, Faculty, RoleEnum
from app.models.settings import AdminSettings
from app.models.academic import Department, Course, ClassSection, Room, TimetableSlot, SectionSubjectFaculty
from app.models.sheet_sync import SheetConfig


def ensure_mysql_database_exists():
    """
    Connects to MySQL server and creates the target database if it does not already exist.
    """
    print(f"Verifying MySQL database '{settings.MYSQL_DATABASE}' on {settings.MYSQL_HOST}:{settings.MYSQL_PORT}...")
    try:
        conn = pymysql.connect(
            host=settings.MYSQL_HOST,
            port=settings.MYSQL_PORT,
            user=settings.MYSQL_USER,
            password=settings.MYSQL_PASSWORD,
        )
        cursor = conn.cursor()
        cursor.execute(
            f"CREATE DATABASE IF NOT EXISTS `{settings.MYSQL_DATABASE}` "
            "CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
        )
        conn.commit()
        conn.close()
        print(f"[OK] MySQL Database '{settings.MYSQL_DATABASE}' confirmed ready.")
    except Exception as e:
        print(f"Notice during database verification: {e}")


async def seed_database():
    if "mysql" in settings.DATABASE_URL:
        ensure_mysql_database_exists()
    print("Beginning Smart Attendance Schema & Demo Accounts Initialization...")

    # Create all MySQL tables with InnoDB and utf8mb4
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("[OK] All MySQL tables verified / created.")

    async with AsyncSessionLocal() as db:
        # 1. Super Admin User
        existing_admin = (await db.execute(select(User).where(User.email == "admin@campus.edu"))).scalar_one_or_none()
        if not existing_admin:
            print("1. Creating Super Admin User...")
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
            print("[OK] Super Admin user initialized (admin@campus.edu / admin123).")
        else:
            existing_admin.password_hash = get_password_hash("admin123")
            print("[OK] Super Admin user verified / password updated.")

        # 2. Institutional Settings
        existing_settings = (await db.execute(select(AdminSettings))).scalar_one_or_none()
        if not existing_settings:
            print("2. Initializing Institutional Settings...")
            db.add(AdminSettings(
                id="institution-settings-default",
                ble_signal_range=15.0,
                ble_rssi_threshold=-75.0,
                face_confidence_threshold=85.0,
                liveness_check_enabled=True,
                auto_sync_offline=True,
                faculty_manual_override_allowed=True
            ))
            print("[OK] Institutional settings initialized.")
        else:
            print("[OK] Institutional settings already present.")

        # 3. Academic Departments
        dept_data = [
            ("dept-it", "IT", "Information Technology"),
            ("dept-cse", "CSE", "Computer Science and Engineering"),
            ("dept-ece", "ECE", "Electronics and Communication Engineering"),
            ("dept-eee", "EEE", "Electrical and Electronics Engineering"),
            ("dept-mech", "MECH", "Mechanical Engineering"),
            ("dept-civil", "CIVIL", "Civil Engineering"),
            ("dept-aids", "AIDS", "Artificial Intelligence and Data Science"),
            ("dept-aiml", "AIML", "Artificial Intelligence and Machine Learning"),
            ("dept-csbs", "CSBS", "Computer Science and Business Systems"),
            ("dept-mba", "MBA", "Master of Business Administration"),
        ]
        for d_id, code, name in dept_data:
            existing_d = (await db.execute(select(Department).where(Department.code == code))).scalar_one_or_none()
            if not existing_d:
                db.add(Department(id=d_id, code=code, name=name, active=True))
        await db.flush()
        print("[OK] Academic Departments verified (10 institutional branches).")

        # 4. Class Sections
        section_data = [
            ("sec-it-3a", "IT - 3rd Year - Section A", "Information Technology", 3, "A", 60),
            ("sec-it-3b", "IT - 3rd Year - Section B", "Information Technology", 3, "B", 58),
            ("sec-cse-3a", "CSE - 3rd Year - Section A", "Computer Science and Engineering", 3, "A", 65),
        ]
        sec_map = {}
        for s_id, s_name, s_dept, s_yr, s_sec, s_cnt in section_data:
            existing_s = (await db.execute(select(ClassSection).where(ClassSection.name == s_name))).scalar_one_or_none()
            if not existing_s:
                new_s = ClassSection(id=s_id, name=s_name, department=s_dept, year=s_yr, section=s_sec, student_count=s_cnt)
                db.add(new_s)
                sec_map[s_id] = s_id
            else:
                sec_map[s_id] = existing_s.id
        await db.flush()
        print("[OK] Class Sections verified (IT-3A, IT-3B, CSE-3A).")

        # 5. Rooms with BLE Beacons
        rooms_data = [
            ("room-lh-201", "LH-201", "e2c56db5-dffb-48d2-b060-d0f5a71096e0", 60, -59.0),
            ("room-lh-202", "LH-202", "e2c56db5-dffb-48d2-b060-d0f5a71096e1", 60, -59.0),
            ("room-lh-204", "LH-204", "e2c56db5-dffb-48d2-b060-d0f5a71096e2", 60, -59.0),
            ("room-lh-208", "LH-208", "e2c56db5-dffb-48d2-b060-d0f5a71096e3", 60, -59.0),
            ("room-iot-102", "IoT Lab 102", "e2c56db5-dffb-48d2-b060-d0f5a71096e4", 45, -59.0),
            ("room-comp-lab3", "Computing Lab 3", "e2c56db5-dffb-48d2-b060-d0f5a71096e5", 50, -59.0),
        ]
        room_map = {}
        for r_id, r_name, r_uuid, r_cap, r_tx in rooms_data:
            existing_r = (await db.execute(select(Room).where(Room.name == r_name))).scalar_one_or_none()
            if not existing_r:
                new_r = Room(id=r_id, name=r_name, beacon_uuid=r_uuid, capacity=r_cap, default_tx_power=r_tx)
                db.add(new_r)
                room_map[r_name] = r_id
            else:
                room_map[r_name] = existing_r.id
        await db.flush()
        print("[OK] Physical Rooms and BLE Beacons verified.")

        # 6. Academic Courses
        courses_data = [
            ("crs-it-301", "22IT301", "Data Structures & Algorithms", "Information Technology", 4),
            ("crs-it-302", "22IT302", "Database Management Systems", "Information Technology", 4),
            ("crs-it-303", "22IT303", "Operating Systems", "Information Technology", 3),
            ("crs-it-305", "22IT305", "Full Stack Web Development", "Information Technology", 3),
            ("crs-hs-004", "22HS004", "Universal Human Values", "General", 2),
            ("crs-it-308", "22IT308", "Computer Networks & Security", "Information Technology", 3),
        ]
        course_map = {}
        for c_id, c_code, c_name, c_dept, c_cred in courses_data:
            existing_c = (await db.execute(select(Course).where(Course.code == c_code))).scalar_one_or_none()
            if not existing_c:
                new_c = Course(id=c_id, code=c_code, name=c_name, department=c_dept, credits=c_cred)
                db.add(new_c)
                course_map[c_code] = c_id
            else:
                course_map[c_code] = existing_c.id
        await db.flush()
        print("[OK] Academic Courses verified (6 curriculum subjects).")

        # 7. Faculty Members
        faculty_roster = [
            ("usr-fac-1", "fac-demo-1", "Dr. Ramesh Kumar", "faculty@campus.edu", "FAC-CSE-001", "Information Technology", "IT-3A"),
            ("usr-fac-2", "fac-demo-2", "Dr. Anandhi Sundaram", "anandhi@campus.edu", "FAC-IT-002", "Information Technology", "IT-3B"),
            ("usr-fac-3", "fac-demo-3", "Prof. Rajesh V", "rajesh@campus.edu", "FAC-CSE-003", "Computer Science and Engineering", "CSE-3A"),
        ]
        fac_map = {}
        for u_id, f_id, f_name, f_email, f_emp, f_dept, f_grp in faculty_roster:
            existing_u = (await db.execute(select(User).where(User.email == f_email))).scalar_one_or_none()
            if not existing_u:
                new_u = User(
                    id=u_id,
                    name=f_name,
                    email=f_email,
                    password_hash=get_password_hash("faculty123"),
                    role=RoleEnum.FACULTY,
                    department=f_dept,
                    phone="+91 98765 00002",
                    photo_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
                )
                db.add(new_u)
                await db.flush()
                new_f = Faculty(id=f_id, user_id=new_u.id, employee_id=f_emp, department=f_dept, active=True, mentor_group=f_grp)
                db.add(new_f)
                fac_map[f_emp] = f_id
            else:
                existing_u.password_hash = get_password_hash("faculty123")
                f_p = (await db.execute(select(Faculty).where(Faculty.user_id == existing_u.id))).scalar_one_or_none()
                if not f_p:
                    f_p = Faculty(id=f_id, user_id=existing_u.id, employee_id=f_emp, department=f_dept, active=True, mentor_group=f_grp)
                    db.add(f_p)
                fac_map[f_emp] = f_p.id
        await db.flush()
        print("[OK] Faculty accounts verified (faculty@campus.edu / faculty123).")

        primary_fac_id = fac_map.get("FAC-CSE-001", "fac-demo-1")
        secondary_fac_id = fac_map.get("FAC-IT-002", "fac-demo-2")

        # 8. Student Members
        student_roster = [
            ("usr-stu-1", "stu-demo-1", "Aarav Sharma", "student@campus.edu", "2026CS101", "Information Technology", 3, "A", 94.5),
            ("usr-stu-2", "stu-demo-2", "Priya Patel", "priya@campus.edu", "2026CS102", "Information Technology", 3, "A", 96.0),
            ("usr-stu-3", "stu-demo-3", "Kavya Iyer", "kavya@campus.edu", "2026CS103", "Information Technology", 3, "A", 89.0),
        ]
        for u_id, s_id, s_name, s_email, s_roll, s_dept, s_yr, s_sec, s_rate in student_roster:
            existing_stu_u = (await db.execute(select(User).where(User.email == s_email))).scalar_one_or_none()
            if not existing_stu_u:
                new_su = User(
                    id=u_id,
                    name=s_name,
                    email=s_email,
                    password_hash=get_password_hash("student123"),
                    role=RoleEnum.STUDENT,
                    department=s_dept,
                    phone="+91 98765 00003",
                    photo_url="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150"
                )
                db.add(new_su)
                await db.flush()
                new_sp = Student(
                    id=s_id,
                    user_id=new_su.id,
                    roll_number=s_roll,
                    department=s_dept,
                    year=s_yr,
                    section=s_sec,
                    attendance_rate=s_rate,
                    face_id_status="enrolled",
                    mentor_id=primary_fac_id
                )
                db.add(new_sp)
            else:
                existing_stu_u.password_hash = get_password_hash("student123")
                stu_rec = (await db.execute(select(Student).where(Student.user_id == existing_stu_u.id))).scalar_one_or_none()
                if not stu_rec:
                    db.add(Student(
                        id=s_id,
                        user_id=existing_stu_u.id,
                        roll_number=s_roll,
                        department=s_dept,
                        year=s_yr,
                        section=s_sec,
                        attendance_rate=s_rate,
                        face_id_status="enrolled",
                        mentor_id=primary_fac_id
                    ))
        await db.flush()
        print("[OK] Student accounts verified (student@campus.edu / student123).")

        # 9. Section-Subject-Faculty Mappings for IT-3A
        sec_3a_id = sec_map.get("sec-it-3a", "sec-it-3a")
        mappings = [
            ("22IT305", primary_fac_id),
            ("22IT301", secondary_fac_id),
            ("22IT302", primary_fac_id),
            ("22IT303", secondary_fac_id),
            ("22HS004", primary_fac_id),
            ("22IT308", secondary_fac_id),
        ]
        for course_code, faculty_id in mappings:
            c_id = course_map.get(course_code)
            if c_id:
                existing_map = (await db.execute(
                    select(SectionSubjectFaculty).where(
                        SectionSubjectFaculty.class_section_id == sec_3a_id,
                        SectionSubjectFaculty.course_id == c_id
                    )
                )).scalar_one_or_none()
                if not existing_map:
                    db.add(SectionSubjectFaculty(
                        id=f"ssf-{course_code.lower()}-it3a",
                        class_section_id=sec_3a_id,
                        course_id=c_id,
                        faculty_id=faculty_id
                    ))
        await db.flush()
        print("[OK] Section-Subject-Faculty mappings initialized for Section IT-3A.")

        # 10. Weekly Timetable Slots for IT-3A (Mon to Sat)
        # Guarantees that every day of the week has rich, scheduled periods
        lh_204_id = room_map.get("LH-204", "room-lh-204")
        lh_201_id = room_map.get("LH-201", "room-lh-201")
        comp_lab_id = room_map.get("Computing Lab 3", "room-comp-lab3")
        iot_lab_id = room_map.get("IoT Lab 102", "room-iot-102")

        schedule_grid = [
            # Monday
            ("Mon", "09:00", "10:00", "22IT305", primary_fac_id, lh_204_id, "teal"),
            ("Mon", "10:00", "11:00", "22IT301", secondary_fac_id, lh_201_id, "indigo"),
            ("Mon", "11:15", "12:15", "22IT302", primary_fac_id, lh_204_id, "violet"),
            ("Mon", "13:15", "14:15", "22IT303", secondary_fac_id, lh_201_id, "amber"),
            # Tuesday
            ("Tue", "09:00", "10:00", "22IT302", primary_fac_id, lh_204_id, "violet"),
            ("Tue", "10:00", "11:00", "22IT305", primary_fac_id, lh_204_id, "teal"),
            ("Tue", "11:15", "12:15", "22HS004", secondary_fac_id, lh_201_id, "rose"),
            ("Tue", "13:15", "15:15", "22IT305", primary_fac_id, comp_lab_id, "teal"),
            # Wednesday
            ("Wed", "09:00", "10:00", "22IT301", secondary_fac_id, lh_201_id, "indigo"),
            ("Wed", "10:00", "11:00", "22IT303", secondary_fac_id, lh_201_id, "amber"),
            ("Wed", "11:15", "12:15", "22IT308", primary_fac_id, lh_204_id, "cyan"),
            ("Wed", "13:15", "14:15", "22IT305", primary_fac_id, lh_204_id, "teal"),
            # Thursday
            ("Thu", "09:00", "10:00", "22IT305", primary_fac_id, lh_204_id, "teal"),
            ("Thu", "10:00", "11:00", "22IT302", primary_fac_id, lh_204_id, "violet"),
            ("Thu", "11:15", "12:15", "22IT301", secondary_fac_id, lh_201_id, "indigo"),
            ("Thu", "13:15", "15:15", "22IT308", secondary_fac_id, iot_lab_id, "cyan"),
            # Friday
            ("Fri", "09:00", "10:00", "22IT303", secondary_fac_id, lh_201_id, "amber"),
            ("Fri", "10:00", "11:00", "22IT308", primary_fac_id, lh_204_id, "cyan"),
            ("Fri", "11:15", "12:15", "22IT305", primary_fac_id, lh_204_id, "teal"),
            ("Fri", "13:15", "14:15", "22HS004", secondary_fac_id, lh_201_id, "rose"),
            # Saturday
            ("Sat", "09:00", "10:00", "22IT305", primary_fac_id, lh_204_id, "teal"),
            ("Sat", "10:00", "11:00", "22IT301", secondary_fac_id, lh_201_id, "indigo"),
            ("Sat", "11:15", "12:15", "22IT302", primary_fac_id, lh_204_id, "violet"),
        ]

        for day, st, et, c_code, f_id, r_id, color in schedule_grid:
            c_id = course_map.get(c_code)
            if c_id:
                slot_id = f"slot-it3a-{day.lower()}-{st.replace(':', '')}"
                existing_slot = (await db.execute(select(TimetableSlot).where(TimetableSlot.id == slot_id))).scalar_one_or_none()
                if not existing_slot:
                    db.add(TimetableSlot(
                        id=slot_id,
                        section_id=sec_3a_id,
                        course_id=c_id,
                        faculty_id=f_id,
                        room_id=r_id,
                        day_of_week=day,
                        start_time=st,
                        end_time=et,
                        color=color
                    ))
        await db.flush()
        print(f"[OK] Full weekly timetable slots verified for Section IT-3A ({len(schedule_grid)} weekly periods).")

        # 11. Default Google Sheet Configurations
        sheet_configs = [
            ("sheet-config-student-timetable", "student_timetable"),
            ("sheet-config-teacher-timetable", "teacher_timetable"),
            ("sheet-config-student", "student"),
            ("sheet-config-faculty", "faculty"),
        ]
        for cfg_id, s_type in sheet_configs:
            existing_cfg = (await db.execute(select(SheetConfig).where(SheetConfig.id == cfg_id))).scalar_one_or_none()
            if not existing_cfg:
                db.add(SheetConfig(
                    id=cfg_id,
                    sheet_type=s_type,
                    sync_interval_minutes=0,
                    auto_apply=False,
                    last_sync_status="idle"
                ))
        await db.flush()
        print("[OK] Sheet sync configurations verified.")

        await db.commit()
        print("\n=======================================================")
        print(" [SUCCESS] Smart Attendance Database Initialized!")
        print(" Demo Login Credentials:")
        print(" - Admin:   admin@campus.edu   / admin123")
        print(" - Faculty: faculty@campus.edu / faculty123")
        print(" - Student: student@campus.edu / student123")
        print("=======================================================")
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed_database())
