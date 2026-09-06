#!/bin/bash

# Script d'installation des dépendances Python pour CV Genius Parser
# Usage: ./scripts/install-python-deps.sh

set -e  # Arrêt en cas d'erreur

echo "🚀 Installation des dépendances Python pour CV Genius..."

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction d'affichage coloré
log_info() {
    echo -e "${GREEN}ℹ️  $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Vérification que nous sommes dans le bon répertoire
if [ ! -f "package.json" ]; then
    log_error "Ce script doit être exécuté depuis la racine du projet CV Genius"
    exit 1
fi

# Vérification de Python
if ! command -v python3 &> /dev/null; then
    log_error "Python 3 n'est pas installé sur ce système"
    exit 1
fi

log_info "Python 3 détecté: $(python3 --version)"

# Vérification/installation de python3-venv
if ! python3 -c "import venv" &> /dev/null; then
    log_warning "python3-venv n'est pas installé. Installation en cours..."
    
    # Détection de l'OS
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if command -v apt &> /dev/null; then
            sudo apt update && sudo apt install -y python3-venv python3-pip
        elif command -v yum &> /dev/null; then
            sudo yum install -y python3-venv python3-pip
        elif command -v dnf &> /dev/null; then
            sudo dnf install -y python3-venv python3-pip
        else
            log_error "Gestionnaire de paquets non supporté. Installez python3-venv manuellement."
            exit 1
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        log_info "macOS détecté - python3-venv devrait être disponible"
    else
        log_error "OS non supporté: $OSTYPE"
        exit 1
    fi
fi

# Création de l'environnement virtuel
if [ ! -d "venv" ]; then
    log_info "Création de l'environnement virtuel Python..."
    python3 -m venv venv
else
    log_info "Environnement virtuel Python déjà existant"
fi

# Activation de l'environnement virtuel et installation des dépendances
log_info "Activation de l'environnement virtuel et installation des dépendances..."

source venv/bin/activate

# Mise à jour de pip
pip install --upgrade pip

# Installation des dépendances depuis requirements.txt
if [ -f "scripts/requirements.txt" ]; then
    log_info "Installation des dépendances depuis requirements.txt..."
    pip install -r scripts/requirements.txt
else
    log_error "Fichier scripts/requirements.txt non trouvé"
    exit 1
fi

# Vérification de l'installation
log_info "Vérification de l'installation..."

if python -c "import pymupdf; print('✅ pymupdf OK')" 2>/dev/null; then
    log_info "pymupdf installé avec succès"
else
    log_error "Problème avec l'installation de pymupdf"
    exit 1
fi

# Test du script parser
log_info "Test du script parser..."
if [ -f "CV_NGUYEN_Ngoc_Linh_Nhi_FullStack.pdf" ]; then
    python scripts/pdf_parser.py CV_NGUYEN_Ngoc_Linh_Nhi_FullStack.pdf > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        log_info "✅ Script parser testé avec succès"
    else
        log_warning "Le script parser a rencontré des problèmes lors du test"
    fi
else
    log_warning "Fichier de test CV_NGUYEN_Ngoc_Linh_Nhi_FullStack.pdf non trouvé - impossible de tester"
fi

deactivate

echo ""
log_info "🎉 Installation terminée avec succès!"
echo ""
echo "Pour utiliser le parser Python:"
echo "  1. Activez l'environnement virtuel: source venv/bin/activate"
echo "  2. Utilisez le script: python scripts/pdf_parser.py <fichier.pdf>"
echo "  3. Ou utilisez l'API Next.js qui gère automatiquement l'environnement"
echo "" 