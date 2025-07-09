# 🧪 Guide Complet des Tests - CV Genius

## 📚 Table des Matières
1. [Introduction aux Tests](#introduction)
2. [La Pyramide des Tests](#pyramide)
3. [Configuration](#configuration)
4. [Tests Unitaires](#unitaires)
5. [Tests d'Intégration](#integration)
6. [Tests E2E](#e2e)
7. [Bonnes Pratiques](#bonnes-pratiques)

---

## 🎯 Introduction aux Tests {#introduction}

### Pourquoi tester ?

Les tests sont **essentiels** dans le développement moderne pour :

- **🔒 Fiabilité** : Éviter les bugs en production
- **🚀 Confiance** : Déployer sans stress
- **🛠️ Maintenance** : Refactorer sans casser
- **📖 Documentation** : Comprendre le comportement attendu
- **👥 Collaboration** : Travail en équipe sécurisé

### Types de problèmes détectés

```javascript
// ❌ Bug détecté par les tests
function calculateDiscount(price, percentage) {
  return price * percentage; // Oups! Devrait être price * (percentage/100)
}

// ✅ Test qui aurait détecté le bug
test('should calculate 10% discount correctly', () => {
  expect(calculateDiscount(100, 10)).toBe(10); // Échoue!
});
```

---

## 🔺 La Pyramide des Tests {#pyramide}

### Structure Théorique

```
       🌐 E2E (10%)
      /____________\     Lents, coûteux, fragiles
     /              \    Testent l'expérience utilisateur
    /________________\
   /🔗 Integration (20%)\  Moyennement rapides
  /__________________\    Testent les interactions
 /                    \
/🧩 Unit Tests (70%)  \   Rapides, fiables, isolés
\____________________/    Testent la logique métier
```

### Répartition pour CV Genius

| Type | % | Vitesse | Coût | Objectif |
|------|---|---------|------|----------|
| **Unit** | 70% | ⚡ <1s | 💰 Faible | Logique pure |
| **Integration** | 20% | 🚀 <10s | 💰💰 Moyen | APIs/DB |
| **E2E** | 10% | 🐌 >30s | 💰💰💰 Élevé | UX complète |

---

## ⚙️ Configuration {#configuration}

### Jest (Tests Unitaires)

```javascript
// jest.config.js
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};

module.exports = createJestConfig(customJestConfig);
```

### Playwright (Tests E2E)

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

---

## 🧩 Tests Unitaires {#unitaires}

### Principe : Tests Isolés

Les tests unitaires testent **une seule fonction/composant** de manière **isolée**.

### Exemple : Hook d'Authentification

```typescript
// hooks/useAuthForm.ts
export function useAuthForm(mode: 'login' | 'register') {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const authFunction = mode === 'login' ? signIn : signUp;
      const { error } = await authFunction(email, password);
      
      if (error) {
        setError(error.message);
      } else {
        // Succès
        router.push(mode === 'login' ? '/dashboard' : '/login');
      }
    } catch (err) {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return { email, setEmail, password, setPassword, error, loading, handleSubmit };
}
```

### Test du Hook

```typescript
// tests/hooks/useAuthForm.test.ts
import { renderHook, act } from '@testing-library/react';
import { useAuthForm } from '@/hooks/useAuthForm';
import * as supabaseClient from '@/lib/supabase/client';

// 🎭 Mock des dépendances externes
jest.mock('@/lib/supabase/client');
jest.mock('next/navigation');

const mockSignIn = jest.mocked(supabaseClient.signIn);
const mockRouter = { push: jest.fn() };

describe('useAuthForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  describe('Initialisation', () => {
    it('doit initialiser avec des valeurs vides', () => {
      const { result } = renderHook(() => useAuthForm('login'));
      
      expect(result.current.email).toBe('');
      expect(result.current.password).toBe('');
      expect(result.current.error).toBe('');
      expect(result.current.loading).toBe(false);
    });
  });

  describe('Gestion des états', () => {
    it('doit mettre à jour l\'email', () => {
      const { result } = renderHook(() => useAuthForm('login'));
      
      act(() => {
        result.current.setEmail('test@example.com');
      });
      
      expect(result.current.email).toBe('test@example.com');
    });

    it('doit afficher l\'état de chargement pendant la soumission', async () => {
      mockSignIn.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ error: null }), 100))
      );
      
      const { result } = renderHook(() => useAuthForm('login'));
      
      act(() => {
        result.current.setEmail('test@example.com');
        result.current.setPassword('password123');
      });

      // Démarrer la soumission
      act(() => {
        result.current.handleSubmit({ preventDefault: jest.fn() } as any);
      });

      // Vérifier l'état de chargement
      expect(result.current.loading).toBe(true);

      // Attendre la fin
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 150));
      });

      expect(result.current.loading).toBe(false);
    });
  });

  describe('Gestion des erreurs', () => {
    it('doit afficher les erreurs d\'authentification', async () => {
      mockSignIn.mockResolvedValue({ 
        error: { message: 'Invalid credentials' } 
      });
      
      const { result } = renderHook(() => useAuthForm('login'));
      
      await act(async () => {
        await result.current.handleSubmit({ preventDefault: jest.fn() } as any);
      });

      expect(result.current.error).toBe('Invalid credentials');
    });

    it('doit gérer les erreurs réseau', async () => {
      mockSignIn.mockRejectedValue(new Error('Network error'));
      
      const { result } = renderHook(() => useAuthForm('login'));
      
      await act(async () => {
        await result.current.handleSubmit({ preventDefault: jest.fn() } as any);
      });

      expect(result.current.error).toBe('Erreur de connexion');
    });
  });

  describe('Navigation', () => {
    it('doit rediriger vers dashboard après connexion réussie', async () => {
      mockSignIn.mockResolvedValue({ error: null });
      
      const { result } = renderHook(() => useAuthForm('login'));
      
      await act(async () => {
        await result.current.handleSubmit({ preventDefault: jest.fn() } as any);
      });

      expect(mockRouter.push).toHaveBeenCalledWith('/dashboard');
    });

    it('doit rediriger vers login après inscription réussie', async () => {
      mockSignUp.mockResolvedValue({ error: null });
      
      const { result } = renderHook(() => useAuthForm('register'));
      
      await act(async () => {
        await result.current.handleSubmit({ preventDefault: jest.fn() } as any);
      });

      expect(mockRouter.push).toHaveBeenCalledWith('/login');
    });
  });
});
```

### Test de Composant

```typescript
// tests/components/LoginPage.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginPage from '@/app/(auth)/login/page';
import { useAuthForm } from '@/hooks/useAuthForm';

// Mock du hook
jest.mock('@/hooks/useAuthForm');
const mockUseAuthForm = jest.mocked(useAuthForm);

describe('LoginPage', () => {
  const mockAuthForm = {
    email: '',
    setEmail: jest.fn(),
    password: '',
    setPassword: jest.fn(),
    error: '',
    loading: false,
    handleSubmit: jest.fn(),
  };

  beforeEach(() => {
    mockUseAuthForm.mockReturnValue(mockAuthForm);
  });

  it('doit afficher le formulaire de connexion', () => {
    render(<LoginPage />);
    
    expect(screen.getByRole('heading', { name: 'Connexion' })).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Mot de passe')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Se connecter' })).toBeInTheDocument();
  });

  it('doit appeler setEmail quand l\'utilisateur tape', () => {
    render(<LoginPage />);
    
    const emailInput = screen.getByLabelText('Email');
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    
    expect(mockAuthForm.setEmail).toHaveBeenCalledWith('test@example.com');
  });

  it('doit afficher l\'état de chargement', () => {
    mockUseAuthForm.mockReturnValue({
      ...mockAuthForm,
      loading: true,
    });
    
    render(<LoginPage />);
    
    expect(screen.getByText('Connexion...')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('doit afficher les erreurs', () => {
    mockUseAuthForm.mockReturnValue({
      ...mockAuthForm,
      error: 'Email ou mot de passe incorrect',
    });
    
    render(<LoginPage />);
    
    expect(screen.getByText('Email ou mot de passe incorrect')).toBeInTheDocument();
  });
});
```

---

## 🔗 Tests d'Intégration {#integration}

### Principe : Tests d'Interactions

Les tests d'intégration vérifient que **plusieurs composants fonctionnent ensemble**.

### Test API + Base de Données

```typescript
// tests/integration/auth-flow.integration.test.ts
import { createClient } from '@supabase/supabase-js';
import { signIn, signUp } from '@/lib/supabase/client';

// Utilisation de la vraie base de données de test
const supabaseTest = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_TEST_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_TEST_ANON_KEY!
);

describe('Auth Integration', () => {
  beforeEach(async () => {
    // Nettoyer la base de test
    await supabaseTest.auth.signOut();
  });

  describe('Inscription complète', () => {
    it('doit créer un utilisateur et l\'enregistrer en base', async () => {
      const testEmail = `test-${Date.now()}@example.com`;
      const testPassword = 'TestPassword123!';

      // 1. Inscription
      const { data, error } = await signUp(testEmail, testPassword);
      
      expect(error).toBeNull();
      expect(data.user).toBeTruthy();
      expect(data.user?.email).toBe(testEmail);

      // 2. Vérifier en base
      const { data: users } = await supabaseTest
        .from('auth.users')
        .select('*')
        .eq('email', testEmail);
      
      expect(users).toHaveLength(1);
    });

    it('doit rejeter les mots de passe faibles', async () => {
      const { error } = await signUp('test@example.com', '123');
      
      expect(error).toBeTruthy();
      expect(error?.message).toContain('Password');
    });
  });

  describe('Connexion complète', () => {
    it('doit connecter un utilisateur existant', async () => {
      // Prérequis : utilisateur existant
      const testEmail = 'existing-user@example.com';
      const testPassword = 'ExistingPassword123!';
      
      await signUp(testEmail, testPassword);

      // Test de connexion
      const { data, error } = await signIn(testEmail, testPassword);
      
      expect(error).toBeNull();
      expect(data.session).toBeTruthy();
      expect(data.user?.email).toBe(testEmail);

      // Vérifier la session
      const { data: session } = await supabaseTest.auth.getSession();
      expect(session.session).toBeTruthy();
    });

    it('doit rejeter les mauvais identifiants', async () => {
      const { error } = await signIn('wrong@example.com', 'wrongpassword');
      
      expect(error).toBeTruthy();
      expect(error?.message).toContain('Invalid');
    });
  });
});
```

### Test de Flux Complet

```typescript
// tests/integration/cv-generation-flow.integration.test.ts
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { createMockRouter } from '@/__mocks__/next/router';
import CVBuilder from '@/app/cv-builder/page';

describe('CV Generation Flow', () => {
  it('doit générer un CV de bout en bout', async () => {
    // 1. Rendu de la page
    render(<CVBuilder />);
    
    // 2. Saisie des données
    fireEvent.change(screen.getByLabelText('Nom'), {
      target: { value: 'John Doe' }
    });
    
    fireEvent.change(screen.getByLabelText('Expérience'), {
      target: { value: 'Développeur chez TechCorp depuis 2020' }
    });

    // 3. Génération IA
    fireEvent.click(screen.getByText('Générer avec IA'));
    
    // 4. Attendre le résultat
    await waitFor(() => {
      expect(screen.getByText('CV généré avec succès')).toBeInTheDocument();
    }, { timeout: 10000 });

    // 5. Vérifier le contenu généré
    expect(screen.getByText(/John Doe/)).toBeInTheDocument();
    expect(screen.getByText(/Développeur expérimenté/)).toBeInTheDocument();
  });
});
```

---

## 🌐 Tests E2E (End-to-End) {#e2e}

### Principe : Tests Utilisateur Réel

Les tests E2E simulent un **utilisateur réel** utilisant l'application complète.

### Parcours d'Authentification

```typescript
// tests/e2e/auth-complete-flow.e2e.ts
import { test, expect } from '@playwright/test';

test.describe('Parcours d\'authentification complet', () => {
  test('inscription → confirmation → connexion → dashboard', async ({ page }) => {
    const timestamp = Date.now();
    const testEmail = `e2e-test-${timestamp}@example.com`;
    const testPassword = 'E2ETestPassword123!';

    // 1. 🏠 Page d'accueil
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('CV Genius');

    // 2. 📝 Inscription
    await page.click('text=S\'inscrire');
    await expect(page).toHaveURL('/register');
    
    await page.fill('[data-testid="email-input"]', testEmail);
    await page.fill('[data-testid="password-input"]', testPassword);
    await page.click('button[type="submit"]');

    // 3. ✅ Confirmation d'inscription
    await expect(page.locator('text=Compte créé avec succès')).toBeVisible();
    await expect(page).toHaveURL('/login');

    // 4. 🔐 Connexion
    await page.fill('[data-testid="email-input"]', testEmail);
    await page.fill('[data-testid="password-input"]', testPassword);
    await page.click('button[type="submit"]');

    // 5. 🎯 Dashboard
    await expect(page.locator('text=Connexion réussie')).toBeVisible();
    await expect(page).toHaveURL('/dashboard');
    
    // 6. 👤 Vérifier interface utilisateur connecté
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    await expect(page.locator('text=Créer un CV')).toBeVisible();
  });

  test('gestion des erreurs de connexion', async ({ page }) => {
    await page.goto('/login');
    
    // Identifiants incorrects
    await page.fill('[data-testid="email-input"]', 'wrong@example.com');
    await page.fill('[data-testid="password-input"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Vérifier l'erreur
    await expect(page.locator('[role="alert"]')).toContainText('Invalid');
    await expect(page).toHaveURL('/login'); // Reste sur login
  });
});
```

### Test de Performance

```typescript
// tests/e2e/performance.e2e.ts
test('performance de chargement des pages', async ({ page }) => {
  // Mesurer le temps de chargement
  const startTime = Date.now();
  await page.goto('/');
  const loadTime = Date.now() - startTime;

  // Assertions de performance
  expect(loadTime).toBeLessThan(3000); // < 3 secondes

  // Vérifier les métriques Web Vitals
  const metrics = await page.evaluate(() => {
    return new Promise((resolve) => {
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        resolve(entries.map(entry => ({
          name: entry.name,
          value: entry.value
        })));
      }).observe({ entryTypes: ['measure'] });
    });
  });

  // Assertions sur les métriques
  const lcp = metrics.find(m => m.name === 'LCP');
  expect(lcp?.value).toBeLessThan(2500); // LCP < 2.5s
});
```

### Tests Responsive

```typescript
test('responsivité mobile', async ({ page }) => {
  // Simuler un iPhone
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/login');

  // Vérifier l'adaptation mobile
  const form = page.locator('form');
  const formWidth = await form.evaluate(el => 
    window.getComputedStyle(el).maxWidth
  );
  
  expect(formWidth).toBe('448px'); // max-w-md en Tailwind

  // Tester la navigation mobile
  const emailInput = page.locator('[data-testid="email-input"]');
  await expect(emailInput).toBeVisible();
  
  // Vérifier que les inputs sont tactiles
  await emailInput.tap();
  await expect(emailInput).toBeFocused();
});
```

---

## ✅ Bonnes Pratiques {#bonnes-pratiques}

### Structure des Tests

```
tests/
├── 🧩 unit/                    # Tests unitaires (70%)
│   ├── components/
│   │   ├── Button.test.tsx
│   │   └── AuthForm.test.tsx
│   ├── hooks/
│   │   └── useAuthForm.test.ts
│   └── utils/
│       └── validation.test.ts
├── 🔗 integration/             # Tests d'intégration (20%)
│   ├── api/
│   │   └── auth.integration.test.ts
│   └── flows/
│       └── cv-generation.integration.test.ts
└── 🌐 e2e/                     # Tests E2E (10%)
    ├── auth-flow.e2e.ts
    └── cv-builder.e2e.ts
```

### Nommage des Tests

```typescript
// ✅ Bon : Descriptif et précis
describe('useAuthForm avec mode login', () => {
  it('doit rediriger vers /dashboard après connexion réussie', () => {
    // ...
  });
  
  it('doit afficher une erreur si l\'email est invalide', () => {
    // ...
  });
});

// ❌ Mauvais : Vague et technique
describe('useAuthForm', () => {
  it('should work', () => {
    // ...
  });
});
```

### Arrangement AAA

```typescript
// ✅ Arrange - Act - Assert
test('doit calculer le total avec remise', () => {
  // 🎯 Arrange : Préparer les données
  const price = 100;
  const discount = 10;
  
  // 🎬 Act : Exécuter l'action
  const result = calculateDiscountedPrice(price, discount);
  
  // ✅ Assert : Vérifier le résultat
  expect(result).toBe(90);
});
```

### Mocks Intelligents

```typescript
// ✅ Mock seulement ce qui est nécessaire
jest.mock('@/lib/supabase/client', () => ({
  signIn: jest.fn(),
  signUp: jest.fn(),
  // Ne pas mocker getCurrentUser si pas utilisé
}));

// ❌ Over-mocking
jest.mock('@/lib/supabase/client');
```

### Tests de Régression

```typescript
// ✅ Tester les bugs corrigés
test('REGRESSION: doit gérer les emails avec +', () => {
  // Bug #123 : emails avec + causaient une erreur
  const email = 'user+test@example.com';
  
  expect(() => validateEmail(email)).not.toThrow();
  expect(validateEmail(email)).toBe(true);
});
```

---

## 🚀 Scripts de Test

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:unit": "jest tests/unit",
    "test:integration": "jest tests/integration",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:all": "npm run test:unit && npm run test:integration && npm run test:e2e",
    "test:ci": "npm run test:coverage && npm run test:e2e"
  }
}
```

---

## 📈 Métriques de Qualité

### Couverture de Code
- **Lignes** : >80%
- **Fonctions** : >80%  
- **Branches** : >75%

### Performance des Tests
- **Unit** : <1s par test
- **Integration** : <10s par test
- **E2E** : <60s par scénario

### Fiabilité
- **Flakiness** : <1% (tests instables)
- **Temps total** : <5min pour la suite complète

---

## 🎓 Exercices Pratiques

### Niveau Débutant
1. Écrire un test unitaire pour `validatePassword()`
2. Tester le composant `Button` avec différents props
3. Mocker un appel API simple

### Niveau Intermédiaire  
1. Créer un test d'intégration pour le flow d'inscription
2. Tester un hook custom avec état complexe
3. Implémenter des tests de snapshot

### Niveau Avancé
1. Écrire un test E2E pour le parcours CV complet
2. Créer des tests de performance avec métriques
3. Implémenter des tests de sécurité (XSS, CSRF)

---

**🎯 L'objectif : Une application robuste, fiable et maintenable !** 