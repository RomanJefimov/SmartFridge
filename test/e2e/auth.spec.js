const { test, expect } = require('@playwright/test');

test('should login successfully', async ({ page }) => {
    await page.goto('/');
    await page.screenshot({ path: 'screenshot.png' });
    
    const loginBtn = page.locator('button[name="login"]');
    console.log('Button count:', await loginBtn.count());
    await loginBtn.click();
});

test.describe('Authentication', () => {
  test('should login successfully with valid credentials', async ({ page }) => {
    // 1. Go to home page
    await page.goto('/');

    // 2. Click "Log in" button to open modal
    const loginBtn = page.locator('button[name="login"]');
    await loginBtn.click();

    // 3. Fill in the login form
    const loginForm = page.locator('#login-form');
    await loginForm.locator('input[type="email"]').fill('tests@ee.ee');
    await loginForm.locator('input[type="password"]').fill('Ballistik31!');

    // 4. Submit the form
    await loginForm.locator('button.submit-btn').click();

    // 5. Verify redirection to /user
    // We wait for the URL to change to something containing /user
    await page.waitForURL('**/user/**', { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    
    // 6. Check if we are on the user dashboard
    await expect(page).toHaveURL(/\/user/);
    
    // Optionally check for something specific on the user page
    // For example, checking if the token is in localStorage
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeTruthy();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/');
    await page.click('button[name="login"]');

    const loginForm = page.locator('#login-form');
    await loginForm.locator('input[type="email"]').fill('wrong@test.ee');
    await loginForm.locator('input[type="password"]').fill('wrongpassword');
    await loginForm.locator('button.submit-btn').click();

    // Check for error message
    const errorBox = page.locator('#login-error');
    await expect(errorBox).toBeVisible();
    await expect(errorBox).not.toBeEmpty();
  });
});
