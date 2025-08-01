# Configuration des Variables d'Environnement

Pour que le parser fonctionne correctement, vous devez configurer les variables d'environnement suivantes.

## 📁 Créer le fichier `.env.local`

Créez un fichier `.env.local` à la racine du projet avec le contenu suivant :

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Gemini AI Configuration (OBLIGATOIRE pour le parser)
GEMINI_API_KEY=your_gemini_api_key

# Next.js Configuration
NEXTAUTH_SECRET=your_random_secret_string_at_least_32_characters
NEXTAUTH_URL=http://localhost:3000
```

## 🔑 Comment obtenir les clés

### 1. Clé API Gemini (Obligatoire)
1. Aller sur [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Créer une nouvelle clé API
3. Copier la clé dans `GEMINI_API_KEY`

### 2. Configuration Supabase (Obligatoire pour l'authentification)
1. Aller sur [supabase.com](https://supabase.com)
2. Créer un nouveau projet
3. Dans Settings > API, copier :
   - L'**URL du projet** → `NEXT_PUBLIC_SUPABASE_URL`
   - La **clé anonyme** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - La **clé service role** → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ Gardez cette clé secrète!)

### 3. Secret NextAuth
Générer une chaîne aléatoire de 32+ caractères :
```bash
openssl rand -base64 32
```

## ✅ Test de la configuration

Après avoir configuré les variables, redémarrez le serveur :
```bash
npm run dev
```

Le parser devrait maintenant fonctionner sur `/api/parser` et l'authentification sur `/api/cv/generate` 