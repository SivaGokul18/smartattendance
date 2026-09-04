import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  X, 
  Upload, 
  CheckSquare, 
  Download, 
  Filter,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { Student } from '../../types';

export const AdminStudents: React.FC = () => {
  const { students, faculty, addStudent, updateStudent, deleteStudent } = useAppStore();

  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [department, setDepartment] = useState('Computer Science');
  const [year, setYear] = useState(3);
  const [section, setSection] = useState('A');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [faceIdStatus, setFaceIdStatus] = useState<'enrolled' | 'pending'>('enrolled');
  const [mentorId, setMentorId] = useState(faculty[0]?.id || 'fac-1');

  const openAddDrawer = () => {
    setEditingStudent(null);
    setName('');
    setRollNumber(`21CS${Math.floor(100 + Math.random() * 900)}`);
    setDepartment('Computer Science');
    setYear(3);
    setSection('A');
    setEmail('');
    setPhone('+91 98765 00000');
    setPhotoUrl('https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80');
    setFaceIdStatus('enrolled');
    setMentorId(faculty[0]?.id || 'fac-1');
    setIsDrawerOpen(true);
  };

  const openEditDrawer = (std: Student) => {
    setEditingStudent(std);
    setName(std.name);
    setRollNumber(std.rollNumber);
    setDepartment(std.department);
    setYear(std.year);
    setSection(std.section);
    setEmail(std.email);
    setPhone(std.phone);
    setPhotoUrl(std.photoUrl || '');
    setFaceIdStatus(std.faceIdStatus);
    setMentorId(std.mentorId || faculty[0]?.id || 'fac-1');
    setIsDrawerOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedFacultyMentor = faculty.find((f) => f.id === mentorId) || faculty[0];

    if (editingStudent) {
      updateStudent(editingStudent.id, {
        name,
        rollNumber,
        department,
        year,
        section,
        email,
        phone,
        photoUrl,
        faceIdStatus,
        mentorId: selectedFacultyMentor?.id,
        mentorName: selectedFacultyMentor?.name,
      });
    } else {
      addStudent({
        name,
        rollNumber,
        department,
        year,
        section,
        email: email || `${name.toLowerCase().replace(/\s+/g, '.')}@attend.edu`,
        phone,
        photoUrl,
        faceIdStatus,
        mentorId: selectedFacultyMentor?.id,
        mentorName: selectedFacultyMentor?.name,
      });
    }
    setIsDrawerOpen(false);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredStudents.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredStudents.map((s) => s.id));
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((i) => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBulkDelete = () => {
    selectedIds.forEach((id) => deleteStudent(id));
    setSelectedIds([]);
  };

  const filteredStudents = students.filter((std) => {
    const matchesSearch =
      std.name.toLowerCase().includes(search.toLowerCase()) ||
      std.rollNumber.toLowerCase().includes(search.toLowerCase()) ||
      std.email.toLowerCase().includes(search.toLowerCase());
    const matchesDept = selectedDept === 'All' || std.department === selectedDept;
    const matchesStatus = selectedStatus === 'All' || std.faceIdStatus === selectedStatus;
    return matchesSearch && matchesDept && matchesStatus;
  });

  return (
    <div className="space-y-6 relative text-slate-900">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Students Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Directory of enrolled students, biometric verification status, and batch mapping.
          </p>
        </div>
        <button
          onClick={openAddDrawer}
          className="px-5 py-2.5 rounded-full font-bold text-xs text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:brightness-110 shadow-md shadow-indigo-600/25 transition-all flex items-center gap-2 active:scale-95 self-start md:self-auto cursor-pointer"
        >
          <Plus size={16} />
          <span>Add Student</span>
        </button>
      </div>

      {/* Filter Chips & Search Bar in White */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-4">
        <div className="relative w-full md:w-80">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, roll number, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
          <Filter size={14} className="text-slate-500 shrink-0" />
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-xs text-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none font-medium"
          >
            <option value="All">All Departments</option>
            <option value="Computer Science">Computer Science</option>
            <option value="AI & Data Science">AI & Data Science</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-xs text-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none font-medium"
          >
            <option value="All">All Biometric Status</option>
            <option value="enrolled">Enrolled</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      {/* Data Table in Crisp White */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.length > 0 && selectedIds.length === filteredStudents.length}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded text-indigo-600 bg-white border-slate-300"
                  />
                </th>
                <th className="py-3.5 px-4">Student</th>
                <th className="py-3.5 px-4">Roll Number</th>
                <th className="py-3.5 px-4">Department & Class</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4">Face-ID Status</th>
                <th className="py-3.5 px-4">Attendance</th>
                <th className="py-3.5 px-4">Assigned Mentor</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.map((std) => {
                const isSelected = selectedIds.includes(std.id);
                return (
                  <tr
                    key={std.id}
                    className={`hover:bg-slate-50 transition ${isSelected ? 'bg-indigo-50/50' : ''}`}
                  >
                    <td className="py-3.5 px-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(std.id)}
                        className="w-4 h-4 rounded text-indigo-600 bg-white border-slate-300"
                      />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={std.photoUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                          alt={std.name}
                          className="w-9 h-9 rounded-full object-cover border border-slate-200 shadow-xs"
                        />
                        <div>
                          <span className="font-bold text-slate-900 block">{std.name}</span>
                          <span className="text-[11px] text-slate-500">{std.phone}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">
                      {std.rollNumber}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      <div className="font-medium">{std.department}</div>
                      <div className="text-[10px] text-slate-500">
                        Year {std.year} • Sec {std.section}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">
                      {std.email}
                    </td>
                    <td className="py-3.5 px-4">
                      {std.faceIdStatus === 'enrolled' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 size={11} /> Enrolled
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock size={11} /> Pending
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900">{std.attendanceRate}%</span>
                        <div className="w-12 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              std.attendanceRate >= 75 ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                            style={{ width: `${std.attendanceRate}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{std.mentorName || 'Dr. Rajesh Kumar'}</div>
                      <div className="text-[10px] text-indigo-600 font-medium">Designated Mentor</div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditDrawer(std)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition"
                          title="Edit Student"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          onClick={() => deleteStudent(std.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition"
                          title="Delete Student"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Table Footer / Pagination */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Showing {filteredStudents.length} enrolled students</span>
          <div className="flex items-center gap-1">
            <button className="px-3 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium">
              Previous
            </button>
            <span className="px-3 py-1 text-slate-900 font-bold">1</span>
            <button className="px-3 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium">
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Floating Bulk-Action Bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 px-6 py-3 rounded-2xl bg-white border border-indigo-200 shadow-2xl flex items-center gap-4 text-xs animate-in slide-in-from-bottom">
          <span className="font-bold text-slate-900 flex items-center gap-1.5">
            <CheckSquare size={14} className="text-indigo-600" />
            {selectedIds.length} Selected
          </span>
          <div className="h-4 w-px bg-slate-200"></div>
          <button
            onClick={() => alert(`Exporting ${selectedIds.length} students as CSV...`)}
            className="flex items-center gap-1 text-slate-700 hover:text-indigo-600 transition font-medium"
          >
            <Download size={13} /> Export CSV
          </button>
          <button
            onClick={() => alert(`Assign section modal opened for ${selectedIds.length} students`)}
            className="flex items-center gap-1 text-slate-700 hover:text-indigo-600 transition font-medium"
          >
            Assign Section
          </button>
          <button
            onClick={handleBulkDelete}
            className="flex items-center gap-1 text-rose-600 hover:text-rose-700 transition font-bold ml-2"
          >
            <Trash2 size={13} /> Delete
          </button>
          <button
            onClick={() => setSelectedIds([])}
            className="p-1 text-slate-400 hover:text-slate-700 rounded ml-2"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Slide-in Drawer for Add / Edit Student in White */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-md h-full bg-white border-l border-slate-200 shadow-2xl flex flex-col p-6 overflow-hidden text-slate-900 animate-in slide-in-from-right">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  {editingStudent ? 'Edit Student' : 'Add New Student'}
                </h3>
                <p className="text-xs text-slate-500">Enroll biometrics & student record</p>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-2">
                  Face Biometric Photo
                </label>
                <div className="flex items-center gap-4">
                  <img
                    src={photoUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                    alt="Preview"
                    className="w-16 h-16 rounded-full object-cover border-2 border-indigo-500 shadow-md"
                  />
                  <div className="flex-1">
                    <button
                      type="button"
                      onClick={() =>
                        setPhotoUrl(
                          `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 90000000)}?w=150&auto=format&fit=crop&q=80`
                        )
                      }
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition"
                    >
                      <Upload size={13} />
                      <span>Upload / Randomize</span>
                    </button>
                    <span className="text-[10px] text-slate-400 block mt-1">
                      Used for Face-ID neural vector embeddings.
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Roll No</label>
                  <input
                    type="text"
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Face Status</label>
                  <select
                    value={faceIdStatus}
                    onChange={(e) => setFaceIdStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none"
                  >
                    <option value="enrolled">Enrolled</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Department</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none"
                >
                  <option value="Computer Science">Computer Science</option>
                  <option value="AI & Data Science">AI & Data Science</option>
                  <option value="Information Tech">Information Tech</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Assigned Faculty Mentor (Auto-routed for Leave / OD)
                </label>
                <select
                  value={mentorId}
                  onChange={(e) => setMentorId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                >
                  {faculty.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.department}) — {f.employeeId}
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Designated mentor in DB. Student's leave applications are automatically routed here.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Year</label>
                  <select
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none"
                  >
                    <option value={1}>1st Year</option>
                    <option value={2}>2nd Year</option>
                    <option value={3}>3rd Year</option>
                    <option value={4}>4th Year</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Section</label>
                  <input
                    type="text"
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  placeholder="name@attend.edu"
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Phone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none font-mono"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:brightness-110 shadow-md"
                >
                  {editingStudent ? 'Save Changes' : 'Create Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
