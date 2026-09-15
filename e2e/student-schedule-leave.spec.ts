import { test, expect } from '@playwright/test';

test.describe('Student Portal: Schedule & Leave Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // 1. Navigate to login and authenticate as student
    await page.goto('/login');
    await page.getByRole('button', { name: /Student/i }).click();
    await page.getByRole('button', { name: /VERIFY & LOG IN/i }).click();
    await expect(page).toHaveURL(/.*\/student/);
  });

  test('should display student dashboard with attendance rate and classes', async ({ page }) => {
    // Verify greeting and dashboard stats
    await expect(page.getByText(/Hello,|Welcome/i)).toBeVisible();
    await expect(page.getByText(/Ready for Attendance|Attendance Rate|Attendance/i).first()).toBeVisible();
  });

  test('should navigate to Class Schedule and view weekly timetable', async ({ page }) => {
    // Click on Class Schedule tab in desktop top navigation
    await page.getByRole('button', { name: /Class Schedule/i }).click();

    // Verify Weekly Time Table view
    await expect(page.getByRole('heading', { name: /Weekly Time Table/i })).toBeVisible();
    await expect(page.getByText(/DB Active/i)).toBeVisible();

    // Verify Day filters are present (All Week, Mon, Tue, etc.)
    await expect(page.getByRole('button', { name: /All Week/i })).toBeVisible();

    // Click on a specific day filter (e.g., Mon)
    const monBtn = page.getByRole('button', { name: /^Mon\b/i });
    if (await monBtn.isVisible()) {
      await monBtn.click();
      await expect(monBtn).toHaveClass(/bg-teal-600/);
    }
  });

  test('should open Leave Application modal and inspect mentor routing', async ({ page }) => {
    // Navigate to Class Schedule & Bookings page
    await page.getByRole('button', { name: /Class Schedule/i }).click();

    // Switch to Leave subtab
    await page.getByRole('button', { name: /^Leave\b/i }).click();
    await expect(page.getByRole('heading', { name: 'Leave Applications', exact: true })).toBeVisible();

    // Click Apply for Leave button
    await page.getByRole('button', { name: 'Apply for Leave', exact: true }).click();

    // Verify Leave modal opens
    await expect(page.getByRole('heading', { name: /Apply for Leave/i })).toBeVisible();
    await expect(page.getByText(/Designated Faculty Mentor/i)).toBeVisible();
    await expect(page.getByText(/Direct Mentor Route/i)).toBeVisible();

    // Verify reason field is present
    const reasonInput = page.getByPlaceholder(/detailed reason for requesting leave/i);
    await expect(reasonInput).toBeVisible();

    // Edge case: Submitting empty reason does not proceed
    await page.getByRole('button', { name: /Send to/i }).click();
    // Modal stays open
    await expect(page.getByRole('heading', { name: /Apply for Leave/i })).toBeVisible();

    // Close modal
    await page.getByRole('button', { name: /Cancel/i }).click();
    await expect(page.getByRole('heading', { name: /Apply for Leave/i })).not.toBeVisible();
  });
});
