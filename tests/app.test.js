const { test, expect } = require("@playwright/test");

test.use({
  ignoreHTTPSErrors: true, // Ignore SSL certificate errors
});

// User Registration
test("User can register successfully", async ({ page }) => {
  await page.goto("https://localhost:3000/register");

  // Fill in the registration form
  await page.fill('input[name="email"]', "testuser@example.com");
  await page.fill('input[name="username"]', "testuser");
  await page.fill('input[name="password"]', "StrongPassword123!");

  // Submit the form
  await page.click('button[type="submit"]');

  // Check if redirected to items or login page
  await expect(page).toHaveURL(/\/items|\/login/);
  await expect(page.locator("text=Welcome, testuser!")).toBeVisible(); // On success
});

// User Login
test("User can log in successfully", async ({ page }) => {
  await page.goto("https://localhost:3000/login");

  // Fill in login form
  await page.fill('input[name="email"]', "testuser@example.com");
  await page.fill('input[name="password"]', "StrongPassword123!");

  // Submit the form
  await page.click('button[type="submit"]');

  // Check if redirected to items page
  await expect(page).toHaveURL(/\/items/);
  await expect(page.locator("text=Welcome, testuser!")).toBeVisible();
});

test("Login fails with incorrect password", async ({ page }) => {
  await page.goto("https://localhost:3000/login");

  // Fill in login form with incorrect password
  await page.fill('input[name="email"]', "testuser@example.com");
  await page.fill('input[name="password"]', "WrongPassword!");

  // Submit the form
  await page.click('button[type="submit"]');

  // Check if error message is displayed
  await expect(page.locator("#error-message")).toHaveText(/incorrect/i);
});

// Item Management
test("User can add an item to inventory", async ({ page }) => {
  await page.goto("https://localhost:3000/login");
  await page.fill('input[name="email"]', "testuser@example.com");
  await page.fill('input[name="password"]', "StrongPassword123!");
  await page.click('button[type="submit"]');

  // Add an item
  await page.fill('input[name="name"]', "Test Item");
  await page.fill('input[name="quantity"]', "10");
  await page.click('button:has-text("Add Item")');

  // Verify item is added
  await expect(page.locator("table.items-table")).toContainText("Test Item");
});

test("User can edit an item", async ({ page }) => {
  // Login and navigate to items page
  await page.goto("https://localhost:3000/login");
  await page.fill('input[name="email"]', "testuser@example.com");
  await page.fill('input[name="password"]', "StrongPassword123!");
  await page.click('button[type="submit"]');

  await page.fill('table.items-table input[name="quantity"]', "20");
  await page.click('table.items-table button:has-text("Update")');

  // Use a more specific locator for the item row to verify the quantity update
  const updatedRowLocator = page.locator(
    'table.items-table >> text=Test Item >> .. >> input[value="20"]'
  );

  await expect(updatedRowLocator).toBeVisible({
    timeout: 7000, // Extend timeout to allow for table updates
  });
});

test("User can delete an item", async ({ page }) => {
  // Login and navigate to items page
  await page.goto("https://localhost:3000/login");
  await page.fill('input[name="email"]', "testuser@example.com");
  await page.fill('input[name="password"]', "StrongPassword123!");
  await page.click('button[type="submit"]');

  // Delete the item
  await page.click('table.items-table button:has-text("Delete")');

  // Verify item is removed
  await expect(page.locator("table.items-table")).not.toContainText(
    "Test Item"
  );
});

// Administration Panel
test("Admin can view all users", async ({ page }) => {
  // Login as admin
  await page.goto("https://localhost:3000/login");
  await page.fill('input[name="email"]', "test5@test.com");
  await page.fill('input[name="password"]', "Test123!");
  await page.click('button[type="submit"]');

  // Navigate to admin panel
  await page.click('a:has-text("Administration")');

  // Verify users are displayed
  await expect(page.locator("table.items-table")).toContainText(
    "testuser@example.com"
  );
});

test("Admin can lock a user account", async ({ page }) => {
  // Login as admin and navigate to admin panel
  await page.goto("https://localhost:3000/login");
  await page.fill('input[name="email"]', "test5@test.com");
  await page.fill('input[name="password"]', "Test123!");
  await page.click('button[type="submit"]');
  await page.click('a:has-text("Administration")');

  // Lock a user account
  await page.click('table.items-table button:has-text("Lock")');

  // Verify account status is updated
  await expect(page.locator("table.items-table")).toContainText("Locked");
});
