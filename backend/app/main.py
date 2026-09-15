import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
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

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
