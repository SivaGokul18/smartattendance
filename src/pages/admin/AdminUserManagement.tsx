import React, { useState, useMemo, useEffect } from 'react';
import { 
  Users, 
  GraduationCap, 
  Search, 
  Filter, 
  Plus, 
  Upload, 
  Download, 
  ScanFace, 
  ShieldCheck, 
  AlertCircle, 
  MoreVertical, 
  CheckCircle2, 
  X, 
  Trash2, 
  Edit3, 
  ChevronLeft, 
  ChevronRight,
  ArrowUpDown,
  FileSpreadsheet,
  Layers,
  RefreshCw
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { Student, Faculty } from '../../types';
import { adminApi } from '../../api/client';
import { AdminSheetSyncModal } from '../../components/admin/AdminSheetSyncModal';
import { AdminBulkImportModal } from '../../components/admin/AdminBulkImportModal';

export const AdminUserManagement: React.FC = () => {
  const { students, faculty, addStudent, updateStudent, deleteStudent, addFaculty, updateFaculty, toggleFacultyStatus, deleteFaculty, syncWithBackend } = useAppStore();

  // Active sub-tab: 'students' or 'faculty'
  const [activeTab, setActiveTab] = useState<'students' | 'faculty'>('students');

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Sorting
  const [sortField, setSortField] = useState<'name' | 'rate' | 'id'>('name');
  const [sortAsc, setSortAsc] = useState(true);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [isSheetSyncOpen, setIsSheetSyncOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<{ id: string; name: string; type: 'student' | 'faculty' } | null>(null);
  const [userToEdit, setUserToEdit] = useState<{ id: string; type: 'student' | 'faculty' } | null>(null);
  const [sheetSyncStatus, setSheetSyncStatus] = useState<{ active: boolean; label: string }>({ active: false, label: '' });

  // Load sync config status and fresh users on mount
  useEffect(() => {
    syncWithBackend();
    adminApi.getSheetConfigs().then((res: any) => {
      const stu = res?.student;
      const fac = res?.faculty;
      const hasAuto = (stu?.sync_interval_minutes > 0 && stu?.url) || (fac?.sync_interval_minutes > 0 && fac?.url);
      const hasUrl = Boolean(stu?.url || fac?.url);
      setSheetSyncStatus({
        active: hasAuto,
        label: hasAuto ? 'Auto-Sync Active' : hasUrl ? 'Sheet Connected' : '',
      });
    }).catch(() => {});
  }, []);

  // Form input state for adding user
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    rollNumber: '',
    employeeId: '',
    department: 'Computer Science',
    semester: 'Semester 5',
    section: 'Sec A',
    designation: 'Assistant Professor'
  });

  // Edit user state
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    rollNumber: '',
    employeeId: '',
    department: '',
    year: 3,
    section: 'A',
    phone: '',
    designation: '',
    mentorName: '',
  });

  const handleOpenEdit = (user: any, type: 'student' | 'faculty') => {
    setUserToEdit({ id: user.id, type });
    setEditFormData({
      name: user.name || '',
      email: user.email || '',
      rollNumber: user.rollNumber || '',
      employeeId: user.employeeId || '',
      department: user.department || '',
      year: user.year || 3,
      section: user.section || 'A',
      phone: user.phone || '',
      designation: user.designation || 'Associate Professor',
      mentorName: user.mentorName || '',
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userToEdit) return;
    if (userToEdit.type === 'student') {
      updateStudent(userToEdit.id, {
        name: editFormData.name,
        email: editFormData.email,
        rollNumber: editFormData.rollNumber,
        department: editFormData.department,
        year: Number(editFormData.year),
        section: editFormData.section,
        phone: editFormData.phone,
        mentorName: editFormData.mentorName,
      });
    } else {
      updateFaculty(userToEdit.id, {
        name: editFormData.name,
        email: editFormData.email,
        employeeId: editFormData.employeeId,
        department: editFormData.department,
        phone: editFormData.phone,
        designation: editFormData.designation,
      });
    }
    setIsEditModalOpen(false);
    setUserToEdit(null);
  };

  // Filtered & Sorted Students
  const filteredStudents = useMemo(() => {
    return students
      .filter((s) => {
        const matchesSearch = 
          s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.rollNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.department.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesDept = selectedDept === 'all' || s.department.toLowerCase().includes(selectedDept.toLowerCase());
        const matchesStatus = 
          selectedStatus === 'all' || 
          (selectedStatus === 'enrolled' && s.faceIdStatus === 'enrolled') ||
          (selectedStatus === 'pending' && s.faceIdStatus !== 'enrolled');
        return matchesSearch && matchesDept && matchesStatus;
      })
      .sort((a, b) => {
        if (sortField === 'name') return sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
        if (sortField === 'rate') return sortAsc ? a.attendanceRate - b.attendanceRate : b.attendanceRate - a.attendanceRate;
        return sortAsc ? a.rollNumber.localeCompare(b.rollNumber) : b.rollNumber.localeCompare(a.rollNumber);
      });
  }, [students, searchQuery, selectedDept, selectedStatus, sortField, sortAsc]);

  // Filtered & Sorted Faculty
  const filteredFaculty = useMemo(() => {
    return faculty
      .filter((f) => {
        const matchesSearch = 
          f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          f.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
          f.department.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesDept = selectedDept === 'all' || f.department.toLowerCase().includes(selectedDept.toLowerCase());
        const matchesStatus = selectedStatus === 'all' || (selectedStatus === 'active' ? f.active : !f.active);
        return matchesSearch && matchesDept && matchesStatus;
      })
      .sort((a, b) => {
        if (sortField === 'name') return sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
        return sortAsc ? a.employeeId.localeCompare(b.employeeId) : b.employeeId.localeCompare(a.employeeId);
      });
  }, [faculty, searchQuery, selectedDept, selectedStatus, sortField, sortAsc]);

  // Pagination slice
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredStudents.slice(start, start + itemsPerPage);
  }, [filteredStudents, currentPage]);

  const paginatedFaculty = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredFaculty.slice(start, start + itemsPerPage);
  }, [filteredFaculty, currentPage]);

  const totalPages = Math.ceil(
    (activeTab === 'students' ? filteredStudents.length : filteredFaculty.length) / itemsPerPage
  ) || 1;

  // Handle Add Form Submission
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'students') {
      addStudent({
        name: formData.name,
        rollNumber: formData.rollNumber || `2026CS${Math.floor(100 + Math.random() * 900)}`,
        department: formData.department,
        year: 3,
        section: 'A',
        email: formData.email || `${formData.name.toLowerCase().replace(/\s+/g, '')}@smartattendance.edu`,
        phone: '+91 98765 43210',
        faceIdStatus: 'pending'
      });
    } else {
      addFaculty({
        name: formData.name,
        employeeId: formData.employeeId || `EMP-${Math.floor(2000 + Math.random() * 8000)}`,
        department: formData.department,
        email: formData.email || `${formData.name.toLowerCase().replace(/\s+/g, '')}@smartattendance.edu`,
        phone: '+91 98765 12345',
        active: true,
        subjects: ['Machine Learning (CS301)'],
      });
    }

    setIsAddModalOpen(false);
    setFormData({
      name: '',
      email: '',
      rollNumber: '',
      employeeId: '',
      department: 'Computer Science',
      semester: 'Semester 5',
      section: 'Sec A',
      designation: 'Assistant Professor'
    });
  };

  // Confirm and execute delete
  const handleExecuteDelete = () => {
    if (!userToDelete) return;
    if (userToDelete.type === 'student') {
      deleteStudent(userToDelete.id);
    } else {
      deleteFaculty(userToDelete.id);
    }
    setIsDeleteConfirmOpen(false);
    setUserToDelete(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-xs">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Users size={22} className="text-amber-700" />
            <span>Students & Faculty</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Directory of campus students, faculty members, and biometric profiles.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => setIsSheetSyncOpen(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition flex items-center gap-2 cursor-pointer shadow-2xs group"
            title="Configure and trigger live Google Sheet synchronization"
          >
            <RefreshCw size={14} className="text-emerald-700 group-hover:rotate-180 transition-transform duration-500" />
            <span>Google Sheet Sync</span>
            {sheetSyncStatus.active ? (
              <span className="flex items-center gap-1 text-[10px] font-extrabold bg-emerald-200/80 text-emerald-900 px-1.5 py-0.5 rounded-md">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                <span>Live</span>
              </span>
            ) : sheetSyncStatus.label ? (
              <span className="text-[10px] font-medium text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-md">
                {sheetSyncStatus.label}
              </span>
            ) : null}
          </button>

          <button
            onClick={() => setIsCsvModalOpen(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 transition flex items-center gap-2 cursor-pointer shadow-2xs group"
            title="Upload local Excel (.xlsx, .xls, .csv) spreadsheet to bulk update and onboard students & faculty"
          >
            <FileSpreadsheet size={14} className="text-teal-700" />
            <span>Upload Excel Sheet</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 transition flex items-center gap-1.5 shadow-md shadow-amber-600/20 cursor-pointer"
          >
            <Plus size={15} />
            <span>{activeTab === 'students' ? 'Add Student' : 'Add Faculty'}</span>
          </button>
        </div>
      </div>

      {/* Tabs & Search & Filter Bar */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          {/* Sub-Tabs: Students vs Faculty */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs">
            <button
              onClick={() => {
                setActiveTab('students');
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-xl font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'students'
                  ? 'bg-white text-amber-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GraduationCap size={15} />
              <span>Students ({students.length})</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('faculty');
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-xl font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'faculty'
                  ? 'bg-white text-amber-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users size={15} />
              <span>Faculty ({faculty.length})</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 sm:max-w-xs">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={`Search ${activeTab}...`}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-amber-600 transition"
            />
          </div>
        </div>

        {/* Filter Dropdowns & Sorter */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 text-slate-500 font-medium">
              <Filter size={13} />
              <span>Filter:</span>
            </div>

            {/* Department Filter */}
            <select
              value={selectedDept}
              onChange={(e) => {
                setSelectedDept(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-amber-600"
            >
              <option value="all">All Departments</option>
              <option value="computer">Computer Science</option>
              <option value="information">Information Tech</option>
              <option value="electronics">Electronics & Comm</option>
              <option value="mechanical">Mechanical</option>
              <option value="civil">Civil</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-amber-600"
            >
              <option value="all">All Statuses</option>
              {activeTab === 'students' ? (
                <>
                  <option value="enrolled">Face ID Enrolled</option>
                  <option value="pending">Biometric Pending</option>
                </>
              ) : (
                <>
                  <option value="active">Active Staff</option>
                  <option value="inactive">On Leave / Inactive</option>
                </>
              )}
            </select>
          </div>

          {/* Sorter */}
          <div className="flex items-center gap-2 text-slate-500">
            <span>Sort by:</span>
            <button
              onClick={() => {
                setSortAsc(!sortAsc);
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 font-semibold hover:bg-slate-100 transition flex items-center gap-1 cursor-pointer"
            >
              <span>{sortField === 'name' ? 'Name' : sortField === 'rate' ? 'Attendance' : 'ID'}</span>
              <ArrowUpDown size={12} />
            </button>
          </div>
        </div>

        {/* DATA TABLE */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Identifier</th>
                <th className="py-3 px-4">Department & Term</th>
                {activeTab === 'students' ? (
                  <>
                    <th className="py-3 px-4">Attendance</th>
                    <th className="py-3 px-4">Face ID Status</th>
                  </>
                ) : (
                  <>
                    <th className="py-3 px-4">Assigned Courses</th>
                    <th className="py-3 px-4">Status</th>
                  </>
                )}
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {activeTab === 'students' ? (
                paginatedStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400">
                      No students match your filter criteria.
                    </td>
                  </tr>
                ) : (
                  paginatedStudents.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center shrink-0 border border-amber-200">
                            {s.name.slice(0, 2).toUpperCase()}
                          </div>
                          <span className="font-bold text-slate-900">{s.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-slate-700">
                        {s.rollNumber}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">{s.department}</div>
                        <div className="text-[10px] text-slate-400">Year {s.year} &bull; Sec {s.section}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 font-bold font-mono text-slate-900">
                          <span>{s.attendanceRate}%</span>
                          <div className="w-12 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${s.attendanceRate >= 85 ? 'bg-emerald-500' : s.attendanceRate >= 75 ? 'bg-amber-500' : 'bg-rose-500'}`}
                              style={{ width: `${s.attendanceRate}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {s.faceIdStatus === 'enrolled' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <ScanFace size={12} />
                            <span>Enrolled</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <AlertCircle size={12} />
                            <span>Pending</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEdit(s, 'student')}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition cursor-pointer"
                            title="Edit student record"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => {
                              setUserToDelete({ id: s.id, name: s.name, type: 'student' });
                              setIsDeleteConfirmOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            title="Remove student"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )
              ) : (
                paginatedFaculty.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400">
                      No faculty members match your filter criteria.
                    </td>
                  </tr>
                ) : (
                  paginatedFaculty.map((f) => (
                    <tr key={f.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center shrink-0 border border-slate-300">
                            {(f.name || 'F').replace(/^(Dr\.|Prof\.)\s+/i, '').slice(0, 2).toUpperCase()}
                          </div>
                          <span className="font-bold text-slate-900">{f.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-slate-700">
                        {f.employeeId}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">{f.department}</div>
                        <div className="text-[10px] text-slate-400">
                          {students.filter(std => std.mentorId === f.id || (std.mentorName && f.name && std.mentorName.toLowerCase().includes(f.name.toLowerCase()))).length} Mentees
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800 truncate max-w-[160px]">
                          {(f.subjects || []).join(', ') || 'General'}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          f.active 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${f.active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          <span>{f.active ? 'Active' : 'On Leave'}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEdit(f, 'faculty')}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition cursor-pointer"
                            title="Edit faculty details"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => toggleFacultyStatus(f.id)}
                            className={`p-1.5 rounded-lg transition cursor-pointer ${
                              f.active ? 'text-emerald-600 hover:bg-emerald-50' : 'text-slate-400 hover:bg-slate-100'
                            }`}
                            title={f.active ? 'Active (click to mark on leave)' : 'On Leave (click to activate)'}
                          >
                            <ShieldCheck size={14} />
                          </button>
                          <button
                            onClick={() => {
                              setUserToDelete({ id: f.id, name: f.name, type: 'faculty' });
                              setIsDeleteConfirmOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            title="Remove faculty member (Resigned / Left)"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
          <span>
            Page <strong className="text-slate-900">{currentPage}</strong> of <strong className="text-slate-900">{totalPages}</strong>
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* MODAL 1: ADD USER */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-900 tracking-tight">
                {activeTab === 'students' ? 'Add New Student' : 'Add New Faculty Member'}
              </h3>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Full Legal Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maya Krishnan"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-600"
                />
              </div>

              {activeTab === 'students' ? (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Roll Number / Student ID</label>
                  <input
                    type="text"
                    placeholder="e.g. 2026CS110"
                    value={formData.rollNumber}
                    onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-600 font-mono"
                  />
                </div>
              ) : (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Employee ID</label>
                  <input
                    type="text"
                    placeholder="e.g. EMP-2095"
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-600 font-mono"
                  />
                </div>
              )}

              <div>
                <label className="font-bold text-slate-700 block mb-1">Academic Department</label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-600"
                >
                  <option value="Computer Science">Computer Science & Engineering</option>
                  <option value="Information Tech">Information Technology</option>
                  <option value="Electronics & Comm">Electronics & Communication</option>
                  <option value="Mechanical Eng">Mechanical Engineering</option>
                  <option value="Civil Engineering">Civil Engineering</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Institutional Email</label>
                <input
                  type="email"
                  placeholder="name@smartattendance.edu"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-600"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 bg-slate-100 hover:bg-slate-200 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-white bg-amber-600 hover:bg-amber-700 font-bold shadow-xs cursor-pointer"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT USER RECORD */}
      {isEditModalOpen && userToEdit && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Edit3 size={18} className="text-amber-700" />
                <h3 className="font-bold text-slate-900 text-sm">
                  {userToEdit.type === 'student' ? 'Edit Student Details' : 'Edit Faculty Details'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setUserToEdit(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-600"
                />
              </div>

              {userToEdit.type === 'student' ? (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Roll Number</label>
                      <input
                        type="text"
                        value={editFormData.rollNumber}
                        onChange={(e) => setEditFormData({ ...editFormData, rollNumber: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-600 font-mono"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Section</label>
                      <input
                        type="text"
                        value={editFormData.section}
                        onChange={(e) => setEditFormData({ ...editFormData, section: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-600 uppercase font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Assigned Faculty Mentor</label>
                    <input
                      type="text"
                      placeholder="e.g. Dr. Santhiya M"
                      value={editFormData.mentorName}
                      onChange={(e) => setEditFormData({ ...editFormData, mentorName: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-600"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Employee ID</label>
                      <input
                        type="text"
                        value={editFormData.employeeId}
                        onChange={(e) => setEditFormData({ ...editFormData, employeeId: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-600 font-mono"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Designation</label>
                      <input
                        type="text"
                        value={editFormData.designation}
                        onChange={(e) => setEditFormData({ ...editFormData, designation: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-600"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="font-bold text-slate-700 block mb-1">Department</label>
                <input
                  type="text"
                  value={editFormData.department}
                  onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Official Email</label>
                  <input
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-600"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Mobile / Phone</label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-600"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setUserToEdit(null);
                  }}
                  className="px-4 py-2 rounded-xl text-slate-600 bg-slate-100 hover:bg-slate-200 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-white bg-amber-600 hover:bg-amber-700 font-bold shadow-xs cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: BULK EXCEL SPREADSHEET IMPORT & SYNC WIZARD */}
      <AdminBulkImportModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        onSuccess={() => {
          syncWithBackend();
        }}
      />

      {/* CONFIRMATION DIALOG: DELETE RECORD */}
      {isDeleteConfirmOpen && userToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 size={24} />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-black text-slate-900 tracking-tight">
                {userToDelete.type === 'student' ? 'Remove Student Record?' : 'Remove Faculty Member?'}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {userToDelete.type === 'student' ? (
                  <>
                    Are you sure you want to remove student <strong className="text-slate-800">{userToDelete.name}</strong> from institutional records?
                  </>
                ) : (
                  <>
                    Are you sure you want to remove <strong className="text-slate-800">{userToDelete.name}</strong> from the faculty directory? This removes their account and clears assignments in the event of resignation or job departure.
                  </>
                )}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => {
                  setIsDeleteConfirmOpen(false);
                  setUserToDelete(null);
                }}
                className="py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteDelete}
                className="py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-xs cursor-pointer"
              >
                {userToDelete.type === 'student' ? 'Remove Student' : 'Remove Faculty'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LIVE GOOGLE SHEET URL SYNC MODAL */}
      <AdminSheetSyncModal
        isOpen={isSheetSyncOpen}
        onClose={() => setIsSheetSyncOpen(false)}
        onSuccess={() => {
          syncWithBackend();
          adminApi.getSheetConfigs().then((res: any) => {
            const stu = res?.student;
            const fac = res?.faculty;
            const hasAuto = (stu?.sync_interval_minutes > 0 && stu?.url) || (fac?.sync_interval_minutes > 0 && fac?.url);
            const hasUrl = Boolean(stu?.url || fac?.url);
            setSheetSyncStatus({
              active: hasAuto,
              label: hasAuto ? 'Auto-Sync Active' : hasUrl ? 'Sheet Connected' : '',
            });
          }).catch(() => {});
        }}
      />
    </div>
  );
};

export default AdminUserManagement;
