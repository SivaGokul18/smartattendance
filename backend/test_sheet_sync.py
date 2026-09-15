import asyncio
from app.services.sheet_sync import (
    validate_and_normalize_sheet_url,
    generate_csv_template,
    validate_and_diff_sheet_data,
    apply_sheet_sync_rows,
    check_and_execute_scheduled_syncs
)
from app.core.database import AsyncSessionLocal, engine, Base
from app.models.user import User, Student, RoleEnum
from app.models.academic import Department
from app.models.sheet_sync import SheetConfig


def test_ssrf_protection():
    print("\n--- Testing SSRF Protection & URL Normalization ---")

    # 1. Reject non-HTTPS
    invalid_urls = [
        "http://docs.google.com/spreadsheets/d/123/edit",
        "ftp://docs.google.com/spreadsheets/d/123",
        "file:///etc/passwd",
        "javascript:alert(1)",
    ]
    for u in invalid_urls:
        try:
            validate_and_normalize_sheet_url(u)
            assert False, f"Expected rejection for: {u}"
        except ValueError as e:
            assert "HTTPS" in str(e) or "protocol" in str(e).lower()
            print(f"[PASS] Insecure URL correctly rejected: {u}")

    # 2. Reject unauthorized domains and SSRF vectors
    ssrf_vectors = [
        "https://evil.com/sheet.csv",
        "https://localhost:8000/data.csv",
        "https://127.0.0.1/admin",
        "https://169.254.169.254/latest/meta-data/",
        "https://docs.google.com.attacker.com/steal",
        "https://fake-docs.google.com/spreadsheet",
    ]
    for u in ssrf_vectors:
        try:
            validate_and_normalize_sheet_url(u)
            assert False, f"Expected rejection for: {u}"
        except ValueError as e:
            assert "Access denied" in str(e) or "authorized" in str(e)
            print(f"[PASS] SSRF vector correctly rejected: {u}")

    # 3. Accept and normalize valid Google Sheet URLs
    valid_edit = "https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit#gid=105"
    norm_1 = validate_and_normalize_sheet_url(valid_edit)
    assert "export?format=csv" in norm_1
    assert "gid=105" in norm_1
    print(f"[PASS] Normalized edit URL -> {norm_1}")

    valid_pub = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR6z9G/pub?gid=0&single=true"
    norm_2 = validate_and_normalize_sheet_url(valid_pub)
    assert "output=csv" in norm_2
    print(f"[PASS] Normalized published URL -> {norm_2}")


def test_csv_template_generation():
    print("\n--- Testing CSV Template Generation ---")
    stu_tpl = generate_csv_template("student")
    assert "Full Name" in stu_tpl
    assert "Roll Number" in stu_tpl
    assert "Department" in stu_tpl
    print("[PASS] Student CSV Template generated with required headers.")

    fac_tpl = generate_csv_template("faculty")
    assert "Employee ID" in fac_tpl
    assert "Designation" in fac_tpl
    print("[PASS] Faculty CSV Template generated with required headers.")


async def test_diff_and_apply_flow():
    print("\n--- Testing Validation, Diffing & Database Apply Engine ---")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        # Ensure Computer Science department exists
        import time
        from sqlalchemy import select

        # Find existing student to determine current section
        existing_student = (await db.execute(select(Student).join(User).where(User.email == "student@campus.edu"))).scalar_one_or_none()
        current_sec = existing_student.section if existing_student else "A"
        new_sec = "C" if current_sec == "B" else "B"

        unique_ts = int(time.time())
        new_test_email = f"test.student.{unique_ts}@campus.edu"
        new_test_roll = f"2026CS{unique_ts % 10000:04d}"

        # Simulated Sheet CSV containing 1 user update and 1 new user insert
        csv_data = (
            "Full Name,Email,Roll Number,Department,Semester,Section,Mentor Email,Phone Number\n"
            f"Aarav Sharma,student@campus.edu,2026CS101,CSE,5,{new_sec},,+91 99999 11111\n"
            f"Brand New Student,{new_test_email},{new_test_roll},CSE,3,A,,+91 99999 22222\n"
        )

        preview = await validate_and_diff_sheet_data(csv_data, "student", db)
        print(f"[PASS] Preview Generated: Total={preview['total_rows']}, Valid={preview['valid_rows_count']}, Errors={preview['error_rows_count']}")
        print(f"       Creates={preview['create_count']}, Updates={preview['update_count']}, MissingInSheet={preview['missing_count']}")
        for r in preview["preview_rows"]:
            print(f"Row {r['row_number']} status={r['status']} action={r['action']} errors={r['errors']}")

        assert preview["total_rows"] == 2
        assert preview["error_rows_count"] == 0
        assert preview["update_count"] == 1
        assert preview["create_count"] == 1

        # Apply the rows
        apply_res = await apply_sheet_sync_rows(
            sheet_type="student",
            rows=preview["preview_rows"],
            actor_id="test_admin",
            actor_role="admin",
            db=db
        )
        print(f"[PASS] Apply Result: Created={apply_res['imported']}, Updated={apply_res['updated']}, Skipped={apply_res['skipped']}")
        assert apply_res["imported"] == 1
        assert apply_res["updated"] == 1

        # Check new credentials generated
        assert len(apply_res["credentials"]) == 1
        cred = apply_res["credentials"][0]
        assert "Welcome@" in cred["temporaryPassword"]
        print(f"[PASS] Temporary credentials generated for {cred['email']}: {cred['temporaryPassword']}")

        # Verify biometric preservation: existing user's face_id_status should not be erased
        stu_check = (await db.execute(select(Student).join(User).where(User.email == "student@campus.edu"))).scalar_one_or_none()
        assert stu_check is not None
        assert stu_check.section == new_sec
        assert stu_check.face_id_status == "enrolled"
        print(f"[PASS] Student record updated to section {new_sec} while preserving face_id_status='enrolled'.")


async def test_api_endpoints():
    print("\n--- Testing Sheet Sync REST Endpoints via ASGI Client ---")
    from app.main import app
    import httpx

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Admin login to get JWT
        login_res = await client.post("/api/v1/auth/login", json={"identifier": "admin", "password": "admin123"})
        assert login_res.status_code == 200, f"Admin login failed: {login_res.text}"
        token = login_res.json()["access_token"]
        auth_headers = {"Authorization": f"Bearer {token}"}
        print("[PASS] Authenticated as Admin for API test.")

        # 2. Get Configs
        cfg_res = await client.get("/api/v1/admin/sheets/config", headers=auth_headers)
        assert cfg_res.status_code == 200, f"Get config failed: {cfg_res.text}"
        cfg_data = cfg_res.json()
        assert "student" in cfg_data
        assert "faculty" in cfg_data
        print("[PASS] GET /api/v1/admin/sheets/config returned student & faculty configurations.")

        # 3. Save Config
        save_res = await client.post(
            "/api/v1/admin/sheets/config",
            headers=auth_headers,
            json={
                "sheet_type": "student",
                "url": "https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit#gid=0",
                "sync_interval_minutes": 60,
                "auto_apply": False
            }
        )
        assert save_res.status_code == 200, f"Save config failed: {save_res.text}"
        saved = save_res.json()
        assert saved["sync_interval_minutes"] == 60
        assert "export?format=csv" in saved["url"]
        print(f"[PASS] POST /api/v1/admin/sheets/config normalized & saved URL: {saved['url']}")

        # 4. SSRF Validation via Endpoint
        ssrf_res = await client.post(
            "/api/v1/admin/sheets/config",
            headers=auth_headers,
            json={
                "sheet_type": "student",
                "url": "http://evil-attacker.com/malicious.csv",
                "sync_interval_minutes": 0,
                "auto_apply": False
            }
        )
        assert ssrf_res.status_code == 400
        print("[PASS] SSRF payload rejected with HTTP 400 through API endpoint.")

        # 5. Download Template
        tpl_res = await client.get("/api/v1/admin/sheets/template/student", headers=auth_headers)
        assert tpl_res.status_code == 200
        assert "Full Name" in tpl_res.text
        assert "Roll Number" in tpl_res.text
        print("[PASS] GET /api/v1/admin/sheets/template/student returned CSV template.")


async def main():
    test_ssrf_protection()
    test_csv_template_generation()
    await test_diff_and_apply_flow()
    await test_api_endpoints()
    print("\n==========================================")
    print("ALL BACKEND GOOGLE SHEET SYNC TESTS PASSED!")
    print("==========================================")


if __name__ == "__main__":
    asyncio.run(main())
