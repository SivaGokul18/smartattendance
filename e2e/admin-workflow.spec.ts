import { test, expect } from '@playwright/test';

test.describe('Admin Console: Oversight & Management Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate and login as admin
    await page.goto('/');
    await page.getByRole('button', { name: 'Fill' }).click();
    await page.getByRole('button', { name: /^Sign In$/i }).click();
    await expect(page).toHaveURL(/.*\/admin/);
  });

  test('should display Admin Overview console with key metric cards', async ({ page }) => {
    await expect(page.getByText(/Smart Attendance/i).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Overview/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Leaves/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Users', exact: true })).toBeVisible();
  });

  test('should navigate to Leave Oversight and toggle student and faculty leave views', async ({ page }) => {
    // Click Leaves in desktop nav
    await page.getByRole('button', { name: /Leaves/i }).first().click();

    // Verify Leave Oversight header
    await expect(page.getByRole('heading', { name: /Student Leave & OD Oversight|Leave & Substitute Oversight/i })).toBeVisible();
    await expect(page.getByText(/Review student leave applications/i).first()).toBeVisible();

    // Verify Tab buttons for Student Leaves and Faculty Leaves
    const studentLeavesTab = page.getByRole('button', { name: /Student Leaves/i });
    const facultyLeavesTab = page.getByRole('button', { name: /Faculty Requests & Substitutes/i });

    await expect(studentLeavesTab).toBeVisible();
    await expect(facultyLeavesTab).toBeVisible();

    // Switch to Faculty Leaves tab
    await facultyLeavesTab.click();
    await expect(facultyLeavesTab).toHaveClass(/bg-white/);

    // Switch back to Student Leaves tab
    await studentLeavesTab.click();
    await expect(studentLeavesTab).toHaveClass(/bg-white/);
  });

  test('should navigate to Users Management and view directory', async ({ page }) => {
    await page.getByRole('button', { name: 'Users', exact: true }).click();
    await expect(page.getByText(/Students & Faculty|Directory of campus students/i).first()).toBeVisible();
  });
});
