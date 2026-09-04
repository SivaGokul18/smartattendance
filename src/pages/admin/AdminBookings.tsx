import React, { useState } from 'react';
import { Plus, Calendar, List, Search, MapPin, Users, CheckCircle, Clock, X } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export const AdminBookings: React.FC = () => {
  const { bookings, students, subjects } = useAppStore();

  const [viewMode, setViewMode] = useState<'calendar' | 'table'>('calendar');
  const [filterSubject, setFilterSubject] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Booking Modal state
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState(students[0].id);
  const [selectedBookingId, setSelectedBookingId] = useState(bookings[0].id);

  const filteredBookings = bookings.filter(
    (b) => filterSubject === 'All' || b.subjectName.includes(filterSubject)
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Student Session & Lab Booking</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage student seat reservations for specialized hardware labs and elective sessions.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start md:self-auto">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                viewMode === 'calendar' ? 'bg-white text-indigo-600 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar size={13} />
              <span>Calendar</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                viewMode === 'table' ? 'bg-white text-indigo-600 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List size={13} />
              <span>Table</span>
            </button>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-full font-semibold text-xs text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:brightness-110 shadow-md shadow-indigo-600/20 flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
          >
            <Plus size={14} />
            <span>New Booking</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {viewMode === 'calendar' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {filteredBookings.map((slot) => {
            const seatsLeft = slot.totalSeats - slot.bookedSeats;
            return (
              <div
                key={slot.id}
                className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm hover:border-indigo-300 hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono text-indigo-600 font-bold flex items-center gap-1 bg-indigo-50 px-2 py-0.5 rounded-md">
                      <Calendar size={12} />
                      {slot.date}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        seatsLeft <= 3
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {seatsLeft} seats left
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900">{slot.subjectName}</h3>
                  <p className="text-xs text-slate-600 mt-1 flex items-center gap-1">
                    <MapPin size={12} className="text-slate-400" />
                    {slot.room}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                    <Clock size={12} className="text-slate-400" />
                    {slot.time}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-500">Capacity booked</span>
                    <span className="text-slate-900 font-bold">
                      {slot.bookedSeats} / {slot.totalSeats}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full"
                      style={{ width: `${(slot.bookedSeats / slot.totalSeats) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Booking ID</th>
                <th className="py-3 px-4">Lab / Subject Session</th>
                <th className="py-3 px-4">Instructor</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Room</th>
                <th className="py-3 px-4">Capacity Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBookings.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50 transition">
                  <td className="py-3.5 px-4 font-mono text-indigo-600 font-bold">{b.id}</td>
                  <td className="py-3.5 px-4 font-medium text-slate-900">{b.subjectName}</td>
                  <td className="py-3.5 px-4 text-slate-600">{b.facultyName}</td>
                  <td className="py-3.5 px-4 text-slate-600">
                    <div>{b.date}</div>
                    <div className="text-[10px] text-slate-400">{b.time}</div>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-600">{b.room}</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {b.bookedSeats} / {b.totalSeats} Confirmed
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => alert(`Viewing roster for ${b.subjectName}`)}
                      className="text-indigo-600 hover:text-indigo-700 font-medium cursor-pointer"
                    >
                      View Roster
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* New Booking Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white p-6 border border-slate-200 shadow-2xl rounded-3xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-900 text-base">Create Student Reservation</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                alert('Student seat booked successfully!');
                setIsModalOpen(false);
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Select Student</label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600 transition"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.rollNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Select Available Session</label>
                <select
                  value={selectedBookingId}
                  onChange={(e) => setSelectedBookingId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600 transition"
                >
                  {bookings.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.subjectName} — {b.date} ({b.totalSeats - b.bookedSeats} seats left)
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-full font-medium text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:brightness-110 shadow-md shadow-indigo-600/25 transition active:scale-95"
                >
                  Confirm Reservation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
