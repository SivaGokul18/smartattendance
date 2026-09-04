import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, X, RotateCcw } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useSessionStore } from '../../store/useSessionStore';
import { simulateFaceScan, FaceScanStatus } from '../../lib/face-simulator';

interface StudentFaceVerifyProps {
  onVerified: () => void;
  onCancel: () => void;
}

export const StudentFaceVerify: React.FC<StudentFaceVerifyProps> = ({
  onVerified,
  onCancel,
}) => {
  const { selectedStudent } = useAppStore();
  const { studentCheckIn } = useSessionStore();

  const [scanStatus, setScanStatus] = useState<FaceScanStatus>('scanning');
  const [confidence, setConfidence] = useState(40);

  useEffect(() => {
    const cleanup = simulateFaceScan((status, conf) => {
      setScanStatus(status);
      setConfidence(conf);

      if (status === 'verified') {
        studentCheckIn({
          id: selectedStudent.id,
          name: selectedStudent.name,
          rollNumber: selectedStudent.rollNumber,
          department: selectedStudent.department,
          method: 'ble+face',
        });

        setTimeout(() => {
          onVerified();
        }, 1200);
      }
    }, true);

    return cleanup;
  }, [selectedStudent, studentCheckIn, onVerified]);

  const isSuccess = scanStatus === 'verified';
  const isFailed = scanStatus === 'failed';

  return (
    <div className="flex-1 flex flex-col justify-between p-5 bg-white text-slate-900 relative overflow-hidden">
      {/* Top Header */}
      <div className="flex justify-between items-center z-20">
        <span className="text-[10px] uppercase font-bold tracking-wider text-teal-600">
          Face Liveness Check
        </span>
        <button onClick={onCancel} className="p-1 rounded-full text-slate-400 hover:text-slate-700">
          <X size={18} />
        </button>
      </div>

      {/* Camera Preview with Oval Face Guide & Laser Beam */}
      <div className="relative my-auto w-full max-w-[280px] h-[340px] mx-auto rounded-3xl overflow-hidden border border-slate-200 shadow-xl flex items-center justify-center bg-slate-900">
        {/* Simulated Camera feed */}
        <img
          src={selectedStudent.photoUrl || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400'}
          alt="Student"
          className="w-full h-full object-cover filter contrast-105"
        />

        {/* Soft-edged Oval Face Guide Overlay */}
        <div
          className={`absolute w-44 h-56 rounded-full border-2 transition-all duration-300 flex items-center justify-center ${
            isSuccess
              ? 'border-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.7)]'
              : isFailed
              ? 'border-rose-500 shadow-[0_0_20px_rgba(239,68,68,0.5)]'
              : 'border-teal-400/90'
          }`}
        >
          {/* Corner Brackets Glowing Green on Match */}
          <div
            className={`absolute -top-2 -left-2 w-6 h-6 border-t-4 border-l-4 rounded-tl-lg transition-colors ${
              isSuccess ? 'border-emerald-400' : 'border-teal-400'
            }`}
          />
          <div
            className={`absolute -top-2 -right-2 w-6 h-6 border-t-4 border-r-4 rounded-tr-lg transition-colors ${
              isSuccess ? 'border-emerald-400' : 'border-teal-400'
            }`}
          />
          <div
            className={`absolute -bottom-2 -left-2 w-6 h-6 border-b-4 border-l-4 rounded-bl-lg transition-colors ${
              isSuccess ? 'border-emerald-400' : 'border-teal-400'
            }`}
          />
          <div
            className={`absolute -bottom-2 -right-2 w-6 h-6 border-b-4 border-r-4 rounded-br-lg transition-colors ${
              isSuccess ? 'border-emerald-400' : 'border-teal-400'
            }`}
          />

          {/* Animated Laser Scanning Line */}
          {!isSuccess && <div className="laser-beam"></div>}
        </div>

        {/* Neural Confidence pill */}
        <div className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur text-[10px] font-mono font-bold text-white border border-white/10">
          Neural: {confidence}%
        </div>
      </div>

      {/* Status Text & Actions */}
      <div className="text-center space-y-3">
        {isSuccess ? (
          <div className="flex items-center justify-center gap-2 text-emerald-600 font-extrabold text-sm animate-in zoom-in">
            <CheckCircle2 size={20} />
            <span>Biometric Verified! Marking Attendance...</span>
          </div>
        ) : isFailed ? (
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-1.5 text-rose-600 font-bold text-xs">
              <AlertCircle size={16} />
              <span>Face not recognized. Try again</span>
            </div>
            <button
              onClick={() => {
                setScanStatus('scanning');
                setConfidence(40);
              }}
              className="px-4 py-1.5 rounded-full bg-slate-100 text-xs font-bold text-slate-800 flex items-center gap-1.5 mx-auto hover:bg-slate-200"
            >
              <RotateCcw size={13} /> Retry Verification
            </button>
          </div>
        ) : (
          <div>
            <p className="text-xs font-bold text-teal-700 animate-pulse">
              Hold still... Verifying face vector
            </p>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              Cosine vector similarity match in progress
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
