from app.routers.auth import router as auth_router
from app.routers.student import router as student_router
from app.routers.faculty import router as faculty_router
from app.routers.admin import router as admin_router
from app.routers.sheet_router import router as sheet_router
from app.routers.timetable_router import router as timetable_router

__all__ = ["auth_router", "student_router", "faculty_router", "admin_router", "sheet_router", "timetable_router"]

