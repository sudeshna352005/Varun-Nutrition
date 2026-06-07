import { test, expect } from '@playwright/test';

test('Verify Worker Roles functionality', async ({ page }) => {
  // Login first
  await page.goto('http://localhost:3000');
  await page.fill('input[placeholder="Username"]', 'owner');
  await page.fill('input[placeholder="Password"]', 'owner123');
  await page.click('button:has-text("Login")');

  // Go to Worker Management
  await page.click('button:has-text("Workers")');
  await expect(page.locator('h1')).toContainText('Worker Management');

  // Add a Sales Worker
  await page.click('button:has-text("Add New Worker")');
  await page.fill('input[placeholder="Full Name"]', 'Sales Alice');
  await page.fill('input[placeholder="Username"]', 'alice_sales');
  await page.fill('input[placeholder="Password"]', 'password123');
  await page.selectOption('select', 'Sales Worker');
  await page.click('button:has-text("Add Worker")');

  // Wait for modal to disappear
  await expect(page.locator('text=Add New Worker')).toHaveCount(0);

  // Add a Delivery Staff
  await page.click('button:has-text("Add New Worker")');
  await page.fill('input[placeholder="Full Name"]', 'Delivery Bob');
  await page.fill('input[placeholder="Username"]', 'bob_delivery');
  await page.fill('input[placeholder="Password"]', 'password123');
  await page.selectOption('select', 'Delivery Staff');
  await page.click('button:has-text("Add Worker")');

  // Wait for modal to disappear
  await expect(page.locator('text=Add New Worker')).toHaveCount(0);

  // Verify both are in the list
  await expect(page.locator('text=Sales Alice')).toBeVisible();
  await expect(page.locator('text=Delivery Bob')).toBeVisible();

  // Test Filter: Sales
  await page.click('button:has-text("Sales")');
  await expect(page.locator('text=Sales Alice')).toBeVisible();
  await expect(page.locator('text=Delivery Bob')).not.toBeVisible();
  await page.screenshot({ path: '/home/jules/verification/worker_filter_sales.png' });

  // Test Filter: Delivery
  await page.click('button:has-text("Delivery")');
  await expect(page.locator('text=Delivery Bob')).toBeVisible();
  await expect(page.locator('text=Sales Alice')).not.toBeVisible();
  await page.screenshot({ path: '/home/jules/verification/worker_filter_delivery.png' });

  // Test Filter: All
  await page.click('button:has-text("All")');
  await expect(page.locator('text=Sales Alice')).toBeVisible();
  await expect(page.locator('text=Delivery Bob')).toBeVisible();
  await page.screenshot({ path: '/home/jules/verification/worker_all_list.png' });
});
