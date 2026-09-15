import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Calendar,
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
  FileSpreadsheet,
  UploadCloud,
  Users,
  GraduationCap,
  Sparkles,
  Info,
  Layers,
  MapPin,
  BookOpen,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { adminApi } from '../../api/client';
import { useAppStore } from '../../store/useAppStore';

interface AdminTimetableSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ConflictItem {
  conflict_type: 'room_collision' | 'faculty_collision' | 'section_collision';
  message: string;
  day: string;
  time: string;
  affected_entity: string;
  row_numbers: number[];
}

interface TimetablePreviewRow {
  row_number: number;
  day: string;
  start_time: string;
  end_time: string;
  course_code: string;
  course_name: string;
  department: string;
  year: number;
  section: string;
  faculty_identifier: string;
  faculty_name: string;
  faculty_id?: string;
  room_name: string;
  color: string;
  status: 'valid' | 'warning' | 'error';
  errors: string[];
  warnings: string[];
}

interface ApplyResult {
  imported_slots: number;
  sections_assigned: number;
  faculty_assigned: number;
  courses_mapped: number;
  message: string;
}

export const AdminTimetableSyncModal: React.FC<AdminTimetableSyncModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { syncWithBackend } = useAppStore();

  // Tab: 'master' | 'section' | 'faculty'
  const [activeTab, setActiveTab] = useState<'master' | 'section' | 'faculty'>('master');

  // Config & URL State - Student Timetable
  const [studentUrl, setStudentUrl] = useState('');
  const [studentLastSyncedAt, setStudentLastSyncedAt] = useState<string | null>(null);
  const [studentLastSyncStatus, setStudentLastSyncStatus] = useState<string>('idle');
  const [isSavingStudent, setIsSavingStudent] = useState(false);
  const [studentSaveSuccess, setStudentSaveSuccess] = useState(false);
  const [isSyncingStudent, setIsSyncingStudent] = useState(false);

  // Config & URL State - Teacher Timetable
  const [teacherUrl, setTeacherUrl] = useState('');
  const [teacherLastSyncedAt, setTeacherLastSyncedAt] = useState<string | null>(null);
  const [teacherLastSyncStatus, setTeacherLastSyncStatus] = useState<string>('idle');
  const [isSavingTeacher, setIsSavingTeacher] = useState(false);
  const [teacherSaveSuccess, setTeacherSaveSuccess] = useState(false);
  const [isSyncingTeacher, setIsSyncingTeacher] = useState(false);

  // File Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Processing & Loading States
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [replaceExisting, setReplaceExisting] = useState(true);

  // Preview Data & Conflicts
  const [previewRows, setPreviewRows] = useState<TimetablePreviewRow[]>([]);
  const [conflicts, setConflicts] = useState<ConflictItem[]>([]);
  const [uniqueSections, setUniqueSections] = useState<string[]>([]);
  const [uniqueFaculty, setUniqueFaculty] = useState<string[]>([]);
  const [uniqueCourses, setUniqueCourses] = useState<string[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    valid: 0,
    warning: 0,
    error: 0,
    conflictCount: 0,
  });

  // Filters & Filter Tab
  const [selectedSectionFilter, setSelectedSectionFilter] = useState<string>('all');
  const [selectedFacultyFilter, setSelectedFacultyFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'valid' | 'conflicts' | 'errors'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 7;

  // Post Apply Result State
  const [applyResult, setApplyResult] = useState<ApplyResult | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);

  // Load config on open
  useEffect(() => {
    if (isOpen) {
      loadConfig();
      setApplyResult(null);
      setErrorMessage(null);
    }
  }, [isOpen]);

  const loadConfig = async () => {
    setIsLoadingConfig(true);
    try {
      const configs = await adminApi.getAllTimetableConfigs();
      if (configs?.student) {
        setStudentUrl(configs.student.url || '');
        setStudentLastSyncedAt(configs.student.last_synced_at || null);
        setStudentLastSyncStatus(configs.student.last_sync_status || 'idle');
        if (configs.student.pending_preview && configs.student.pending_preview.preview_rows) {
          loadPreviewData(configs.student.pending_preview);
        }
      }
      if (configs?.teacher) {
        setTeacherUrl(configs.teacher.url || '');
        setTeacherLastSyncedAt(configs.teacher.last_synced_at || null);
        setTeacherLastSyncStatus(configs.teacher.last_sync_status || 'idle');
        if (!configs?.student?.pending_preview?.preview_rows && configs.teacher.pending_preview?.preview_rows) {
          loadPreviewData(configs.teacher.pending_preview);
        }
      }
    } catch (err: any) {
      console.warn('Could not load timetable sheet configs:', err);
    } finally {
      setIsLoadingConfig(false);
    }
  };

  const loadPreviewData = (data: any) => {
    setPreviewRows(data.preview_rows || []);
    setConflicts(data.conflicts || []);
    setUniqueSections(data.unique_sections || []);
    setUniqueFaculty(data.unique_faculty || []);
    setUniqueCourses(data.unique_courses || []);
    setStats({
      total: data.total_slots || 0,
      valid: data.valid_slots_count || 0,
      warning: data.warning_slots_count || 0,
      error: data.error_slots_count || 0,
      conflictCount: data.conflict_count || 0,
    });
    setCurrentPage(1);
  };

  const handleSaveStudentConfig = async () => {
    if (!studentUrl.trim()) return;
    setIsSavingStudent(true);
    setErrorMessage(null);
    try {
      const updated = await adminApi.saveTimetableConfig({
        sheet_type: 'student_timetable',
        url: studentUrl.trim(),
        sync_interval_minutes: 0,
        auto_apply: false,
      }, 'student');
      setStudentUrl(updated.url || '');
      setStudentSaveSuccess(true);
      setTimeout(() => setStudentSaveSuccess(false), 3000);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.detail || err.message || 'Failed to save student timetable URL.');
    } finally {
      setIsSavingStudent(false);
    }
  };

  const handleSaveTeacherConfig = async () => {
    if (!teacherUrl.trim()) return;
    setIsSavingTeacher(true);
    setErrorMessage(null);
    try {
      const updated = await adminApi.saveTimetableConfig({
        sheet_type: 'teacher_timetable',
        url: teacherUrl.trim(),
        sync_interval_minutes: 0,
        auto_apply: false,
      }, 'teacher');
      setTeacherUrl(updated.url || '');
      setTeacherSaveSuccess(true);
      setTimeout(() => setTeacherSaveSuccess(false), 3000);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.detail || err.message || 'Failed to save teacher timetable URL.');
    } finally {
      setIsSavingTeacher(false);
    }
  };

  const [isAutoApplyingStudent, setIsAutoApplyingStudent] = useState(false);
  const [isAutoApplyingTeacher, setIsAutoApplyingTeacher] = useState(false);

  const handleSyncStudent = async (autoApply: boolean = false) => {
    if (!studentUrl.trim()) {
      setErrorMessage('Please enter a Student Timetable Google Sheet URL.');
      return;
    }
    if (autoApply) {
      setIsAutoApplyingStudent(true);
    } else {
      setIsSyncingStudent(true);
    }
    setErrorMessage(null);
    setSelectedFile(null);
    try {
      const data = await adminApi.syncTimetable({
        customUrl: studentUrl.trim(),
        target: 'student',
        autoApply,
      });
      if (autoApply && data.applied_result) {
        setApplyResult(data.applied_result);
        setStudentLastSyncedAt(new Date().toISOString());
        setStudentLastSyncStatus('success');
        await syncWithBackend();
        onSuccess();
      } else {
        loadPreviewData(data);
        setStudentLastSyncedAt(new Date().toISOString());
        setStudentLastSyncStatus(data.error_slots_count === 0 ? 'pending_review' : 'warning');
      }
    } catch (err: any) {
      const detail = err.response?.data?.detail || err.message || 'Failed to fetch and parse Student Timetable.';
      setErrorMessage(detail);
    } finally {
      setIsSyncingStudent(false);
      setIsAutoApplyingStudent(false);
    }
  };

  const handleSyncTeacher = async (autoApply: boolean = false) => {
    if (!teacherUrl.trim()) {
      setErrorMessage('Please enter a Teacher Timetable Google Sheet URL.');
      return;
    }
    if (autoApply) {
      setIsAutoApplyingTeacher(true);
    } else {
      setIsSyncingTeacher(true);
    }
    setErrorMessage(null);
    setSelectedFile(null);
    try {
      const data = await adminApi.syncTimetable({
        customUrl: teacherUrl.trim(),
        target: 'teacher',
        autoApply,
      });
      if (autoApply && data.applied_result) {
        setApplyResult(data.applied_result);
        setTeacherLastSyncedAt(new Date().toISOString());
        setTeacherLastSyncStatus('success');
        await syncWithBackend();
        onSuccess();
      } else {
        loadPreviewData(data);
        setTeacherLastSyncedAt(new Date().toISOString());
        setTeacherLastSyncStatus(data.error_slots_count === 0 ? 'pending_review' : 'warning');
      }
    } catch (err: any) {
      const detail = err.response?.data?.detail || err.message || 'Failed to fetch and parse Teacher Timetable.';
      setErrorMessage(detail);
    } finally {
      setIsSyncingTeacher(false);
      setIsAutoApplyingTeacher(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    setSelectedFile(file);
    setIsSyncing(true);
    setErrorMessage(null);
    try {
      const data = await adminApi.syncTimetable({ file });
      loadPreviewData(data);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.detail || err.message || 'Failed to parse uploaded file.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDownloadTemplate = async () => {
    setIsDownloadingTemplate(true);
    try {
      await adminApi.downloadTimetableTemplate();
    } catch (err: any) {
      setErrorMessage('Failed to download timetable template.');
    } finally {
      setIsDownloadingTemplate(false);
    }
  };

  const handleApply = async () => {
    const validRows = previewRows.filter(r => r.status === 'valid' || r.status === 'warning');
    if (validRows.length === 0) {
      setErrorMessage('There are no valid timetable slots to apply.');
      return;
    }

    setIsApplying(true);
    setErrorMessage(null);
    try {
      const res = await adminApi.applyTimetableSlots({
        rows: previewRows,
        replace_existing: replaceExisting,
      });
      setApplyResult(res);
      await syncWithBackend();
      onSuccess();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.detail || err.message || 'Failed to apply timetable slots.');
    } finally {
      setIsApplying(false);
    }
  };

  // Filtered rows for the table
  const filteredRows = useMemo(() => {
    return previewRows.filter((r) => {
      // Tab filter
      if (activeTab === 'section' && selectedSectionFilter !== 'all') {
        const secTag = `${r.department} Yr ${r.year} Sec ${r.section}`;
        if (secTag !== selectedSectionFilter) return false;
      }
      if (activeTab === 'faculty' && selectedFacultyFilter !== 'all') {
        if (r.faculty_name !== selectedFacultyFilter) return false;
      }

      // Status filter
      if (statusFilter === 'valid' && r.status !== 'valid') return false;
      if (statusFilter === 'conflicts' && r.status !== 'warning') return false;
      if (statusFilter === 'errors' && r.status !== 'error') return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          r.course_code.toLowerCase().includes(q) ||
          r.course_name.toLowerCase().includes(q) ||
          r.faculty_name.toLowerCase().includes(q) ||
          r.room_name.toLowerCase().includes(q) ||
          r.section.toLowerCase().includes(q) ||
          r.department.toLowerCase().includes(q) ||
          r.day.toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [previewRows, activeTab, selectedSectionFilter, selectedFacultyFilter, statusFilter, searchQuery]);

  const totalPages = Math.ceil(filteredRows.length / rowsPerPage) || 1;
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredRows.slice(start, start + rowsPerPage);
  }, [filteredRows, currentPage]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 font-sans animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Header Bar */}
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-600 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                Timetable Sync
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Sync weekly schedules for students and teachers.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-800 text-xs">
            <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
            <div className="flex-1">
              <div className="font-bold">Sync Notice</div>
              <div className="mt-0.5">{errorMessage}</div>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-rose-400 hover:text-rose-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Success Modal View after apply */}
        {applyResult ? (
          <div className="p-6 sm:p-8 flex-1 overflow-y-auto space-y-6">
            <div className="text-center max-w-md mx-auto py-6">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 border border-emerald-200">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                Timetable Allocation Complete!
              </h3>
              <p className="text-xs text-slate-600 mt-2">
                {applyResult.message}
              </p>
            </div>

            {/* KPI Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
              <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 text-center">
                <span className="text-[11px] font-medium text-amber-700 uppercase tracking-wider block">Imported Slots</span>
                <span className="text-2xl font-bold font-mono text-slate-900 mt-1 block">{applyResult.imported_slots}</span>
              </div>
              <div className="bg-sky-50 rounded-2xl p-4 border border-sky-200 text-center">
                <span className="text-[11px] font-medium text-sky-700 uppercase tracking-wider block">Sections Assigned</span>
                <span className="text-2xl font-bold font-mono text-slate-900 mt-1 block">{applyResult.sections_assigned}</span>
              </div>
              <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200 text-center">
                <span className="text-[11px] font-medium text-emerald-700 uppercase tracking-wider block">Faculty Mapped</span>
                <span className="text-2xl font-bold font-mono text-slate-900 mt-1 block">{applyResult.faculty_assigned}</span>
              </div>
              <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-200 text-center">
                <span className="text-[11px] font-medium text-indigo-700 uppercase tracking-wider block">Courses Linked</span>
                <span className="text-2xl font-bold font-mono text-slate-900 mt-1 block">{applyResult.courses_mapped}</span>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 max-w-2xl mx-auto text-xs text-slate-600 space-y-1.5">
              <div className="flex items-center gap-2 font-semibold text-slate-800">
                <Info className="w-4 h-4 text-amber-600" />
                <span>Synchronized Portals:</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-600 pl-1">
                <li><strong>Student Portals</strong>: Weekly schedules updated for all enrolled students in matched class sections.</li>
                <li><strong>Faculty Profiles</strong>: Courses automatically added to faculty teaching assignments in database and store.</li>
                <li><strong>Curriculum View</strong>: Courses and sections now reflect assigned faculty and classrooms.</li>
              </ul>
            </div>

            <div className="flex justify-center pt-4">
              <button
                onClick={() => {
                  setApplyResult(null);
                  onClose();
                }}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-sm transition active:scale-95 text-xs flex items-center gap-2"
              >
                <span>Done & View Courses</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">

            {/* Ingestion Panel: Separate Student & Teacher Timetable URLs */}
            <div className="bg-slate-50/80 border border-slate-200/90 rounded-2xl p-4 sm:p-5 space-y-3.5">
              
              {/* Quick Actions Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-1 border-b border-slate-200/60">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-amber-600" />
                  <span>Google Sheet URL Sync</span>
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".csv, .xlsx, .xls"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file);
                    }}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isSyncing || isSyncingStudent || isSyncingTeacher}
                    className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold px-3 py-1.5 rounded-xl text-xs transition flex items-center gap-1.5 shadow-2xs"
                  >
                    <UploadCloud className="w-3.5 h-3.5 text-amber-600" />
                    <span>{selectedFile ? selectedFile.name.slice(0, 16) + '...' : 'Upload Excel / CSV'}</span>
                  </button>

                  <button
                    onClick={handleDownloadTemplate}
                    disabled={isDownloadingTemplate}
                    className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold px-3 py-1.5 rounded-xl text-xs transition flex items-center gap-1.5 shadow-2xs"
                    title="Download Timetable Template"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                    <span>Template</span>
                  </button>

                  <button
                    onClick={() => setShowInstructions(!showInstructions)}
                    className="text-[11px] font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1 ml-1"
                  >
                    <Info className="w-3.5 h-3.5" />
                    <span>{showInstructions ? 'Hide Help' : 'How to get URL?'}</span>
                  </button>
                </div>
              </div>

              {/* URL Section 1: Student Timetable URL */}
              <div className="bg-white border border-slate-200/80 rounded-xl p-3 sm:p-3.5 space-y-2 shadow-2xs">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-sky-600" />
                    <span>Student Timetable URL</span>
                  </label>
                  {studentLastSyncedAt && (
                    <span className="text-[10px] text-slate-400">
                      Last synced: {new Date(studentLastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="url"
                      placeholder="Paste Student Timetable Google Sheet URL (edit, share, or published link)"
                      value={studentUrl}
                      onChange={(e) => setStudentUrl(e.target.value)}
                      className="w-full pl-3.5 pr-8 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition font-mono"
                    />
                    {studentUrl && (
                      <button
                        onClick={() => setStudentUrl('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={handleSaveStudentConfig}
                      disabled={isSavingStudent || !studentUrl.trim()}
                      className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold px-2.5 py-2 rounded-xl text-xs transition flex items-center gap-1 disabled:opacity-50"
                      title="Save URL to database"
                    >
                      {isSavingStudent ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-600" />
                      ) : studentSaveSuccess ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Save className="w-3.5 h-3.5 text-slate-500" />
                      )}
                      <span>Save</span>
                    </button>

                    <button
                      onClick={() => handleSyncStudent(false)}
                      disabled={isSyncingStudent || isAutoApplyingStudent || !studentUrl.trim()}
                      className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold px-3 py-2 rounded-xl text-xs transition flex items-center gap-1.5 disabled:opacity-50"
                      title="Fetch and preview slots without immediately modifying timetable"
                    >
                      {isSyncingStudent ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-600" />
                      ) : (
                        <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                      )}
                      <span>Preview</span>
                    </button>

                    <button
                      onClick={() => handleSyncStudent(true)}
                      disabled={isSyncingStudent || isAutoApplyingStudent || !studentUrl.trim()}
                      className="bg-sky-600 hover:bg-sky-700 text-white font-bold px-3.5 py-2 rounded-xl shadow-xs transition active:scale-95 text-xs flex items-center gap-1.5 disabled:opacity-50"
                      title="Sync from Google Sheet and immediately assign to student portals"
                    >
                      {isAutoApplyingStudent ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5" />
                      )}
                      <span>Sync & Apply</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* URL Section 2: Teacher Timetable URL */}
              <div className="bg-white border border-slate-200/80 rounded-xl p-3 sm:p-3.5 space-y-2 shadow-2xs">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-emerald-600" />
                    <span>Teacher Timetable URL</span>
                  </label>
                  {teacherLastSyncedAt && (
                    <span className="text-[10px] text-slate-400">
                      Last synced: {new Date(teacherLastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="url"
                      placeholder="Paste Teacher Timetable Google Sheet URL (edit, share, or published link)"
                      value={teacherUrl}
                      onChange={(e) => setTeacherUrl(e.target.value)}
                      className="w-full pl-3.5 pr-8 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition font-mono"
                    />
                    {teacherUrl && (
                      <button
                        onClick={() => setTeacherUrl('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={handleSaveTeacherConfig}
                      disabled={isSavingTeacher || !teacherUrl.trim()}
                      className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold px-2.5 py-2 rounded-xl text-xs transition flex items-center gap-1 disabled:opacity-50"
                      title="Save URL to database"
                    >
                      {isSavingTeacher ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                      ) : teacherSaveSuccess ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Save className="w-3.5 h-3.5 text-slate-500" />
                      )}
                      <span>Save</span>
                    </button>

                    <button
                      onClick={() => handleSyncTeacher(false)}
                      disabled={isSyncingTeacher || isAutoApplyingTeacher || !teacherUrl.trim()}
                      className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold px-3 py-2 rounded-xl text-xs transition flex items-center gap-1.5 disabled:opacity-50"
                      title="Fetch and preview slots without immediately modifying timetable"
                    >
                      {isSyncingTeacher ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                      ) : (
                        <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                      )}
                      <span>Preview</span>
                    </button>

                    <button
                      onClick={() => handleSyncTeacher(true)}
                      disabled={isSyncingTeacher || isAutoApplyingTeacher || !teacherUrl.trim()}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-2 rounded-xl shadow-xs transition active:scale-95 text-xs flex items-center gap-1.5 disabled:opacity-50"
                      title="Sync from Google Sheet and immediately assign to faculty portals"
                    >
                      {isAutoApplyingTeacher ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5" />
                      )}
                      <span>Sync & Apply</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Collapsible Setup Instructions */}
              {showInstructions && (
                <div className="mt-2 pt-3 border-t border-slate-200/80 text-xs text-slate-600 space-y-1.5 animate-in fade-in">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>How to get Google Sheet CSV Link:</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 pl-1 text-slate-600">
                    <li>Open Google Sheet &rarr; click <strong>File</strong> &rarr; <strong>Share</strong> &rarr; <strong>Publish to web</strong>.</li>
                    <li>Select the Timetable tab and change format to <strong>Comma-separated values (.csv)</strong>.</li>
                    <li>Click <strong>Publish</strong> and copy the link.</li>
                    <li>Paste into the Student or Teacher URL field above and click <strong>Sync & Apply</strong>.</li>
                  </ol>
                </div>
              )}
            </div>

            {/* Staged Preview Ready Callout Banner */}
            {previewRows.length > 0 && !applyResult && (
              <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs animate-in fade-in">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0" />
                  <div>
                    <span className="font-bold text-sky-900 block sm:inline">
                      Preview Loaded: {previewRows.filter(r => r.status === 'valid' || r.status === 'warning').length} slots ready to assign.
                    </span>
                    <span className="text-sky-700 block text-[11px] mt-0.5">
                      Click <strong>Apply to Schedules</strong> below or right here to assign to student and teacher portals.
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleApply}
                  disabled={isApplying || previewRows.filter(r => r.status === 'valid' || r.status === 'warning').length === 0}
                  className="bg-sky-600 hover:bg-sky-700 text-white font-bold px-4 py-2 rounded-xl shadow-xs transition active:scale-95 text-xs flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                >
                  {isApplying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  <span>Apply Now</span>
                </button>
              </div>
            )}

            {/* Quick KPI Stats Bar */}
            {previewRows.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3 text-center">
                  <span className="text-[11px] font-medium text-slate-500 block">Total Periods</span>
                  <span className="text-lg font-bold font-mono text-slate-900 mt-0.5 block">{stats.total}</span>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-center">
                  <span className="text-[11px] font-medium text-emerald-700 block">Valid Slots</span>
                  <span className="text-lg font-bold font-mono text-emerald-800 mt-0.5 block">{stats.valid}</span>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-center">
                  <span className="text-[11px] font-medium text-amber-700 block">Collisions / Warnings</span>
                  <span className="text-lg font-bold font-mono text-amber-800 mt-0.5 block">{stats.warning}</span>
                </div>
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3 text-center">
                  <span className="text-[11px] font-medium text-rose-700 block">Errors</span>
                  <span className="text-lg font-bold font-mono text-rose-800 mt-0.5 block">{stats.error}</span>
                </div>
                <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-3 text-center col-span-2 sm:col-span-1">
                  <span className="text-[11px] font-medium text-indigo-700 block">Sections Assigned</span>
                  <span className="text-lg font-bold font-mono text-indigo-800 mt-0.5 block">{uniqueSections.length}</span>
                </div>
              </div>
            )}

            {/* Collision Analysis Alert Card */}
            {conflicts.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Conflicts Detected: {conflicts.length} collision{conflicts.length > 1 ? 's' : ''} found</span>
                  </div>
                  <span className="text-[11px] text-amber-700 font-medium">Review affected slots before applying</span>
                </div>

                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {conflicts.map((c, idx) => (
                    <div
                      key={idx}
                      className="bg-white/90 border border-amber-200/80 rounded-xl p-2.5 text-[11px] flex items-start gap-2.5"
                    >
                      <span className={`px-2 py-0.5 rounded-md font-bold uppercase text-[10px] shrink-0 ${
                        c.conflict_type === 'room_collision'
                          ? 'bg-rose-100 text-rose-800'
                          : c.conflict_type === 'faculty_collision'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {c.conflict_type === 'room_collision'
                          ? 'Room Collision'
                          : c.conflict_type === 'faculty_collision'
                          ? 'Faculty Concurrency'
                          : 'Section Collision'}
                      </span>
                      <span className="text-slate-700 font-medium flex-1">{c.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Timetable View Tabs: All Schedules, Student Sections, Teachers */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                
                {/* View Tabs */}
                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl w-fit">
                  <button
                    onClick={() => {
                      setActiveTab('master');
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      activeTab === 'master'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    All Schedules
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('section');
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                      activeTab === 'section'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <GraduationCap className="w-3.5 h-3.5 text-sky-600" />
                    <span>Student Sections ({uniqueSections.length})</span>
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('faculty');
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                      activeTab === 'faculty'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Teachers ({uniqueFaculty.length})</span>
                  </button>
                </div>

                {/* Sub-selectors based on tab */}
                {activeTab === 'section' && uniqueSections.length > 0 && (
                  <select
                    value={selectedSectionFilter}
                    onChange={(e) => {
                      setSelectedSectionFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  >
                    <option value="all">All Class Sections</option>
                    {uniqueSections.map((sec) => (
                      <option key={sec} value={sec}>{sec}</option>
                    ))}
                  </select>
                )}

                {activeTab === 'faculty' && uniqueFaculty.length > 0 && (
                  <select
                    value={selectedFacultyFilter}
                    onChange={(e) => {
                      setSelectedFacultyFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  >
                    <option value="all">All Teachers</option>
                    {uniqueFaculty.map((fac) => (
                      <option key={fac} value={fac}>{fac}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Filters & Search Toolbar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search periods, rooms, faculty..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5 self-start sm:self-auto overflow-x-auto w-full sm:w-auto">
                  <button
                    onClick={() => {
                      setStatusFilter('all');
                      setCurrentPage(1);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                      statusFilter === 'all'
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    All ({previewRows.length})
                  </button>
                  <button
                    onClick={() => {
                      setStatusFilter('valid');
                      setCurrentPage(1);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                      statusFilter === 'valid'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    }`}
                  >
                    Valid ({stats.valid})
                  </button>
                  <button
                    onClick={() => {
                      setStatusFilter('conflicts');
                      setCurrentPage(1);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                      statusFilter === 'conflicts'
                        ? 'bg-amber-600 text-white'
                        : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                    }`}
                  >
                    Collisions ({stats.warning})
                  </button>
                  <button
                    onClick={() => {
                      setStatusFilter('errors');
                      setCurrentPage(1);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                      statusFilter === 'errors'
                        ? 'bg-rose-600 text-white'
                        : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                    }`}
                  >
                    Errors ({stats.error})
                  </button>
                </div>
              </div>

              {/* Timetable Preview Table */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <tr>
                        <th className="py-3 px-3.5 text-center w-12">#</th>
                        <th className="py-3 px-3.5">Day & Time</th>
                        <th className="py-3 px-3.5">Course</th>
                        <th className="py-3 px-3.5">Section</th>
                        <th className="py-3 px-3.5">Teacher</th>
                        <th className="py-3 px-3.5">Room</th>
                        <th className="py-3 px-3.5 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {paginatedRows.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-400">
                            {previewRows.length === 0
                              ? 'No timetable slots yet. Sync via Student or Teacher URL above, or upload a file.'
                              : 'No timetable slots match the active filters.'}
                          </td>
                        </tr>
                      ) : (
                        paginatedRows.map((row) => {
                          const hasConflicts = row.warnings.some(w => w.startsWith('Collision'));
                          return (
                            <tr
                              key={row.row_number}
                              className={`hover:bg-slate-50/80 transition-colors ${
                                row.status === 'error'
                                   ? 'bg-rose-50/40'
                                  : hasConflicts
                                  ? 'bg-amber-50/40'
                                  : ''
                              }`}
                            >
                              <td className="py-3 px-3.5 text-center font-mono text-slate-400">
                                {row.row_number}
                              </td>
                              <td className="py-3 px-3.5">
                                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                  <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 text-[10px] font-bold">
                                    {row.day}
                                  </span>
                                  <span className="font-mono text-xs">{row.start_time} - {row.end_time}</span>
                                </div>
                              </td>
                              <td className="py-3 px-3.5">
                                <div className="font-bold text-slate-900">{row.course_name}</div>
                                <div className="text-[11px] font-mono text-amber-700 font-semibold">{row.course_code}</div>
                              </td>
                              <td className="py-3 px-3.5">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-sky-50 text-sky-800 border border-sky-100 font-semibold text-[11px]">
                                  {row.department} Yr {row.year} Sec {row.section}
                                </span>
                              </td>
                              <td className="py-3 px-3.5">
                                <div className="font-semibold text-slate-800">{row.faculty_name}</div>
                                <div className="text-[10px] text-slate-400 font-mono">{row.faculty_identifier}</div>
                              </td>
                              <td className="py-3 px-3.5">
                                <span className="inline-flex items-center gap-1 text-slate-700 font-semibold">
                                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                  <span>{row.room_name}</span>
                                </span>
                              </td>
                              <td className="py-3 px-3.5 text-center">
                                {row.status === 'valid' && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>Valid</span>
                                  </span>
                                )}
                                {row.status === 'warning' && (
                                  <div className="inline-flex flex-col items-center">
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
                                      <AlertTriangle className="w-3 h-3" />
                                      <span>{hasConflicts ? 'Collision' : 'Notice'}</span>
                                    </span>
                                  </div>
                                )}
                                {row.status === 'error' && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">
                                    <AlertCircle className="w-3 h-3" />
                                    <span>Error</span>
                                  </span>
                                )}

                                {/* Hover diagnostic notes */}
                                {(row.errors.length > 0 || row.warnings.length > 0) && (
                                  <div className="text-[10px] text-slate-500 mt-1 max-w-xs text-left">
                                    {row.errors.map((e, i) => (
                                      <div key={i} className="text-rose-600 font-medium">• {e}</div>
                                    ))}
                                    {row.warnings.map((w, i) => (
                                      <div key={i} className="text-amber-700">• {w}</div>
                                    ))}
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination footer */}
                {totalPages > 1 && (
                  <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                    <div>
                      Showing {(currentPage - 1) * rowsPerPage + 1} to{' '}
                      {Math.min(currentPage * rowsPerPage, filteredRows.length)} of {filteredRows.length} slots
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="p-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="px-2 font-mono font-medium text-slate-700">
                        {currentPage} / {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="p-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer Controls */}
        {!applyResult && (
          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="replaceExisting"
                checked={replaceExisting}
                onChange={(e) => setReplaceExisting(e.target.checked)}
                className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500/30"
              />
              <label htmlFor="replaceExisting" className="text-xs text-slate-600 font-medium cursor-pointer">
                Replace existing schedule
              </label>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 font-bold text-xs transition"
              >
                Cancel
              </button>

              <button
                onClick={handleApply}
                disabled={isApplying || previewRows.filter(r => r.status === 'valid' || r.status === 'warning').length === 0}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-xs transition active:scale-95 text-xs flex items-center gap-2 disabled:opacity-50"
              >
                {isApplying ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>Apply to Schedules ({previewRows.filter(r => r.status === 'valid' || r.status === 'warning').length})</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
