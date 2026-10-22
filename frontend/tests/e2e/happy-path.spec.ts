import { test, expect } from '@playwright/test';

test('user fills form, previews, and downloads zip', async ({ page }) => {
  await page.goto('/en');

  await page.getByLabel('Name').fill('Security Reviewer');
  await page.getByLabel('Description').fill('Reviews code for vulnerabilities');
  await page
    .getByLabel('Instructions')
    .fill('You are a security expert. Always check for SQL injection.');

  await page.getByRole('button', { name: /^Preview$/ }).click();
  await expect(page.getByText('Files', { exact: true })).toBeVisible({ timeout: 10_000 });

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /Generate/ }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toContain('agentizr-');
});
