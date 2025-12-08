// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Visual Regression Tests
 * 
 * These tests capture screenshots of key pages and compare them against baseline images.
 * Run with: npx playwright test tests/visual-regression.spec.js --update-snapshots
 * to update baseline screenshots after intentional UI changes.
 */

const BASE_URL = process.env.BASE_URL || 'https://researchnotebook.vercel.app';

// Test credentials
const TEST_USER = {
  email: 'alice@example.com',
  password: 'password123'
};

// Helper to login
async function login(page) {
  await page.goto('/login.html');
  await page.fill('#login-email', TEST_USER.email);
  await page.fill('#login-password', TEST_USER.password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/dashboard|todos|notes/);
  await page.waitForTimeout(500); // Allow animations to complete
}

// Helper to set consistent viewport for screenshots
async function setViewport(page, width = 1280, height = 720) {
  await page.setViewportSize({ width, height });
}

test.describe('Visual Regression - Public Pages', () => {
  
  test.beforeEach(async ({ page }) => {
    await setViewport(page);
  });

  test('homepage - dark theme', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    await page.waitForTimeout(300);
    
    await expect(page).toHaveScreenshot('homepage-dark.png', {
      maxDiffPixels: 100,
      threshold: 0.2
    });
  });

  test('homepage - light theme', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'light');
    });
    await page.waitForTimeout(300);
    
    await expect(page).toHaveScreenshot('homepage-light.png', {
      maxDiffPixels: 100,
      threshold: 0.2
    });
  });

  test('login page - dark theme', async ({ page }) => {
    await page.goto('/login.html');
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    await page.waitForTimeout(300);
    
    await expect(page).toHaveScreenshot('login-dark.png', {
      maxDiffPixels: 100,
      threshold: 0.2
    });
  });

  test('login page - light theme', async ({ page }) => {
    await page.goto('/login.html');
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'light');
    });
    await page.waitForTimeout(300);
    
    await expect(page).toHaveScreenshot('login-light.png', {
      maxDiffPixels: 100,
      threshold: 0.2
    });
  });

  test('register page', async ({ page }) => {
    await page.goto('/register.html');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(300);
    
    await expect(page).toHaveScreenshot('register.png', {
      maxDiffPixels: 100,
      threshold: 0.2
    });
  });
});

test.describe('Visual Regression - Authenticated Pages', () => {
  
  test.beforeEach(async ({ page }) => {
    await setViewport(page);
    await login(page);
  });

  test('dashboard - dark theme', async ({ page }) => {
    await page.goto('/dashboard.html');
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    await page.waitForTimeout(500);
    
    // Mask dynamic content that changes between runs
    await expect(page).toHaveScreenshot('dashboard-dark.png', {
      maxDiffPixels: 500, // Higher tolerance for dynamic content
      threshold: 0.3,
      mask: [
        page.locator('.activity-feed'), // Activity changes
        page.locator('#todos-list'),    // Todos change
        page.locator('.stat-card'),     // Stats change
      ]
    });
  });

  test('dashboard - light theme', async ({ page }) => {
    await page.goto('/dashboard.html');
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'light');
    });
    await page.waitForTimeout(500);
    
    await expect(page).toHaveScreenshot('dashboard-light.png', {
      maxDiffPixels: 500,
      threshold: 0.3,
      mask: [
        page.locator('.activity-feed'),
        page.locator('#todos-list'),
        page.locator('.stat-card'),
      ]
    });
  });

  test('todos page', async ({ page }) => {
    await page.goto('/todos.html');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    
    await expect(page).toHaveScreenshot('todos.png', {
      maxDiffPixels: 500,
      threshold: 0.3,
      mask: [
        page.locator('#todos-list'), // Todo items change
      ]
    });
  });

  test('notes page', async ({ page }) => {
    await page.goto('/notes.html');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    
    await expect(page).toHaveScreenshot('notes.png', {
      maxDiffPixels: 500,
      threshold: 0.3,
      mask: [
        page.locator('#notes-list'), // Notes change
      ]
    });
  });

  test('projects page', async ({ page }) => {
    await page.goto('/projects.html');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    
    await expect(page).toHaveScreenshot('projects.png', {
      maxDiffPixels: 500,
      threshold: 0.3,
      mask: [
        page.locator('#projects-list'), // Projects change
      ]
    });
  });

  test('contacts page', async ({ page }) => {
    await page.goto('/contacts.html');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    
    await expect(page).toHaveScreenshot('contacts.png', {
      maxDiffPixels: 500,
      threshold: 0.3,
      mask: [
        page.locator('#app'), // Contact list changes
      ]
    });
  });

  test('messages page', async ({ page }) => {
    await page.goto('/messages.html');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    
    await expect(page).toHaveScreenshot('messages.png', {
      maxDiffPixels: 500,
      threshold: 0.3,
      mask: [
        page.locator('#conversations-list'),
        page.locator('#messages-container'),
      ]
    });
  });

  test('kanban board', async ({ page }) => {
    await page.goto('/kanban.html');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    
    await expect(page).toHaveScreenshot('kanban.png', {
      maxDiffPixels: 500,
      threshold: 0.3,
      mask: [
        page.locator('.kanban-column'), // Tasks change
      ]
    });
  });

  test('note editor', async ({ page }) => {
    await page.goto('/note.html');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    
    await expect(page).toHaveScreenshot('note-editor.png', {
      maxDiffPixels: 300,
      threshold: 0.2
    });
  });
});

test.describe('Visual Regression - Mobile Responsive', () => {
  
  test.beforeEach(async ({ page }) => {
    // Mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
  });

  test('homepage mobile', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(300);
    
    await expect(page).toHaveScreenshot('homepage-mobile.png', {
      maxDiffPixels: 100,
      threshold: 0.2
    });
  });

  test('login mobile', async ({ page }) => {
    await page.goto('/login.html');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(300);
    
    await expect(page).toHaveScreenshot('login-mobile.png', {
      maxDiffPixels: 100,
      threshold: 0.2
    });
  });

  test('dashboard mobile', async ({ page }) => {
    await login(page);
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard.html');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    
    await expect(page).toHaveScreenshot('dashboard-mobile.png', {
      maxDiffPixels: 500,
      threshold: 0.3,
      mask: [
        page.locator('.activity-feed'),
        page.locator('#todos-list'),
        page.locator('.stat-card'),
      ]
    });
  });

  test('todos mobile', async ({ page }) => {
    await login(page);
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/todos.html');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    
    await expect(page).toHaveScreenshot('todos-mobile.png', {
      maxDiffPixels: 500,
      threshold: 0.3,
      mask: [
        page.locator('#todos-list'),
      ]
    });
  });
});

test.describe('Visual Regression - UI Components', () => {
  
  test.beforeEach(async ({ page }) => {
    await setViewport(page);
    await login(page);
  });

  test('command palette', async ({ page }) => {
    await page.goto('/dashboard.html');
    await page.waitForLoadState('networkidle');
    
    // Open command palette
    await page.keyboard.press('Control+k');
    await page.waitForTimeout(300);
    
    const palette = page.locator('#command-palette, .command-palette');
    if (await palette.isVisible()) {
      await expect(page).toHaveScreenshot('command-palette.png', {
        maxDiffPixels: 200,
        threshold: 0.2
      });
    }
  });

  test('keyboard shortcuts help', async ({ page }) => {
    await page.goto('/dashboard.html');
    await page.waitForLoadState('networkidle');
    
    // Open help dialog
    await page.keyboard.press('?');
    await page.waitForTimeout(300);
    
    const helpDialog = page.locator('.shortcuts-overlay, #shortcuts-help');
    if (await helpDialog.isVisible()) {
      await expect(page).toHaveScreenshot('shortcuts-help.png', {
        maxDiffPixels: 200,
        threshold: 0.2
      });
    }
  });

  test('create project modal', async ({ page }) => {
    await page.goto('/projects.html');
    await page.waitForLoadState('networkidle');
    
    // Open create project modal
    const createBtn = page.locator('button:has-text("Create"), button:has-text("New Project")').first();
    if (await createBtn.isVisible()) {
      await createBtn.click();
      await page.waitForTimeout(300);
      
      await expect(page).toHaveScreenshot('create-project-modal.png', {
        maxDiffPixels: 200,
        threshold: 0.2
      });
    }
  });

  test('todo modal', async ({ page }) => {
    await page.goto('/todos.html');
    await page.waitForLoadState('networkidle');
    
    // Open new todo modal if it exists
    const createBtn = page.locator('button:has-text("New"), button:has-text("Add")').first();
    if (await createBtn.isVisible()) {
      await createBtn.click();
      await page.waitForTimeout(300);
      
      const modal = page.locator('.modal, #todo-modal');
      if (await modal.isVisible()) {
        await expect(page).toHaveScreenshot('todo-modal.png', {
          maxDiffPixels: 200,
          threshold: 0.2
        });
      }
    }
  });
});
