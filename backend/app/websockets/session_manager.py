import asyncio
import json
import logging
from typing import Dict, Set
from fastapi import WebSocket

logger = logging.getLogger("session_manager")


class WebSocketSessionManager:
    def __init__(self):
        # Maps channel_name -> Set[WebSocket]
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        self.lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket, channel: str):
        await websocket.accept()
        async with self.lock:
            if channel not in self.active_connections:
                self.active_connections[channel] = set()
            self.active_connections[channel].add(websocket)
        logger.info(f"WebSocket client connected to {channel}. Total: {len(self.active_connections[channel])}")

    async def disconnect(self, websocket: WebSocket, channel: str):
        async with self.lock:
            if channel in self.active_connections:
                self.active_connections[channel].discard(websocket)
                if not self.active_connections[channel]:
                    del self.active_connections[channel]
        logger.info(f"WebSocket client disconnected from {channel}")

    async def broadcast(self, channel: str, message: dict):
        """
        Broadcasts JSON message to all clients connected to a specific channel.
        """
        async with self.lock:
            sockets = list(self.active_connections.get(channel, []))

        if not sockets:
            return

        dead_sockets = []
        payload = json.dumps(message)
        for ws in sockets:
            try:
                await ws.send_text(payload)
            except Exception as e:
                logger.warning(f"Failed to send to WebSocket in {channel}: {e}")
                dead_sockets.append(ws)

        if dead_sockets:
            async with self.lock:
                if channel in self.active_connections:
                    for ws in dead_sockets:
                        self.active_connections[channel].discard(ws)

    async def broadcast_checkin(self, session_id: str, student_data: dict):
        """
        Sends live check-in event to both the Faculty live monitor and Admin oversight.
        """
        payload = {
            "type": "STUDENT_CHECKIN",
            "sessionId": session_id,
            "data": student_data
        }
        # 1. To Faculty Live Monitor
        await self.broadcast(f"session:{session_id}", payload)
        # 2. To Admin Live Oversight Stream
        await self.broadcast("admin:oversight", payload)

    async def broadcast_session_status(self, session_id: str, status: str, session_summary: dict):
        """
        Sends session lifecycle updates (broadcasting started / ended).
        """
        payload = {
            "type": "SESSION_STATUS_CHANGED",
            "sessionId": session_id,
            "status": status,
            "summary": session_summary
        }
        await self.broadcast(f"session:{session_id}", payload)
        await self.broadcast("admin:oversight", payload)


ws_manager = WebSocketSessionManager()
