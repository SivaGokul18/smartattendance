import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.smartattendance.app',
  appName: 'Smart Attendance',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true,
    allowNavigation: [
      'smart-attendance-backend-f7vl.onrender.com',
      'accounts.google.com',
      '*.google.com',
      '*.googleapis.com',
      '10.*',
      '192.168.*',
      '172.*',
      '*'
    ]
  }
};

export default config;
