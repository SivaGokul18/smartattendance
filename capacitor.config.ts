import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.smartattendance.app',
  appName: 'Smart Attendance',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    allowNavigation: [
      'smart-attendance-backend-f7vl.onrender.com',
      'accounts.google.com',
      '*.google.com',
      '*.googleapis.com'
    ]
  }
};

export default config;
