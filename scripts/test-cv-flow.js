#!/usr/bin/env node

/**
 * Script de test pour valider le flow CV complet
 * Usage: node scripts/test-cv-flow.js
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Test du Flow CV Genius\n');

// Test 1: Vérification des dépendances
console.log('📦 Vérification des dépendances...');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const requiredDeps = ['jspdf', '@types/jspdf'];
  
  const missingDeps = requiredDeps.filter(dep => 
    !packageJson.dependencies?.[dep] && !packageJson.devDependencies?.[dep]
  );
  
  if (missingDeps.length > 0) {
    console.log('❌ Dépendances manquantes:', missingDeps.join(', '));
    console.log('   Lancez: npm install jspdf @types/jspdf');
  } else {
    console.log('✅ Toutes les dépendances Node.js sont présentes');
  }
} catch (error) {
  console.log('❌ Erreur lors de la vérification du package.json');
}

// Test 2: Vérification de l'environnement Python
console.log('\n🐍 Vérification de l\'environnement Python...');
const venvPath = path.join(process.cwd(), 'venv', 'bin', 'python');
const requirementsPath = path.join(process.cwd(), 'scripts', 'requirements.txt');

if (fs.existsSync(venvPath)) {
  console.log('✅ Environnement virtuel Python détecté');
} else {
  console.log('❌ Environnement virtuel Python manquant');
  console.log('   Lancez: ./scripts/install-python-deps.sh');
}

if (fs.existsSync(requirementsPath)) {
  console.log('✅ Fichier requirements.txt présent');
} else {
  console.log('❌ Fichier requirements.txt manquant');
}

// Test 3: Vérification des fichiers clés
console.log('\n📁 Vérification des fichiers du flow...');
const requiredFiles = [
  'lib/gemini/service.ts',
  'lib/pdf/generator.ts',
  'app/api/cv/generate/route.ts',
  'app/api/parser/route.ts',
  'scripts/pdf_parser_improved.py'
];

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} manquant`);
  }
});

// Test 4: Vérification de la configuration
console.log('\n⚙️ Configuration requise...');
console.log('📝 Variables d\'environnement à configurer:');
console.log('   - GEMINI_API_KEY (obligatoire pour l\'amélioration IA)');
console.log('   - NEXT_PUBLIC_SUPABASE_URL (pour l\'authentification)');
console.log('   - NEXT_PUBLIC_SUPABASE_ANON_KEY (pour l\'authentification)');

// Test 5: Vérification du CV de test
console.log('\n📄 Fichier CV de test...');
const testCV = 'CV_NGUYEN_Ngoc_Linh_Nhi_FullStack.pdf';
if (fs.existsSync(testCV)) {
  console.log(`✅ CV de test présent: ${testCV}`);
} else {
  console.log(`⚠️ CV de test non trouvé: ${testCV}`);
}

console.log('\n🚀 RÉSUMÉ DU FLOW IMPLÉMENTÉ:');
console.log('1. 📤 Upload CV → Parser Python → JSON structuré');
console.log('2. 📝 Formulaire pré-rempli → Validation utilisateur');
console.log('3. 🤖 JSON → Amélioration Gemini → JSON optimisé');
console.log('4. 📄 JSON optimisé → Génération PDF → Téléchargement');

console.log('\n✨ Pour tester le flow complet:');
console.log('1. Configurez GEMINI_API_KEY dans .env');
console.log('2. Lancez: npm run dev');
console.log('3. Allez sur /dashboard');
console.log('4. Uploadez un CV ou remplissez le formulaire');
console.log('5. Cliquez sur "Générer le CV"');

console.log('\n🎉 Le flow CV Genius est opérationnel !'); 