import { expect, test } from '@playwright/test';

test('CLIENT-001 exposes Pattern-first Creator and Customer surfaces', async ({ page }) => {
  await page.goto('/customer');
  const router = page.getByTestId('customer-commerce-action-router');
  await expect(router).toBeVisible();
  await expect(router.getByText('Request', { exact: true })).toBeVisible();
  await expect(router.getByText('Reserve', { exact: true })).toBeVisible();
  await expect(router.getByText('Quote / Accept', { exact: true })).toBeVisible();

  await page.goto('/creator');
  await expect(page.getByText('Creator Commerce Desk', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Identity' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Reservations' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Contracts' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Orders / Earnings' })).toBeVisible();
});
