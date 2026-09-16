import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from app.core.config import settings
from app.core.database import engine, Base, AsyncSessionLocal
import app.models  # Ensures all 16 models are registered in Base.metadata
from app.routers import auth_router, student_router, faculty_router, admin_router, sheet_router, timetable_router
from app.services.sheet_sync import check_and_execute_scheduled_syncs
from app.websockets.session_manager import ws_manager

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("main")

scheduler = AsyncIOScheduler()


async def scheduled_sheet_sync_job():
    try:
        async with AsyncSessionLocal() as session:
            await check_and_execute_scheduled_syncs(session)
    except Exception as e:
        logger.error(f"Error in background scheduled sheet sync job: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing Smart Attendance Database Engine...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database initialized successfully.")

    # Automatically initialize demo seed data and institutional roster if database is fresh
    try:
        import os
        from app.models.user import User, RoleEnum
        from sqlalchemy import select, func
        async with AsyncSessionLocal() as session:
            user_count = (await session.execute(select(func.count(User.id)))).scalar() or 0
            if user_count <= 1:
                logger.info("Fresh database detected. Auto-seeding initial institutional data...")
                from seed import seed_database
                await seed_database()

                # Automatically load institutional roster from Excel if available
                for r_path in ["institutional_roster.xlsx", "../institutional_roster.xlsx"]:
                    if os.path.exists(r_path):
                        logger.info(f"Auto-importing institutional roster from {r_path}...")
                        from load_excel_roster import load_roster_from_excel
                        await load_roster_from_excel(r_path)
                        break
    except Exception as e:
        logger.warning(f"Notice during automatic database seed check: {e}")

    logger.info("Starting Live Google Sheet Sync Background Scheduler...")
    scheduler.add_job(scheduled_sheet_sync_job, "interval", minutes=1, id="google_sheet_sync_job")
    scheduler.start()

    yield

    logger.info("Shutting down Google Sheet Background Scheduler...")
    try:
        scheduler.shutdown(wait=False)
    except Exception as e:
        logger.warning(f"Error shutting down scheduler: {e}")
    logger.info("Shutting down Smart Attendance API server...")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# CORS Middleware: Permissive regex allows Render domains, Vercel, localhost, Capacitor and mobile webviews with credentials
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^(https?|capacitor|ionic):\/\/.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": f"Server Error: {str(exc)}"}
    )

# Include REST Routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(student_router, prefix=settings.API_V1_STR)
app.include_router(faculty_router, prefix=settings.API_V1_STR)
app.include_router(admin_router, prefix=settings.API_V1_STR)
app.include_router(sheet_router, prefix=settings.API_V1_STR)
app.include_router(timetable_router, prefix=settings.API_V1_STR)



# ================================================================
# WebSocket Endpoints
# ================================================================

@app.websocket("/ws/faculty/session/{session_id}/live")
async def websocket_faculty_session(websocket: WebSocket, session_id: str):
    channel = f"session:{session_id}"
    await ws_manager.connect(websocket, channel)
    try:
        while True:
            # Keep-alive heartbeat listener
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        await ws_manager.disconnect(websocket, channel)
    except Exception as e:
        logger.warning(f"WebSocket error in {channel}: {e}")
        await ws_manager.disconnect(websocket, channel)


@app.websocket("/ws/admin/live-oversight")
async def websocket_admin_oversight(websocket: WebSocket):
    channel = "admin:oversight"
    await ws_manager.connect(websocket, channel)
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        await ws_manager.disconnect(websocket, channel)
    except Exception as e:
        logger.warning(f"WebSocket error in {channel}: {e}")
        await ws_manager.disconnect(websocket, channel)


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "database": settings.DATABASE_URL.split("://")[0]
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
