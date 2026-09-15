import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  FileSpreadsheet,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  X,
  Download,
  Save,
  Check,
  Search,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Key,
  ShieldAlert,
  ArrowRight,
  Loader2,
  Users,
  GraduationCap,
  Sparkles,
  Info
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { adminApi } from '../../api/client';
import { useAppStore } from '../../store/useAppStore';

interface AdminSheetSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface SheetConfigState {
  id: string;
  sheet_type: string;
  url: string;
  sync_interval_minutes: number;
  auto_apply: boolean;
  last_synced_at: string | null;
  last_sync_status: string;
  last_sync_summary: any;
  pending_preview: any;
}

interface PreviewRow {
  row_number: number;
  data: Record<string, any>;
  action: 'create' | 'update' | 'unchanged';
  status: 'valid' | 'warning' | 'error';
  errors: string[];
  warnings: string[];
  changes: Record<string, { old: any; new: any }>;
}

interface MissingRow {
  id: string;
  name: string;
  email: string;
  identifier: string;
  department: string;
  section?: string;
}

interface ApplyResult {
  imported: number;
  updated: number;
  skipped: number;
  errors: Array<{ row_number: number; data: any; reason: string }>;
  credentials: Array<{
    name: string;
    email: string;
    identifier: string;
    role: string;
    temporaryPassword: string;
    department: string;
  }>;
  message: string;
}

export const AdminSheetSyncModal: React.FC<AdminSheetSyncModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { syncWithBackend } = useAppStore();

  // Active Tab: 'student' | 'faculty'
  const [activeTab, setActiveTab] = useState<'student' | 'faculty'>('student');

  // Config States
  const [configs, setConfigs] = useState<{
    student: SheetConfigState | null;
    faculty: SheetConfigState | null;
  }>({ student: null, faculty: null });

  const [inputUrl, setInputUrl] = useState('');
  const [syncInterval, setSyncInterval] = useState(0);
  const [autoApply, setAutoApply] = useState(false);

  // Status & Loading states
  const [isLoadingConfigs, setIsLoadingConfigs] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Preview & Diff States
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  const [missingRows, setMissingRows] = useState<MissingRow[]>([]);
  const [previewStats, setPreviewStats] = useState({
    total: 0,
    valid: 0,
    warning: 0,
    error: 0,
    create: 0,
    update: 0,
    missing: 0,
  });

  // Table filtering and pagination
  const [filterAction, setFilterAction] = useState<'all' | 'updates' | 'creates' | 'warnings' | 'errors'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showMissingRoster, setShowMissingRoster] = useState(false);
  const rowsPerPage = 8;

  // Post-apply results
  const [applyResult, setApplyResult] = useState<ApplyResult | null>(null);

  // Load configs on mount or open
  useEffect(() => {
    if (isOpen) {
      loadConfigs();
    }
  }, [isOpen]);

  // Sync inputs with activeTab config
  useEffect(() => {
    const currentCfg = configs[activeTab];
    if (currentCfg) {
      setInputUrl(currentCfg.url || '');
      setSyncInterval(currentCfg.sync_interval_minutes || 0);
      setAutoApply(currentCfg.auto_apply || false);

      // If there was a pending preview stored in the backend, load it!
      if (currentCfg.pending_preview && currentCfg.pending_preview.preview_rows) {
        const prev = currentCfg.pending_preview;
        setPreviewRows(prev.preview_rows || []);
        setMissingRows(prev.missing_rows || []);
        setPreviewStats({
          total: prev.total_rows || 0,
          valid: prev.valid_rows_count || 0,
          warning: prev.warning_rows_count || 0,
          error: prev.error_rows_count || 0,
          create: prev.create_count || 0,
          update: prev.update_count || 0,
          missing: prev.missing_count || 0,
        });
      } else {
        setPreviewRows([]);
        setMissingRows([]);
        setPreviewStats({ total: 0, valid: 0, warning: 0, error: 0, create: 0, update: 0, missing: 0 });
      }
    } else {
      setInputUrl('');
      setSyncInterval(0);
      setAutoApply(false);
      setPreviewRows([]);
      setMissingRows([]);
    }
    setErrorMessage(null);
    setApplyResult(null);
    setCurrentPage(1);
    setFilterAction('all');
  }, [activeTab, configs]);

  const loadConfigs = async () => {
    setIsLoadingConfigs(true);
    try {
      const res = await adminApi.getSheetConfigs();
      setConfigs({
        student: res.student || null,
        faculty: res.faculty || null,
      });
    } catch (err: any) {
      console.error('Failed to load sheet configs:', err);
      const detail = String(err.response?.data?.detail || err.message || '').toLowerCase();
      if (err.response?.status === 401 || detail.includes('token') || detail.includes('exist')) {
        setErrorMessage('Session expired or unauthorized. Please re-sign in as Admin.');
      } else {
        setErrorMessage('Could not load sheet sync settings. Check server connection.');
      }
    } finally {
      setIsLoadingConfigs(false);
    }
  };

  const handleSaveConfig = async () => {
    setIsSavingConfig(true);
    setErrorMessage(null);
    setSaveSuccessMsg(false);
    try {
      const saved = await adminApi.saveSheetConfig({
        sheet_type: activeTab,
        url: inputUrl.trim(),
        sync_interval_minutes: syncInterval,
        auto_apply: autoApply,
      });

      setConfigs((prev) => ({
        ...prev,
        [activeTab]: saved,
      }));
      setSaveSuccessMsg(true);
      setTimeout(() => setSaveSuccessMsg(false), 3500);
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Failed to save configuration.';
      const detail = String(msg).toLowerCase();
      if (err.response?.status === 401 || detail.includes('token') || detail.includes('exist')) {
        setErrorMessage('Session expired or unauthorized. Please re-sign in as Admin.');
      } else {
        setErrorMessage(msg);
      }
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleTriggerSync = async () => {
    if (!inputUrl.trim()) {
      setErrorMessage('Please provide a Google Sheet URL before syncing.');
      return;
    }

    setIsSyncing(true);
    setErrorMessage(null);
    setApplyResult(null);

    try {
      // First ensure the latest config is saved
      await adminApi.saveSheetConfig({
        sheet_type: activeTab,
        url: inputUrl.trim(),
        sync_interval_minutes: syncInterval,
        auto_apply: autoApply,
      });

      const res = await adminApi.syncSheet(activeTab, inputUrl.trim());
      setPreviewRows(res.preview_rows || []);
      setMissingRows(res.missing_rows || []);
      setPreviewStats({
        total: res.total_rows || 0,
        valid: res.valid_rows_count || 0,
        warning: res.warning_rows_count || 0,
        error: res.error_rows_count || 0,
        create: res.create_count || 0,
        update: res.update_count || 0,
        missing: res.missing_count || 0,
      });
      setCurrentPage(1);

      // Refresh configs
      await loadConfigs();
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Failed to sync with Google Sheet.';
      const detail = String(msg).toLowerCase();
      if (err.response?.status === 401 || detail.includes('token') || detail.includes('exist')) {
        setErrorMessage('Session expired or unauthorized. Please re-sign in as Admin.');
      } else {
        setErrorMessage(msg);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleApplyRows = async () => {
    if (!previewRows || previewRows.length === 0) return;

    setIsApplying(true);
    setErrorMessage(null);

    try {
      const res = await adminApi.applySheetRows({
        sheet_type: activeTab,
        rows: previewRows,
      });
      setApplyResult(res);

      // Re-sync local store with backend
      await syncWithBackend();
      // Reload configs
      await loadConfigs();
      onSuccess();
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Failed to apply sheet changes.';
      const detail = String(msg).toLowerCase();
      if (err.response?.status === 401 || detail.includes('token') || detail.includes('exist')) {
        setErrorMessage('Session expired or unauthorized. Please re-sign in as Admin.');
      } else {
        setErrorMessage(msg);
      }
    } finally {
      setIsApplying(false);
    }
  };

  const handleDownloadTemplate = async () => {
    setIsDownloadingTemplate(true);
    try {
      await adminApi.downloadSheetTemplate(activeTab);
    } catch (err: any) {
      setErrorMessage('Failed to download template. Please try again.');
    } finally {
      setIsDownloadingTemplate(false);
    }
  };

  const handleExportCredentials = () => {
    if (!applyResult || !applyResult.credentials || applyResult.credentials.length === 0) return;

    const ws = XLSX.utils.json_to_sheet(
      applyResult.credentials.map((c) => ({
        'Full Name': c.name,
        Email: c.email,
        Identifier: c.identifier,
        Role: c.role,
        Department: c.department,
        'Temporary Password': c.temporaryPassword,
        'Instructions': 'Must reset password upon initial login',
      }))
    );

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Credentials');
    XLSX.writeFile(wb, `${activeTab}_generated_credentials.xlsx`);
  };

  // URL validity helper
  const isGoogleDocsUrl = useMemo(() => {
    if (!inputUrl) return false;
    try {
      const parsed = new URL(inputUrl);
      return (
        parsed.protocol === 'https:' &&
        (parsed.hostname === 'docs.google.com' || parsed.hostname.endsWith('.docs.google.com'))
      );
    } catch {
      return false;
    }
  }, [inputUrl]);

  // Filtered preview rows
  const filteredRows = useMemo(() => {
    return previewRows.filter((r) => {
      // Action filter
      if (filterAction === 'updates' && r.action !== 'update') return false;
      if (filterAction === 'creates' && r.action !== 'create') return false;
      if (filterAction === 'warnings' && r.status !== 'warning') return false;
      if (filterAction === 'errors' && r.status !== 'error') return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const name = (r.data.full_name || '').toLowerCase();
        const email = (r.data.email || '').toLowerCase();
        const id = (r.data.roll_number || r.data.employee_id || '').toLowerCase();
        const dept = (r.data.department || '').toLowerCase();
        return name.includes(q) || email.includes(q) || id.includes(q) || dept.includes(q);
      }
      return true;
    });
  }, [previewRows, filterAction, searchQuery]);

  const totalPages = Math.ceil(filteredRows.length / rowsPerPage) || 1;
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredRows.slice(start, start + rowsPerPage);
  }, [filteredRows, currentPage]);

  const activeConfig = configs[activeTab];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col max-h-[92vh]">
        {/* MODAL HEADER */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 shrink-0">
              <FileSpreadsheet size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                  Google Sheet Sync
                </h3>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Continuous live synchronization for campus directories.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* TABS: STUDENTS VS FACULTY */}
        <div className="px-6 pt-3 pb-0 bg-white border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('student')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition cursor-pointer ${
                activeTab === 'student'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <GraduationCap size={15} />
              <span>Student Directory</span>
              {configs.student?.last_sync_status === 'pending_review' && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('faculty')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition cursor-pointer ${
                activeTab === 'faculty'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <Users size={15} />
              <span>Faculty Directory</span>
              {configs.faculty?.last_sync_status === 'pending_review' && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              )}
            </button>
          </div>

          {/* Quick Template Download */}
          <button
            onClick={handleDownloadTemplate}
            disabled={isDownloadingTemplate}
            className="text-xs font-semibold text-slate-600 hover:text-emerald-700 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-emerald-50/60 border border-slate-200 transition cursor-pointer"
            title="Download CSV format template"
          >
            {isDownloadingTemplate ? (
              <Loader2 size={13} className="animate-spin text-emerald-600" />
            ) : (
              <Download size={13} className="text-slate-500" />
            )}
            <span>CSV Template</span>
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 bg-slate-50/50">
          {/* ERROR NOTIFICATION BANNER */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <strong className="font-bold">Notice: </strong>
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          {/* SUCCESS BANNER FOR SETTINGS SAVE */}
          {saveSuccessMsg && (
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2.5 animate-in fade-in">
              <CheckCircle2 size={16} className="text-emerald-600" />
              <span className="text-xs font-semibold">Settings saved successfully.</span>
            </div>
          )}

          {/* 1. URL CONFIGURATION & SCHEDULE CARD */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  Sheet Connection
                </h4>
                <p className="text-xs text-slate-500">
                  Connect your Google Sheet or published CSV link.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowInstructions(!showInstructions)}
                className="text-xs text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50/60 hover:bg-emerald-100/70 border border-emerald-200/60 transition cursor-pointer"
              >
                <Info size={13} />
                <span>Publishing Guide</span>
                {showInstructions ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>
            </div>

            {/* Instruction Accordion */}
            {showInstructions && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50/70 to-teal-50/40 border border-emerald-200/80 text-xs text-emerald-950 space-y-3 animate-in fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="p-3 bg-white/90 rounded-xl border border-emerald-100 shadow-2xs space-y-1">
                    <div className="font-bold text-emerald-900 flex items-center gap-1.5 text-xs">
                      <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center font-bold">1</span>
                      <span>Share & Publish</span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      In Google Sheets: File &rarr; Share &rarr; Publish to web.
                    </p>
                  </div>
                  <div className="p-3 bg-white/90 rounded-xl border border-emerald-100 shadow-2xs space-y-1">
                    <div className="font-bold text-emerald-900 flex items-center gap-1.5 text-xs">
                      <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center font-bold">2</span>
                      <span>Choose CSV</span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      Select sheet tab and format as Comma-separated values (.csv).
                    </p>
                  </div>
                  <div className="p-3 bg-white/90 rounded-xl border border-emerald-100 shadow-2xs space-y-1">
                    <div className="font-bold text-emerald-900 flex items-center gap-1.5 text-xs">
                      <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center font-bold">3</span>
                      <span>Paste Link</span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      Copy generated URL and paste below to start syncing.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* URL Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-bold text-slate-700">Google Sheet URL</label>
                {inputUrl && (
                  <span
                    className={`text-[11px] font-semibold flex items-center gap-1 ${
                      isGoogleDocsUrl ? 'text-emerald-700' : 'text-rose-600'
                    }`}
                  >
                    {isGoogleDocsUrl ? (
                      <>
                        <CheckCircle2 size={12} className="text-emerald-600" />
                        <span>Verified Google Docs Link</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle size={12} className="text-rose-500" />
                        <span>Must be a docs.google.com link</span>
                      </>
                    )}
                  </span>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <FileSpreadsheet size={15} />
                </div>
                <input
                  type="url"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/.../pub?output=csv"
                  className="w-full text-xs pl-10 pr-3.5 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition font-mono"
                />
              </div>
            </div>

            {/* Interval & Auto-Apply Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
              {/* Sync Interval */}
              <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-1.5">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Clock size={13} className="text-emerald-600" />
                  <span>Sync Frequency</span>
                </label>
                <select
                  value={syncInterval}
                  onChange={(e) => setSyncInterval(Number(e.target.value))}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 cursor-pointer font-medium text-slate-700"
                >
                  <option value={0}>Manual (On Demand)</option>
                  <option value={15}>Every 15 Minutes</option>
                  <option value={60}>Every 1 Hour</option>
                  <option value={360}>Every 6 Hours</option>
                </select>
              </div>

              {/* Auto-Apply Toggle */}
              <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/80 flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Sparkles size={13} className="text-amber-600" />
                    <span>Auto-Apply Updates</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Apply clean records automatically when zero errors are found.
                  </p>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={autoApply}
                  onClick={() => setAutoApply(!autoApply)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    autoApply ? 'bg-emerald-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      autoApply ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Actions: Save Config & Trigger Sync */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <div className="text-xs text-slate-500 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-300" />
                {activeConfig?.last_synced_at ? (
                  <span>
                    Last Synced:{' '}
                    <strong className="text-slate-700 font-semibold">
                      {new Date(activeConfig.last_synced_at).toLocaleString()}
                    </strong>
                  </span>
                ) : (
                  <span className="text-slate-400">Not synced yet</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveConfig}
                  disabled={isSavingConfig}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSavingConfig ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                  <span>Save Settings</span>
                </button>

                <button
                  type="button"
                  onClick={handleTriggerSync}
                  disabled={isSyncing || !inputUrl.trim()}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 transition flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer disabled:opacity-50 active:scale-95"
                >
                  {isSyncing ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Syncing...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw size={14} />
                      <span>Sync Now</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* 2. SYNC STATUS & HEALTH METRICS BANNER */}
          {previewStats.total > 0 && (
            <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      previewStats.error > 0
                        ? 'bg-rose-500 ring-4 ring-rose-100'
                        : previewStats.warning > 0
                        ? 'bg-amber-500 ring-4 ring-amber-100'
                        : 'bg-emerald-500 ring-4 ring-emerald-100'
                    }`}
                  />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">
                      Sync Validation Preview: {previewStats.total} Rows Processed
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      {previewStats.error > 0
                        ? `${previewStats.error} error(s) found that must be resolved before those rows can be applied.`
                        : 'All validated rows are safe to commit to the institutional database.'}
                    </p>
                  </div>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs overflow-x-auto">
                  <button
                    onClick={() => {
                      setFilterAction('all');
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer text-xs ${
                      filterAction === 'all'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    All ({previewStats.total})
                  </button>

                  <button
                    onClick={() => {
                      setFilterAction('updates');
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer text-xs flex items-center gap-1 ${
                      filterAction === 'updates'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'text-blue-700 hover:bg-blue-50'
                    }`}
                  >
                    <RefreshCw size={11} />
                    <span>Updates ({previewStats.update})</span>
                  </button>

                  <button
                    onClick={() => {
                      setFilterAction('creates');
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer text-xs flex items-center gap-1 ${
                      filterAction === 'creates'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'text-emerald-700 hover:bg-emerald-50'
                    }`}
                  >
                    <CheckCircle2 size={11} />
                    <span>New ({previewStats.create})</span>
                  </button>

                  {previewStats.warning > 0 && (
                    <button
                      onClick={() => {
                        setFilterAction('warnings');
                        setCurrentPage(1);
                      }}
                      className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer text-xs flex items-center gap-1 ${
                        filterAction === 'warnings'
                          ? 'bg-amber-600 text-white shadow-2xs'
                          : 'text-amber-700 hover:bg-amber-50'
                      }`}
                    >
                      <AlertTriangle size={11} />
                      <span>Warnings ({previewStats.warning})</span>
                    </button>
                  )}

                  {previewStats.error > 0 && (
                    <button
                      onClick={() => {
                        setFilterAction('errors');
                        setCurrentPage(1);
                      }}
                      className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer text-xs flex items-center gap-1 ${
                        filterAction === 'errors'
                          ? 'bg-rose-600 text-white shadow-2xs'
                          : 'text-rose-700 hover:bg-rose-50'
                      }`}
                    >
                      <AlertCircle size={11} />
                      <span>Errors ({previewStats.error})</span>
                    </button>
                  )}
                </div>
              </div>

              {/* SEARCH & STATS ROW */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <div className="relative w-full sm:w-64">
                  <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Search preview rows..."
                    className="w-full text-xs pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-500">
                    Showing {paginatedRows.length} of {filteredRows.length} rows
                  </span>
                </div>
              </div>

              {/* PREVIEW TABLE */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-100 text-slate-700 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Row</th>
                      <th className="py-2.5 px-3">Action</th>
                      <th className="py-2.5 px-3">Full Name</th>
                      <th className="py-2.5 px-3">Email</th>
                      <th className="py-2.5 px-3">
                        {activeTab === 'student' ? 'Roll Number' : 'Employee ID'}
                      </th>
                      <th className="py-2.5 px-3">Department</th>
                      <th className="py-2.5 px-3">Detected Changes / Issues</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {paginatedRows.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-400">
                          No matching rows found in this preview.
                        </td>
                      </tr>
                    ) : (
                      paginatedRows.map((r) => {
                        const isUpdate = r.action === 'update';
                        const isCreate = r.action === 'create';
                        const hasErrors = r.errors && r.errors.length > 0;
                        const hasWarnings = r.warnings && r.warnings.length > 0;
                        const changesKeys = Object.keys(r.changes || {});

                        return (
                          <tr
                            key={r.row_number}
                            className={`hover:bg-slate-50/80 transition ${
                              r.status === 'error'
                                ? 'bg-rose-50/40'
                                : r.status === 'warning'
                                ? 'bg-amber-50/30'
                                : isUpdate
                                ? 'bg-blue-50/20'
                                : ''
                            }`}
                          >
                            <td className="py-2 px-3 font-mono text-[11px] text-slate-500">
                              #{r.row_number}
                            </td>

                            {/* Action badge */}
                            <td className="py-2 px-3">
                              {isUpdate && (
                                <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-blue-100 text-blue-800 flex items-center gap-1 w-fit">
                                  <RefreshCw size={10} /> Update
                                </span>
                              )}
                              {isCreate && (
                                <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1 w-fit">
                                  <CheckCircle2 size={10} /> New
                                </span>
                              )}
                              {r.action === 'unchanged' && (
                                <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-600 w-fit">
                                  Unchanged
                                </span>
                              )}
                            </td>

                            <td className="py-2 px-3 font-semibold text-slate-900">
                              {r.data.full_name || '-'}
                            </td>
                            <td className="py-2 px-3 font-mono text-slate-600">
                              {r.data.email || '-'}
                            </td>
                            <td className="py-2 px-3 font-mono font-bold text-slate-800">
                              {r.data.roll_number || r.data.employee_id || '-'}
                            </td>
                            <td className="py-2 px-3 text-slate-600">
                              {r.data.department || '-'}
                            </td>

                            {/* Changes & Errors */}
                            <td className="py-2 px-3">
                              {hasErrors && (
                                <div className="space-y-0.5">
                                  {r.errors.map((err, i) => (
                                    <div
                                      key={i}
                                      className="text-rose-700 font-medium text-[11px] flex items-center gap-1"
                                    >
                                      <AlertCircle size={12} className="shrink-0 text-rose-500" />
                                      <span>{err}</span>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {!hasErrors && changesKeys.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {changesKeys.map((field) => (
                                    <span
                                      key={field}
                                      className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-100 text-blue-900 flex items-center gap-1"
                                    >
                                      <span className="capitalize">{field}</span>:
                                      <span className="line-through text-slate-400">
                                        {r.changes[field].old || 'none'}
                                      </span>
                                      <ArrowRight size={10} />
                                      <span className="font-bold text-blue-800">
                                        {r.changes[field].new}
                                      </span>
                                    </span>
                                  ))}
                                </div>
                              )}

                              {!hasErrors && changesKeys.length === 0 && isCreate && (
                                <span className="text-emerald-700 text-[11px]">
                                  New account registration (auto-generates temp password)
                                </span>
                              )}

                              {!hasErrors && changesKeys.length === 0 && r.action === 'unchanged' && (
                                <span className="text-slate-400 text-[11px]">Record matches DB perfectly</span>
                              )}

                              {hasWarnings && (
                                <div className="space-y-0.5 mt-1">
                                  {r.warnings.map((w, i) => (
                                    <div
                                      key={i}
                                      className="text-amber-700 text-[10px] flex items-center gap-1"
                                    >
                                      <AlertTriangle size={11} className="shrink-0 text-amber-500" />
                                      <span>{w}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </td>

                            {/* Status Icon */}
                            <td className="py-2 px-3 text-center">
                              {r.status === 'valid' && (
                                <CheckCircle2 size={16} className="text-emerald-600 mx-auto" />
                              )}
                              {r.status === 'warning' && (
                                <AlertTriangle size={16} className="text-amber-600 mx-auto" />
                              )}
                              {r.status === 'error' && (
                                <AlertCircle size={16} className="text-rose-600 mx-auto" />
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* PAGINATION CONTROLS */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-slate-500">
                    Page {currentPage} of {totalPages}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 3. MISSING FROM SHEET SAFETY SECTION */}
          {missingRows && missingRows.length > 0 && (
            <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs space-y-3">
              <div
                onClick={() => setShowMissingRoster(!showMissingRoster)}
                className="flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center">
                    <ShieldAlert size={16} />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900">
                      {missingRows.length} Existing {activeTab === 'student' ? 'Student(s)' : 'Faculty'} Missing from Sheet
                    </h5>
                    <p className="text-[11px] text-slate-500">
                      These records exist in the database but are not in the Google Sheet. Safe mode: they are <span className="font-semibold text-slate-700">NOT</span> deleted.
                    </p>
                  </div>
                </div>

                <button className="text-slate-400 hover:text-slate-700">
                  {showMissingRoster ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>

              {showMissingRoster && (
                <div className="pt-2 border-t border-slate-100 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold">
                      <tr>
                        <th className="py-1.5 px-3">Name</th>
                        <th className="py-1.5 px-3">Email</th>
                        <th className="py-1.5 px-3">Identifier</th>
                        <th className="py-1.5 px-3">Department</th>
                        <th className="py-1.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {missingRows.map((m) => (
                        <tr key={m.id} className="hover:bg-slate-50">
                          <td className="py-1.5 px-3 font-semibold">{m.name}</td>
                          <td className="py-1.5 px-3 font-mono text-slate-500">{m.email}</td>
                          <td className="py-1.5 px-3 font-mono">{m.identifier}</td>
                          <td className="py-1.5 px-3">{m.department}</td>
                          <td className="py-1.5 px-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                              Retained in DB
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* 4. POST-APPLY RESULTS & CREDENTIALS CARD */}
          {applyResult && (
            <div className="bg-white p-6 rounded-3xl border border-emerald-200 shadow-lg space-y-4 animate-in zoom-in-95">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900">
                    Google Sheet Sync Committed Successfully!
                  </h4>
                  <p className="text-xs text-slate-500">{applyResult.message}</p>
                </div>
              </div>

              {/* Breakdown metrics */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-100 text-center">
                  <div className="text-lg font-black text-emerald-700">{applyResult.imported}</div>
                  <div className="text-[11px] font-semibold text-emerald-800">New Accounts Created</div>
                </div>
                <div className="p-3 rounded-2xl bg-blue-50/60 border border-blue-100 text-center">
                  <div className="text-lg font-black text-blue-700">{applyResult.updated}</div>
                  <div className="text-[11px] font-semibold text-blue-800">Records Updated</div>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                  <div className="text-lg font-black text-slate-600">{applyResult.skipped}</div>
                  <div className="text-[11px] font-semibold text-slate-500">Rows Skipped (Errors)</div>
                </div>
              </div>

              {/* Generated credentials table */}
              {applyResult.credentials && applyResult.credentials.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      <Key size={14} className="text-amber-600" />
                      <span>Generated Temporary Passwords ({applyResult.credentials.length})</span>
                    </div>

                    <button
                      onClick={handleExportCredentials}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Download size={13} />
                      <span>Export Credentials CSV</span>
                    </button>
                  </div>

                  <div className="max-h-48 overflow-y-auto rounded-2xl border border-slate-200">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-600 uppercase text-[10px] font-bold">
                        <tr>
                          <th className="py-2 px-3">Name</th>
                          <th className="py-2 px-3">Email</th>
                          <th className="py-2 px-3">Identifier</th>
                          <th className="py-2 px-3">Temp Password</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {applyResult.credentials.map((c, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 font-mono text-slate-800">
                            <td className="py-2 px-3 font-sans font-semibold text-slate-900">{c.name}</td>
                            <td className="py-2 px-3">{c.email}</td>
                            <td className="py-2 px-3">{c.identifier}</td>
                            <td className="py-2 px-3 font-bold text-emerald-700 bg-emerald-50/40">
                              {c.temporaryPassword}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-white">
          <div className="text-xs text-slate-500">
            {previewStats.total > 0 && !applyResult && (
              <span>
                Ready to commit:{' '}
                <strong className="text-emerald-700">{previewStats.create} new</strong>,{' '}
                <strong className="text-blue-700">{previewStats.update} updates</strong>.
                {previewStats.error > 0 && (
                  <span className="text-rose-600 font-semibold ml-1">
                    ({previewStats.error} error row(s) will be skipped)
                  </span>
                )}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
            >
              {applyResult ? 'Close' : 'Cancel'}
            </button>

            {previewStats.total > 0 && !applyResult && (
              <button
                type="button"
                onClick={handleApplyRows}
                disabled={isApplying || (previewStats.create === 0 && previewStats.update === 0)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-md shadow-emerald-600/20 transition flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
              >
                {isApplying ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Applying Changes...</span>
                  </>
                ) : (
                  <>
                    <Check size={15} />
                    <span>Confirm & Apply</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
