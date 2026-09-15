import React from 'react';
import { 
  BrowserRouter, 
  Routes, 
  Route, 
  Navigate 
} from 'react-router-dom';

// Page & Layout Imports
import { PortalLogin } from './pages/PortalLogin';
import { AppLogin } from './pages/AppLogin';
import { AdminMobileApp } from './pages/admin/AdminMobileApp';
import { FacultyMobileApp } from './pages/faculty/FacultyMobileApp';
import { StudentMobileApp } from './pages/student/StudentMobileApp';

// Shared Components
import { OfflineBanner } from './components/shared/OfflineBanner';
import { NotificationDrawer } from './components/shared/NotificationDrawer';

function AppContent() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 transition-colors duration-300 selection:bg-teal-600 selection:text-white">
      {/* Global Drawers & Alerts */}
      <OfflineBanner />
      <NotificationDrawer />

      {/* Main Routed Standalone Apps */}
      <main className="flex-1 flex flex-col min-h-0 bg-white">
        <Routes>
          {/* 1. Smart Attendance Portal */}
          <Route path="/" element={<PortalLogin />} />
          <Route path="/portal" element={<PortalLogin />} />
          <Route path="/admin/login" element={<PortalLogin />} />

          {/* 2. Smart Attendance Student & Faculty App Login */}
          <Route path="/login" element={<AppLogin />} />
          <Route path="/app/login" element={<AppLogin />} />
          <Route path="/student/login" element={<AppLogin />} />
          <Route path="/faculty/login" element={<AppLogin />} />

          {/* 3. Admin Command Console */}
          <Route path="/admin/*" element={<AdminMobileApp />} />

          {/* 4. Faculty App (Full-Width Responsive Desktop & Mobile App) */}
          <Route path="/faculty/*" element={<FacultyMobileApp />} />

          {/* 5. Student App (Full-Width Responsive Desktop & Mobile App) */}
          <Route path="/student/*" element={<StudentMobileApp />} />

          {/* Catch-all Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
