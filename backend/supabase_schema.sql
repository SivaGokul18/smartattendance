-- ====================================================================
-- Smart Attendance System: PostgreSQL DDL Schema for Supabase
-- Dialect: PostgreSQL 14+
-- Converted from MySQL (InnoDB, utf8mb4) to PostgreSQL (UTF-8, JSONB)
-- ====================================================================

-- Enable UUID extension (optional if generating UUIDs on Postgres side)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Admin Settings Table
CREATE TABLE IF NOT EXISTS "admin_settings" (
    "id" VARCHAR(64) PRIMARY KEY DEFAULT 'institution-settings-default',
    "ble_signal_range" DOUBLE PRECISION NOT NULL DEFAULT 15.0,
    "ble_rssi_threshold" DOUBLE PRECISION NOT NULL DEFAULT -75.0,
    "face_confidence_threshold" DOUBLE PRECISION NOT NULL DEFAULT 85.0,
    "liveness_check_enabled" BOOLEAN NOT NULL DEFAULT TRUE,
    "auto_sync_offline" BOOLEAN NOT NULL DEFAULT TRUE,
    "faculty_manual_override_allowed" BOOLEAN NOT NULL DEFAULT TRUE
);

-- 2. Departments Table
CREATE TABLE IF NOT EXISTS "departments" (
    "id" VARCHAR(64) PRIMARY KEY,
    "code" VARCHAR(32) NOT NULL UNIQUE,
    "name" VARCHAR(128) NOT NULL UNIQUE,
    "active" BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE INDEX IF NOT EXISTS "idx_departments_code" ON "departments"("code");

-- 3. Users Table
CREATE TABLE IF NOT EXISTS "users" (
    "id" VARCHAR(64) PRIMARY KEY,
    "name" VARCHAR(128) NOT NULL,
    "email" VARCHAR(128) NOT NULL UNIQUE,
    "password_hash" VARCHAR(256) NOT NULL,
    "role" VARCHAR(32) NOT NULL DEFAULT 'student',
    "department" VARCHAR(64) NOT NULL DEFAULT 'General',
    "phone" VARCHAR(32),
    "photo_url" VARCHAR(512),
    "must_change_password" BOOLEAN NOT NULL DEFAULT FALSE,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "idx_users_email" ON "users"("email");
CREATE INDEX IF NOT EXISTS "idx_users_role" ON "users"("role");

-- 4. Faculty Profile Table
CREATE TABLE IF NOT EXISTS "faculty" (
    "id" VARCHAR(64) PRIMARY KEY,
    "user_id" VARCHAR(64) NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
    "employee_id" VARCHAR(64) NOT NULL UNIQUE,
    "department" VARCHAR(64) NOT NULL,
    "designation" VARCHAR(128) DEFAULT 'Faculty',
    "active" BOOLEAN NOT NULL DEFAULT TRUE,
    "is_mentor" BOOLEAN NOT NULL DEFAULT FALSE,
    "mentor_group" VARCHAR(64)
);
CREATE INDEX IF NOT EXISTS "idx_faculty_employee_id" ON "faculty"("employee_id");

-- 5. Students Profile Table
CREATE TABLE IF NOT EXISTS "students" (
    "id" VARCHAR(64) PRIMARY KEY,
    "user_id" VARCHAR(64) NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
    "roll_number" VARCHAR(64) NOT NULL UNIQUE,
    "department" VARCHAR(64) NOT NULL,
    "year" INTEGER NOT NULL DEFAULT 3,
    "section" VARCHAR(16) NOT NULL DEFAULT 'A',
    "attendance_rate" DOUBLE PRECISION NOT NULL DEFAULT 92.0,
    "face_id_status" VARCHAR(32) NOT NULL DEFAULT 'pending',
    "face_template_id" VARCHAR(128),
    "mentor_id" VARCHAR(64) REFERENCES "faculty"("id") ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS "idx_students_roll_number" ON "students"("roll_number");

-- 6. Courses Table
CREATE TABLE IF NOT EXISTS "courses" (
    "id" VARCHAR(64) PRIMARY KEY,
    "code" VARCHAR(32) NOT NULL UNIQUE,
    "name" VARCHAR(128) NOT NULL,
    "department" VARCHAR(64) NOT NULL,
    "credits" INTEGER NOT NULL DEFAULT 3
);
CREATE INDEX IF NOT EXISTS "idx_courses_code" ON "courses"("code");

-- 7. Rooms Table
CREATE TABLE IF NOT EXISTS "rooms" (
    "id" VARCHAR(64) PRIMARY KEY,
    "name" VARCHAR(64) NOT NULL,
    "beacon_uuid" VARCHAR(64) NOT NULL UNIQUE,
    "capacity" INTEGER NOT NULL DEFAULT 60,
    "default_tx_power" DOUBLE PRECISION NOT NULL DEFAULT -59.0
);
CREATE INDEX IF NOT EXISTS "idx_rooms_beacon_uuid" ON "rooms"("beacon_uuid");

-- 8. Class Sections Table
CREATE TABLE IF NOT EXISTS "class_sections" (
    "id" VARCHAR(64) PRIMARY KEY,
    "name" VARCHAR(128) NOT NULL,
    "department" VARCHAR(64) NOT NULL,
    "year" INTEGER NOT NULL DEFAULT 3,
    "section" VARCHAR(16) NOT NULL DEFAULT 'A',
    "student_count" INTEGER NOT NULL DEFAULT 45
);

-- 9. Section Subject Faculty Mapping
CREATE TABLE IF NOT EXISTS "section_subject_faculty" (
    "id" VARCHAR(64) PRIMARY KEY,
    "class_section_id" VARCHAR(64) NOT NULL REFERENCES "class_sections"("id") ON DELETE CASCADE,
    "course_id" VARCHAR(64) NOT NULL REFERENCES "courses"("id") ON DELETE CASCADE,
    "faculty_id" VARCHAR(64) NOT NULL REFERENCES "faculty"("id") ON DELETE CASCADE
);

-- 10. Timetable Slots Table
CREATE TABLE IF NOT EXISTS "timetable_slots" (
    "id" VARCHAR(64) PRIMARY KEY,
    "section_id" VARCHAR(64) NOT NULL REFERENCES "class_sections"("id") ON DELETE CASCADE,
    "course_id" VARCHAR(64) NOT NULL REFERENCES "courses"("id") ON DELETE CASCADE,
    "faculty_id" VARCHAR(64) NOT NULL REFERENCES "faculty"("id") ON DELETE CASCADE,
    "room_id" VARCHAR(64) NOT NULL REFERENCES "rooms"("id") ON DELETE CASCADE,
    "day_of_week" VARCHAR(16) NOT NULL,
    "start_time" VARCHAR(16) NOT NULL,
    "end_time" VARCHAR(16) NOT NULL,
    "color" VARCHAR(32) NOT NULL DEFAULT 'indigo'
);

-- 11. Attendance Sessions Table
CREATE TABLE IF NOT EXISTS "attendance_sessions" (
    "id" VARCHAR(64) PRIMARY KEY,
    "section_id" VARCHAR(64) NOT NULL REFERENCES "class_sections"("id") ON DELETE CASCADE,
    "course_id" VARCHAR(64) NOT NULL REFERENCES "courses"("id") ON DELETE CASCADE,
    "faculty_id" VARCHAR(64) NOT NULL REFERENCES "faculty"("id") ON DELETE CASCADE,
    "room_id" VARCHAR(64) NOT NULL REFERENCES "rooms"("id") ON DELETE CASCADE,
    "started_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
    "status" VARCHAR(32) NOT NULL DEFAULT 'broadcasting',
    "broadcast_power" DOUBLE PRECISION NOT NULL DEFAULT -59.0,
    "rolling_token" VARCHAR(128) NOT NULL,
    "duration_minutes" INTEGER NOT NULL DEFAULT 50,
    "face_verification_required" BOOLEAN NOT NULL DEFAULT TRUE,
    "capacity" INTEGER NOT NULL DEFAULT 60
);
CREATE INDEX IF NOT EXISTS "idx_attendance_sessions_status" ON "attendance_sessions"("status");

-- 12. Attendance Records Table
CREATE TABLE IF NOT EXISTS "attendance_records" (
    "id" VARCHAR(64) PRIMARY KEY,
    "session_id" VARCHAR(64) NOT NULL REFERENCES "attendance_sessions"("id") ON DELETE CASCADE,
    "student_id" VARCHAR(64) NOT NULL REFERENCES "students"("id") ON DELETE CASCADE,
    "marked_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confidence_score" DOUBLE PRECISION NOT NULL DEFAULT 94.5,
    "method" VARCHAR(32) NOT NULL DEFAULT 'ble+face',
    "face_verified" BOOLEAN NOT NULL DEFAULT TRUE,
    "marked_by" VARCHAR(64),
    "override_reason" VARCHAR(256)
);
CREATE INDEX IF NOT EXISTS "idx_attendance_records_session_id" ON "attendance_records"("session_id");
CREATE INDEX IF NOT EXISTS "idx_attendance_records_student_id" ON "attendance_records"("student_id");

-- 13. Student Leave Requests Table
CREATE TABLE IF NOT EXISTS "leave_requests" (
    "id" VARCHAR(64) PRIMARY KEY,
    "student_id" VARCHAR(64) NOT NULL REFERENCES "students"("id") ON DELETE CASCADE,
    "mentor_id" VARCHAR(64) REFERENCES "faculty"("id") ON DELETE SET NULL,
    "leave_type" VARCHAR(64) NOT NULL,
    "start_date" VARCHAR(32) NOT NULL,
    "start_session" VARCHAR(8) NOT NULL DEFAULT 'FN',
    "end_date" VARCHAR(32) NOT NULL,
    "end_session" VARCHAR(8) NOT NULL DEFAULT 'AN',
    "days_count" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "is_half_day" BOOLEAN NOT NULL DEFAULT FALSE,
    "reason" TEXT NOT NULL,
    "document_url" VARCHAR(512),
    "status" VARCHAR(32) NOT NULL DEFAULT 'pending',
    "review_comment" TEXT,
    "applied_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "idx_leave_requests_student_id" ON "leave_requests"("student_id");
CREATE INDEX IF NOT EXISTS "idx_leave_requests_status" ON "leave_requests"("status");

-- 14. Faculty Leave Requests Table
CREATE TABLE IF NOT EXISTS "faculty_leave_requests" (
    "id" VARCHAR(64) PRIMARY KEY,
    "faculty_id" VARCHAR(64) NOT NULL REFERENCES "faculty"("id") ON DELETE CASCADE,
    "substitute_faculty_id" VARCHAR(64) REFERENCES "faculty"("id") ON DELETE SET NULL,
    "leave_type" VARCHAR(64) NOT NULL,
    "start_date" VARCHAR(32) NOT NULL,
    "start_session" VARCHAR(8) NOT NULL DEFAULT 'FN',
    "end_date" VARCHAR(32) NOT NULL,
    "end_session" VARCHAR(8) NOT NULL DEFAULT 'AN',
    "days_count" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "is_half_day" BOOLEAN NOT NULL DEFAULT FALSE,
    "reason" TEXT NOT NULL,
    "status" VARCHAR(32) NOT NULL DEFAULT 'pending',
    "review_comment" TEXT,
    "affected_subjects_json" TEXT,
    "applied_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "idx_faculty_leave_requests_faculty_id" ON "faculty_leave_requests"("faculty_id");
CREATE INDEX IF NOT EXISTS "idx_faculty_leave_requests_status" ON "faculty_leave_requests"("status");

-- 15. Audit Logs Table
CREATE TABLE IF NOT EXISTS "audit_logs" (
    "id" VARCHAR(64) PRIMARY KEY,
    "actor_id" VARCHAR(64) NOT NULL,
    "actor_role" VARCHAR(32) NOT NULL,
    "action_type" VARCHAR(64) NOT NULL,
    "target_entity" VARCHAR(64) NOT NULL,
    "metadata_json" JSONB,
    "ip_address" VARCHAR(64),
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "idx_audit_logs_actor_id" ON "audit_logs"("actor_id");
CREATE INDEX IF NOT EXISTS "idx_audit_logs_action_type" ON "audit_logs"("action_type");
CREATE INDEX IF NOT EXISTS "idx_audit_logs_created_at" ON "audit_logs"("created_at");

-- 16. Google Sheet Sync Configurations Table
CREATE TABLE IF NOT EXISTS "sheet_configs" (
    "id" VARCHAR(64) PRIMARY KEY,
    "sheet_type" VARCHAR(32) NOT NULL UNIQUE,
    "url" VARCHAR(512),
    "sync_interval_minutes" INTEGER NOT NULL DEFAULT 0,
    "auto_apply" BOOLEAN NOT NULL DEFAULT FALSE,
    "last_synced_at" TIMESTAMP WITH TIME ZONE,
    "last_sync_status" VARCHAR(32) NOT NULL DEFAULT 'idle',
    "last_sync_summary" JSONB,
    "pending_preview" JSONB,
    "created_by" VARCHAR(64),
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "idx_sheet_configs_sheet_type" ON "sheet_configs"("sheet_type");
