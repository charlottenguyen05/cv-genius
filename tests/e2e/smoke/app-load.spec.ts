import { test, expect } from "@playwright/test";

test.describe(() => {
  test("application loads and all key pages display correctly", async ({ page }) => {
    console.log("CRITICAL TEST: Chargement des pages critiques");

    const criticalPages = [
      {
        path: "/",
        expectedElement: '[data-testid="homepage"]',
        description: "Page d'accueil",
      },
      {
        path: "/login",
        expectedElement: '[data-testid="login-form"]',
        description: "Page de connexion",
      },
      {
        path: "/register",
        expectedElement: '[data-testid="register-form"]',
        description: "Page d'inscription",
      },
      {
        path: "/dashboard",
        expectedElement: '[data-testid="dashboard-page"]',
        description: "Tableau de bord",
      },
    ];

    const jsErrors: string[] = [];
    // Set an event listener on the pageerror event (the code is run when a pageerror event is triggered): caught JS errors when running without break the test
    page.on("pageerror", (err) => {
      jsErrors.push(`JS Error on ${page.url()}: ${err.message}`);
    });

    for (const criticalPage of criticalPages) {
      try {
        console.log(`Navigating to ${criticalPage.path}`);
        
        // Use waitUntil: 'networkidle' to wait for all network activity to settle
        await page.goto(criticalPage.path, { 
          timeout: 50000 
        });
        
        // Additional wait for any authentication state to settle
        await page.waitForTimeout(200);
        
        // Check URL contains the expected path (more flexible than exact match)
        await expect(page).toHaveURL(new RegExp(criticalPage.path.replace('/', '\/')));
        
        // Wait for the expected element to be visible
        await expect(page.locator(criticalPage.expectedElement)).toBeVisible({ timeout: 10000 });
        
        console.log(`✓ ${criticalPage.description} loaded successfully`);
        
      } catch (error) {
        console.error(`❌ ${criticalPage.description} : ERREUR - ${error}`);
        // Take screenshot on failure for debugging
        await page.screenshot({ path: `test-failure-${criticalPage.path.replace('/', '_')}.png` });
        throw error;
      }
    }
    expect(jsErrors).toHaveLength(0);
  });
});