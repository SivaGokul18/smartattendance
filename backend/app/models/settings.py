from sqlalchemy import Column, String, Float, Boolean
from app.core.database import Base


class AdminSettings(Base):
    __tablename__ = "admin_settings"

    id = Column(String(64), primary_key=True, default="institution-settings-default")
    ble_signal_range = Column(Float, default=15.0, nullable=False)
    ble_rssi_threshold = Column(Float, default=-75.0, nullable=False)
    face_confidence_threshold = Column(Float, default=85.0, nullable=False)
    liveness_check_enabled = Column(Boolean, default=True, nullable=False)
    auto_sync_offline = Column(Boolean, default=True, nullable=False)
    faculty_manual_override_allowed = Column(Boolean, default=True, nullable=False)
