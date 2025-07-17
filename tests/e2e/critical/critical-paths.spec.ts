/**
 * 🎯 SMOKE TESTS - PARCOURS CRITIQUES
 *
 * Les smoke tests (tests de fumée) vérifient que les fonctionnalités CRITIQUES
 * de l'application fonctionnent correctement après un déploiement.
 *
 * OBJECTIF :
 * - Détecter rapidement les régressions majeures
 * - Vérifier que l'application est "vivante" et utilisable
 * - Tests rapides à exécuter avant/après déploiement
 * - Couvrir les parcours utilisateur les plus importants
 *
 * DIFFÉRENCE AVEC LES TESTS COMPLETS :
 * - Plus rapides et moins détaillés
 * - Se concentrent sur le "happy path"
 * - Moins de cas d'erreur et edge cases
 * - Priorité à la détection de pannes majeures
 *
 * PARCOURS TESTÉS :
 * ✅ Inscription → Connexion → Parse CV → Autofill CV -> Génération CV
 * ✅ Navigation principale fonctionne
 */

import { test, expect } from "@playwright/test";
import { DashboardPage } from "../dashboard/DashboardPage";

function generateRandomEmail(): string {
  const randomString = Math.random().toString(36).substring(2, 10);
  return `${randomString}@example.com`;
}

test.describe("Critical Paths", () => {
  test("complete user journey from registration to CV generation", async ({
    page,
    browserName,
  }) => {
    console.log("🚀 CRITICAL TEST : Parcours utilisateur complet");
    let registeremail = generateRandomEmail();
    const loginemail = registeremail;
    const password = "Password123";
    const dashboardPage = new DashboardPage(page, browserName);

    // 📋 ÉTAPE 1 : INSCRIPTION
    console.log("📝 Étape 1 : Inscription d'un nouvel utilisateur...");

    await page.goto("/register");

    // Vérifier que la page d'inscription se charge
    await expect(page.locator('[data-testid="register-form"]')).toBeVisible();

    // Remplir le formulaire d'inscription
    await page.fill('[data-testid="email-input"]', registeremail);
    await page.fill('[data-testid="password-input"]', password);
    await page.fill('[data-testid="cfpassword-input"]', password);

    // Soumettre l'inscription
    await page.click('[data-testid="submit-button"]');
    await expect(
      page.locator('[data-testid="successful-register-toast"]')
    ).toBeVisible();
    // Vérifier la redirection vers le dashboard après inscription
    await expect(page).toHaveURL("/login");
    await expect(
      page.getByRole("heading", { name: "Connexion" })
    ).toBeVisible();
    console.log("✅ Inscription réussie");

    // 📋 ÉTAPE 2 : SE CONNECTER
    console.log(`🔐 Connexion de ${loginemail}...`);

    await page.fill('[data-testid="email-input"]', loginemail);
    await page.fill('[data-testid="password-input"]', password);
    await page.click('[data-testid="submit-button"]');

    // Attendre la redirection vers le dashboard
    await expect(page).toHaveURL("/dashboard");
    console.log("✅ Connexion réussie et redirect vers dashboard");

    // 📋 ÉTAPE 3 : MISE EN LIGNE LE CV + PARSER LE CV
    console.log("📄 Étape 3 : Mise en ligne le CV");
    await dashboardPage.expectPagelLoadSuccessful();
    console.log("✅ Dashboard apparait correctement");

    await dashboardPage.uploadFile("tests/e2e/fixtures/CV_test.pdf");

    // Check parsing correct
    await dashboardPage.expectParsingSuccess();
    console.log("✅ Parser les donnees");

    // Fill the missing startDate for parsed education info
    await dashboardPage.fillMonthInputBasedOnBrowser(
      '[data-testid="education-0-startDate"]',
      "2023-05"
    );

    await dashboardPage.addExperience();

    // 📋 ÉTAPE 4 : GÉNÉRATION DU CV
    console.log("🤖 Étape 4 : Génération du CV avec IA...");
    await dashboardPage.startImproveCV();

    // Attendre que la génération se termine (timeout généreux pour l'IA)
    await dashboardPage.expectImproveSuccess();

    console.log("✅ CV généré avec succès");

    // 📋 ÉTAPE 5 : VÉRIFICATION FINALE
    // console.log("🎯 Étape 5 : Vérification finale...");

    // // Fermer le modal
    // await page.click('[data-testid="close-modal-button"]');
    // await expect(
    //   page.locator('[data-testid="cv-generation-modal"]')
    // ).toBeHidden();

    // Vérifier qu'on est toujours sur le dashboard
    await expect(page).toHaveURL("/dashboard");

    console.log("🎉 CRITICAL PATH TEST COMPLET RÉUSSI !");
  });
});
