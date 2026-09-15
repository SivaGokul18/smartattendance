import React, { useState, useMemo, useEffect } from 'react';
import { 
  BookOpen, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Users, 
  GraduationCap, 
  Layers, 
  Award, 
  AlertTriangle,
  X,
  CheckCircle2,
  Filter,
  ArrowUpDown,
  Calendar,
  FileSpreadsheet,
  Clock,
  MapPin,
  Sparkles,
  UserCheck,
  RefreshCw
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { Subject } from '../../types';
import { adminApi } from '../../api/client';
import { AdminTimetableSyncModal } from '../../components/admin/AdminTimetableSyncModal';

export const AdminCourseSetup: React.FC = () => {
  const { 
    subjects, 
    faculty, 
    classSections, 
    timetable, 
    addSubject, 
    updateSubject, 
    deleteSubject, 
    syncWithBackend 
  } = useAppStore();

  // Active View Switcher: Courses Catalog, Student Timetable, or Faculty Timetable
  const [activeView, setActiveView] = useState<'courses' | 'student_timetable' | 'faculty_timetable'>('courses');

  // Timetable View States
  const [selectedSectionId, setSelectedSectionId] = useState<string>('all');
  const [studentDayFilter, setStudentDayFilter] = useState<string>('All');
  const [selectedFacultyId, setSelectedFacultyId] = useState<string>('all');
  const [facultyDayFilter, setFacultyDayFilter] = useState<string>('All');
  const [timetableSearch, setTimetableSearch] = useState<string>('');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'code' | 'name' | 'credits'>('code');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isTimetableModalOpen, setIsTimetableModalOpen] = useState(false);
  const [timetableSyncStatus, setTimetableSyncStatus] = useState<string>('idle');
  const [timetableLastSync, setTimetableLastSync] = useState<string | null>(null);
  const [editingCourse, setEditingCourse] = useState<Subject | null>(null);
  const [courseToDelete, setCourseToDelete] = useState<Subject | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadTimetableStatus = async () => {
    try {
      const cfg = await adminApi.getTimetableConfig();
      if (cfg) {
        setTimetableSyncStatus(cfg.last_sync_status || 'idle');
        setTimetableLastSync(cfg.last_synced_at || null);
      }
    } catch {
      // Ignore if offline
    }
  };

  useEffect(() => {
    syncWithBackend();
    loadTimetableStatus();
  }, []);

  // When switching views, ensure backend data is synchronized
  useEffect(() => {
    if (activeView === 'student_timetable' || activeView === 'faculty_timetable') {
      syncWithBackend();
    }
  }, [activeView]);


  // Form state
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    department: 'Computer Science',
    credits: 3,
    assignedFacultyIds: [] as string[],
    assignedClassIds: [] as string[],
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const departments = useMemo(() => {
    const depts = new Set(subjects.map(s => s.department));
    return ['All', ...Array.from(depts)];
  }, [subjects]);

  const filteredCourses = useMemo(() => {
    return subjects
      .filter((s) => {
        const matchesSearch = 
          s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.department.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesDept = selectedDept === 'All' || s.department === selectedDept;
        return matchesSearch && matchesDept;
      })
      .sort((a, b) => {
        let valA: any = a[sortBy];
        let valB: any = b[sortBy];
        if (typeof valA === 'string') {
          return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      });
  }, [subjects, searchQuery, selectedDept, sortBy, sortOrder]);

  const openAddModal = () => {
    setFormData({
      code: '',
      name: '',
      department: 'Computer Science',
      credits: 3,
      assignedFacultyIds: [],
      assignedClassIds: [],
    });
    setEditingCourse(null);
    setIsAddModalOpen(true);
  };

  const openEditModal = (course: Subject) => {
    setEditingCourse(course);
    setFormData({
      code: course.code,
      name: course.name,
      department: course.department,
      credits: course.credits,
      assignedFacultyIds: course.assignedFacultyIds || [],
      assignedClassIds: course.assignedClassIds || [],
    });
    setIsAddModalOpen(true);
  };

  const handleSaveCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim() || !formData.name.trim()) return;

    if (editingCourse) {
      updateSubject(editingCourse.id, {
        code: formData.code.toUpperCase().trim(),
        name: formData.name.trim(),
        department: formData.department,
        credits: Number(formData.credits),
        assignedFacultyIds: formData.assignedFacultyIds,
        assignedClassIds: formData.assignedClassIds,
      });
      showToast(`Course "${formData.code}" updated successfully`);
    } else {
      addSubject({
        code: formData.code.toUpperCase().trim(),
        name: formData.name.trim(),
        department: formData.department,
        credits: Number(formData.credits),
        assignedFacultyIds: formData.assignedFacultyIds,
        assignedClassIds: formData.assignedClassIds,
      });
      showToast(`New course "${formData.code}" registered`);
    }
    setIsAddModalOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (courseToDelete) {
      deleteSubject(courseToDelete.id);
      showToast(`Course "${courseToDelete.code}" deleted`);
      setCourseToDelete(null);
    }
  };

  const toggleFacultySelection = (facId: string) => {
    setFormData(prev => ({
      ...prev,
      assignedFacultyIds: prev.assignedFacultyIds.includes(facId)
        ? prev.assignedFacultyIds.filter(id => id !== facId)
        : [...prev.assignedFacultyIds, facId]
    }));
  };

  const totalCredits = subjects.reduce((sum, s) => sum + s.credits, 0);

  // Helpers for cleaning faculty names and flexible timetable matching
  const formatFacultyTitleAndName = (rawName?: string) => {
    if (!rawName) return '';
    let s = rawName.replace(/^[.\s,]+/, '').replace(/[.\s,]+$/, '').trim();
    // Normalize titles: e.g. "Dr.SHOBANA" -> "Dr. SHOBANA", "Mrs. .PRIYA" -> "Mrs. PRIYA"
    s = s.replace(/^(dr|prof|mr|mrs|ms)\.?\s*\.?\s*/i, (_m, title) => {
      const capTitle = title.charAt(0).toUpperCase() + title.slice(1).toLowerCase() + '.';
      return capTitle + ' ';
    });
    // Remove any remaining stray dots at start of name part
    s = s.replace(/\s+\.\s*/g, ' ');
    // Title case words that are all uppercase
    const parts = s.split(/\s+/).map((p) => {
      if (/^(Dr\.|Prof\.|Mr\.|Mrs\.|Ms\.)$/i.test(p)) return p;
      if (p.length > 1 && p === p.toUpperCase()) {
        return p.charAt(0).toUpperCase() + p.slice(1).toLowerCase();
      }
      return p;
    });
    return parts.join(' ').trim();
  };

  const cleanFacultyName = (name?: string) => {
    if (!name) return '';
    return name
      .replace(/^(Dr\.|Prof\.|Mr\.|Mrs\.|Ms\.)\s*/i, '')
      .replace(/^[.\s,]+/, '')
      .replace(/[.\s,]+$/, '')
      .trim();
  };

  const cleanFacultyDisplay = (assignedFacultyList: any[]) => {
    if (!assignedFacultyList || assignedFacultyList.length === 0) {
      return 'Not assigned';
    }
    const formatted = assignedFacultyList
      .map((f: any) => formatFacultyTitleAndName(f.name))
      .filter(Boolean);
    const seen = new Set<string>();
    const unique: string[] = [];
    for (const name of formatted) {
      const key = name.toLowerCase().replace(/^(dr\.|prof\.|mr\.|mrs\.|ms\.)\s*/i, '').trim();
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(name);
      }
    }
    return unique.length > 0 ? unique.join(', ') : 'Not assigned';
  };

  const isSlotMatchingSection = (slot: any, section: any) => {
    if (!section) return true;
    const sId = (slot.classSectionId || '').toLowerCase().trim();
    const sName = (slot.classSectionName || '').toLowerCase().trim();
    const tId = (section.id || '').toLowerCase().trim();
    const tName = (section.name || '').toLowerCase().trim();
    const tSec = (section.section || '').toLowerCase().trim();

    if (sId && (sId === tId || sId === tName)) return true;
    if (sName && (sName === tName || sName === tId)) return true;
    if (tSec && (sName.includes(`sec ${tSec}`) || sName.includes(`section ${tSec}`) || sName.endsWith(` ${tSec}`))) return true;
    return false;
  };

  const isSlotMatchingFaculty = (slot: any, fac: any) => {
    if (!fac) return true;
    const sId = (slot.facultyId || '').toLowerCase().trim();
    const sName = cleanFacultyName(slot.facultyName).toLowerCase();
    const tId = (fac.id || '').toLowerCase().trim();
    const tEmp = (fac.employeeId || '').toLowerCase().trim();
    const tName = cleanFacultyName(fac.name).toLowerCase();

    if (sId && (sId === tId || (tEmp && sId === tEmp))) return true;
    if (sName && tName && (sName === tName || sName.includes(tName) || tName.includes(sName))) return true;
    return false;
  };

  // Student Timetable Computed Data
  const currentSection = useMemo(() => {
    if (selectedSectionId === 'all') return null;
    return classSections.find(c => c.id === selectedSectionId) || null;
  }, [classSections, selectedSectionId]);

  const studentSlots = useMemo(() => {
    if (selectedSectionId === 'all') return timetable;
    const sec = classSections.find(c => c.id === selectedSectionId);
    if (!sec) return timetable;
    return timetable.filter(s => isSlotMatchingSection(s, sec));
  }, [timetable, selectedSectionId, classSections]);

  const filteredStudentSlots = useMemo(() => {
    return studentSlots.filter(s => {
      const matchDay = studentDayFilter === 'All' || s.day === studentDayFilter;
      const matchSearch = !timetableSearch || 
        (s.subjectName || '').toLowerCase().includes(timetableSearch.toLowerCase()) ||
        (s.subjectCode || '').toLowerCase().includes(timetableSearch.toLowerCase()) ||
        (s.facultyName || '').toLowerCase().includes(timetableSearch.toLowerCase()) ||
        (s.classSectionName || '').toLowerCase().includes(timetableSearch.toLowerCase()) ||
        (s.room || '').toLowerCase().includes(timetableSearch.toLowerCase());
      return matchDay && matchSearch;
    }).sort((a, b) => {
      const dayOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const dayDiff = dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
      if (dayDiff !== 0) return dayDiff;
      return (a.startTime || '').localeCompare(b.startTime || '');
    });
  }, [studentSlots, studentDayFilter, timetableSearch]);

  // Faculty Timetable Computed Data
  const currentFacultyMember = useMemo(() => {
    if (selectedFacultyId === 'all') return null;
    return faculty.find(f => f.id === selectedFacultyId) || null;
  }, [faculty, selectedFacultyId]);

  const facultySlots = useMemo(() => {
    if (selectedFacultyId === 'all') return timetable;
    const fac = faculty.find(f => f.id === selectedFacultyId);
    if (!fac) return timetable;
    return timetable.filter(s => isSlotMatchingFaculty(s, fac));
  }, [timetable, selectedFacultyId, faculty]);

  const filteredFacultySlots = useMemo(() => {
    return facultySlots.filter(s => {
      const matchDay = facultyDayFilter === 'All' || s.day === facultyDayFilter;
      const matchSearch = !timetableSearch || 
        (s.subjectName || '').toLowerCase().includes(timetableSearch.toLowerCase()) ||
        (s.subjectCode || '').toLowerCase().includes(timetableSearch.toLowerCase()) ||
        (s.facultyName || '').toLowerCase().includes(timetableSearch.toLowerCase()) ||
        (s.classSectionName || '').toLowerCase().includes(timetableSearch.toLowerCase()) ||
        (s.room || '').toLowerCase().includes(timetableSearch.toLowerCase());
      return matchDay && matchSearch;
    }).sort((a, b) => {
      const dayOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const dayDiff = dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
      if (dayDiff !== 0) return dayDiff;
      return (a.startTime || '').localeCompare(b.startTime || '');
    });
  }, [facultySlots, facultyDayFilter, timetableSearch]);

  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
  const DAY_FILTERS = ['All', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 bg-slate-900 text-amber-400 px-4 py-3 rounded-xl shadow-2xl border border-amber-500/30 text-xs font-semibold animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-amber-500" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold mb-2">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Curriculum & Schedules</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Courses & Timetables
            </h1>
            <p className="text-slate-500 text-xs mt-1">
              Manage degree courses, assigned faculty, student class schedules, and teaching hours.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
            <button
              onClick={() => setIsTimetableModalOpen(true)}
              className="flex items-center justify-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 font-bold px-3.5 py-2.5 rounded-xl border border-slate-200/90 shadow-xs transition active:scale-95 text-xs cursor-pointer"
              title={timetableLastSync ? `Last synced: ${new Date(timetableLastSync).toLocaleString()}` : 'Sync weekly schedule from Google Sheets'}
            >
              <Calendar className="w-4 h-4 text-amber-600" />
              <span>Sync Timetable Sheet</span>
              {timetableSyncStatus === 'success' && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Timetable Active & Synced" />
              )}
            </button>

            <button
              onClick={openAddModal}
              className="flex items-center justify-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-2.5 rounded-xl shadow-xs transition active:scale-95 text-xs cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Course</span>
            </button>
          </div>
        </div>

        {/* Navigation View Switcher Tabs */}
        <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100 rounded-2xl mt-5 border border-slate-200/80 w-fit">
          <button
            onClick={() => setActiveView('courses')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeView === 'courses'
                ? 'bg-white text-amber-800 shadow-sm ring-1 ring-slate-200/60'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <BookOpen className="w-4 h-4 text-amber-600" />
            <span>Courses & Subjects</span>
            <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[10px] font-mono font-bold">
              {subjects.length}
            </span>
          </button>

          <button
            onClick={() => setActiveView('student_timetable')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeView === 'student_timetable'
                ? 'bg-white text-teal-800 shadow-sm ring-1 ring-slate-200/60'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <GraduationCap className="w-4 h-4 text-teal-600" />
            <span>Student Timetable</span>
            <span className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 text-[10px] font-mono font-bold">
              {classSections.length} Sections
            </span>
          </button>

          <button
            onClick={() => setActiveView('faculty_timetable')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeView === 'faculty_timetable'
                ? 'bg-white text-indigo-800 shadow-sm ring-1 ring-slate-200/60'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Users className="w-4 h-4 text-indigo-600" />
            <span>Faculty Timetable</span>
            <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-mono font-bold">
              {faculty.length} Faculty
            </span>
          </button>
        </div>

        {/* Quick KPI stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-slate-100">
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
            <span className="text-[11px] font-medium text-slate-500 block">Total Courses</span>
            <div className="text-lg font-bold text-slate-900 font-mono mt-0.5">{subjects.length}</div>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
            <span className="text-[11px] font-medium text-slate-500 block">Total Credits</span>
            <div className="text-lg font-bold text-amber-700 font-mono mt-0.5">{totalCredits}</div>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
            <span className="text-[11px] font-medium text-slate-500 block">Faculty Members</span>
            <div className="text-lg font-bold text-emerald-700 font-mono mt-0.5">{faculty.length}</div>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
            <span className="text-[11px] font-medium text-slate-500 block">Active Sections</span>
            <div className="text-lg font-bold text-sky-700 font-mono mt-0.5">{classSections.length}</div>
          </div>
        </div>
      </div>

      {/* ========================================================
          VIEW 1: COURSES & SUBJECTS CATALOG
          ======================================================== */}
      {activeView === 'courses' && (
        <>
          {/* Control Bar: Search, Filters & Sorting */}
          <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by code, title, or department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-colors"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <Filter className="w-3.5 h-3.5" />
                <span>Dept:</span>
              </div>
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                {departments.map((dept) => (
                  <button
                    key={dept}
                    onClick={() => setSelectedDept(dept)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                      selectedDept === dept
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    }`}
                  >
                    {dept}
                  </button>
                ))}
              </div>

              <button
                onClick={() => {
                  if (sortBy === 'code') setSortBy('name');
                  else if (sortBy === 'name') setSortBy('credits');
                  else setSortBy('code');
                }}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                title="Toggle sort column"
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
                <span className="capitalize">{sortBy}</span>
              </button>
            </div>
          </div>

          {/* Course Grid Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCourses.map((course) => {
              const assignedFacultyList = faculty.filter(f => course.assignedFacultyIds?.includes(f.id));
              const mappedClasses = classSections.filter(cs => 
                cs.subjectFacultyMap.some(m => m.subjectId === course.id) || course.assignedClassIds?.includes(cs.id)
              );

              return (
                <div 
                  key={course.id}
                  className="group bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md hover:border-amber-300/80 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200/70 text-amber-800 font-mono text-xs font-bold tracking-wider">
                          {course.code}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                          <Award className="w-3 h-3 text-amber-500" />
                          {course.credits} Credits
                        </span>
                      </div>

                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEditModal(course)}
                          className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit course"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setCourseToDelete(course)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete course"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <h3 className="font-bold text-slate-900 text-base leading-snug group-hover:text-amber-700 transition-colors">
                      {course.name}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-1">
                      {course.department}
                    </p>

                    <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-slate-400" /> Assigned Faculty
                        </span>
                        <span className="font-semibold text-slate-800">
                          <span className="truncate max-w-[170px] inline-block text-right">
                            {cleanFacultyDisplay(assignedFacultyList)}
                          </span>
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 flex items-center gap-1">
                          <Layers className="w-3.5 h-3.5 text-slate-400" /> Active Sections
                        </span>
                        <span className="font-mono text-slate-700 font-bold">
                          {mappedClasses.length} Section{mappedClasses.length === 1 ? '' : 's'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-400">
                      {course.credits} Credits &bull; {course.department}
                    </span>
                    <button
                      onClick={() => openEditModal(course)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 transition active:scale-95 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Course</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredCourses.length === 0 && (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h4 className="text-base font-bold text-slate-800">No courses match your criteria</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Try adjusting your search query or department filter, or register a new course syllabus.
              </p>
              <button
                onClick={openAddModal}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Course
              </button>
            </div>
          )}
        </>
      )}

      {/* ========================================================
          VIEW 2: STUDENT TIMETABLE (BY SECTION)
          ======================================================== */}
      {activeView === 'student_timetable' && (
        <div className="space-y-5">
          {/* Controls: Section Selector, Day Filter, Search */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-teal-600 shrink-0" />
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Class Section:</span>
              </div>
              <select
                value={selectedSectionId}
                onChange={(e) => setSelectedSectionId(e.target.value)}
                className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition cursor-pointer"
              >
                <option value="all">All Class Sections ({timetable.length} Total Periods)</option>
                {classSections.map((sec) => {
                  const count = timetable.filter(s => isSlotMatchingSection(s, sec)).length;
                  return (
                    <option key={sec.id} value={sec.id}>
                      {sec.name} ({count} Periods)
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Day Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 lg:pb-0 bg-slate-100 p-1 rounded-xl">
              {DAY_FILTERS.map((day) => (
                <button
                  key={day}
                  onClick={() => setStudentDayFilter(day)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                    studentDayFilter === day
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search subject, faculty, room..."
                value={timetableSearch}
                onChange={(e) => setTimetableSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition"
              />
              {timetableSearch && (
                <button
                  onClick={() => setTimetableSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Section Information Banner */}
          <div className="bg-gradient-to-r from-teal-50 to-emerald-50 rounded-2xl p-4 sm:p-5 border border-teal-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-teal-600 text-white text-[10px] font-bold uppercase tracking-wider">
                  {currentSection ? currentSection.department : 'All Departments'}
                </span>
                <span className="text-xs font-semibold text-teal-800">
                  {currentSection ? `Year ${currentSection.year} • Section ${currentSection.section}` : `${classSections.length} Class Sections`}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-1">
                {currentSection ? currentSection.name : 'Weekly Student Timetable (All Sections)'}
              </h2>
            </div>

            <div className="flex items-center gap-3 text-xs font-semibold text-slate-600">
              <div className="bg-white/80 px-3 py-1.5 rounded-xl border border-teal-200/60 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-teal-600" />
                <span>{studentSlots.length} Scheduled Periods</span>
              </div>
              <button
                onClick={() => syncWithBackend()}
                className="bg-white/80 hover:bg-white px-3 py-1.5 rounded-xl border border-teal-200/60 flex items-center gap-1.5 text-teal-700 font-bold transition cursor-pointer"
                title="Refresh timetable slots from database"
              >
                <RefreshCw className="w-3.5 h-3.5 text-teal-600" />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Timetable Grid / Periods Display */}
          {filteredStudentSlots.length > 0 ? (
            <div className="space-y-4">
              {DAYS.filter(d => studentDayFilter === 'All' || studentDayFilter === d).map(day => {
                const daySlots = filteredStudentSlots.filter(s => s.day === day);
                if (daySlots.length === 0) return null;

                return (
                  <div key={day} className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
                        <h3 className="font-bold text-slate-900 text-sm">
                          {day === 'Mon' ? 'Monday' : day === 'Tue' ? 'Tuesday' : day === 'Wed' ? 'Wednesday' : day === 'Thu' ? 'Thursday' : day === 'Fri' ? 'Friday' : 'Saturday'}
                        </h3>
                      </div>
                      <span className="text-xs text-slate-500 font-medium font-mono">
                        {daySlots.length} Period{daySlots.length === 1 ? '' : 's'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {daySlots.map((slot, idx) => (
                        <div
                          key={slot.id || idx}
                          className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-teal-300/80 transition-all space-y-2 relative overflow-hidden"
                        >
                          <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-teal-500 rounded-l" />

                          <div className="flex items-center justify-between gap-2 pl-1">
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                              <Clock className="w-3 h-3 text-teal-600" />
                              {slot.startTime} - {slot.endTime}
                            </span>
                            <span className="font-mono text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200/60">
                              {slot.subjectCode || 'SUB'}
                            </span>
                          </div>

                          <div className="pl-1">
                            <h4 className="font-bold text-slate-900 text-sm leading-snug">
                              {slot.subjectName || 'Course'}
                            </h4>
                          </div>

                          <div className="pt-2 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-1.5 text-xs text-slate-500 pl-1">
                            <span className="flex items-center gap-1 font-medium text-slate-700 truncate max-w-[140px]">
                              <UserCheck className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                              <span className="truncate">{formatFacultyTitleAndName(slot.facultyName) || 'Faculty'}</span>
                            </span>
                            <span className="inline-flex items-center gap-1 font-mono font-bold text-slate-600 bg-white px-2 py-0.5 rounded-md border border-slate-200 text-[10px]">
                              <MapPin className="w-3 h-3 text-amber-500" />
                              {slot.room || 'Room'}
                            </span>
                            {slot.classSectionName && (
                              <span className="w-full inline-flex items-center gap-1 text-[11px] font-medium text-teal-700 bg-teal-50/70 px-2 py-0.5 rounded border border-teal-200/50 truncate">
                                <Layers className="w-3 h-3 text-teal-600 shrink-0" />
                                <span className="truncate">{slot.classSectionName}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h4 className="text-base font-bold text-slate-800">No timetable slots found for this section</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Sync the weekly timetable from your Google Sheet or switch to All Class Sections.
              </p>
              <div className="mt-4 flex items-center justify-center gap-2">
                <button
                  onClick={() => setSelectedSectionId('all')}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  View All Sections
                </button>
                <button
                  onClick={() => setIsTimetableModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  Sync Timetable Sheet
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          VIEW 3: FACULTY TIMETABLE (BY TEACHER)
          ======================================================== */}
      {activeView === 'faculty_timetable' && (
        <div className="space-y-5">
          {/* Controls: Faculty Selector, Day Filter, Search */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Teacher / Faculty:</span>
              </div>
              <select
                value={selectedFacultyId}
                onChange={(e) => setSelectedFacultyId(e.target.value)}
                className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition cursor-pointer"
              >
                <option value="all">All Faculty Members ({timetable.length} Total Teaching Classes)</option>
                {faculty.map((fac) => {
                  const count = timetable.filter(s => isSlotMatchingFaculty(s, fac)).length;
                  return (
                    <option key={fac.id} value={fac.id}>
                      {formatFacultyTitleAndName(fac.name)} &bull; {fac.department || 'Academic'} ({count} Classes)
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Day Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 lg:pb-0 bg-slate-100 p-1 rounded-xl">
              {DAY_FILTERS.map((day) => (
                <button
                  key={day}
                  onClick={() => setFacultyDayFilter(day)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                    facultyDayFilter === day
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search subject, section, room..."
                value={timetableSearch}
                onChange={(e) => setTimetableSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition"
              />
              {timetableSearch && (
                <button
                  onClick={() => setTimetableSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Faculty Information Banner */}
          <div className="bg-gradient-to-r from-indigo-50 to-violet-50 rounded-2xl p-4 sm:p-5 border border-indigo-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                {currentFacultyMember
                  ? cleanFacultyName(currentFacultyMember.name).slice(0, 2).toUpperCase()
                  : 'ALL'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider">
                    {currentFacultyMember ? (currentFacultyMember.department || 'Academic') : 'All Departments'}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    {currentFacultyMember ? `ID: ${currentFacultyMember.employeeId || 'FAC-100'}` : `${faculty.length} Faculty Members`}
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
                  {currentFacultyMember ? formatFacultyTitleAndName(currentFacultyMember.name) : 'Weekly Faculty Teaching Schedule (All Faculty)'}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs font-semibold text-slate-600">
              <div className="bg-white/80 px-3 py-1.5 rounded-xl border border-indigo-200/60 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                <span>{facultySlots.length} Teaching Classes</span>
              </div>
              <button
                onClick={() => syncWithBackend()}
                className="bg-white/80 hover:bg-white px-3 py-1.5 rounded-xl border border-indigo-200/60 flex items-center gap-1.5 text-indigo-700 font-bold transition cursor-pointer"
                title="Refresh timetable slots from database"
              >
                <RefreshCw className="w-3.5 h-3.5 text-indigo-600" />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Faculty Timetable Grid */}
          {filteredFacultySlots.length > 0 ? (
            <div className="space-y-4">
              {DAYS.filter(d => facultyDayFilter === 'All' || facultyDayFilter === d).map(day => {
                const daySlots = filteredFacultySlots.filter(s => s.day === day);
                if (daySlots.length === 0) return null;

                return (
                  <div key={day} className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                        <h3 className="font-bold text-slate-900 text-sm">
                          {day === 'Mon' ? 'Monday' : day === 'Tue' ? 'Tuesday' : day === 'Wed' ? 'Wednesday' : day === 'Thu' ? 'Thursday' : day === 'Fri' ? 'Friday' : 'Saturday'}
                        </h3>
                      </div>
                      <span className="text-xs text-slate-500 font-medium font-mono">
                        {daySlots.length} Class{daySlots.length === 1 ? '' : 'es'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {daySlots.map((slot, idx) => (
                        <div
                          key={slot.id || idx}
                          className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-indigo-300/80 transition-all space-y-2 relative overflow-hidden"
                        >
                          <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-indigo-600 rounded-l" />

                          <div className="flex items-center justify-between gap-2 pl-1">
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                              <Clock className="w-3 h-3 text-indigo-600" />
                              {slot.startTime} - {slot.endTime}
                            </span>
                            <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200/60">
                              {slot.subjectCode || 'SUB'}
                            </span>
                          </div>

                          <div className="pl-1">
                            <h4 className="font-bold text-slate-900 text-sm leading-snug">
                              {slot.subjectName || 'Course'}
                            </h4>
                          </div>

                          <div className="pt-2 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-1.5 text-xs text-slate-500 pl-1">
                            <span className="flex items-center gap-1 font-medium text-slate-700 truncate max-w-[140px]">
                              <UserCheck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                              <span className="truncate">{formatFacultyTitleAndName(slot.facultyName) || 'Faculty'}</span>
                            </span>
                            <span className="inline-flex items-center gap-1 font-mono font-bold text-slate-600 bg-white px-2 py-0.5 rounded-md border border-slate-200 text-[10px]">
                              <MapPin className="w-3 h-3 text-amber-500" />
                              {slot.room || 'Room'}
                            </span>
                            {slot.classSectionName && (
                              <span className="w-full inline-flex items-center gap-1 text-[11px] font-medium text-indigo-700 bg-indigo-50/70 px-2 py-0.5 rounded border border-indigo-200/50 truncate">
                                <GraduationCap className="w-3 h-3 text-indigo-600 shrink-0" />
                                <span className="truncate">{slot.classSectionName}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h4 className="text-base font-bold text-slate-800">No teaching classes found for this faculty member</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Sync the weekly timetable from your Google Sheet or select another faculty member.
              </p>
              <div className="mt-4 flex items-center justify-center gap-2">
                <button
                  onClick={() => setSelectedFacultyId('all')}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  View All Faculty
                </button>
                <button
                  onClick={() => setIsTimetableModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  Sync Timetable Sheet
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95">
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-400" />
                <h3 className="font-heading font-bold text-lg">
                  {editingCourse ? 'Edit Course Catalog' : 'Register New Course'}
                </h3>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCourse} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Course Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CS401"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Credits *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="8"
                    required
                    value={formData.credits}
                    onChange={(e) => setFormData({ ...formData, credits: parseInt(e.target.value) || 1 })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Course Title / Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Distributed Operating Systems"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Department *
                </label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-amber-500"
                >
                  <option value="Computer Science">Computer Science</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Mechanical">Mechanical</option>
                  <option value="Civil">Civil</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Assign Lead Faculty
                </label>
                <div className="max-h-36 overflow-y-auto space-y-1.5 border border-slate-200 rounded-xl p-2.5 bg-slate-50">
                  {faculty.map((fac) => {
                    const isSelected = formData.assignedFacultyIds.includes(fac.id);
                    return (
                      <div
                        key={fac.id}
                        onClick={() => toggleFacultySelection(fac.id)}
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer text-xs transition-colors ${
                          isSelected 
                            ? 'bg-amber-100 border border-amber-300 text-amber-900 font-bold' 
                            : 'hover:bg-slate-200/70 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input 
                            type="checkbox" 
                            checked={isSelected} 
                            readOnly 
                            className="rounded text-amber-600 focus:ring-amber-500 pointer-events-none" 
                          />
                          <span>{fac.name}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">{fac.department}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-600/20"
                >
                  {editingCourse ? 'Save Changes' : 'Create Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {courseToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 text-center animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-heading font-bold text-lg text-slate-900">
              Delete Course {courseToDelete.code}?
            </h3>
            <p className="text-xs text-slate-500 mt-2">
              Are you sure you want to remove <span className="font-semibold text-slate-800">"{courseToDelete.name}"</span>? Any active timetable slots or lecture logs referencing this course may be impacted.
            </p>

            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                onClick={() => setCourseToDelete(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-600/20"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Timetable Sheet URL Sync & Allocation Modal */}
      <AdminTimetableSyncModal
        isOpen={isTimetableModalOpen}
        onClose={() => setIsTimetableModalOpen(false)}
        onSuccess={() => {
          showToast('Timetable synchronized and assigned successfully across all portals');
          syncWithBackend();
          loadTimetableStatus();
        }}
      />
    </div>
  );
};

