import React, { useState } from 'react';
import { Plus, Search, BookOpen, Users, X, Award, Check } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { Subject } from '../../types';

const getInitials = (name: string) => {
  const clean = name.replace(/^(Dr\.|Prof\.|Mr\.|Ms\.|Mrs\.)\s+/i, '').trim();
  const parts = clean.split(' ').filter(Boolean);
  if (parts.length === 0) return 'FC';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const AdminSubjectMapping: React.FC = () => {
  const { subjects, faculty, classSections, addSubject } = useAppStore();

  const [search, setSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'classes' | 'faculty'>('overview');

  // Add Subject Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newSubName, setNewSubName] = useState('');
  const [newSubCode, setNewSubCode] = useState('');
  const [newSubCredits, setNewSubCredits] = useState(4);
  const [newSubDept, setNewSubDept] = useState('Computer Science');

  const filteredSubjects = subjects.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.code.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateSubject = (e: React.FormEvent) => {
    e.preventDefault();
    addSubject({
      name: newSubName,
      code: newSubCode,
      credits: newSubCredits,
      department: newSubDept,
      assignedFacultyIds: ['fac-1'],
      assignedClassIds: ['cls-1'],
    });
    setIsAddModalOpen(false);
    setNewSubName('');
    setNewSubCode('');
  };

  return (
    <div className="space-y-6 text-slate-900">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Subject Mapping</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Credit courses, syllabus catalogs, and assigned teaching faculty.
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-5 py-2.5 rounded-full font-bold text-xs text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:brightness-110 shadow-md shadow-indigo-600/25 transition-all flex items-center gap-2 active:scale-95 self-start md:self-auto cursor-pointer"
        >
          <Plus size={16} />
          <span>Add Subject</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search subjects by name or course code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600"
          />
        </div>
        <span className="text-xs text-slate-500 hidden sm:block font-medium">
          {filteredSubjects.length} active courses
        </span>
      </div>

      {/* Card Grid Layout in White */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredSubjects.map((sub) => {
          const assignedFac = faculty.filter((f) => sub.assignedFacultyIds.includes(f.id));
          return (
            <div
              key={sub.id}
              onClick={() => {
                setSelectedSubject(sub);
                setActiveTab('overview');
              }}
              className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                    {sub.code}
                  </span>
                  <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                    <Award size={13} className="text-amber-500" />
                    {sub.credits} Credits
                  </span>
                </div>

                <h3 className="font-bold text-base text-slate-900 group-hover:text-indigo-600 transition">
                  {sub.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1">{sub.department}</p>
              </div>

              {/* Faculty Avatars */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center -space-x-2">
                  {assignedFac.map((fac) => (
                    <div
                      key={fac.id}
                      title={fac.name}
                      className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-50 to-slate-100 border-2 border-white text-indigo-700 flex items-center justify-center text-[10px] font-bold shadow-xs"
                    >
                      {getInitials(fac.name)}
                    </div>
                  ))}
                  {assignedFac.length === 0 && (
                    <span className="text-[11px] text-slate-400 italic">No faculty assigned</span>
                  )}
                </div>
                <span className="text-[10px] text-slate-500 font-bold group-hover:text-indigo-600 transition">
                  View Details →
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail Modal with Tabs in White */}
      {selectedSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/25 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-white p-6 border border-slate-200 shadow-2xl rounded-3xl text-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold border border-indigo-100">
                  {selectedSubject.code}
                </span>
                <h3 className="font-bold text-slate-900 text-base">{selectedSubject.name}</h3>
              </div>
              <button
                onClick={() => setSelectedSubject(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex items-center border-b border-slate-100 my-4 text-xs font-bold">
              <button
                onClick={() => setActiveTab('overview')}
                className={`pb-2 px-3 transition border-b-2 cursor-pointer ${
                  activeTab === 'overview'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('classes')}
                className={`pb-2 px-3 transition border-b-2 cursor-pointer ${
                  activeTab === 'classes'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                Assigned Classes
              </button>
              <button
                onClick={() => setActiveTab('faculty')}
                className={`pb-2 px-3 transition border-b-2 cursor-pointer ${
                  activeTab === 'faculty'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                Assigned Faculty
              </button>
            </div>

            {/* Tab Contents */}
            <div className="py-2 text-xs space-y-4">
              {activeTab === 'overview' && (
                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Department:</span>
                      <span className="text-slate-900 font-bold">{selectedSubject.department}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Credit Weightage:</span>
                      <span className="text-slate-900 font-bold">{selectedSubject.credits} Academic Credits</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Attendance Quorum:</span>
                      <span className="text-emerald-700 font-bold">75% Mandatory</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'classes' && (
                <div className="space-y-2">
                  <span className="text-slate-500 font-medium block mb-1">Sections taking this course:</span>
                  <div className="space-y-1.5">
                    {classSections.map((cls) => (
                      <div
                        key={cls.id}
                        className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between"
                      >
                        <span className="text-slate-900 font-bold">{cls.name}</span>
                        <span className="text-slate-500">{cls.studentCount} Students</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'faculty' && (
                <div className="space-y-2">
                  <span className="text-slate-500 font-medium block mb-1">Teaching staff authorized for BLE sessions:</span>
                  <div className="space-y-2">
                    {faculty.map((fac) => (
                      <div
                        key={fac.id}
                        className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-50 to-slate-100 border border-indigo-200/60 text-indigo-700 flex items-center justify-center text-[10px] font-bold shrink-0 shadow-2xs">
                            {getInitials(fac.name)}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">{fac.name}</span>
                            <span className="text-[10px] text-slate-500 font-mono">{fac.employeeId}</span>
                          </div>
                        </div>
                        <span className="px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                          Authorized
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedSubject(null)}
                className="px-5 py-2 rounded-full text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Subject Modal in White */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/25 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white p-6 border border-slate-200 shadow-2xl rounded-3xl text-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-900 text-base">Add New Subject</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSubject} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Subject Name</label>
                <input
                  type="text"
                  value={newSubName}
                  onChange={(e) => setNewSubName(e.target.value)}
                  placeholder="e.g. Distributed Computing"
                  className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Course Code</label>
                  <input
                    type="text"
                    value={newSubCode}
                    onChange={(e) => setNewSubCode(e.target.value)}
                    placeholder="CS305"
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Credits</label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    value={newSubCredits}
                    onChange={(e) => setNewSubCredits(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Department</label>
                <select
                  value={newSubDept}
                  onChange={(e) => setNewSubDept(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none"
                >
                  <option value="Computer Science">Computer Science</option>
                  <option value="AI & Data Science">AI & Data Science</option>
                  <option value="Information Tech">Information Tech</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:brightness-110 shadow-md"
                >
                  Create Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
