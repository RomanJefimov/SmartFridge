const { test, expect } = require('@playwright/test');

test.describe('Home Page', () => {
  test('should load the home page and show the title', async ({ page }) => {
    await page.goto('/');
    
    // Check title
    await expect(page).toHaveTitle(/Smart Fridge/);
    
    // Check if "Log in" button is visible
    const loginBtn = page.locator('button[name="login"]');
    await expect(loginBtn).toBeVisible();
    await expect(loginBtn).toHaveText('Log in');
  });

  test('should open login modal when clicking login button', async ({ page }) => {
    await page.goto('/');
    
    await page.click('button[name="login"]');
    
    // Check if modal is visible
    const modal = page.locator('#modal');
    await expect(modal).toBeVisible();
    
    // Check if "Log in" heading is visible inside the modal
    const loginHeading = modal.locator('h2', { hasText: 'Log in' });
    await expect(loginHeading).toBeVisible();
  });
});
