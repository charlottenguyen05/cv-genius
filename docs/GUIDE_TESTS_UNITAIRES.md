# Guide Complet des Tests Unitaires dans Next.js

## 🏗️ La Pyramide des Tests

La pyramide des tests est un concept fondamental qui guide comment structurer vos tests :

```
    /\
   /  \     Tests E2E (End-to-End)
  /____\    ↑ Moins nombreux, plus lents, plus chers
 /      \   
/        \  Tests d'Intégration  
\________/  ↑ Quantité moyenne, complexité moyenne
\          /
 \        /  Tests Unitaires
  \______/   ↑ Nombreux, rapides, bon marché
```

### Pourquoi cette structure ?

1. **Tests Unitaires (Base de la pyramide)** : 70-80%
   - ✅ **Rapides** : Millisecondes d'exécution
   - ✅ **Fiables** : Résultats déterministes
   - ✅ **Isolation** : Testent une seule unité de code
   - ✅ **Feedback rapide** : Détectent les erreurs immédiatement
   - ✅ **Bon marché** : Faciles à écrire et maintenir

2. **Tests d'Intégration (Milieu)** : 15-25%
   - Testent l'interaction entre plusieurs composants
   - Plus lents mais couvrent les interactions réelles

3. **Tests E2E (Sommet)** : 5-10%
   - Testent l'application complète du point de vue utilisateur
   - Très lents mais couvrent les scenarios complets

## 🧪 Types de Tests Unitaires

### 1. Tests de Fonctions Utilitaires

**Quand les utiliser :**
- Fonctions pures (même entrée → même sortie)
- Logique métier (validation, calculs, formatage)
- Utilitaires génériques

**Exemple :** `validatePassword`, `formatDate`, `calculateTotal`

**Structure AAA :**
```typescript
// ARRANGE : Préparer les données
const password = "InvalidPass";

// ACT : Exécuter la fonction
const result = validatePassword(password);

// ASSERT : Vérifier le résultat
expect(result.isValid).toBe(false);
```

### 2. Tests de Composants React

**Quand les utiliser :**
- Vérifier le rendu des composants
- Tester les interactions utilisateur
- Valider les props et états
- Vérifier l'accessibilité

**Outils principaux :**
```typescript
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
```

**Pattern de test :**
```typescript
// 1. Render le composant
render(<Button onClick={mockFn}>Click me</Button>);

// 2. Trouver l'élément (par rôle ARIA recommandé)
const button = screen.getByRole("button", { name: /click me/i });

// 3. Interagir (si nécessaire)
await userEvent.click(button);

// 4. Vérifier le comportement
expect(mockFn).toHaveBeenCalled();
```

### 3. Tests de Hooks Personnalisés

**Quand les utiliser :**
- Logique d'état complexe
- Effets de bord (API, localStorage)
- Logique réutilisable entre composants

**Outils spécialisés :**
```typescript
import { renderHook, act } from "@testing-library/react";
```

**Pattern spécial :**
```typescript
// 1. Render le hook
const { result } = renderHook(() => useCustomHook());

// 2. Interagir avec le hook (dans act())
act(() => {
  result.current.updateValue("new value");
});

// 3. Vérifier les changements d'état
expect(result.current.value).toBe("new value");
```

## 🎯 Stratégies de Test

### Que Tester (Focus Principal)

**✅ À TESTER :**
- **Comportements publics** : Ce que l'utilisateur voit/fait
- **Logique métier** : Règles et calculs importants
- **Cas limites** : Valeurs nulles, vides, extrêmes
- **Gestion d'erreurs** : Que se passe-t-il quand ça échoue ?
- **Intégrations critiques** : API, base de données

**❌ À ÉVITER :**
- **Détails d'implémentation** : Comment c'est codé en interne
- **Styles CSS** : Sauf si c'est crucial pour la fonctionnalité
- **Libraries tierces** : Elles ont leurs propres tests
- **Getters/Setters simples** : Sans logique métier

### Règle du Red-Green-Refactor (TDD)

1. **🔴 Red** : Écrire un test qui échoue
2. **🟢 Green** : Écrire le minimum de code pour que ça passe
3. **🔵 Refactor** : Améliorer le code sans casser les tests

## 🛠️ Configuration et Outils

### Jest Configuration (jest.config.js)

```javascript
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  collectCoverageFrom: [
    'components/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
}

module.exports = createJestConfig(customJestConfig)
```

### Jest Setup (jest.setup.js)

```javascript
import '@testing-library/jest-dom'

// Mock global objects
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})
```

## 🔧 Patterns et Techniques Avancées

### 1. Mocking Strategies

**Mock de modules entiers :**
```typescript
jest.mock('@/lib/api', () => ({
  fetchUser: jest.fn(),
  updateUser: jest.fn(),
}));
```

**Mock conditionnel :**
```typescript
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Dans le test
mockFetch.mockResolvedValueOnce({
  ok: true,
  json: async () => ({ id: 1, name: 'John' }),
});
```

**Mock de hooks React :**
```typescript
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));
```

### 2. Factory Pattern pour les Tests

```typescript
// test-utils/factories.ts
export const createUser = (overrides = {}) => ({
  id: 1,
  name: 'John Doe',
  email: 'john@example.com',
  ...overrides,
});

// Dans les tests
const user = createUser({ name: 'Jane Doe' });
```

### 3. Custom Render pour les Providers

```typescript
// test-utils/render.tsx
import { render } from '@testing-library/react';
import { ThemeProvider } from '@/contexts/ThemeContext';

export const renderWithProviders = (ui, options = {}) => {
  const Wrapper = ({ children }) => (
    <ThemeProvider>
      {children}
    </ThemeProvider>
  );

  return render(ui, { wrapper: Wrapper, ...options });
};
```

## 📊 Métriques et Couverture

### Coverage Goals (Objectifs de Couverture)

- **Functions** : 80-90% (Toutes les fonctions testées)
- **Lines** : 80-90% (Toutes les lignes exécutées)
- **Branches** : 70-85% (Tous les chemins if/else)
- **Statements** : 80-90% (Toutes les instructions)

### Commandes Utiles

```bash
# Lancer tous les tests
npm test

# Tests en mode watch
npm test -- --watch

# Coverage report
npm test -- --coverage

# Tests spécifiques
npm test -- --testNamePattern="Button"

# Tests en mode debug
npm test -- --verbose
```

## 🚀 Workflow de Développement

### 1. Développement dirigé par les tests (TDD)

```typescript
// 1. Écrire le test d'abord
describe('calculateTax', () => {
  it('should calculate tax correctly', () => {
    expect(calculateTax(100, 0.2)).toBe(20);
  });
});

// 2. Implémenter la fonction
export const calculateTax = (amount: number, rate: number) => {
  return amount * rate;
};

// 3. Refactorer si nécessaire
```

### 2. Workflow avec Git Hooks

```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm test",
      "pre-push": "npm test -- --coverage"
    }
  }
}
```

## 🐛 Debugging des Tests

### Techniques de Debug

```typescript
// 1. Debug render avec screen.debug()
render(<MyComponent />);
screen.debug(); // Affiche le DOM actuel

// 2. Debug queries avec logRoles()
import { logRoles } from '@testing-library/dom';
logRoles(container);

// 3. Debug avec console.log dans les mocks
const mockFn = jest.fn().mockImplementation((arg) => {
  console.log('Called with:', arg);
  return 'result';
});
```

### Tests Flaky (Instables)

**Causes communes :**
- Tests qui dépendent du timing
- États partagés entre tests
- Mocks non nettoyés

**Solutions :**
```typescript
// Attendre les éléments asynchrones
await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument();
});

// Nettoyer après chaque test
afterEach(() => {
  jest.clearAllMocks();
  cleanup();
});
```

## 📚 Ressources et Bonnes Pratiques

### Principes FIRST

- **F**ast : Les tests doivent être rapides
- **I**ndependent : Chaque test est indépendant
- **R**epeatable : Même résultat à chaque exécution
- **S**elf-Validating : Succès ou échec clair
- **T**imely : Écrits en même temps que le code

### Nommage des Tests

**Format recommandé :**
```typescript
describe('Component/Function Name', () => {
  it('should [expected behavior] when [condition]', () => {
    // Test implementation
  });
});
```

**Exemples concrets :**
```typescript
describe('LoginForm', () => {
  it('should show error when email is invalid', () => {});
  it('should disable submit button when loading', () => {});
  it('should call onSubmit when form is valid', () => {});
});
```

### Structure des Fichiers de Test

```
src/
├── components/
│   ├── Button/
│   │   ├── Button.tsx
│   │   └── Button.test.tsx
├── hooks/
│   ├── useAuth.ts
│   └── useAuth.test.ts
├── utils/
│   ├── validation.ts
│   └── validation.test.ts
└── __tests__/
    ├── setup.ts
    └── test-utils.tsx
```

## 🎯 Checklist de Review

Avant de valider vos tests, vérifiez :

- [ ] **Nommage clair** : Le nom du test explique le comportement
- [ ] **Isolation** : Le test fonctionne seul
- [ ] **AAA Structure** : Arrange, Act, Assert bien séparés
- [ ] **Mocks appropriés** : Seules les dépendances externes sont mockées
- [ ] **Cas limites** : Les edge cases sont couverts
- [ ] **Cleanup** : Les mocks sont nettoyés
- [ ] **Performance** : Le test est rapide (< 100ms)
- [ ] **Lisibilité** : Un développeur peut comprendre rapidement

## 🔗 Ressources Complémentaires

- [Testing Library Documentation](https://testing-library.com/)
- [Jest Documentation](https://jestjs.io/)
- [React Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Test-Driven Development Guide](https://martinfowler.com/bliki/TestDrivenDevelopment.html)

---

*Ce guide couvre les bases des tests unitaires. Pour les tests d'intégration et E2E, consultez les guides dédiés.* 