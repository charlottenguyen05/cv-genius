# Objectifs Pédagogiques - CV Genius 🎓

## Vue d'ensemble

Ce projet est conçu comme un parcours d'apprentissage complet pour maîtriser les compétences essentielles du développement web moderne. Chaque aspect du projet CV Genius a été pensé pour couvrir des compétences techniques et méthodologiques cruciales.

## 🎯 Compétences principales à développer

### 1. Clean Code & Principes SOLID

#### Objectifs d'apprentissage :
- **Single Responsibility Principle (SRP)** : Chaque composant/service a une responsabilité unique
- **Open/Closed Principle** : Code ouvert à l'extension, fermé à la modification
- **Lisibilité** : Code auto-documenté avec noms explicites
- **Modularité** : Fonctions pures et composants réutilisables

#### Mise en pratique :
```
📁 Exemples d'application :
├── components/CVForm.tsx          # SRP : Gestion du formulaire uniquement
├── services/geminiService.ts      # SRP : Communication avec l'API Gemini
├── lib/validators/cvSchema.ts     # SRP : Validation des données CV
└── hooks/useCV.ts                # SRP : Logique d'état des CV
```

#### Exercices concrets :
- Refactoriser un composant monolithique en composants spécialisés
- Créer des interfaces TypeScript pour abstraire les dépendances
- Implémenter le pattern Repository pour l'accès aux données

---

### 2. Design Patterns

#### Patterns à maîtriser :
- **Repository Pattern** : Abstraction de l'accès aux données
- **Observer Pattern** : Gestion des événements et état global
- **Factory Pattern** : Création de templates de CV
- **Strategy Pattern** : Différentes stratégies de génération de contenu

#### Mise en pratique :
```typescript
// Repository Pattern
interface CVRepository {
  save(cv: CV): Promise<CV>
  findById(id: string): Promise<CV>
  findByUserId(userId: string): Promise<CV[]>
}

// Strategy Pattern
interface ContentGenerator {
  generate(rawContent: string, context: GenerationContext): Promise<string>
}
```

---

### 3. Pyramide des Tests

#### Niveaux de tests à implémenter :

##### Tests Unitaires (70%) - Jest + Testing Library
```typescript
// Exemple : tests/lib/formatters.test.ts
describe('formatExperience', () => {
  it('should format experience correctly', () => {
    const raw = "Developed web apps using React"
    const formatted = formatExperience(raw)
    expect(formatted).toContain('Développé des applications web')
  })
})
```

##### Tests d'Intégration (20%) - API Routes
```typescript
// Exemple : tests/api/cv.test.ts
describe('/api/cv', () => {
  it('should create CV with valid data', async () => {
    const response = await request(app)
      .post('/api/cv')
      .send(validCVData)
      .expect(201)
    
    expect(response.body.id).toBeDefined()
  })
})
```

##### Tests End-to-End (10%) - Playwright
```typescript
// Exemple : tests/e2e/cv-creation.spec.ts
test('user can create and preview CV', async ({ page }) => {
  await page.goto('/cv-builder')
  await page.fill('[data-testid="company"]', 'TechCorp')
  await page.click('[data-testid="generate-cv"]')
  await expect(page.locator('[data-testid="preview"]')).toBeVisible()
})
```

#### Exercices pratiques :
- Configurer Jest avec Next.js et TypeScript
- Écrire des tests pour chaque service et composant
- Implémenter une pipeline CI qui exécute tous les tests
- Atteindre 80%+ de couverture de code

---

### 4. CI/CD avec Vercel

#### Pipeline de déploiement :
```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm run test:coverage
      - name: Run E2E tests
        run: npm run test:e2e
```

#### Apprentissages :
- Configuration des environments (dev, staging, prod)
- Variables d'environnement sécurisées
- Preview deployments automatiques
- Monitoring et rollback

---

### 5. Interaction avec API Gemini

#### Compétences techniques :
- **Gestion des API externes** : Authentification, rate limiting, gestion d'erreurs
- **Prompt Engineering** : Création de prompts efficaces pour l'IA
- **Streaming** : Gestion des réponses en temps réel
- **Sécurité** : Protection des clés API côté serveur

#### Exemple d'implémentation :
```typescript
// lib/gemini/service.ts
export class GeminiService {
  async generateContent(prompt: string): Promise<string> {
    try {
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.GEMINI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      })
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`)
      }
      
      const data = await response.json()
      return data.candidates[0].content.parts[0].text
    } catch (error) {
      console.error('Gemini API Error:', error)
      throw new GeminiError('Failed to generate content')
    }
  }
}
```

#### Exercices :
- Implémenter la gestion d'erreurs robuste
- Optimiser les prompts pour différents types de contenu
- Ajouter un système de retry et cache
- Créer des tests mockés pour les API calls

---

### 6. Méthodologie Scrum

#### Organisation du travail :

##### Sprint Planning (début de chaque sprint)
- **Objectif** : Définir les user stories à réaliser
- **Durée** : Sprints de 1 semaine
- **Livrable** : Sprint backlog avec estimation

##### Daily Stand-ups (quotidien - 5 min)
- Qu'as-tu fait hier ?
- Que fais-tu aujourd'hui ?
- Y a-t-il des obstacles ?

##### Sprint Review (fin de sprint)
- Démonstration des fonctionnalités développées
- Feedback et ajustements

##### Rétrospective
- Ce qui a bien fonctionné
- Points d'amélioration
- Actions pour le prochain sprint

#### User Stories exemples :
```
📝 Sprint 1
- En tant qu'utilisateur, je veux créer un compte pour sauvegarder mes CV
- En tant qu'utilisateur, je veux me connecter pour accéder à mes données
- En tant qu'utilisateur, je veux voir une prévisualisation en temps réel

📝 Sprint 2 - IA et génération
- En tant qu'utilisateur, je veux saisir mes expériences pour créer mon CV
- En tant qu'utilisateur, je veux que l'IA améliore le contenu de mon CV
- En tant qu'utilisateur, je veux pouvoir éditer le contenu généré
```

---

### 7. Maîtrise de Git

#### Workflow GitFlow :
```
main (production)
├── develop (intégration)
│   ├── feature/auth-system
│   ├── feature/cv-builder
│   ├── feature/gemini-integration
│   └── hotfix/critical-bug-fix
```

#### Bonnes pratiques :
- **Commits atomiques** : Une modification logique par commit
- **Messages clairs** : `feat: add user authentication with Supabase`
- **Pull Requests** : Code review obligatoire
- **Branches descriptives** : `feature/add-cv-templates`

#### Exercices pratiques :
- Configurer un workflow avec protection des branches
- Pratiquer le rebase interactif
- Gérer les conflits de merge
- Utiliser les hooks Git pour automatiser les checks

---

### 8. Debugging et DevOps

#### Techniques de debug :

##### Frontend
- **Chrome DevTools** : Console, Network, Performance, Sources
- **React DevTools** : État des composants, props, re-renders
- **Debugging TypeScript** : Source maps, breakpoints

##### Backend
- **Logs structurés** : Winston ou console.log organisés
- **Monitoring Vercel** : Analytics et métriques
- **Error tracking** : Sentry ou similaire

#### Outils de développement :
```typescript
// lib/logger.ts
export const logger = {
  info: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[INFO] ${message}`, data)
    }
  },
  error: (message: string, error?: Error) => {
    console.error(`[ERROR] ${message}`, error)
    // En production : envoyer à un service de monitoring
  }
}
```

---

### 9. Base de données PostgreSQL & Supabase

#### Concepts à maîtriser :

##### Modélisation de données
- Relations entre tables (users ↔ resumes)
- Types de données JSON(B) pour contenu flexible
- Index pour optimisation des performances
- Contraintes et validations

##### Supabase spécifique
- Row Level Security (RLS) pour la sécurité
- Real-time subscriptions
- Edge Functions pour la logique métier
- Auto-génération d'API REST

#### Exercices SQL :
```sql
-- Requête complexe avec agrégation
SELECT 
  u.email,
  COUNT(r.id) as total_cvs,
  MAX(r.updated_at) as last_activity
FROM users u
LEFT JOIN resumes r ON u.id = r.user_id
GROUP BY u.id, u.email
HAVING COUNT(r.id) > 0;
```

---

### 10. Déploiement Vercel & Production

#### Configuration production :
- Variables d'environnement par environnement
- Optimisation des builds Next.js
- Monitoring des performances
- Gestion des erreurs et logs

#### Métriques à surveiller :
- Core Web Vitals (LCP, FID, CLS)
- Temps de réponse API
- Taux d'erreur
- Usage des ressources

---

## 📊 Plan d'apprentissage progressif

### Semaine 1 : Fondations
- [ ] Setup du projet et configuration
- [ ] Authentification avec Supabase
- [ ] Premiers composants React
- [ ] Formulaires et validation
- [ ] Intégration base de données
- [ ] Tests unitaires

### Semaine 2 : IA et génération
- [ ] Intégration API Gemini
- [ ] Gestion des erreurs
- [ ] Tests d'intégration
- [ ] Interface utilisateur finalisée
- [ ] Tests E2E complets
- [ ] Déploiement production

---

## 🏆 Critères de réussite

### Technique
- ✅ Code coverage > 80%
- ✅ 0 erreur TypeScript/ESLint
- ✅ Performance Lighthouse > 90
- ✅ Fonctionnalité complète working

### Méthodologique
- ✅ Documentation complète
- ✅ Git workflow respecté
- ✅ Sprints planifiés et exécutés
- ✅ Code reviews systématiques

### Apprentissage
- ✅ Maîtrise des concepts SOLID
- ✅ Compréhension des design patterns
- ✅ Autonomie sur les tests
- ✅ Capacité de debug efficace

---

## 📚 Ressources complémentaires

### Documentation officielle
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)

### Guides et tutoriels
- Clean Code principles
- Testing best practices
- Git workflows
- PostgreSQL optimization

Ce projet offre une expérience d'apprentissage complète et progressive, couvrant tous les aspects du développement web professionnel moderne. 