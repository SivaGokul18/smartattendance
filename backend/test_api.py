import asyncio
import httpx


async def test_backend_suite():
    print("Running Smart Attendance Backend Test Suite...")
    base_url = "http://127.0.0.1:8000/api/v1"

    async with httpx.AsyncClient(base_url="http://127.0.0.1:8000", timeout=10.0) as client:
        # Health check
        h_res = await client.get("/health")
        assert h_res.status_code == 200, f"Health check failed: {h_res.text}"
        print("[PASS] Health Check Passed:", h_res.json())

        # 1. Test Admin Login
        admin_login = await client.post("/api/v1/auth/login", json={"identifier": "admin", "password": "admin123"})
        assert admin_login.status_code == 200, f"Admin login failed: {admin_login.text}"
        admin_data = admin_login.json()
        admin_token = admin_data["access_token"]
        assert admin_data["role"] == "admin"
        print(f"[PASS] Admin Login Succeeded: {admin_data['name']} ({admin_data['role']})")

        # 2. Test Faculty Login
        fac_login = await client.post("/api/v1/auth/login", json={"identifier": "faculty", "password": "faculty123"})
        assert fac_login.status_code == 200, f"Faculty login failed: {fac_login.text}"
        fac_data = fac_login.json()
        fac_token = fac_data["access_token"]
        assert fac_data["role"] == "faculty"
        print(f"[PASS] Faculty Login Succeeded: {fac_data['name']} ({fac_data['employeeId']})")

        # 3. Test Student Login
        stu_login = await client.post("/api/v1/auth/login", json={"identifier": "student", "password": "student123"})
        assert stu_login.status_code == 200, f"Student login failed: {stu_login.text}"
        stu_data = stu_login.json()
        stu_token = stu_data["access_token"]
        assert stu_data["role"] == "student"
        print(f"[PASS] Student Login Succeeded: {stu_data['name']} ({stu_data['rollNumber']})")

        # 4. Test Student Home
        stu_home = await client.get(
            "/api/v1/student/home",
            headers={"Authorization": f"Bearer {stu_token}"}
        )
        assert stu_home.status_code == 200, f"Student home failed: {stu_home.text}"
        home_json = stu_home.json()
        print(f"[PASS] Student Home Succeeded: {home_json['studentName']}, Attendance: {home_json['attendanceRate']}%")

        # 5. Test Faculty Start Session
        start_sess = await client.post(
            "/api/v1/faculty/session/start",
            headers={"Authorization": f"Bearer {fac_token}"},
            json={
                "classSectionId": "class-cse-3a",
                "subjectId": "crs-cs301",
                "room": "LH-204",
                "durationMinutes": 45,
                "faceVerificationRequired": True,
                "capacity": 45
            }
        )
        assert start_sess.status_code == 200, f"Start session failed: {start_sess.text}"
        sess_data = start_sess.json()
        session_id = sess_data["sessionId"]
        rolling_token = sess_data["rollingToken"]
        print(f"[PASS] Faculty Session Started: ID={session_id}, Token={rolling_token}")

        # 6. Test Student Attendance Verify
        stu_verify = await client.post(
            "/api/v1/student/attendance/verify",
            headers={"Authorization": f"Bearer {stu_token}"},
            json={
                "sessionId": session_id,
                "bleToken": rolling_token,
                "rssi": -62.0,
                "distanceMeters": 1.8,
                "faceConfidenceScore": 96.5,
                "faceVerified": True,
                "method": "ble+face"
            }
        )
        assert stu_verify.status_code == 200, f"Student verify failed: {stu_verify.text}"
        print("[PASS] Student Verification Succeeded:", stu_verify.json()["message"])

        # 7. Test Admin Dashboard & Leave Oversight
        admin_dash = await client.get(
            "/api/v1/admin/dashboard",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert admin_dash.status_code == 200
        dash_json = admin_dash.json()
        print(f"[PASS] Admin Dashboard Metrics: {dash_json['totalStudents']} Students, {dash_json['totalFaculty']} Faculty, {dash_json['totalPendingLeaves']} Pending Leaves")

        admin_leaves = await client.get(
            "/api/v1/admin/leave-oversight",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert admin_leaves.status_code == 200
        leaves_json = admin_leaves.json()
        print(f"[PASS] Admin Leave Oversight Succeeded: {len(leaves_json['studentLeaves'])} Student Leaves, {len(leaves_json['facultyLeaves'])} Faculty Leaves")

        # 8. Test WebSockets
        import websockets
        ws_url = f"ws://127.0.0.1:8000/ws/admin/live-oversight"
        async with websockets.connect(ws_url) as ws:
            await ws.send("ping")
            reply = await asyncio.wait_for(ws.recv(), timeout=5.0)
            assert reply == "pong", f"Expected pong, got {reply}"
            print("[PASS] WebSocket Admin Live Oversight Ping/Pong Verified!")

        # 9. Test Google OAuth Endpoint Validation
        g_invalid = await client.post("/api/v1/auth/google", json={"credential": "invalid_test_token", "target_role": "student"})
        assert g_invalid.status_code == 401, f"Expected 401 for invalid google token, got {g_invalid.status_code}"
        print("[PASS] Google OAuth Endpoint Signature Verification Verified (Rejected Malformed Token with 401)!")

    print("\nALL BACKEND API & WEBSOCKET TESTS PASSED SUCCESSFULLY!")


if __name__ == "__main__":
    asyncio.run(test_backend_suite())
