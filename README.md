# Smart Attendance

An intelligent, modern attendance tracking system featuring:
- **Student & Faculty Dashboards**: Clean, responsive, platinum/white UI with real-time stats and schedule management.
- **Biometric & BLE Verification**: Facial recognition simulation and BLE beacon classroom signal detection.
- **Cross-Platform**: Web application built with React, Vite, and Tailwind CSS, bundled with Capacitor for native Android deployment.
- **Offline & Local First**: Real-time session management and state persistence.

## Getting Started

### Web Development
```bash
npm install
npm run dev
```

### Android APK Build
```bash
npm run build
npx cap sync android
# Build with Gradle or in Android Studio
```

## End-to-End Testing (Playwright)

This project uses [Playwright](https://playwright.dev/) for robust, multi-browser end-to-end testing across Admin, Student, and Faculty portals.

### 1. Install Browsers
Before running tests for the first time, install the required browser binaries:
```bash
npx playwright install chromium
# Or install all browsers (Chromium, Firefox, WebKit):
npx playwright install
```

### 2. Run Tests Locally
Playwright will automatically launch the local Vite development server (`http://localhost:5173`) if it is not already running.

- **Run all E2E tests headlessly**:
  ```bash
  npm run test:e2e
  ```

- **Run tests only on Chromium**:
  ```bash
  npx playwright test --project=chromium
  ```

- **Interactive UI Mode (with time-travel debugging & live preview)**:
  ```bash
  npm run test:e2e:ui
  ```

- **Headed mode (watch the browser actions live)**:
  ```bash
  npm run test:e2e:headed
  ```

- **View HTML Test Report**:
  ```bash
  npm run test:e2e:report
  ```

### 3. Continuous Integration (CI)
To run Playwright tests in CI pipelines (such as GitHub Actions):

```yaml
name: Playwright Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - name: Install dependencies
        run: npm ci
      - name: Install Playwright Browsers
        run: npx playwright install --with-deps chromium
      - name: Run Playwright tests
        run: npm run test:e2e -- --project=chromium
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 14
```

