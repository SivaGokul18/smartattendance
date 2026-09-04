import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Layers, ArrowRight, Check, Sparkles, BookOpen } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export const AdminClassMapping: React.FC = () => {
  const { classSections, subjects, faculty, updateClassMapping } = useAppStore();

  const [expandedClassId, setExpandedClassId] = useState<string>(classSections[0].id);

  // Right form state
  const [selectedClassId, setSelectedClassId] = useState(classSections[0].id);
  const [selectedSubjectId, setSelectedSubjectId] = useState(subjects[0].id);
  const [selectedFacultyId, setSelectedFacultyId] = useState(faculty[0].id);
  const [isSaved, setIsSaved] = useState(false);

  const handleSaveMapping = (e: React.FormEvent) => {
    e.preventDefault();
    updateClassMapping(selectedClassId, selectedSubjectId, selectedFacultyId);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const currentClass = classSections.find((c) => c.id === selectedClassId);
  const currentSubject = subjects.find((s) => s.id === selectedSubjectId);
  const currentFaculty = faculty.find((f) => f.id === selectedFacultyId);

  return (
    <div className="space-y-6 text-slate-900">
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Class & Curriculum Mapping</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Map academic sections to their credit subjects and assigned faculty instructors.
        </p>
      </div>

      {/* Visual Tree Flow Diagram in White */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm overflow-x-auto">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-3">
          Interactive Architecture Flow
        </span>
        <div className="flex items-center gap-3 min-w-[620px] justify-between">
          <div className="flex-1 p-3.5 rounded-2xl bg-indigo-50 border border-indigo-100 text-center">
            <span className="text-[10px] text-indigo-700 font-bold uppercase block">1. Class Level</span>
            <span className="text-xs font-bold text-slate-900 mt-1 block">{currentClass?.name || 'Class'}</span>
          </div>

          <ArrowRight size={16} className="text-slate-400 shrink-0" />

          <div className="flex-1 p-3.5 rounded-2xl bg-violet-50 border border-violet-100 text-center">
            <span className="text-[10px] text-violet-700 font-bold uppercase block">2. Section</span>
            <span className="text-xs font-bold text-slate-900 mt-1 block">Section {currentClass?.section}</span>
          </div>

          <ArrowRight size={16} className="text-slate-400 shrink-0" />

          <div className="flex-1 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-100 text-center">
            <span className="text-[10px] text-emerald-700 font-bold uppercase block">3. Course Subject</span>
            <span className="text-xs font-bold text-slate-900 mt-1 block truncate">
              {currentSubject?.code} - {currentSubject?.name}
            </span>
          </div>

          <ArrowRight size={16} className="text-slate-400 shrink-0" />

          <div className="flex-1 p-3.5 rounded-2xl bg-amber-50 border border-amber-100 text-center">
            <span className="text-[10px] text-amber-800 font-bold uppercase block">4. Faculty Beacon</span>
            <span className="text-xs font-bold text-slate-900 mt-1 block truncate">
              {currentFaculty?.name}
            </span>
          </div>
        </div>
      </div>

      {/* Two-Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Panel: Expandable Accordion Cards (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <h3 className="font-bold text-slate-900 text-sm">Configured Classes</h3>
          {classSections.map((cls) => {
            const isExpanded = expandedClassId === cls.id;
            return (
              <div
                key={cls.id}
                className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden transition-all"
              >
                <button
                  onClick={() => setExpandedClassId(isExpanded ? '' : cls.id)}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                      <Layers size={16} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{cls.name}</h4>
                      <span className="text-xs text-slate-500">
                        {cls.studentCount} students • {cls.subjectFacultyMap.length} subjects mapped
                      </span>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronDown size={18} className="text-slate-400" />
                  ) : (
                    <ChevronRight size={18} className="text-slate-400" />
                  )}
                </button>

                {isExpanded && (
                  <div className="p-4 pt-0 border-t border-slate-100 bg-slate-50/50">
                    <table className="w-full text-left text-xs mt-3">
                      <thead>
                        <tr className="text-slate-500 border-b border-slate-200 pb-2 text-[10px] font-bold uppercase">
                          <th className="pb-2">Subject</th>
                          <th className="pb-2">Assigned Faculty</th>
                          <th className="pb-2 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200/60">
                        {cls.subjectFacultyMap.map((mapItem, idx) => {
                          const sub = subjects.find((s) => s.id === mapItem.subjectId);
                          const fac = faculty.find((f) => f.id === mapItem.facultyId);
                          return (
                            <tr key={idx} className="hover:bg-white">
                              <td className="py-2.5 text-slate-900 font-medium">
                                <span className="font-mono text-indigo-600 font-bold mr-1.5">{sub?.code}</span>
                                {sub?.name}
                              </td>
                              <td className="py-2.5 text-slate-700 font-medium">
                                {fac?.name || 'Unassigned'}
                              </td>
                              <td className="py-2.5 text-right">
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  Mapped
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Right Panel: Mapping Form (5 cols) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm h-fit">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={18} className="text-indigo-600" />
            <h3 className="font-bold text-slate-900 text-base">Assign / Update Mapping</h3>
          </div>

          <form onSubmit={handleSaveMapping} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Target Class</label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600"
              >
                {classSections.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Subject</label>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code} - {s.name} ({s.credits} Credits)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Faculty Instructor
              </label>
              <select
                value={selectedFacultyId}
                onChange={(e) => setSelectedFacultyId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600"
              >
                {faculty.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.employeeId})
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-3 mt-2 rounded-full font-bold text-xs text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:brightness-110 shadow-md shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
            >
              {isSaved ? (
                <>
                  <Check size={14} />
                  <span>Mapping Saved!</span>
                </>
              ) : (
                <span>Save Mapping</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
