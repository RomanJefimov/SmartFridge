const { test, expect } = require('@playwright/test');

test.describe('Fridge Management', () => {
  // We use a setup that logs in first
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.click('button[name="login"]');
    
    const loginForm = page.locator('#login-form');
    await loginForm.locator('input[type="email"]').fill('tests@ee.ee');
    await loginForm.locator('input[type="password"]').fill('Ballistik31!');
    await loginForm.locator('button.submit-btn').click();
    
    await page.waitForURL(/\/user/, { timeout: 10000 });
  });

  test('should navigate through dashboard sections', async ({ page }) => {
    // Check navigation items
    const nav = page.locator('nav');
    await expect(nav.locator('text=Upload Picture')).toBeVisible();
    await expect(nav.locator('text=List of products')).toBeVisible();
    await expect(nav.locator('text=Recipes')).toBeVisible();
    await expect(nav.locator('text=History')).toBeVisible();

    // Click "List of products"
    await page.click('text=List of products');
    
    // Check if "List of products" header appears in content
    const content = page.locator('.content');
    // It might say "Fridge is empty" or show products
    const heading = content.locator('h1');
    await expect(heading).toBeVisible();
    const headingText = await heading.textContent();
    expect(['List of products', 'Fridge is empty']).toContain(headingText);
  });

  test('should show upload interface when clicking Upload Picture', async ({ page }) => {
    await page.click('text=Upload Picture');
    
    const content = page.locator('.content');
    await expect(content.locator('h1')).toHaveText('Upload Fridge Photo');
    await expect(content.locator('input[type="file"]')).toBeAttached();
  });

  test('should be able to logout', async ({ page }) => {
    await page.evaluate(() => {
        document.getElementById('profileDropdown').style.display = 'block';
    });

    await expect(page.locator('#profileDropdown')).toBeVisible();
    
    // Wait for navigation before clicking
    const [response] = await Promise.all([
        page.waitForURL('http://localhost:3000/', { timeout: 10000 }),
        page.click('button.logout-btn')
    ]);

    await expect(page).toHaveTitle(/Smart Fridge/);
    
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeNull();
  });
});
