# Guide Complet - Flow CV Genius

## 🚀 Flow de Génération CV Implémenté

### Vue d'ensemble
Le nouveau flow permet de transformer un CV existant ou des données manuelles en CV professionnel amélioré par IA.

### Étapes du Flow

1. **📤 Upload CV (Optionnel)**
   - L'utilisateur peut uploader un PDF
   - Le parser Python extrait automatiquement les données
   - Le formulaire se pré-remplit automatiquement

2. **📝 Validation/Modification**
   - L'utilisateur vérifie et complète les informations
   - Minimum requis : nom + email
   - Toutes les sections sont éditables

3. **🚀 Génération**
   - Click sur "Générer le CV"
   - Les données JSON sont envoyées à Gemini
   - Gemini améliore le contenu (verbes d'action, quantifications, etc.)
   - Un PDF professionnel est généré
   - Téléchargement automatique

## 🛠️ Configuration Requise

### Variables d'environnement
```bash
# OBLIGATOIRE pour l'amélioration IA
GEMINI_API_KEY=your_gemini_api_key

# Supabase (pour l'auth)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
```

### Dépendances Python
```bash
# Installation automatique
./scripts/install-python-deps.sh

# Ou manuel
pip install pdfplumber spacy fr-core-news-sm
```

### Dépendances Node.js
```bash
npm install jspdf @types/jspdf
```

## 📋 API Endpoints

### `/api/parser` - Parse PDF
```typescript
POST /api/parser
Content-Type: multipart/form-data

// Retourne CVFormData JSON
```

### `/api/cv/generate` - Flow Complet
```typescript
POST /api/cv/generate
Content-Type: application/json

{
  "cvData": {
    "personalInfo": { "name": "...", "email": "..." },
    "experiences": [...],
    "education": [...],
    "skills": [...],
    "languages": [...]
  }
}

// Retourne directement le PDF
```

## 🔧 Structure des Données

### CVFormData
```typescript
interface CVFormData {
  personalInfo: {
    name: string
    email: string
    phone?: string
    location?: string
    linkedin?: string
    website?: string
  }
  experiences: Experience[]
  education: Education[]
  skills: Skill[]
  languages?: Language[]
}
```

## 🤖 Prompt Gemini

Le système utilise un prompt master optimisé qui :
- Demande UNIQUEMENT du JSON en retour
- Améliore le contenu sans changer la structure
- Utilise des verbes d'action puissants
- Quantifie les réalisations
- Optimise pour les ATS
- Adapte au marché français

## 📄 Génération PDF

Le PDF généré inclut :
- Header avec nom et contacts
- Sections professionnelles organisées
- Mise en page propre et lisible
- Export automatique avec nom intelligent

## 🧪 Test du Flow

### 1. Test du Parser
```bash
source venv/bin/activate
python scripts/pdf_parser_improved.py CV_NGUYEN_Ngoc_Linh_Nhi_FullStack.pdf
```

### 2. Test de l'API
```bash
# Démarrer le serveur
npm run dev

# Tester le parser
curl -X POST http://localhost:3000/api/parser \
  -F "file=@CV_NGUYEN_Ngoc_Linh_Nhi_FullStack.pdf"

# Tester la génération (avec données JSON)
curl -X POST http://localhost:3000/api/cv/generate \
  -H "Content-Type: application/json" \
  -d '{"cvData": {...}}' \
  --output cv_generated.pdf
```

## 📱 Interface Utilisateur

### Dashboard (`/dashboard`)
- Section upload avec drag & drop
- Formulaire pré-rempli automatiquement
- Validation temps réel
- Bouton de génération avec loading
- Téléchargement automatique

### Fonctionnalités UX
- ✅ Auto-parsing des CVs uploadés
- ✅ Validation des champs requis
- ✅ Loading states avec spinners
- ✅ Gestion d'erreurs complète
- ✅ Téléchargement automatique sans toast
- ✅ Nom de fichier intelligent

## 🚨 Gestion d'Erreurs

Le système gère :
- Echecs de parsing PDF
- Erreurs Gemini (fallback sur données originales)
- Erreurs de génération PDF
- Problèmes d'authentification
- Validation côté client et serveur

## 🔄 Améliorations Futures Possibles

1. **Templates PDF multiples**
2. **Aperçu avant génération**
3. **Sauvegarde des CVs en base**
4. **Export en multiple formats**
5. **Amélioration du parser pour plus de formats**
6. **Suggestions personnalisées par secteur**

---

**Le flow est maintenant complètement opérationnel ! 🎉** 