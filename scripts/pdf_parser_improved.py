#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CV Genius - PDF Parser Amélioré
Version optimisée pour mieux extraire les données structurées des CVs PDF
"""

import re
import json
import sys
import argparse
from pathlib import Path
from typing import Dict, List, Optional, Any
import logging

# Imports pour le parsing PDF
try:
    import pdfplumber
except ImportError:
    print("❌ pdfplumber non installé. Installation en cours...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "pdfplumber"])
    import pdfplumber

# Configuration du logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class ImprovedCVParser:
    """Parser CV amélioré avec détection de sections optimisée"""
    
    def __init__(self):
        self.email_pattern = re.compile(r'\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b')
        self.phone_patterns = [
            re.compile(r'(?:\+33|0)\s?[1-9](?:[\s.-]?\d{2}){4}'),  # Français
            re.compile(r'\+?(?:\d{1,3}[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}'),  # International
        ]
        # Pattern amélioré pour LinkedIn
        self.linkedin_pattern = re.compile(r'(?:https?://)?(?:www\.)?(?:linkedin\.com/in/|in/)[\w-]+/?', re.IGNORECASE)
        # Pattern pour GitHub
        self.github_pattern = re.compile(r'(?:https?://)?(?:www\.)?github\.com/[\w-]+/?', re.IGNORECASE)
        # Pattern pour sites web déployés
        self.deployed_site_pattern = re.compile(r'https?://[\w.-]+\.(?:vercel\.app|onrender\.com|herokuapp\.com|netlify\.app)[\w/.-]*', re.IGNORECASE)

    def extract_text_from_pdf(self, pdf_path: str) -> str:
        """Extrait le texte d'un PDF avec pdfplumber"""
        try:
            logger.info(f"📄 Extraction du texte de: {pdf_path}")
            with pdfplumber.open(pdf_path) as pdf:
                text = ""
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
                
                logger.info(f"✅ Texte extrait: {len(text)} caractères")
                return text.strip()
        except Exception as e:
            logger.error(f"❌ Erreur lors de l'extraction du PDF: {e}")
            return ""

    def extract_personal_info(self, text: str) -> Dict[str, str]:
        """Extrait les informations personnelles avec amélioration"""
        logger.info("🔍 Extraction des informations personnelles...")
        info = {}
        
        lines = text.split('\n')
        
        # Nom (généralement première ligne)
        if lines:
            first_line = lines[0].strip()
            if first_line and not '@' in first_line and not '+' in first_line:
                info['name'] = first_line
                logger.info(f"👤 Nom trouvé: {first_line}")
        
        # Email
        email_match = self.email_pattern.search(text)
        if email_match:
            info['email'] = email_match.group()
            logger.info(f"📧 Email trouvé: {info['email']}")
        
        # Téléphone
        for pattern in self.phone_patterns:
            phone_match = pattern.search(text)
            if phone_match:
                info['phone'] = phone_match.group()
                logger.info(f"📱 Téléphone trouvé: {info['phone']}")
                break
        
        # LinkedIn amélioré
        linkedin_match = self.linkedin_pattern.search(text)
        if linkedin_match:
            linkedin_url = linkedin_match.group()
            # Normalise l'URL LinkedIn
            if not linkedin_url.startswith('http'):
                if linkedin_url.startswith('in/'):
                    linkedin_url = 'https://linkedin.com/' + linkedin_url
                else:
                    linkedin_url = 'https://www.' + linkedin_url
            info['linkedin'] = linkedin_url
            logger.info(f"💼 LinkedIn trouvé: {linkedin_url}")
        
        # GitHub
        github_match = self.github_pattern.search(text)
        if github_match:
            github_url = github_match.group()
            if not github_url.startswith('http'):
                github_url = 'https://' + github_url
            info['website'] = github_url
            logger.info(f"🐙 GitHub trouvé: {github_url}")
        
        # Sites déployés (projets)
        if 'website' not in info:
            deployed_match = self.deployed_site_pattern.search(text)
            if deployed_match:
                info['website'] = deployed_match.group()
                logger.info(f"🌐 Site déployé trouvé: {info['website']}")
        
        # Localisation améliorée
        location_patterns = [
            r'Campus\s+([A-Z][a-zA-Z\s]+)',
            r'([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),?\s*(?:France|Vietnam)',
            r'INSA\s+([A-Z][a-z]+)'
        ]
        
        for pattern in location_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                info['location'] = match.group(1).strip()
                logger.info(f"📍 Localisation trouvée: {info['location']}")
                break
        
        return info

    def extract_experiences(self, text: str) -> List[Dict[str, Any]]:
        """Extrait les expériences avec logique améliorée"""
        logger.info("🔍 Extraction des expériences...")
        experiences = []
        
        lines = text.split('\n')
        in_experience_section = False
        in_projects_section = False
        
        for i, line in enumerate(lines):
            line = line.strip()
            if not line:
                continue
                
            # Détecte les sections
            if re.search(r'^EXPÉRIENCES?$', line, re.IGNORECASE):
                in_experience_section = True
                in_projects_section = False
                continue
            elif re.search(r'^PROJETS?\s+PERSONNELS?$', line, re.IGNORECASE):
                in_projects_section = True
                in_experience_section = False
                continue
            elif re.search(r'^(FORMATION|COMPÉ?TENCES\s+TECHNIQUES|LANGUES)', line, re.IGNORECASE):
                in_experience_section = False
                in_projects_section = False
                continue
                
            if not (in_experience_section or in_projects_section):
                continue
                
            # Cherche les postes/projets
            if (line and not line.isdigit() and len(line) > 5 and 
                not re.search(r'^(Fonctionnalités|Technologies|Compétences|Déploiement|CERTIFICATS)', line, re.IGNORECASE)):
                
                # Vérifie si c'est un titre de poste/projet
                next_lines = []
                for j in range(i+1, min(i+8, len(lines))):
                    if lines[j].strip():
                        next_lines.append(lines[j].strip())
                
                # Cherche une année dans les lignes suivantes
                year_found = False
                company = ""
                location = ""
                year = ""
                
                for next_line in next_lines:
                    year_match = re.search(r'\b(20\d{2})\b', next_line)
                    if year_match:
                        year = year_match.group(1)
                        year_found = True
                        break
                
                # Si pas d'année trouvée directement, cherche dans les lignes après
                if not year_found:
                    for j, next_line in enumerate(next_lines):
                        if 'projet' in next_line.lower() and j < len(next_lines) - 1:
                            # Cherche l'année dans la ligne suivante
                            following_lines = next_lines[j+1:]
                            for following_line in following_lines:
                                year_match = re.search(r'\b(20\d{2})\b', following_line)
                                if year_match:
                                    year = year_match.group(1)
                                    year_found = True
                                    break
                            if year_found:
                                break
                
                if year_found:
                    # Extrait l'entreprise/projet
                    for next_line in next_lines:
                        if 'projet' in next_line.lower() or '-' in next_line:
                            if '-' in next_line:
                                parts = next_line.split('-')
                                company = parts[0].strip()
                                if len(parts) > 1:
                                    location = parts[1].strip()
                            else:
                                company = next_line
                            break
                
                if year_found:
                    # Collecte la description
                    description_parts = []
                    for j in range(i+2, min(i+10, len(lines))):
                        desc_line = lines[j].strip()
                        if desc_line and not re.search(r'^[A-Z\s]+$', desc_line):
                            if re.search(r'^(FORMATION|COMPÉ?TENCES|CERTIFICATS)', desc_line, re.IGNORECASE):
                                break
                            if desc_line.startswith(('Fonctionnalités', 'Technologies', 'Compétences', 'Déploiement')):
                                description_parts.append(desc_line)
                    
                    exp = {
                        'id': f"exp-{hash(line + company)}-{len(experiences)}",
                        'position': line,
                        'company': company or "Projet personnel",
                        'location': location,
                        'startDate': year,
                        'endDate': '',
                        'description': ' '.join(description_parts),
                        'isCurrentPosition': False
                    }
                    
                    experiences.append(exp)
                    logger.info(f"💼 Expérience trouvée: {line} - {company}")
        
        logger.info(f"💼 {len(experiences)} expériences trouvées")
        return experiences

    def extract_education(self, text: str) -> List[Dict[str, Any]]:
        """Extrait la formation avec logique améliorée"""
        logger.info("🔍 Extraction de la formation...")
        education = []
        
        lines = text.split('\n')
        in_formation_section = False
        
        for i, line in enumerate(lines):
            line = line.strip()
            if not line:
                continue
                
            # Détecte le début de la section formation
            if re.search(r'^FORMATION$', line, re.IGNORECASE):
                in_formation_section = True
                continue
                
            # Arrête si on atteint une nouvelle section
            if in_formation_section and re.search(r'^(PROJETS|COMPÉ?TENCES|EXPÉRIENCES|CERTIFICATS)', line, re.IGNORECASE):
                break
                
            if not in_formation_section:
                continue
                
            # Cherche une ligne avec des dates
            if re.search(r'\d{4}\s*-\s*(?:\d{4}|présent)', line, re.IGNORECASE):
                # Cette ligne contient les dates
                date_match = re.search(r'(\d{4})\s*-\s*((?:\d{4}|présent))', line, re.IGNORECASE)
                if date_match:
                    start_year = date_match.group(1)
                    end_year = date_match.group(2).lower()
                    
                    # L'institution et le diplôme sont dans les lignes suivantes
                    institution = ""
                    degree = ""
                    description = ""
                    
                    # Cherche dans les lignes suivantes
                    for j in range(i+1, min(i+6, len(lines))):
                        next_line = lines[j].strip()
                        if not next_line or next_line == "CONTACT":
                            continue
                            
                        if re.search(r'INSA|université|école|institut', next_line, re.IGNORECASE):
                            # C'est l'institution et le diplôme
                            if '-' in next_line:
                                parts = next_line.split('-', 1)
                                institution = parts[0].strip()
                                degree = parts[1].strip()
                            else:
                                institution = next_line
                                degree = "Études d'ingénieur"
                            break
                    
                    # Collecte la description
                    description_parts = []
                    for j in range(i+2, min(i+8, len(lines))):
                        desc_line = lines[j].strip()
                        if desc_line and not re.search(r'^[A-Z\s]+:?$', desc_line):
                            if re.search(r'^(PROJETS|COMPÉ?TENCES|EXPÉRIENCES)', desc_line, re.IGNORECASE):
                                break
                            description_parts.append(desc_line)
                    
                    edu = {
                        'id': f"edu-{hash(degree + institution)}-{len(education)}",
                        'degree': degree or "Formation en cours",
                        'institution': institution or "INSA Toulouse",
                        'field': "Informatique",
                        'startDate': start_year,
                        'endDate': '' if end_year == 'présent' else end_year,
                        'description': ' '.join(description_parts[:3])  # Limite à 3 lignes
                    }
                    
                    education.append(edu)
                    logger.info(f"🎓 Formation trouvée: {degree} - {institution}")
        
        logger.info(f"🎓 {len(education)} formations trouvées")
        return education

    def extract_languages(self, text: str) -> List[Dict[str, Any]]:
        """Extrait les langues avec reconnaissance améliorée"""
        logger.info("🔍 Extraction des langues...")
        languages = []
        
        # Cherche la section langues
        lines = text.split('\n')
        in_languages_section = False
        
        for line in lines:
            line_clean = line.strip()
            
            # Détecte le début de la section langues
            if re.search(r'COMPÉ?TENCES\s+LINGUISTIQUES?|LINGUISTIQUES\s+TRANSVERSALES|LANGUES?', line_clean, re.IGNORECASE):
                in_languages_section = True
                continue
                
            # Arrête si nouvelle section
            if in_languages_section and re.search(r'^(FORMATION|COMPÉ?TENCES\s+TECHNIQUES|EXPÉRIENCES)', line_clean, re.IGNORECASE):
                break
                
            if in_languages_section and line_clean:
                # Patterns pour extraire langues avec niveaux
                lang_patterns = [
                    (r'(Français?)\s*:\s*([^(]+)(?:\(([^)]+)\))?', 'Français'),
                    (r'(Anglais?)\s*:\s*([^(]+)(?:\(([^)]+)\))?', 'Anglais'),
                    (r'(Vietnamien?)\s*:\s*([^(]+)', 'Vietnamien'),
                    (r'(Espagnol?)\s*:\s*([^(]+)(?:\(([^)]+)\))?', 'Espagnol'),
                ]
                
                for pattern, lang_name in lang_patterns:
                    match = re.search(pattern, line_clean, re.IGNORECASE)
                    if match:
                        level_text = match.group(2).strip().lower()
                        level_in_parens = match.group(3) if len(match.groups()) > 2 and match.group(3) else ""
                        
                        # Détermine le niveau
                        if level_in_parens:
                            level = level_in_parens.strip()
                        elif 'natale' in level_text or 'native' in level_text:
                            level = 'native'
                        elif 'courant' in level_text:
                            if 'b2' in line_clean.lower():
                                level = 'B2'
                            elif 'c2' in line_clean.lower():
                                level = 'C2'
                            else:
                                level = 'C1'
                        else:
                            level = 'B1'
                        
                        languages.append({
                            'id': f"lang-{hash(lang_name)}-{len(languages)}",
                            'name': lang_name,
                            'level': level
                        })
                        logger.info(f"🗣️ Langue trouvée: {lang_name} ({level})")
        
        logger.info(f"🗣️ {len(languages)} langues trouvées")
        return languages

    def extract_skills(self, text: str) -> List[Dict[str, Any]]:
        """Extrait les compétences techniques"""
        logger.info("🔍 Extraction des compétences...")
        skills = []
        
        lines = text.split('\n')
        in_skills_section = False
        
        # Technologies communes à détecter
        tech_keywords = {
            'java', 'python', 'javascript', 'typescript', 'dart', 'sql', 'html', 'css', 'c',
            'react', 'angular', 'vue', 'next', 'flutter', 'spring', 'hibernate',
            'docker', 'kubernetes', 'git', 'jenkins', 'supabase', 'firebase',
            'apache', 'camel', 'bootstrap', 'node', 'express', 'mongodb', 'postgresql',
            'tailwindcss', 'prisma', 'stripe'
        }
        
        for line in lines:
            line_clean = line.strip().lower()
            
            # Détecte le début de la section compétences
            if re.search(r'compé?tences.*technique', line_clean) or re.search(r'^langages?\s*:', line_clean):
                in_skills_section = True
                
            # Arrête si nouvelle section
            if in_skills_section and re.search(r'^(formation|langues|expé?rience|certificats)', line_clean):
                break
                
            if (in_skills_section or re.search(r'langages?\s*:', line_clean)) and line_clean:
                # Extrait les technologies de la ligne
                words = re.findall(r'\b\w+\b', line_clean)
                for word in words:
                    if word in tech_keywords:
                        # Évite les doublons
                        if not any(skill['name'].lower() == word for skill in skills):
                            skills.append({
                                'id': f"skill-{hash(word)}-{len(skills)}",
                                'name': word.title(),
                                'category': 'technical',
                                'level': 'intermediate'
                            })
        
        logger.info(f"🛠️ {len(skills)} compétences trouvées")
        return skills

    def parse_cv(self, pdf_path: str) -> Dict[str, Any]:
        """Parse complet d'un CV PDF"""
        logger.info(f"🚀 Début du parsing de: {pdf_path}")
        
        # Extraction du texte
        text = self.extract_text_from_pdf(pdf_path)
        if not text:
            logger.error("❌ Impossible d'extraire le texte du PDF")
            return self._empty_cv_data()
        
        # Extraction des données structurées
        result = {
            "personalInfo": self.extract_personal_info(text),
            "experiences": self.extract_experiences(text),
            "education": self.extract_education(text),
            "skills": self.extract_skills(text),
            "languages": self.extract_languages(text)
        }
        
        logger.info("✅ Parsing terminé avec succès!")
        return result

    def _empty_cv_data(self) -> Dict[str, Any]:
        """Retourne une structure CV vide"""
        return {
            "personalInfo": {},
            "experiences": [],
            "education": [],
            "skills": [],
            "languages": []
        }

def main():
    """Fonction principale pour utilisation en ligne de commande"""
    parser = argparse.ArgumentParser(description='Parser CV PDF amélioré pour CV Genius')
    parser.add_argument('pdf_path', help='Chemin vers le fichier PDF à parser')
    parser.add_argument('--output', '-o', help='Fichier de sortie JSON (optionnel)')
    parser.add_argument('--verbose', '-v', action='store_true', help='Mode verbose')
    
    args = parser.parse_args()
    
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    # Vérification du fichier
    if not Path(args.pdf_path).exists():
        logger.error(f"❌ Fichier non trouvé: {args.pdf_path}")
        sys.exit(1)
    
    # Parsing
    cv_parser = ImprovedCVParser()
    result = cv_parser.parse_cv(args.pdf_path)
    
    # Sortie
    json_output = json.dumps(result, indent=2, ensure_ascii=False)
    
    if args.output:
        with open(args.output, 'w', encoding='utf-8') as f:
            f.write(json_output)
        logger.info(f"✅ Résultat sauvegardé dans: {args.output}")
    else:
        print(json_output)

if __name__ == "__main__":
    main() 