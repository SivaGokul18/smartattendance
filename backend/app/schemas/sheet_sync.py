from typing import List, Optional, Dict, Any
from pydantic import BaseModel


class SheetConfigItem(BaseModel):
    id: str
    sheet_type: str
    url: Optional[str] = None
    sync_interval_minutes: int = 0
    auto_apply: bool = False
    last_synced_at: Optional[str] = None
    last_sync_status: str = "idle"
    last_sync_summary: Optional[Dict[str, Any]] = None
    pending_preview: Optional[Dict[str, Any]] = None
    created_by: Optional[str] = None
    updated_at: Optional[str] = None


class SheetConfigsResponse(BaseModel):
    student: Optional[SheetConfigItem] = None
    faculty: Optional[SheetConfigItem] = None


class SheetConfigSaveRequest(BaseModel):
    sheet_type: str  # "student" | "faculty"
    url: Optional[str] = None
    sync_interval_minutes: int = 0
    auto_apply: bool = False


class SheetPreviewRow(BaseModel):
    row_number: int
    data: Dict[str, Any]
    action: str  # "create" | "update" | "unchanged"
    status: str  # "valid" | "warning" | "error"
    errors: List[str] = []
    warnings: List[str] = []
    changes: Dict[str, Dict[str, Any]] = {}


class MissingRowItem(BaseModel):
    id: str
    name: str
    email: str
    identifier: str
    department: str
    section: Optional[str] = None


class SheetSyncPreviewResponse(BaseModel):
    sheet_type: str
    total_rows: int
    valid_rows_count: int
    warning_rows_count: int
    error_rows_count: int
    create_count: int
    update_count: int
    missing_count: int
    preview_rows: List[SheetPreviewRow]
    missing_rows: List[MissingRowItem]
    headers: List[str]


class SheetApplyRequest(BaseModel):
    sheet_type: str  # "student" | "faculty"
    rows: List[Dict[str, Any]]


class SheetApplyCredential(BaseModel):
    name: str
    email: str
    identifier: str
    role: str
    temporaryPassword: str
    department: str


class SheetApplyResponse(BaseModel):
    imported: int
    updated: int
    skipped: int
    errors: List[Dict[str, Any]] = []
    credentials: List[SheetApplyCredential] = []
    message: str
