# CV Genius 📄✨

## Vue d'ensemble du projet

**CV Genius** est une application web innovante qui transforme automatiquement le contenu brut d'un CV en un document professionnel et percutant grâce à l'intelligence artificielle.

### 🎯 Objectif principal

Permettre aux utilisateurs de saisir leurs informations de parcours professionnel sous forme de listes à puces brutes (expériences, formations, compétences) et obtenir instantanément une version réécrite dans un style professionnel optimisé pour le marché du travail.

### 🚀 Concept

L'utilisateur entre ses informations de manière libre et non-structurée, et l'IA (via l'API Gemini de Google) se charge de :
- Reformuler le contenu dans un style professionnel
- Optimiser la présentation pour les recruteurs
- Améliorer l'impact des descriptions d'expériences
- Harmoniser le ton et le style du document

## ⚙️ Architecture technique

### Stack technologique

- **Frontend** : Next.js 14 avec App Router + TypeScript
- **Styling** : Tailwind CSS
- **Base de données** : PostgreSQL via Supabase
- **Authentification** : Supabase Auth
- **IA** : API Gemini (Google)
- **Déploiement** : Vercel
- **Tests** : Jest + Testing Library + Playwright

### Structure de l'application

```
cv-genius/
├── app/                    # App Router Next.js 14
│   ├── (auth)/            # Groupe de routes authentifiées
│   │   ├── login/         # Page de connexion
│   │   └── register/      # Page d'inscription
│   ├── dashboard/         # Tableau de bord utilisateur
│   ├── cv-builder/        # Interface de création de CV
│   ├── api/               # API Routes
│   │   ├── auth/          # Endpoints d'authentification
│   │   ├── cv/            # Gestion des CV
│   │   └── gemini/        # Intégration API Gemini
│   ├── globals.css        # Styles globaux
│   ├── layout.tsx         # Layout principal
│   └── page.tsx           # Page d'accueil
├── components/            # Composants réutilisables
│   ├── ui/               # Composants d'interface de base
│   ├── forms/            # Composants de formulaires
│   └── layout/           # Composants de mise en page
├── lib/                  # Utilitaires et services
│   ├── supabase/         # Configuration Supabase
│   ├── gemini/           # Service API Gemini
│   └── utils/            # Fonctions utilitaires
├── types/                # Définitions TypeScript
└── tests/                # Tests (unit, integration, e2e)
```

## 🔄 Flux utilisateur principal

1. **Authentification** : L'utilisateur se connecte ou crée un compte
2. **Saisie des données** : Interface de formulaire pour entrer les informations brutes
3. **Traitement IA** : L'API Gemini traite et reformule le contenu
4. **Prévisualisation** : Affichage du CV transformé avec possibilité d'édition
5. **Sauvegarde** : Stockage du CV dans la base de données
6. **Export** : Génération du CV final (PDF, formats divers)

## 📊 Modèle de données

### Table `users`
- Gérée automatiquement par Supabase Auth
- Informations de base de l'utilisateur

### Table `resumes`
```sql
CREATE TABLE resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  title VARCHAR(255) NOT NULL,
  raw_content JSONB NOT NULL,
  generated_content JSONB,
  status VARCHAR(50) DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Structure du contenu (JSONB)
```json
{
  "personalInfo": {
    "name": "string",
    "email": "string",
    "phone": "string",
    "location": "string"
  },
  "experiences": [
    {
      "company": "string",
      "position": "string",
      "duration": "string",
      "description": "string (raw)"
    }
  ],
  "education": [...],
  "skills": [...],
  "languages": [...]
}
```

## 🔌 Intégrations externes

### API Gemini
- **Endpoint** : `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent`
- **Authentification** : Clé API stockée dans les variables d'environnement
- **Usage** : Transformation du contenu brut en contenu professionnel

### Supabase
- **Base de données** : PostgreSQL hébergée
- **Authentification** : Email/password, OAuth (optionnel)
- **API** : Auto-générée à partir du schéma de base

## 🚀 Fonctionnalités principales

### Phase 1 - MVP
- [ ] Authentification utilisateur
- [ ] Formulaire de saisie des informations
- [ ] Intégration API Gemini
- [ ] Prévisualisation du CV généré
- [ ] Sauvegarde en base de données

### Phase 2 - Améliorations
- [ ] Templates de CV multiples
- [ ] Édition fine du contenu généré
- [ ] Export PDF
- [ ] Historique des versions

### Phase 3 - Fonctionnalités avancées
- [ ] Analyse de mots-clés pour optimisation ATS
- [ ] Suggestions basées sur le poste visé
- [ ] Partage de CV public
- [ ] Analytics et métriques

## 🔧 Variables d'environnement

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Gemini API
GEMINI_API_KEY=your_gemini_api_key

# Next.js
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

## 📱 Interface utilisateur

### Design System
- **Couleurs** : Palette bleu professionnel avec accents
- **Typographie** : Inter (moderne et lisible)
- **Composants** : Design system cohérent avec Tailwind CSS
- **Responsive** : Mobile-first design

### Pages principales
1. **Landing page** : Présentation du projet et fonctionnalités
2. **Authentification** : Login/Register
3. **Dashboard** : Liste des CV, statistiques
4. **CV Builder** : Interface de création/édition
5. **Preview** : Prévisualisation et export

## 🔄 Workflow de développement

### Branches Git
- `main` : Production
- `develop` : Intégration
- `feature/*` : Fonctionnalités
- `hotfix/*` : Corrections urgentes

### CI/CD avec Vercel
- Déploiement automatique sur push
- Preview deployments pour les PR
- Tests automatisés avant merge
- Variables d'environnement par environnement

## 📈 Métriques et monitoring

### Analytics d'usage
- Nombre de CV créés
- Taux de conversion par étape
- Temps passé par section
- Formats d'export les plus populaires

### Performance
- Temps de réponse API Gemini
- Métriques Core Web Vitals
- Monitoring des erreurs avec Vercel Analytics

---

## 🎓 Valeur pédagogique

Ce projet couvre tous les aspects du développement web moderne :
- Architecture d'application complète
- Intégration d'IA dans une application web
- Gestion de données complexes
- Expérience utilisateur optimisée
- Déploiement et monitoring production 