import React, { useState } from 'react';
import { ScanFace, CheckCircle2, RotateCcw, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

interface StudentEnrollmentProps {
  onComplete: () => void;
}

export const StudentEnrollment: React.FC<StudentEnrollmentProps> = ({ onComplete }) => {
  const { selectedStudent, updateStudent } = useAppStore();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isAligned, setIsAligned] = useState(false);

  const handleStartScan = () => {
    setStep(2);
    setTimeout(() => {
      setIsAligned(true);
      setTimeout(() => {
        setStep(3);
      }, 1400);
    }, 1800);
  };

  const handleConfirm = () => {
    updateStudent(selectedStudent.id, { faceIdStatus: 'enrolled' });
    onComplete();
  };

  return (
    <div className="flex-1 p-5 flex flex-col justify-between bg-white text-slate-900 overflow-y-auto">
      {/* 3-Step Progress-Dot Stepper at Top */}
      <div>
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step === s
                    ? 'bg-gradient-to-r from-teal-500 to-indigo-600 text-white ring-4 ring-teal-500/20'
                    : step > s
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {step > s ? '✓' : s}
              </div>
              {s < 3 && (
                <div
                  className={`w-8 h-0.5 rounded-full ${
                    step > s ? 'bg-emerald-500' : 'bg-slate-200'
                  }`}
                ></div>
              )}
            </div>
          ))}
        </div>

        {/* STEP 1: Instructions */}
        {step === 1 && (
          <div className="text-center space-y-4 animate-in fade-in">
            <div className="w-24 h-24 mx-auto rounded-3xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 shadow-sm my-4">
              <ScanFace size={50} />
            </div>

            <h3 className="text-xl font-black tracking-tight text-slate-900">
              Let's set up Face ID
            </h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
              We encrypt your facial geometry into a cryptographic vector for instant, touchless classroom attendance.
            </p>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-2 text-xs text-slate-700">
              <div className="flex items-center gap-2 text-teal-700 font-bold">
                <Sparkles size={14} /> Tips for best accuracy:
              </div>
              <p>• Look directly into the camera with good lighting</p>
              <p>• Avoid sunglasses or heavy face masks</p>
              <p>• Hold the device at eye level</p>
            </div>
          </div>
        )}

        {/* STEP 2: Live camera preview with oval face-guide overlay & corner brackets */}
        {step === 2 && (
          <div className="flex flex-col items-center text-center space-y-3 animate-in zoom-in-95">
            <div className="relative w-64 h-72 rounded-3xl overflow-hidden bg-slate-900 border border-slate-200 shadow-2xl flex items-center justify-center">
              <img
                src={selectedStudent.photoUrl || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400'}
                alt="Camera feed"
                className="w-full h-full object-cover filter contrast-105"
              />

              <div
                className={`absolute w-44 h-56 rounded-full border-2 border-dashed transition-all duration-500 flex items-center justify-center ${
                  isAligned ? 'border-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.5)]' : 'border-teal-400/80'
                }`}
              >
                <div
                  className={`absolute -top-2 -left-2 w-6 h-6 border-t-4 border-l-4 rounded-tl-lg transition-colors ${
                    isAligned ? 'border-emerald-400' : 'border-teal-400'
                  }`}
                />
                <div
                  className={`absolute -top-2 -right-2 w-6 h-6 border-t-4 border-r-4 rounded-tr-lg transition-colors ${
                    isAligned ? 'border-emerald-400' : 'border-teal-400'
                  }`}
                />
                <div
                  className={`absolute -bottom-2 -left-2 w-6 h-6 border-b-4 border-l-4 rounded-bl-lg transition-colors ${
                    isAligned ? 'border-emerald-400' : 'border-teal-400'
                  }`}
                />
                <div
                  className={`absolute -bottom-2 -right-2 w-6 h-6 border-b-4 border-r-4 rounded-br-lg transition-colors ${
                    isAligned ? 'border-emerald-400' : 'border-teal-400'
                  }`}
                />

                <div className="laser-beam"></div>
              </div>

              <div className="absolute bottom-3 px-3 py-1 rounded-full bg-black/70 backdrop-blur text-[11px] font-semibold text-white">
                {isAligned ? 'Face Aligned! Capturing...' : 'Align face in oval'}
              </div>
            </div>
            <p className="text-xs text-slate-500 font-medium">Hold steady while vectors are calculated...</p>
          </div>
        )}

        {/* STEP 3: Confirmation screen with captured photo */}
        {step === 3 && (
          <div className="text-center space-y-4 animate-in fade-in">
            <div className="relative w-36 h-36 mx-auto rounded-full overflow-hidden border-4 border-emerald-500 shadow-xl ring-8 ring-emerald-50 my-2">
              <img
                src={selectedStudent.photoUrl || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400'}
                alt="Enrolled Face"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex items-center justify-center gap-1.5 text-emerald-600 font-bold text-sm">
              <CheckCircle2 size={18} />
              <span>Biometric Vector Generated</span>
            </div>

            <h3 className="text-lg font-black text-slate-900">Face ID Enrollment Ready</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Your biometric face profile is verified with 98% neural confidence score.
            </p>
          </div>
        )}
      </div>

      {/* Stepper Navigation Buttons */}
      <div className="pt-4 border-t border-slate-100">
        {step === 1 && (
          <button
            onClick={handleStartScan}
            className="w-full py-3 rounded-full font-bold text-xs text-white bg-gradient-to-r from-teal-500 to-indigo-600 hover:brightness-110 shadow-lg shadow-teal-500/25 flex items-center justify-center gap-2 active:scale-95 transition cursor-pointer"
          >
            <span>Start Camera Preview</span>
            <ArrowRight size={14} />
          </button>
        )}

        {step === 2 && (
          <button
            onClick={() => {
              setIsAligned(true);
              setStep(3);
            }}
            className="w-full py-3 rounded-full font-bold text-xs text-white bg-slate-800 hover:bg-slate-700 flex items-center justify-center gap-2"
          >
            <span>Auto-Capturing... (or Click to Snap)</span>
          </button>
        )}

        {step === 3 && (
          <div className="space-y-2">
            <button
              onClick={handleConfirm}
              className="w-full py-3 rounded-full font-bold text-xs text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-110 shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 active:scale-95 transition cursor-pointer"
            >
              <span>Confirm & Continue</span>
              <ArrowRight size={14} />
            </button>
            <button
              onClick={() => {
                setIsAligned(false);
                setStep(2);
              }}
              className="w-full py-2.5 rounded-full font-semibold text-xs text-slate-500 hover:text-slate-800 flex items-center justify-center gap-1.5"
            >
              <RotateCcw size={13} />
              <span>Retake Photo</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
