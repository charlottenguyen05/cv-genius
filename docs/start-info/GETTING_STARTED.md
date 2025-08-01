# Guide de Démarrage - CV Genius 🚀

Ce guide vous accompagnera étape par étape pour configurer et démarrer le projet CV Genius.

## 📋 Prérequis

Avant de commencer, assurez-vous d'avoir installé :

- **Node.js 18+** : [Télécharger Node.js](https://nodejs.org/)
- **npm** ou **yarn** (inclus avec Node.js)
- **Git** : [Télécharger Git](https://git-scm.com/)
- Un éditeur de code comme **VS Code**

## 🛠️ Installation

### 1. Cloner le repository

```bash
git clone <repository-url>
cd cv-genius
```

### 2. Installer les dépendances

```bash
npm install
# ou
yarn install
```

### 3. Configuration des variables d'environnement

```bash
# Copier le fichier d'exemple
cp .env.example .env.local
```

Éditer `.env.local` avec vos valeurs :

```env
# Supabase (étape 4)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Gemini API (étape 5)
GEMINI_API_KEY=your_gemini_api_key

# Next.js
NEXTAUTH_SECRET=your_random_secret_key
NEXTAUTH_URL=http://localhost:3000
```

## 🗄️ Configuration Supabase

### 1. Créer un compte Supabase

1. Aller sur [supabase.com](https://supabase.com)
2. Créer un compte gratuit
3. Créer un nouveau projet

### 2. Récupérer les clés API

Dans votre dashboard Supabase :
1. Aller dans **Settings** > **API**
2. Copier l'**URL** et l'**anon key**
3. Les ajouter dans `.env.local`

### 3. Configurer la base de données

Dans l'**SQL Editor** de Supabase, exécuter :

```sql
-- Activer l'extension UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Créer la table des CV
CREATE TABLE resumes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  raw_content JSONB NOT NULL,
  generated_content JSONB,
  status VARCHAR(50) DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Créer la table des profils utilisateur
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activer RLS (Row Level Security)
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Politiques de sécurité pour les CV
CREATE POLICY "Users can view their own resumes" ON resumes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own resumes" ON resumes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own resumes" ON resumes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own resumes" ON resumes
  FOR DELETE USING (auth.uid() = user_id);

-- Politiques de sécurité pour les profils
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour updated_at
CREATE TRIGGER update_resumes_updated_at 
  BEFORE UPDATE ON resumes 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## 🤖 Configuration API Gemini

### 1. Obtenir une clé API

1. Aller sur [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Se connecter avec un compte Google
3. Créer une nouvelle clé API
4. Copier la clé et l'ajouter dans `.env.local`

### 2. Tester l'API

```bash
# Lancer le serveur de dev
npm run dev

# Tester l'endpoint Gemini
curl http://localhost:3000/api/generate
```

## 🚀 Démarrage du projet

### 1. Lancer le serveur de développement

```bash
npm run dev
```

Le projet sera accessible sur [http://localhost:3000](http://localhost:3000)

### 2. Vérifier que tout fonctionne

- ✅ Page d'accueil s'affiche correctement
- ✅ Pas d'erreurs dans la console
- ✅ Style Tailwind CSS chargé

## 🧪 Tests

### Tests unitaires

```bash
# Lancer tous les tests
npm run test

# Tests en mode watch
npm run test:watch

# Coverage
npm run test:coverage
```

### Tests E2E

```bash
# Installer Playwright
npx playwright install

# Lancer les tests E2E
npm run test:e2e
```

## 🔧 Scripts disponibles

```bash
# Développement
npm run dev          # Serveur de développement
npm run build        # Build de production
npm run start        # Serveur de production

# Tests
npm run test         # Tests unitaires
npm run test:watch   # Tests en mode watch
npm run test:coverage # Couverture de code
npm run test:e2e     # Tests end-to-end

# Qualité de code
npm run lint         # ESLint
npm run type-check   # Vérification TypeScript
```

## 📁 Structure du projet

```
cv-genius/
├── app/                    # App Router Next.js 14
│   ├── api/               # API Routes
│   ├── globals.css        # Styles globaux
│   ├── layout.tsx         # Layout principal
│   └── page.tsx           # Page d'accueil
├── components/            # Composants React
│   ├── ui/               # Composants de base
│   ├── forms/            # Composants de formulaires
│   └── layout/           # Composants de mise en page
├── lib/                  # Services et utilitaires
│   ├── supabase/         # Configuration Supabase
│   ├── gemini/           # Service API Gemini
│   └── utils/            # Fonctions utilitaires
├── types/                # Définitions TypeScript
├── tests/                # Tests
└── docs/                 # Documentation
```

## 🚨 Résolution des problèmes courants

### Erreur : "Module not found"
```bash
# Réinstaller les dépendances
rm -rf node_modules package-lock.json
npm install
```

### Erreur Supabase : "Invalid API key"
- Vérifier que les variables d'environnement sont correctes
- Redémarrer le serveur de dev après modification de `.env.local`

### Erreur Gemini : "API key not found"
- Vérifier la clé API dans `.env.local`
- S'assurer que l'API Gemini est activée

### Tests qui échouent
```bash
# Mettre à jour les snapshots si nécessaire
npm run test -- --updateSnapshot
```

## 📚 Ressources utiles

- [Documentation Next.js](https://nextjs.org/docs)
- [Documentation Supabase](https://supabase.com/docs)
- [Documentation Tailwind CSS](https://tailwindcss.com/docs)
- [Documentation TypeScript](https://www.typescriptlang.org/docs)
- [Documentation Playwright](https://playwright.dev/docs/intro)

## 🆘 Besoin d'aide ?

1. Consulter la [documentation du projet](../README.md)
2. Vérifier les [issues GitHub](../../issues)
3. Créer une nouvelle issue si le problème persiste

---

**Prêt à coder ? Let's go ! 🎉** 