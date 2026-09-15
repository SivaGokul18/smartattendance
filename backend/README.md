# Smart Attendance - Unified FastAPI Python Backend

A production-grade Python backend built with **FastAPI**, **SQLAlchemy (Async)**, **Alembic**, **WebSockets**, and **JWT Authentication (RBAC)** serving the Student App, Faculty App, and Admin Portal from a single unified API.

---

## 1. Features & Architecture

- **Unified REST API**: Serves Student, Faculty, and Admin applications under `/api/v1`.
- **Role-Based Access Control (RBAC)**: Secure JWT Bearer tokens for `student`, `faculty`, and `admin` with `Depends(require_role([...]))`.
- **Real-Time WebSockets**:
  - `/ws/faculty/session/{session_id}/live`: Real-time student attendance stream as check-ins occur.
  - `/ws/admin/live-oversight`: Institution-wide broadcast stream of all active sessions and attendance rates.
- **Server-Side Proximity & Anti-Spoofing Verification**:
  - Validates BLE RSSI signal strength and computed path-loss distance ($d \le 15\text{m}$).
  - Validates rolling cryptographic session tokens to prevent replay attacks.
  - Enforces minimum biometric facial confidence thresholds (&ge; 85%).
- **Faculty Substitute Assignment**:
  - Full workflow for faculty leave applications, timetabled lecture conflict detection, and Admin substitute teacher allocation.
- **Audit Logging**: Automatic immutable logging of overrides, session terminations, and leave decisions in `audit_logs`.
- **Flexible & Robust Database**:
  - Primary production database is **MySQL 8.x** via asynchronous `mysql+aiomysql` driver.
  - Configured with explicit `InnoDB` engine, `utf8mb4` character set, and `utf8mb4_unicode_ci` collation on all tables.
  - Connection pooling with `pool_pre_ping=True` and `pool_recycle=3600` to prevent stale MySQL connections.
  - Native `JSON` columns for system metadata and audit trails.
- **Alembic Database Migrations**:
  - Full schema evolution tracking configured for MySQL async engines under `alembic/`.
- **Optional Redis Pub/Sub**: Seamless multi-node WebSocket sync when `REDIS_URL` is configured.

---

## 2. Quickstart (MySQL Database Setup)

### Prerequisites
- Python 3.10+ (tested with Python 3.14)
- **MySQL 8.x** running locally on port 3306 (or configured in `.env`)
- Node.js & npm (for the frontend)

### Setup & Run

1. **Navigate to the backend folder**:
   ```bash
   cd backend
   ```

2. **Create & activate a virtual environment**:
   ```bash
   python -m venv .venv
   # Windows (PowerShell):
   .\.venv\Scripts\Activate.ps1
   # Linux / macOS:
   source .venv/bin/activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Seed the database with demo accounts & timetable**:
   ```bash
   python seed.py
   ```

5. **Start the FastAPI server**:
   ```bash
   uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```

Interactive Swagger API Documentation will be live at:
- **Swagger UI**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)
- **Health Check**: [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)

---

## 3. Demo Credentials

| Role | Username / Identifier | Password | Access Rights |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin` *(or `admin@campus.edu`)* | `admin123` | Institutional Console, User CRUD, Course Setup, Beacon Hardware, Leave SLA Oversight |
| **Faculty** | `faculty` *(or `CS1065` / `EMP-9021`)* | `faculty123` | Start BLE Session, Live Check-In Monitor, Manual Override, Mentee Approvals, My Leave |
| **Student** | `student` *(or `2026CS2E51`)* | `student123` | BLE Scan & Proximity Verification, Face Biometrics, Today's Periods, Leave Application |

---

## 4. Production Deployment with Docker Compose

To deploy FastAPI with **PostgreSQL** and **Redis**:

```bash
cd backend
docker-compose up --build -d
```

This starts:
- **FastAPI backend** on port `8000`
- **PostgreSQL 16** on port `5432`
- **Redis 7** on port `6379`

To seed the production database inside the container:
```bash
docker-compose exec api python seed.py
```

---

## 5. API Endpoints Reference

### Authentication (`/api/v1/auth`)
- `POST /auth/login` - Authenticate and obtain JWT bearer token.
- `POST /auth/register` - Create user profile.
- `GET /auth/me` - Get profile of authenticated user.

### Student Portal (`/api/v1/student`)
- `GET /student/home` - Today's periods, live session beacon in range, streak.
- `GET /student/timetable` - Weekly timetable slots.
- `POST /student/attendance/verify` - Check in with BLE RSSI + Face Biometrics.
- `GET /student/attendance/history` - Term attendance records.
- `POST /student/enrollment/face` - Register facial biometric template.
- `POST /student/leave` - Submit student leave application.
- `GET /student/leave` - List student leave requests.

### Faculty Portal (`/api/v1/faculty`)
- `GET /faculty/home` - Dashboard metrics, today's schedule, pending approvals.
- `POST /faculty/session/start` - Broadcast BLE attendance session with rolling token.
- `POST /faculty/session/{id}/manual-checkin` - Override attendance with audit logging.
- `POST /faculty/session/{id}/end` - Finalize attendance session.
- `GET /faculty/history` - Historical sessions and attendance rates.
- `GET /faculty/approvals` - Mentee leave applications.
- `POST /faculty/approvals/{id}` - Approve/reject mentee leave.
- `GET /faculty/leave` & `POST /faculty/leave` - Faculty's own leave applications.

### Admin Console (`/api/v1/admin`)
- `GET /admin/dashboard` - Institution-wide analytics, department attendance, active classes.
- `GET /admin/students` & `GET /admin/faculty` - Full directories.
- `POST /admin/users` - Create student or faculty member.
- `PUT /admin/users/{id}` & `DELETE /admin/users/{id}` - Manage users.
- `POST /admin/users/bulk-import` - CSV student bulk import.
- `POST /admin/sessions/{id}/force-end` - Institutional session termination.
- `GET /admin/leave-oversight` - Student leaves & faculty leave with substitute assignment.
- `POST /admin/leave-oversight/{id}/review` - Decision modal with substitute faculty allocation.
- `GET /admin/audit-logs` - System audit log events.
- `GET /admin/settings` & `PUT /admin/settings` - Global BLE thresholds & face confidence settings.
