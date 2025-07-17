
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
        await page.goto(criticalPage.path);
        expect(page.url()).toContain(criticalPage.path);

        await expect(page.locator(criticalPage.expectedElement)).toBeVisible();

        // Test to make sur no error 404/500
        const response = await page.goto(criticalPage.path);
        expect(response?.status()).toBeLessThan(400);
      } catch (error) {
        console.error(`❌ ${criticalPage.description} : ERREUR - ${error}`);
        throw error;
      }
    }
    expect(jsErrors).toHaveLength(0);
  });
});
