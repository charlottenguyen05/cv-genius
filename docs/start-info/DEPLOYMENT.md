# Guide de Déploiement - CV Genius 🚀

## Déploiement sur Vercel

### 1. Préparer le repository

```bash
# S'assurer que le build fonctionne localement
npm run build

# Commit et push vers GitHub
git add .
git commit -m "feat: setup complete project structure"
git push origin main
```

### 2. Déployer sur Vercel

1. Aller sur [vercel.com](https://vercel.com)
2. Se connecter avec GitHub
3. Cliquer sur "Import Project"
4. Sélectionner le repository `cv-genius`
5. Configurer les variables d'environnement :

#### Variables d'environnement Vercel

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
GEMINI_API_KEY=your_gemini_api_key
NEXTAUTH_SECRET=your_production_secret
NEXTAUTH_URL=https://your-app.vercel.app
```

### 3. Configuration automatique

Le fichier `vercel.json` configure automatiquement :
- Framework Next.js
- Commandes de build
- Variables d'environnement

### 4. Domain et SSL

Vercel fournit automatiquement :
- ✅ Domaine `.vercel.app`
- ✅ Certificat SSL
- ✅ CDN global
- ✅ Optimisations automatiques

### 5. Preview Deployments

Chaque PR GitHub créera automatiquement :
- Une preview deployment
- Tests automatiques
- Vérification du build

## Production Checklist

- [ ] Variables d'environnement configurées
- [ ] Supabase en mode production
- [ ] API Gemini avec limites appropriées
- [ ] Tests passent
- [ ] Performance optimisée
- [ ] Monitoring configuré

## Domaine personnalisé (optionnel)

1. Dans Vercel Dashboard > Settings > Domains
2. Ajouter votre domaine
3. Configurer les DNS selon les instructions

## Rollback

En cas de problème :
1. Aller dans Vercel Dashboard
2. Sélectionner une version précédente
3. Cliquer "Promote to Production"

---

**Le projet sera accessible sur votre URL Vercel en quelques minutes ! 🎉** 