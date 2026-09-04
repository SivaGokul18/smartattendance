import React, { useState } from 'react';
import { Calendar, Clock, MapPin, QrCode, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export const StudentBooking: React.FC = () => {
  const { bookings, addBooking, selectedStudent } = useAppStore();

  const [activeTab, setActiveTab] = useState<'available' | 'my-bookings'>('available');
  const [selectedSlotId, setSelectedSlotId] = useState<string>(bookings[0].id);
  const [isBookedSuccess, setIsBookedSuccess] = useState(false);

  const selectedSlot = bookings.find((b) => b.id === selectedSlotId);
  const myBookedSlots = bookings.filter((b) => b.studentIds.includes(selectedStudent.id));

  const handleConfirm = () => {
    if (!selectedSlotId) return;
    addBooking(selectedSlotId, selectedStudent.id);
    setIsBookedSuccess(true);
    setTimeout(() => {
      setIsBookedSuccess(false);
      setActiveTab('my-bookings');
    }, 1500);
  };

  return (
    <div className="flex-1 p-4 space-y-4 overflow-y-auto pb-24 bg-white text-slate-900">
      {/* Top Header & Tabs */}
      <div>
        <h3 className="text-base font-black text-slate-900">Lab & Session Reservation</h3>
        <p className="text-xs text-slate-500">Book GPU clusters, workshops, and hardware benches</p>
      </div>

      <div className="flex rounded-2xl bg-slate-100 p-1 border border-slate-200 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('available')}
          className={`flex-1 py-2 rounded-xl transition ${
            activeTab === 'available' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Available Sessions
        </button>
        <button
          onClick={() => setActiveTab('my-bookings')}
          className={`flex-1 py-2 rounded-xl transition ${
            activeTab === 'my-bookings' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          My Bookings ({myBookedSlots.length})
        </button>
      </div>

      {activeTab === 'available' ? (
        <div className="space-y-4">
          {/* Selectable Pill Chips for Available Slots */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Choose Session Slot:
            </span>
            <div className="space-y-2">
              {bookings.map((slot) => {
                const isSelected = selectedSlotId === slot.id;
                const seatsLeft = slot.totalSeats - slot.bookedSeats;
                return (
                  <button
                    key={slot.id}
                    onClick={() => setSelectedSlotId(slot.id)}
                    className={`w-full p-3.5 rounded-2xl text-left border transition flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-teal-50/80 border-teal-500 shadow-sm ring-1 ring-teal-500/20'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <span className="font-bold text-xs text-slate-900 block truncate">
                        {slot.subjectName}
                      </span>
                      <span className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
                        <span>{slot.date}</span>
                        <span>•</span>
                        <span>{slot.time}</span>
                      </span>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 ${
                        seatsLeft <= 3
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {seatsLeft} left
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Slot Summary Card */}
          {selectedSlot && (
            <div className="p-4 rounded-3xl bg-slate-50 border border-slate-200 shadow-sm space-y-3">
              <span className="text-[10px] uppercase font-bold tracking-wider text-teal-700">
                Reservation Details
              </span>
              <h4 className="font-black text-sm text-slate-900">{selectedSlot.subjectName}</h4>

              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <MapPin size={13} className="text-slate-400" />
                  <span>{selectedSlot.room}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={13} className="text-slate-400" />
                  <span>
                    {selectedSlot.date} • {selectedSlot.time}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 pt-1">
                  Instructor: <span className="font-bold text-slate-800">{selectedSlot.facultyName}</span>
                </div>
              </div>

              <button
                onClick={handleConfirm}
                className="w-full py-3 mt-2 rounded-full font-bold text-xs text-white bg-gradient-to-r from-teal-500 to-indigo-600 hover:brightness-110 shadow-lg shadow-teal-500/25 flex items-center justify-center gap-2 active:scale-95 transition cursor-pointer"
              >
                {isBookedSuccess ? (
                  <>
                    <CheckCircle2 size={15} />
                    <span>Reservation Confirmed!</span>
                  </>
                ) : (
                  <>
                    <span>Confirm Booking</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      ) : (
        /* My Bookings List with QR Code Cards */
        <div className="space-y-3">
          {myBookedSlots.map((slot) => (
            <div
              key={slot.id}
              className="p-4 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono text-teal-700 font-bold">
                    Ref: {slot.id.toUpperCase()}
                  </span>
                  <h4 className="font-bold text-xs text-slate-900 mt-0.5">{slot.subjectName}</h4>
                  <p className="text-[11px] text-slate-500">{slot.room}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-slate-50 p-1 flex items-center justify-center border border-slate-200 shadow-xs">
                  <QrCode size={40} className="text-slate-800" />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                <span>{slot.date}</span>
                <span className="text-emerald-700 font-bold">Confirmed Seat</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
