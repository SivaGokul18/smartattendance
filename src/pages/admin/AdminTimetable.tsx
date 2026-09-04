import React, { useState } from 'react';
import { Plus, Copy, AlertTriangle, X, Clock, MapPin, CheckCircle2 } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { TimetableSlot } from '../../types';

export const AdminTimetable: React.FC = () => {
  const { timetable, addTimetableSlot, deleteTimetableSlot, subjects, faculty, classSections } = useAppStore();

  const [selectedClassId, setSelectedClassId] = useState('cls-1');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeSlotTarget, setActiveSlotTarget] = useState<{ day: TimetableSlot['day']; time: string } | null>(null);

  // Form states for new slot
  const [modalSubjectId, setModalSubjectId] = useState('sub-1');
  const [modalFacultyId, setModalFacultyId] = useState('fac-1');
  const [modalRoom, setModalRoom] = useState('LH-204');
  const [modalDuration, setModalDuration] = useState('60');

  const days: TimetableSlot['day'][] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const timeSlots = ['09:00', '10:15', '11:30', '14:00', '15:15'];

  const detectConflicts = () => {
    const map = new Map<string, TimetableSlot[]>();
    timetable.forEach((slot) => {
      const key = `${slot.day}-${slot.startTime}-${slot.facultyId}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(slot);
    });

    const conflicts: { facultyName: string; day: string; time: string; rooms: string[] }[] = [];
    map.forEach((slots) => {
      if (slots.length > 1) {
        const fac = faculty.find((f) => f.id === slots[0].facultyId);
        conflicts.push({
          facultyName: fac?.name || 'Faculty Member',
          day: slots[0].day,
          time: slots[0].startTime,
          rooms: slots.map((s) => s.room),
        });
      }
    });
    return conflicts;
  };

  const conflicts = detectConflicts();

  const handleCellClick = (day: TimetableSlot['day'], time: string) => {
    setActiveSlotTarget({ day, time });
    setIsModalOpen(true);
  };

  const handleCreateSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSlotTarget) return;

    const [h, m] = activeSlotTarget.time.split(':').map(Number);
    const endMinutes = h * 60 + m + Number(modalDuration);
    const endH = Math.floor(endMinutes / 60).toString().padStart(2, '0');
    const endM = (endMinutes % 60).toString().padStart(2, '0');

    addTimetableSlot({
      day: activeSlotTarget.day,
      startTime: activeSlotTarget.time,
      endTime: `${endH}:${endM}`,
      subjectId: modalSubjectId,
      facultyId: modalFacultyId,
      classSectionId: selectedClassId,
      room: modalRoom,
      color: modalSubjectId === 'sub-1' ? '#4F46E5' : modalSubjectId === 'sub-2' ? '#7C3AED' : '#10B981',
    });

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 text-slate-900">
      {/* Conflict Banner if detected */}
      {conflicts.length > 0 && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-between text-xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <AlertTriangle size={18} className="text-rose-600 shrink-0" />
            <div>
              <span className="font-bold text-rose-900 block">Timetable Collision Detected!</span>
              <span>
                {conflicts[0].facultyName} is scheduled across multiple rooms ({conflicts[0].rooms.join(' & ')}) on {conflicts[0].day} at {conflicts[0].time}.
              </span>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded bg-rose-100 text-rose-800 font-mono font-bold">
            Conflict
          </span>
        </div>
      )}

      {/* Top Toolbar in White */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <label className="text-xs font-semibold text-slate-700">Select Section:</label>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-xs text-slate-800 rounded-xl px-3 py-2 focus:outline-none font-medium"
          >
            {classSections.map((cs) => (
              <option key={cs.id} value={cs.id}>
                {cs.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto">
          <button
            onClick={() => alert('Timetable template duplicated from Week 35.')}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition"
          >
            <Copy size={13} />
            <span>Copy from Previous Week</span>
          </button>
          <button
            onClick={() => {
              setActiveSlotTarget({ day: 'Mon', time: '09:00' });
              setIsModalOpen(true);
            }}
            className="px-4 py-2 rounded-full font-bold text-xs text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:brightness-110 shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={14} />
            <span>Add Slot</span>
          </button>
        </div>
      </div>

      {/* Weekly Grid in White */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm overflow-x-auto">
        <table className="w-full border-collapse min-w-[700px]">
          <thead>
            <tr>
              <th className="p-3 text-left text-xs font-bold text-slate-500 w-24 border-b border-slate-200">
                Time
              </th>
              {days.map((day) => (
                <th
                  key={day}
                  className="p-3 text-center text-xs font-bold text-slate-900 border-b border-slate-200"
                >
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timeSlots.map((time) => (
              <tr key={time} className="border-b border-slate-100">
                <td className="p-3 text-xs font-mono font-semibold text-slate-500 align-top">
                  {time}
                </td>
                {days.map((day) => {
                  const slot = timetable.find(
                    (s) => s.day === day && s.startTime === time && s.classSectionId === selectedClassId
                  );
                  const sub = slot ? subjects.find((s) => s.id === slot.subjectId) : null;
                  const fac = slot ? faculty.find((f) => f.id === slot.facultyId) : null;

                  return (
                    <td key={day} className="p-2 align-top h-28 w-44">
                      {slot ? (
                        <div
                          className="h-full p-2.5 rounded-2xl shadow-sm flex flex-col justify-between relative group transition hover:scale-[1.02] text-white"
                          style={{
                            background: `linear-gradient(135deg, ${slot.color || '#4F46E5'} 0%, #312E81 100%)`,
                          }}
                        >
                          <div>
                            <span className="font-extrabold text-xs text-white block truncate">
                              {sub?.code || 'Course'}
                            </span>
                            <span className="text-[11px] text-slate-200 block truncate">
                              {sub?.name}
                            </span>
                          </div>

                          <div className="pt-2 border-t border-white/20 flex items-center justify-between text-[10px] text-slate-200">
                            <div className="flex items-center gap-1 truncate max-w-[90px]">
                              <img
                                src={fac?.photoUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150'}
                                alt=""
                                className="w-4 h-4 rounded-full border border-white/40"
                              />
                              <span className="truncate">{fac?.name.split(' ')[1] || 'Staff'}</span>
                            </div>
                            <span className="font-mono bg-black/40 px-1.5 py-0.5 rounded text-white text-[9px]">
                              {slot.room}
                            </span>
                          </div>

                          <button
                            onClick={() => deleteTimetableSlot(slot.id)}
                            className="absolute top-1.5 right-1.5 p-1 text-white/70 hover:text-rose-300 bg-black/40 rounded opacity-0 group-hover:opacity-100 transition"
                            title="Remove Slot"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleCellClick(day, time)}
                          className="w-full h-full rounded-2xl border border-dashed border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/50 flex flex-col items-center justify-center text-slate-400 hover:text-indigo-600 transition text-[11px] font-medium"
                        >
                          <Plus size={14} className="mb-0.5" />
                          <span>Assign</span>
                        </button>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Slot Modal in White */}
      {isModalOpen && activeSlotTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white p-6 border border-slate-200 shadow-2xl rounded-3xl text-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Assign Timetable Slot</h3>
                <p className="text-xs text-slate-500">
                  {activeSlotTarget.day} at {activeSlotTarget.time}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSlot} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Subject</label>
                <select
                  value={modalSubjectId}
                  onChange={(e) => setModalSubjectId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code} - {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Faculty Instructor
                </label>
                <select
                  value={modalFacultyId}
                  onChange={(e) => setModalFacultyId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none"
                >
                  {faculty.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.department})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Classroom / Lab</label>
                  <input
                    type="text"
                    value={modalRoom}
                    onChange={(e) => setModalRoom(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Duration</label>
                  <select
                    value={modalDuration}
                    onChange={(e) => setModalDuration(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none"
                  >
                    <option value="60">60 mins</option>
                    <option value="90">90 mins</option>
                    <option value="120">120 mins</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:brightness-110 shadow-md"
                >
                  Confirm Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
