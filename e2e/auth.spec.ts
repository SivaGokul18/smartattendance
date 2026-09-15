import { test, expect } from '@playwright/test';

test.describe('Authentication & Access Control', () => {
  test.describe('Portal Admin Login', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/');
    });

    test('should display the Admin Sign In portal page with required elements', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /Admin Sign In/i })).toBeVisible();
      await expect(page.getByLabel(/Username or Email/i)).toBeVisible();
      await expect(page.getByLabel(/^Password$/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /^Sign In$/i })).toBeVisible();
    });

    test('should show validation errors when submitting empty credentials', async ({ page }) => {
      // Click sign in without filling credentials
      await page.getByRole('button', { name: /^Sign In$/i }).click();

      // Check inline validation error alerts
      await expect(
        page.getByRole('alert').filter({ hasText: /Username or institutional email is required/i })
      ).toBeVisible();
      await expect(
        page.getByRole('alert').filter({ hasText: /Password is required/i })
      ).toBeVisible();
    });

    test('should successfully sign in as admin using valid credentials', async ({ page }) => {
      // Use the demo quick-fill button
      await page.getByRole('button', { name: 'Fill' }).click();

      await expect(page.locator('#admin-identifier')).toHaveValue('admin');
      await expect(page.locator('#admin-password')).toHaveValue('admin123');

      // Submit form
      await page.getByRole('button', { name: /^Sign In$/i }).click();

      // Verify redirect to admin console
      await expect(page).toHaveURL(/.*\/admin/);
      await expect(page.getByText(/Smart Attendance/i).first()).toBeVisible();
      await expect(page.getByText(/Admin Console|Institution Overview/i).first()).toBeVisible();
    });

    test('should show an error alert when submitting incorrect password', async ({ page }) => {
      await page.locator('#admin-identifier').fill('admin');
      await page.locator('#admin-password').fill('wrongpassword123');
      await page.getByRole('button', { name: /^Sign In$/i }).click();

      // Verify error alert/notification
      await expect(page.getByRole('alert')).toBeVisible();
    });
  });

  test.describe('Student & Faculty App Login', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/login');
    });

    test('should display App Login with Student & Faculty quick-fill buttons', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /Welcome back/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /Student/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /Faculty/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /VERIFY & LOG IN/i })).toBeVisible();
    });

    test('should show validation error on empty App Login submit', async ({ page }) => {
      await page.getByRole('button', { name: /VERIFY & LOG IN/i }).click();
      await expect(
        page.getByRole('alert').filter({ hasText: /Username, Roll No, or Faculty ID is required/i })
      ).toBeVisible();
    });

    test('should log in as student and redirect to Student Dashboard', async ({ page }) => {
      // Click student quick-fill
      await page.getByRole('button', { name: /Student/i }).click();
      await page.getByRole('button', { name: /VERIFY & LOG IN/i }).click();

      // Verify redirect to student app
      await expect(page).toHaveURL(/.*\/student/);
      await expect(page.getByText(/Smart Attendance/i).first()).toBeVisible();
      await expect(page.getByText(/Student App/i).first()).toBeVisible();
    });

    test('should log in as faculty and redirect to Faculty App', async ({ page }) => {
      // Click faculty quick-fill
      await page.getByRole('button', { name: /Faculty/i }).click();
      await page.getByRole('button', { name: /VERIFY & LOG IN/i }).click();

      // Verify redirect to faculty app
      await expect(page).toHaveURL(/.*\/faculty/);
      await expect(page.getByText(/Smart Attendance/i).first()).toBeVisible();
      await expect(page.getByText(/^Faculty$/i).first()).toBeVisible();
    });
  });
});
