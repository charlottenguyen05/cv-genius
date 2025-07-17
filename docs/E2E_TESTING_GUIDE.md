# 🎯 Guide Complet E2E Testing avec Playwright - CV Genius

## 📚 Table des Matières

1. [Qu'est-ce que le E2E Testing ?](#quest-ce-que-le-e2e-testing-)
2. [Pourquoi Playwright ?](#pourquoi-playwright-)
3. [Architecture des Tests E2E](#architecture-des-tests-e2e)
4. [Configuration et Setup](#configuration-et-setup)
5. [Concepts Fondamentaux](#concepts-fondamentaux)
6. [Patterns et Bonnes Pratiques](#patterns-et-bonnes-pratiques)
7. [Tests Pratiques pour CV-Genius](#tests-pratiques-pour-cv-genius)
8. [Debugging et Maintenance](#debugging-et-maintenance)
9. [CI/CD et Automatisation](#cicd-et-automatisation)

---

## Qu'est-ce que le E2E Testing ? 🤔

### Définition
Les **tests End-to-End (E2E)** simulent le comportement d'un utilisateur réel qui navigue dans votre application. Contrairement aux tests unitaires qui testent des fonctions isolées, ou aux tests d'intégration qui testent des interactions entre composants, les tests E2E vérifient que **l'application entière fonctionne correctement** du point de vue de l'utilisateur final.

### Pyramide des Tests
```
        /\
       /  \
      / E2E \     ← Moins nombreux, plus lents, plus coûteux
     /______\       Mais testent l'expérience utilisateur complète
    /        \
   / INTÉGR. \    ← Tests d'interaction entre modules
  /__________\
 /            \
/ UNITAIRES   \   ← Nombreux, rapides, ciblés
/______________\     Testent la logique métier isolée
```

### Différence avec les autres types de tests

#### ❌ Test Unitaire
```javascript
// Teste UNE fonction isolée
test('validateEmail should return true for valid email', () => {
  expect(validateEmail('test@example.com')).toBe(true);
});
```

#### ❌ Test d'Intégration  
```javascript
// Teste l'interaction entre composants (avec mocks)
test('LoginForm should call authentication service', () => {
  const mockAuth = jest.fn();
  render(<LoginForm authService={mockAuth} />);
  // ... teste l'interaction sans vraie API
});
```

#### ✅ Test E2E
```javascript
// Teste le parcours utilisateur COMPLET avec la vraie application
test('User can login and access dashboard', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[data-testid="email"]', 'user@example.com');
  await page.fill('[data-testid="password"]', 'password123');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/dashboard');
  await expect(page.locator('h1')).toContainText('Tableau de bord');
});
```

### Quand utiliser les tests E2E ?

#### ✅ Parfait pour :
- **Parcours utilisateur critiques** (inscription, connexion, achat)
- **Fonctionnalités métier importantes** (génération de CV, paiement)
- **Intégrations complexes** (API externes, bases de données)
- **Validation avant déploiement** (smoke tests)

#### ❌ Éviter pour :
- **Logique métier complexe** → Tests unitaires
- **Validation de formulaires simples** → Tests d'intégration
- **Tests de performance** → Outils spécialisés
- **Cas d'erreur edge cases** → Tests unitaires

---

## Pourquoi Playwright ? 🎭

### Avantages de Playwright

#### 🚀 **Multi-navigateurs natif**
```javascript
// Un seul test, tous les navigateurs
export default defineConfig({
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile', use: { ...devices['iPhone 12'] } },
  ],
});
```

#### ⚡ **Performance exceptionnelle**
- **Parallélisation automatique** des tests
- **Auto-waiting** intelligent (pas de `sleep()` manuels)
- **Retry automatique** sur échec

#### 🛠️ **Outils de développement intégrés**
- **Playwright Inspector** pour débugger en mode step-by-step
- **Trace Viewer** pour analyser les échecs
- **Codegen** pour générer automatiquement les tests

#### 📱 **Support mobile et responsive**
```javascript
// Tester sur mobile
test('should work on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  // ... tests mobile
});
```

### Comparaison avec les alternatives

| Outil | Avantages | Inconvénients |
|-------|-----------|---------------|
| **Playwright** | Multi-navigateurs, rapide, outils excellents | Plus récent |
| **Cypress** | Interface graphique, DX excellent | Chrome uniquement, limitations iframe |
| **Selenium** | Mature, langages multiples | Lent, configuration complexe |
| **Puppeteer** | Rapide pour Chrome | Chrome uniquement |

---

## Architecture des Tests E2E 🏗️

### Structure recommandée

```
tests/
├── e2e/                          # Tests end-to-end
│   ├── auth/                     # Tests d'authentification
│   │   ├── login.spec.ts         # Connexion utilisateur
│   │   ├── register.spec.ts      # Inscription utilisateur  
│   │   └── logout.spec.ts        # Déconnexion
│   ├── dashboard/                # Tests du tableau de bord
│   │   ├── cv-upload.spec.ts     # Upload de CV
│   │   ├── cv-form.spec.ts       # Formulaires CV
│   │   └── cv-generation.spec.ts # Génération avec IA
│   ├── navigation/               # Tests de navigation
│   │   ├── header.spec.ts        # Navigation principale
│   │   └── routing.spec.ts       # Routing entre pages
│   └── smoke/                    # Tests de fumée (critiques)
│       └── critical-path.spec.ts # Parcours principal
├── fixtures/                     # Données de test
│   ├── users.json               # Utilisateurs de test
│   └── cv-data.json             # Données CV de test
├── pages/                        # Page Object Model
│   ├── LoginPage.ts             # Abstraction page login
│   ├── DashboardPage.ts         # Abstraction page dashboard
│   └── BasePage.ts              # Méthodes communes
└── utils/                        # Utilitaires de test
    ├── test-data.ts             # Génération de données
    └── helpers.ts               # Fonctions d'aide
```

### Page Object Model (POM)

Le **Page Object Model** est un pattern qui encapsule les éléments et actions d'une page dans une classe, rendant les tests plus maintenables.

#### ❌ Sans POM (difficile à maintenir)
```javascript
test('user can login', async ({ page }) => {
  await page.goto('/login');
  await page.fill('#email', 'user@example.com');
  await page.fill('#password', 'password123');
  await page.click('button[type="submit"]');
  await expect(page.locator('h1')).toContainText('Dashboard');
});

test('login with invalid credentials', async ({ page }) => {
  await page.goto('/login');
  await page.fill('#email', 'invalid@example.com');
  await page.fill('#password', 'wrongpass');
  await page.click('button[type="submit"]');
  await expect(page.locator('.error')).toBeVisible();
});
```

#### ✅ Avec POM (maintenable et réutilisable)
```javascript
// pages/LoginPage.ts
export class LoginPage {
  constructor(private page: Page) {}

  // Sélecteurs centralisés
  private selectors = {
    emailInput: '[data-testid="email-input"]',
    passwordInput: '[data-testid="password-input"]',
    submitButton: '[data-testid="submit-button"]',
    errorMessage: '[role="alert"]',
    form: '[data-testid="login-form"]'
  };

  // Actions de haut niveau
  async goto() {
    await this.page.goto('/login');
    await this.waitForPageLoad();
  }

  async login(email: string, password: string) {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.submit();
  }

  async fillEmail(email: string) {
    await this.page.fill(this.selectors.emailInput, email);
  }

  async fillPassword(password: string) {
    await this.page.fill(this.selectors.passwordInput, password);
  }

  async submit() {
    await this.page.click(this.selectors.submitButton);
  }

  // Vérifications
  async expectErrorMessage(message: string) {
    await expect(this.page.locator(this.selectors.errorMessage))
      .toContainText(message);
  }

  async expectLoginSuccess() {
    await expect(this.page).toHaveURL('/dashboard');
  }

  private async waitForPageLoad() {
    await expect(this.page.locator(this.selectors.form)).toBeVisible();
  }
}

// tests/e2e/auth/login.spec.ts
test('user can login with valid credentials', async ({ page }) => {
  const loginPage = new LoginPage(page);
  
  await loginPage.goto();
  await loginPage.login('user@example.com', 'password123');
  await loginPage.expectLoginSuccess();
});
```

---

## Configuration et Setup ⚙️

### Configuration actuelle dans votre projet

Votre projet a déjà une configuration Playwright solide dans `playwright.config.ts` :

```typescript
export default defineConfig({
  testDir: './tests/e2e',           // Dossier des tests E2E
  fullyParallel: true,              // Tests en parallèle
  retries: process.env.CI ? 2 : 0,  // Retry en CI
  reporter: 'html',                 // Rapport HTML
  
  use: {
    baseURL: 'http://localhost:3000',  // URL de base
    trace: 'on-first-retry',          // Traces pour debug
    screenshot: 'only-on-failure',    // Screenshots d'échec
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
    { name: 'Mobile Safari', use: { ...devices['iPhone 12'] } },
  ],

  webServer: {
    command: 'npm run dev',           // Lance le serveur automatiquement
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### Variables d'environnement pour les tests

Créez un fichier `.env.test` pour les tests :

```env
# Variables spécifiques aux tests E2E
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=test_anon_key
GEMINI_API_KEY=test_gemini_key
NEXTAUTH_URL=http://localhost:3000

# Utilisateurs de test
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=TestPassword123
```

### Scripts package.json

Ajoutez ces scripts à votre `package.json` :

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:report": "playwright show-report"
  }
}
```

---

## Concepts Fondamentaux 🧠

### 1. Locators (Sélecteurs)

Les **locators** sont la façon dont Playwright trouve les éléments dans la page.

#### Types de locators

```javascript
// ✅ Par data-testid (RECOMMANDÉ)
await page.locator('[data-testid="submit-button"]').click();

// ✅ Par role (accessible)
await page.locator('button', { hasText: 'Se connecter' }).click();

// ✅ Par texte
await page.locator('text=Se connecter').click();

// ⚠️ Par classe CSS (fragile)
await page.locator('.btn-primary').click();

// ❌ Par XPath (complexe et fragile)
await page.locator('//button[@class="btn-primary"]').click();
```

#### Locators chaînés et filtrés

```javascript
// Trouver un bouton dans un formulaire spécifique
await page
  .locator('[data-testid="login-form"]')
  .locator('button[type="submit"]')
  .click();

// Filtrer par texte
await page
  .locator('button')
  .filter({ hasText: 'Confirmer' })
  .click();

// Premier/dernier élément
await page.locator('.item').first().click();
await page.locator('.item').last().click();
await page.locator('.item').nth(2).click();
```

### 2. Actions

#### Actions de base

```javascript
// Navigation
await page.goto('/dashboard');
await page.goBack();
await page.reload();

// Saisie de texte
await page.fill('[data-testid="email"]', 'user@example.com');
await page.type('[data-testid="password"]', 'password', { delay: 100 });

// Clics
await page.click('button');
await page.dblclick('button');
await page.hover('button');

// Sélection
await page.selectOption('select', 'option-value');
await page.check('input[type="checkbox"]');
await page.setChecked('input[type="checkbox"]', true);

// Upload de fichier
await page.setInputFiles('input[type="file"]', 'path/to/file.pdf');

// Glisser-déposer
await page.dragAndDrop('[data-testid="source"]', '[data-testid="target"]');
```

#### Actions avancées

```javascript
// Attendre qu'un élément soit visible
await page.waitForSelector('[data-testid="result"]');

// Attendre une navigation
await page.waitForURL('**/dashboard');

// Attendre une réponse API
await page.waitForResponse('**/api/cv/generate');

// Exécuter JavaScript dans la page
const title = await page.evaluate(() => document.title);

// Prendre une screenshot
await page.screenshot({ path: 'example.png', fullPage: true });
```

### 3. Assertions

Playwright utilise `expect` pour les vérifications :

```javascript
// Vérifications d'éléments
await expect(page.locator('h1')).toBeVisible();
await expect(page.locator('h1')).toContainText('Bienvenue');
await expect(page.locator('input')).toHaveValue('test@example.com');
await expect(page.locator('button')).toBeDisabled();

// Vérifications de page
await expect(page).toHaveURL('/dashboard');
await expect(page).toHaveTitle(/CV Genius/);

// Vérifications de comptage: There is exactly 3 elements that has the CSS class cv-item
await expect(page.locator('.cv-item')).toHaveCount(3);

// Vérifications avec timeout personnalisé: The loading sign to be disappear after 10000ms (=10s)
await expect(page.locator('.loading')).toBeHidden({ timeout: 10000 });
```

### 4. Auto-waiting

**Playwright attend automatiquement** que les éléments soient prêts :

```javascript
// ✅ Pas besoin de wait manuel
await page.click('button'); // Attend que le bouton soit cliquable

// ✅ Pas besoin de wait pour les réponses API
await page.fill('input', 'text'); // Attend que l'input soit disponible

// ❌ Éviter les waits manuels (sauf cas spéciaux)
await page.waitForTimeout(5000); // Anti-pattern !
```

---

## Patterns et Bonnes Pratiques 📋

### 1. Data-testid Strategy

#### ✅ Bonnes pratiques

```javascript
// Ajoutez des data-testid dans vos composants
const LoginForm = () => (
  <form data-testid="login-form">
    <input 
      data-testid="email-input"
      type="email" 
    />
    <input 
      data-testid="password-input"
      type="password" 
    />
    <button 
      data-testid="submit-button"
      type="submit"
    >
      Se connecter
    </button>
  </form>
);

// Utilisez-les dans les tests
await page.fill('[data-testid="email-input"]', 'user@example.com');
await page.click('[data-testid="submit-button"]');
```

#### Convention de nommage

```typescript
// Convention : [component]-[element]-[action?]
data-testid="login-form"
data-testid="email-input"
data-testid="submit-button"
data-testid="error-message"
data-testid="cv-upload-zone"
data-testid="experience-add-button"
data-testid="skill-remove-button"
```

### 2. Gestion des données de test

#### Fixtures pour les données

```typescript
// tests/fixtures/test-data.ts
export const testUsers = {
  validUser: {
    email: 'valid@example.com',
    password: 'ValidPassword123',
    name: 'Jean Dupont'
  },
  invalidUser: {
    email: 'invalid@example.com',
    password: 'wrongpassword'
  }
};

export const testCVData = {
  basicCV: {
    personalInfo: {
      name: 'Jean Dupont',
      email: 'jean@example.com',
      phone: '01.23.45.67.89',
      location: 'Paris, France'
    },
    experiences: [
      {
        company: 'Tech Corp',
        position: 'Développeur Full Stack',
        duration: '2020-2023',
        description: 'Développement d\'applications web modernes'
      }
    ]
  }
};
```

#### Utilisation dans les tests

```typescript
import { testUsers, testCVData } from '../fixtures/test-data';

test('user can create CV with valid data', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const dashboardPage = new DashboardPage(page);
  
  await loginPage.goto();
  await loginPage.login(testUsers.validUser.email, testUsers.validUser.password);
  
  await dashboardPage.fillCVForm(testCVData.basicCV);
  await dashboardPage.submitCV();
  
  await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
});
```

### 3. Setup et teardown

#### Hooks de test

```typescript
import { test as base, expect } from '@playwright/test';

// Extended test avec setup automatique
export const test = base.extend({
  authenticatedPage: async ({ page }, use) => {
    // Setup : connexion automatique
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', process.env.TEST_USER_EMAIL);
    await page.fill('[data-testid="password-input"]', process.env.TEST_USER_PASSWORD);
    await page.click('[data-testid="submit-button"]');
    await expect(page).toHaveURL('/dashboard');
    
    // Utilisation dans le test
    await use(page);
    
    // Teardown : nettoyage si nécessaire
    // await cleanupTestData();
  }
});

// Utilisation
test('authenticated user can access dashboard', async ({ authenticatedPage }) => {
  // L'utilisateur est déjà connecté !
  await expect(authenticatedPage.locator('h1')).toContainText('Tableau de bord');
});
```

### 4. Gestion des states

#### Storage state (session persistante)

```typescript
// playwright.config.ts
export default defineConfig({
  projects: [
    // Setup pour créer l'état d'authentification
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    // Tests qui utilisent l'état d'authentification
    {
      name: 'authenticated tests',
      use: { storageState: 'tests/.auth/user.json' },
      dependencies: ['setup'],
    },
  ],
});

// tests/auth.setup.ts
test('authenticate user', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[data-testid="email-input"]', process.env.TEST_USER_EMAIL);
  await page.fill('[data-testid="password-input"]', process.env.TEST_USER_PASSWORD);
  await page.click('[data-testid="submit-button"]');
  
  await expect(page).toHaveURL('/dashboard');
  
  // Sauvegarder l'état d'authentification
  await page.context().storageState({ path: 'tests/.auth/user.json' });
});
```

---

## Tests Pratiques pour CV-Genius 🏠

Maintenant, créons des tests E2E concrets pour votre application CV-Genius :

### 1. Test de Connexion Utilisateur

```typescript
// tests/e2e/auth/login.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Aller à la page de connexion avant chaque test
    await page.goto('/login');
  });

  test('should login with valid credentials', async ({ page }) => {
    // 🎯 OBJECTIF: Vérifier qu'un utilisateur peut se connecter avec des identifiants valides
    
    // ✅ ÉTAPE 1: Vérifier que la page de connexion s'affiche correctement
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
    await expect(page.locator('h1')).toContainText('Connexion');
    
    // ✅ ÉTAPE 2: Remplir le formulaire de connexion
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'ValidPassword123');
    
    // ✅ ÉTAPE 3: Vérifier que les valeurs sont bien saisies
    await expect(page.locator('[data-testid="email-input"]')).toHaveValue('test@example.com');
    await expect(page.locator('[data-testid="password-input"]')).toHaveValue('ValidPassword123');
    
    // ✅ ÉTAPE 4: Soumettre le formulaire
    await page.click('[data-testid="submit-button"]');
    
    // ✅ ÉTAPE 5: Vérifier l'état de chargement
    await expect(page.locator('[data-testid="submit-button"]')).toBeDisabled();
    await expect(page.locator('[data-testid="submit-button"]')).toContainText('Connexion...');
    
    // ✅ ÉTAPE 6: Attendre la redirection vers le dashboard
    await expect(page).toHaveURL('/dashboard');
    
    // ✅ ÉTAPE 7: Vérifier que l'utilisateur est bien sur le dashboard
    await expect(page.locator('h1')).toContainText('Tableau de bord');
  });

  test('should show error with invalid credentials', async ({ page }) => {
    // 🎯 OBJECTIF: Vérifier la gestion d'erreur pour des identifiants invalides
    
    await page.fill('[data-testid="email-input"]', 'invalid@example.com');
    await page.fill('[data-testid="password-input"]', 'wrongpassword');
    await page.click('[data-testid="submit-button"]');
    
    // ✅ Vérifier l'affichage du message d'erreur
    await expect(page.locator('[role="alert"]')).toBeVisible();
    await expect(page.locator('[role="alert"]')).toContainText('Email ou mot de passe incorrect');
    
    // ✅ Vérifier que l'utilisateur reste sur la page de connexion
    await expect(page).toHaveURL('/login');
  });

  test('should validate required fields', async ({ page }) => {
    // 🎯 OBJECTIF: Vérifier la validation côté client
    
    // Tenter de soumettre sans rien remplir
    await page.click('[data-testid="submit-button"]');
    
    // Les champs email et password sont "required" en HTML5
    // Le navigateur empêche la soumission
    await expect(page).toHaveURL('/login'); // Reste sur la page
  });
});
```

### 2. Test du Workflow CV Complet

```typescript
// tests/e2e/dashboard/cv-workflow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('CV Creation Workflow', () => {
  // Setup: Connexion automatique avant chaque test
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'ValidPassword123');
    await page.click('[data-testid="submit-button"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should create CV from manual data entry', async ({ page }) => {
    // 🎯 OBJECTIF: Tester la création complète d'un CV en saisissant les données manuellement
    
    // ✅ ÉTAPE 1: Vérifier l'affichage initial du dashboard
    await expect(page.locator('h1')).toContainText('Tableau de bord');
    await expect(page.locator('[data-testid="cv-form"]')).toBeVisible();
    
    // ✅ ÉTAPE 2: Remplir les informations personnelles
    await page.fill('[data-testid="name-input"]', 'Jean Dupont');
    await page.fill('[data-testid="email-input"]', 'jean.dupont@example.com');
    await page.fill('[data-testid="phone-input"]', '01.23.45.67.89');
    await page.fill('[data-testid="location-input"]', 'Paris, France');
    
    // ✅ ÉTAPE 3: Ajouter une expérience professionnelle
    await page.click('[data-testid="add-experience-button"]');
    
    // Remplir la première expérience
    await page.fill('[data-testid="experience-0-company"]', 'Tech Solutions');
    await page.fill('[data-testid="experience-0-position"]', 'Développeur Full Stack');
    await page.fill('[data-testid="experience-0-duration"]', '2020-2023');
    await page.fill('[data-testid="experience-0-description"]', 
      'Développement d\'applications web avec React et Node.js');
    
    // ✅ ÉTAPE 4: Ajouter une formation
    await page.click('[data-testid="add-education-button"]');
    await page.fill('[data-testid="education-0-school"]', 'Université de Paris');
    await page.fill('[data-testid="education-0-degree"]', 'Master Informatique');
    await page.fill('[data-testid="education-0-year"]', '2018-2020');
    
    // ✅ ÉTAPE 5: Ajouter des compétences
    await page.click('[data-testid="add-skill-button"]');
    await page.fill('[data-testid="skill-0-name"]', 'JavaScript');
    await page.selectOption('[data-testid="skill-0-level"]', 'Avancé');
    
    await page.click('[data-testid="add-skill-button"]');
    await page.fill('[data-testid="skill-1-name"]', 'React');
    await page.selectOption('[data-testid="skill-1-level"]', 'Avancé');
    
    // ✅ ÉTAPE 6: Ajouter des langues
    await page.click('[data-testid="add-language-button"]');
    await page.fill('[data-testid="language-0-name"]', 'Français');
    await page.selectOption('[data-testid="language-0-level"]', 'Natif');
    
    // ✅ ÉTAPE 7: Générer le CV avec l'IA
    await page.click('[data-testid="generate-cv-button"]');
    
    // ✅ ÉTAPE 8: Vérifier l'ouverture du modal de génération
    await expect(page.locator('[data-testid="generation-modal"]')).toBeVisible();
    await expect(page.locator('text=Génération en cours')).toBeVisible();
    
    // ✅ ÉTAPE 9: Vérifier les étapes de progression
    await expect(page.locator('[data-testid="step-validation"]')).toContainText('Validation');
    await expect(page.locator('[data-testid="step-ai-improvement"]')).toContainText('Amélioration IA');
    
    // ✅ ÉTAPE 10: Attendre la fin de la génération (timeout généreux pour l'IA)
    await expect(page.locator('[data-testid="generation-success"]')).toBeVisible({ timeout: 30000 });
    
    // ✅ ÉTAPE 11: Vérifier que le PDF est généré (download automatique)
    const downloadPromise = page.waitForEvent('download');
    await downloadPromise;
    
    // ✅ ÉTAPE 12: Fermer le modal
    await page.click('[data-testid="close-modal-button"]');
    await expect(page.locator('[data-testid="generation-modal"]')).toBeHidden();
  });

  test('should upload and parse PDF CV', async ({ page }) => {
    // 🎯 OBJECTIF: Tester l'upload et le parsing d'un CV PDF existant
    
    // ✅ ÉTAPE 1: Vérifier la zone d'upload
    await expect(page.locator('[data-testid="file-upload-zone"]')).toBeVisible();
    
    // ✅ ÉTAPE 2: Simuler l'upload d'un fichier PDF
    // Note: Vous devez avoir un fichier de test dans tests/fixtures/
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/fixtures/sample-cv.pdf');
    
    // ✅ ÉTAPE 3: Vérifier que le fichier est uploadé
    await expect(page.locator('[data-testid="uploaded-file-name"]')).toContainText('sample-cv.pdf');
    
    // ✅ ÉTAPE 4: Attendre le parsing automatique
    await expect(page.locator('[data-testid="parsing-progress"]')).toBeVisible();
    await expect(page.locator('[data-testid="parsing-complete"]')).toBeVisible({ timeout: 15000 });
    
    // ✅ ÉTAPE 5: Vérifier que les données sont pré-remplies
    await expect(page.locator('[data-testid="name-input"]')).not.toHaveValue('');
    await expect(page.locator('[data-testid="email-input"]')).not.toHaveValue('');
    
    // ✅ ÉTAPE 6: Vérifier qu'au moins une expérience est ajoutée
    await expect(page.locator('[data-testid="experience-0-company"]')).toBeVisible();
  });

  test('should handle errors gracefully', async ({ page }) => {
    // 🎯 OBJECTIF: Vérifier la gestion d'erreur
    
    // Tenter de générer un CV sans données minimales
    await page.click('[data-testid="generate-cv-button"]');
    
    // Vérifier l'affichage du toast d'erreur
    await expect(page.locator('[data-testid="error-toast"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-toast"]')).toContainText('Nom et email requis');
  });
});
```

### 3. Test de Navigation et Header

```typescript
// tests/e2e/navigation/header.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Header Navigation', () => {
  test('should navigate correctly when not authenticated', async ({ page }) => {
    // 🎯 OBJECTIF: Tester la navigation pour un utilisateur non connecté
    
    await page.goto('/');
    
    // ✅ Vérifier les liens présents
    await expect(page.locator('[data-testid="login-link"]')).toBeVisible();
    await expect(page.locator('[data-testid="register-link"]')).toBeVisible();
    
    // ✅ Tester navigation vers login
    await page.click('[data-testid="login-link"]');
    await expect(page).toHaveURL('/login');
    
    // ✅ Retourner à l'accueil et tester navigation vers register
    await page.goto('/');
    await page.click('[data-testid="register-link"]');
    await expect(page).toHaveURL('/register');
  });

  test('should show user menu when authenticated', async ({ page }) => {
    // 🎯 OBJECTIF: Tester la navigation pour un utilisateur connecté
    
    // Connexion
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'ValidPassword123');
    await page.click('[data-testid="submit-button"]');
    await expect(page).toHaveURL('/dashboard');
    
    // ✅ Vérifier le menu utilisateur
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    await expect(page.locator('[data-testid="dashboard-link"]')).toBeVisible();
    await expect(page.locator('[data-testid="logout-button"]')).toBeVisible();
    
    // ✅ Tester la déconnexion
    await page.click('[data-testid="logout-button"]');
    await expect(page).toHaveURL('/');
    await expect(page.locator('[data-testid="login-link"]')).toBeVisible();
  });
});
```

### 4. Tests de Régression (Smoke Tests)

```typescript
// tests/e2e/smoke/critical-paths.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Smoke Tests - Critical Paths', () => {
  test('complete user journey from registration to CV generation', async ({ page }) => {
    // 🎯 OBJECTIF: Test de bout en bout du parcours utilisateur critique
    
    // ✅ ÉTAPE 1: Inscription
    await page.goto('/register');
    
    const timestamp = Date.now();
    const testEmail = `test${timestamp}@example.com`;
    
    await page.fill('[data-testid="email-input"]', testEmail);
    await page.fill('[data-testid="password-input"]', 'TestPassword123');
    await page.fill('[data-testid="confirm-password-input"]', 'TestPassword123');
    await page.click('[data-testid="submit-button"]');
    
    // ✅ ÉTAPE 2: Vérification de l'inscription
    await expect(page).toHaveURL('/dashboard');
    
    // ✅ ÉTAPE 3: Création rapide d'un CV
    await page.fill('[data-testid="name-input"]', 'Test User');
    await page.fill('[data-testid="email-input"]', testEmail);
    
    // ✅ ÉTAPE 4: Génération du CV
    await page.click('[data-testid="generate-cv-button"]');
    await expect(page.locator('[data-testid="generation-modal"]')).toBeVisible();
    
    // ✅ ÉTAPE 5: Attendre le succès (timeout généreux)
    await expect(page.locator('[data-testid="generation-success"]')).toBeVisible({ timeout: 30000 });
  });

  test('all critical pages load correctly', async ({ page }) => {
    // 🎯 OBJECTIF: Vérifier que toutes les pages critiques se chargent
    
    const criticalPages = ['/', '/login', '/register'];
    
    for (const pagePath of criticalPages) {
      await page.goto(pagePath);
      
      // Vérifier qu'il n'y a pas d'erreur JavaScript
      page.on('pageerror', (error) => {
        throw new Error(`Page error on ${pagePath}: ${error.message}`);
      });
      
      // Vérifier que la page se charge (pas d'erreur 404/500)
      expect(page.url()).toContain(pagePath);
    }
  });
});
```

---

## Debugging et Maintenance 🔧

### 1. Outils de Debug

#### Playwright Inspector
```bash
# Lancer en mode debug
npm run test:e2e:debug

# Ou pour un test spécifique
npx playwright test login.spec.ts --debug
```

#### Mode headless vs headed
```bash
# Voir le navigateur pendant les tests
npm run test:e2e:headed

# Mode normal (headless)
npm run test:e2e
```

#### UI Mode (interface graphique)
```bash
# Interface graphique pour explorer les tests
npm run test:e2e:ui
```

### 2. Screenshots et Traces

#### Screenshots automatiques
```typescript
test('example with screenshot', async ({ page }) => {
  await page.goto('/dashboard');
  
  // Screenshot manuel à un moment précis
  await page.screenshot({ path: 'dashboard-state.png' });
  
  // Les screenshots d'échec sont automatiques avec votre config
});
```

#### Traces pour debug
```typescript
// playwright.config.ts
use: {
  trace: 'on-first-retry', // Trace seulement en cas d'échec
  // ou
  trace: 'on', // Trace pour tous les tests (plus lourd)
}
```

#### Voir les traces après échec
```bash
npm run test:e2e:report
# Cliquer sur un test échoué pour voir la trace complète
```

### 3. Gestion des Tests Flaky

#### Retry strategy
```typescript
// playwright.config.ts
export default defineConfig({
  retries: process.env.CI ? 3 : 1, // Plus de retries en CI
});

// Retry pour un test spécifique
test('flaky test', async ({ page }) => {
  // ... test
});
test.describe.configure({ retries: 3 });
```

#### Timeouts personnalisés
```typescript
test('slow operation', async ({ page }) => {
  // Timeout spécifique pour ce test
  test.setTimeout(60000); // 60 secondes
  
  // Timeout pour une action spécifique
  await expect(page.locator('[data-testid="result"]')).toBeVisible({ timeout: 30000 });
});
```

#### Attentes plus robustes
```typescript
// ❌ Fragile
await page.waitForTimeout(5000);

// ✅ Robuste
await page.waitForResponse('**/api/cv/generate');
await expect(page.locator('[data-testid="success"]')).toBeVisible();
```

---

## CI/CD et Automatisation ⚙️

### 1. GitHub Actions

Créez `.github/workflows/e2e-tests.yml` :

```yaml
name: E2E Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  e2e-tests:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Install Playwright browsers
      run: npx playwright install --with-deps
    
    - name: Setup test environment
      run: |
        cp .env.example .env.local
        echo "GEMINI_API_KEY=${{ secrets.GEMINI_API_KEY }}" >> .env.local
    
    - name: Run E2E tests
      run: npm run test:e2e
      env:
        CI: true
    
    - name: Upload test results
      uses: actions/upload-artifact@v3
      if: failure()
      with:
        name: playwright-report
        path: playwright-report/
```

### 2. Tests par environnement

```typescript
// tests/e2e/config/environments.ts
export const environments = {
  development: {
    baseURL: 'http://localhost:3000',
    user: { email: 'dev@example.com', password: 'devpass' }
  },
  staging: {
    baseURL: 'https://staging.cv-genius.com',
    user: { email: 'staging@example.com', password: 'stagingpass' }
  },
  production: {
    baseURL: 'https://cv-genius.com',
    user: { email: 'prod@example.com', password: 'prodpass' }
  }
};

// playwright.config.ts
const environment = process.env.TEST_ENV || 'development';
const config = environments[environment];

export default defineConfig({
  use: {
    baseURL: config.baseURL,
  },
});
```

### 3. Rapports et métriques

#### Reporter personnalisé
```typescript
// playwright.config.ts
export default defineConfig({
  reporter: [
    ['html'], // Rapport HTML local
    ['github'], // Annotations GitHub (en CI)
    ['junit', { outputFile: 'test-results/junit.xml' }], // Pour CI/CD
  ],
});
```

#### Métriques de performance
```typescript
test('performance check', async ({ page }) => {
  const startTime = Date.now();
  
  await page.goto('/dashboard');
  await expect(page.locator('h1')).toBeVisible();
  
  const loadTime = Date.now() - startTime;
  
  // Vérifier que la page se charge en moins de 3 secondes
  expect(loadTime).toBeLessThan(3000);
});
```

---

## Résumé et Prochaines Étapes 🎯

### Ce que vous avez appris

1. **Concepts E2E** : Différence avec tests unitaires/intégration
2. **Playwright** : Configuration, locators, actions, assertions
3. **Page Object Model** : Organisation et maintenabilité
4. **Tests pratiques** : Login, CV workflow, navigation
5. **Debug et maintenance** : Outils, traces, tests flaky
6. **CI/CD** : Automatisation et déploiement

### Checklist pour commencer

- [ ] ✅ Configuration Playwright (déjà fait)
- [ ] 📁 Créer la structure `tests/e2e/`
- [ ] 🏷️ Ajouter des `data-testid` aux composants critiques
- [ ] 📝 Écrire le premier test (login)
- [ ] 🚀 Lancer et débugger
- [ ] 📊 Intégrer dans CI/CD

### Tests prioritaires à implémenter

1. **Critique** : Login, registration, CV generation
2. **Important** : Navigation, file upload, error handling
3. **Nice-to-have** : Mobile responsiveness, performance

### Resources supplémentaires

- [Documentation Playwright](https://playwright.dev/)
- [Best Practices Playwright](https://playwright.dev/docs/best-practices)
- [Page Object Model](https://playwright.dev/docs/test-pom)

Vous êtes maintenant prêt à créer des tests E2E robustes pour CV-Genius ! 🚀 