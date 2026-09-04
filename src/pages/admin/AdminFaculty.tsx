import React, { useState } from 'react';
import { Plus, Search, Trash2, Edit3, X, Mail, Phone, BookOpen, Check } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { Faculty } from '../../types';

export const AdminFaculty: React.FC = () => {
  const { faculty, addFaculty, updateFaculty, toggleFacultyStatus, subjects } = useAppStore();

  const [search, setSearch] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState<Faculty | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [department, setDepartment] = useState('Computer Science');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [photoUrl, setPhotoUrl] = useState('');

  const openAddDrawer = () => {
    setEditingFaculty(null);
    setName('');
    setEmployeeId(`EMP-${Math.floor(700 + Math.random() * 100)}`);
    setDepartment('Computer Science');
    setEmail('');
    setPhone('+91 98220 00000');
    setSelectedSubjects(['CS301 Machine Learning']);
    setPhotoUrl('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80');
    setIsDrawerOpen(true);
  };

  const openEditDrawer = (fac: Faculty) => {
    setEditingFaculty(fac);
    setName(fac.name);
    setEmployeeId(fac.employeeId);
    setDepartment(fac.department);
    setEmail(fac.email);
    setPhone(fac.phone);
    setSelectedSubjects(fac.subjects);
    setPhotoUrl(fac.photoUrl || '');
    setIsDrawerOpen(true);
  };

  const toggleSubjectSelect = (subName: string) => {
    if (selectedSubjects.includes(subName)) {
      setSelectedSubjects(selectedSubjects.filter((s) => s !== subName));
    } else {
      setSelectedSubjects([...selectedSubjects, subName]);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingFaculty) {
      updateFaculty(editingFaculty.id, {
        name,
        employeeId,
        department,
        email,
        phone,
        subjects: selectedSubjects,
        photoUrl,
      });
    } else {
      addFaculty({
        name,
        employeeId,
        department,
        email: email || `${name.toLowerCase().replace(/\s+/g, '.')}@attend.edu`,
        phone,
        subjects: selectedSubjects,
        active: true,
        photoUrl,
      });
    }
    setIsDrawerOpen(false);
  };

  const filteredFaculty = faculty.filter(
    (fac) =>
      fac.name.toLowerCase().includes(search.toLowerCase()) ||
      fac.employeeId.toLowerCase().includes(search.toLowerCase()) ||
      fac.department.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 text-slate-900">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Faculty Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Teaching staff directory, assigned subjects, and Bluetooth broadcast authorization.
          </p>
        </div>
        <button
          onClick={openAddDrawer}
          className="px-5 py-2.5 rounded-full font-bold text-xs text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:brightness-110 shadow-md shadow-indigo-600/25 transition-all flex items-center gap-2 active:scale-95 self-start md:self-auto cursor-pointer"
        >
          <Plus size={16} />
          <span>Add Faculty</span>
        </button>
      </div>

      {/* Search Bar in White */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by faculty name, ID, or department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600"
          />
        </div>
        <span className="text-xs text-slate-500 hidden sm:block font-medium">
          {filteredFaculty.length} registered faculty members
        </span>
      </div>

      {/* Faculty Data Table in White */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Faculty Member</th>
                <th className="py-3.5 px-4">Employee ID</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-4">Subjects Assigned</th>
                <th className="py-3.5 px-4">Contact</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredFaculty.map((fac) => (
                <tr key={fac.id} className="hover:bg-slate-50 transition">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={fac.photoUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'}
                        alt={fac.name}
                        className="w-9 h-9 rounded-full object-cover border border-slate-200 shadow-xs"
                      />
                      <div>
                        <span className="font-bold text-slate-900 block">{fac.name}</span>
                        <span className="text-[10px] text-indigo-600 font-semibold">Verified Instructor</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">
                    {fac.employeeId}
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 font-medium">
                    {fac.department}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {fac.subjects.map((sub, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100"
                        >
                          {sub}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 space-y-0.5">
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <Mail size={12} className="text-slate-400" />
                      <span>{fac.email}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] font-mono">
                      <Phone size={12} className="text-slate-400" />
                      <span>{fac.phone}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <button
                      onClick={() => toggleFacultyStatus(fac.id)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        fac.active ? 'bg-emerald-500' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          fac.active ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <span className="ml-2 text-[10px] font-bold text-slate-500">
                      {fac.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => openEditDrawer(fac)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition"
                      >
                        <Edit3 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide Drawer for Add/Edit Faculty in White */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-md h-full bg-white border-l border-slate-200 shadow-2xl flex flex-col p-6 overflow-hidden text-slate-900 animate-in slide-in-from-right">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  {editingFaculty ? 'Edit Faculty' : 'Add New Faculty'}
                </h3>
                <p className="text-xs text-slate-500">Staff profile & subject assignments</p>
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
                <label className="text-xs font-semibold text-slate-700 block mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dr. Rajesh Kumar"
                  className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Employee ID</label>
                  <input
                    type="text"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600 font-mono"
                    required
                  />
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

              {/* Assign Subjects Multi-Select */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5 flex items-center justify-between">
                  <span>Assign Subjects</span>
                  <span className="text-[10px] text-indigo-600 font-bold">Click to toggle</span>
                </label>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex flex-wrap gap-1.5">
                    {subjects.map((sub) => {
                      const label = `${sub.code} ${sub.name}`;
                      const isSelected = selectedSubjects.includes(label);
                      return (
                        <button
                          type="button"
                          key={sub.id}
                          onClick={() => toggleSubjectSelect(label)}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {isSelected && <Check size={12} />}
                          <span>{label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
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
                  {editingFaculty ? 'Save Changes' : 'Create Faculty'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
