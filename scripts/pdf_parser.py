#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CV Genius - PDF Parser
Système de parsing avancé pour extraire les données structurées des CVs PDF
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

try:
    import spacy
    # Tenter de charger le modèle français
    nlp = spacy.load("fr_core_news_sm")
except (ImportError, OSError):
    print("⚠️  spaCy ou modèle français non disponible. Utilisation des regex seulement.")
    nlp = None

# Configuration du logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class CVParser:
    """Parser avancé pour CVs PDF"""
    
    def __init__(self):
        self.email_pattern = re.compile(r'\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b')
        self.phone_patterns = [
            re.compile(r'(?:\+33|0)\s?[1-9](?:[\s.-]?\d{2}){4}'),  # Français
            re.compile(r'\+?(?:\d{1,3}[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}'),  # International
            re.compile(r'(?:\+\d{1,3}\s?)?\d{10,}'),  # Format simple
        ]
        self.linkedin_pattern = re.compile(r'(?:https?://)?(?:www\.)?linkedin\.com/in/[\w-]+/?', re.IGNORECASE)
        self.website_pattern = re.compile(r'(?:https?://)?(?:www\.)?[\w-]+\.[\w]{2,}(?:/[\w-]*)*/?', re.IGNORECASE)
        
        # Patterns pour les dates
        self.date_patterns = [
            re.compile(r'(\d{4})\s*[-–]\s*(\d{4}|présent|aujourd\'hui|actuel|current)', re.IGNORECASE),
            re.compile(r'(\d{1,2})/(\d{4})\s*[-–]\s*(\d{1,2})/(\d{4})', re.IGNORECASE),
            re.compile(r'(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+(\d{4})', re.IGNORECASE),
        ]
        
        # Mots-clés pour identifier les sections (avec gestion des accents)
        self.section_keywords = {
            'experience': ['expérience', 'experience', 'expe.*rience', 'professionnel', 'emploi', 'poste', 'carrière', 'work', 'employment', 'projets'],
            'education': ['formation', 'éducation', 'education', 'diplôme', 'université', 'école', 'studies', 'degree'],
            'skills': ['compétences', 'compé.*tences', 'skills', 'technique', 'technical', 'outils', 'tools', 'technologies', 'langages', 'frameworks'],
            'languages': ['langues', 'languages', 'langue', 'idiomas']
        }

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

    def clean_text(self, text: str) -> str:
        """Nettoie le texte extrait"""
        # Supprime les caractères spéciaux inutiles
        text = re.sub(r'\s+', ' ', text)  # Espaces multiples
        text = re.sub(r'[•◦▪▫➤‣⁃]', '-', text)  # Bullets
        text = text.replace('\n', ' ')
        return text.strip()

    def extract_personal_info(self, text: str) -> Dict[str, str]:
        """Extrait les informations personnelles"""
        logger.info("🔍 Extraction des informations personnelles...")
        personal_info = {}
        
        # Email
        email_match = self.email_pattern.search(text)
        if email_match:
            personal_info['email'] = email_match.group()
            logger.info(f"📧 Email trouvé: {personal_info['email']}")
        
        # Téléphone
        for pattern in self.phone_patterns:
            phone_match = pattern.search(text)
            if phone_match:
                personal_info['phone'] = phone_match.group().strip()
                logger.info(f"📱 Téléphone trouvé: {personal_info['phone']}")
                break
        
        # LinkedIn
        linkedin_match = self.linkedin_pattern.search(text)
        if linkedin_match:
            personal_info['linkedin'] = linkedin_match.group()
            logger.info(f"💼 LinkedIn trouvé: {personal_info['linkedin']}")
        
        # Site web (excluant LinkedIn)
        website_matches = self.website_pattern.findall(text)
        for website in website_matches:
            if 'linkedin' not in website.lower() and 'github' not in website.lower():
                personal_info['website'] = website
                logger.info(f"🌐 Site web trouvé: {personal_info['website']}")
                break
        
        # Nom (première ligne qui ne contient pas email/phone)
        lines = [line.strip() for line in text.split('\n') if line.strip()]
        for line in lines[:5]:  # Cherche dans les 5 premières lignes
            if (len(line) > 2 and len(line) < 50 and 
                not self.email_pattern.search(line) and 
                not any(pattern.search(line) for pattern in self.phone_patterns) and
                not any(char.isdigit() for char in line) and
                line.count(' ') >= 1):  # Au moins prénom + nom
                personal_info['name'] = line
                logger.info(f"👤 Nom trouvé: {personal_info['name']}")
                break
        
        return personal_info

    def extract_experiences(self, text: str) -> List[Dict[str, Any]]:
        """Extrait les expériences professionnelles"""
        logger.info("🔍 Extraction des expériences...")
        experiences = []
        
        # Recherche de sections d'expérience
        experience_section = self._find_section(text, 'experience')
        if not experience_section:
            return experiences
        
        # Cherche les blocs d'expérience avec dates
        date_blocks = []
        for pattern in self.date_patterns:
            matches = pattern.finditer(experience_section)
            for match in matches:
                start_pos = max(0, match.start() - 200)
                end_pos = min(len(experience_section), match.end() + 200)
                block = experience_section[start_pos:end_pos]
                date_blocks.append({
                    'text': block,
                    'dates': match.groups(),
                    'position': match.start()
                })
        
        # Traite chaque bloc d'expérience
        for i, block in enumerate(date_blocks):
            exp = {
                'id': f"exp-{hash(block['text'])}-{i}",
                'company': self._extract_company(block['text']),
                'position': self._extract_position(block['text']),
                'startDate': self._parse_start_date(block['dates']),
                'endDate': self._parse_end_date(block['dates']),
                'isCurrentPosition': self._is_current_position(block['dates']),
                'description': self._extract_description(block['text']),
                'location': self._extract_location(block['text'])
            }
            experiences.append(exp)
            logger.info(f"💼 Expérience trouvée: {exp['position']} chez {exp['company']}")
        
        return experiences

    def extract_education(self, text: str) -> List[Dict[str, Any]]:
        """Extrait la formation"""
        logger.info("🔍 Extraction de la formation...")
        education = []
        
        education_section = self._find_section(text, 'education')
        if not education_section:
            return education
        
        # Patterns pour diplômes
        degree_patterns = [
            r'(master|licence|bac|bachelor|phd|doctorat|ingénieur|bts|dut)[\s\w]*',
            r'(m1|m2|l1|l2|l3)[\s\w]*'
        ]
        
        lines = education_section.split('\n')
        current_education = {}
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            # Cherche diplôme
            for pattern in degree_patterns:
                if re.search(pattern, line, re.IGNORECASE):
                    if current_education:
                        education.append(current_education)
                    current_education = {
                        'id': f"edu-{hash(line)}-{len(education)}",
                        'degree': line,
                        'institution': '',
                        'startDate': '',
                        'endDate': ''
                    }
                    break
            
            # Cherche institution
            if current_education and not current_education['institution']:
                if any(keyword in line.lower() for keyword in ['université', 'école', 'institut', 'college']):
                    current_education['institution'] = line
        
        if current_education:
            education.append(current_education)
        
        logger.info(f"🎓 {len(education)} formations trouvées")
        return education

    def extract_skills(self, text: str) -> List[Dict[str, Any]]:
        """Extrait les compétences"""
        logger.info("🔍 Extraction des compétences...")
        skills = []
        
        skills_section = self._find_section(text, 'skills')
        if not skills_section:
            return skills
        
        # Compétences techniques communes
        tech_skills = [
            'python', 'javascript', 'java', 'react', 'angular', 'vue', 'node',
            'docker', 'kubernetes', 'aws', 'azure', 'git', 'sql', 'nosql',
            'html', 'css', 'php', 'ruby', 'go', 'rust', 'typescript'
        ]
        
        words = re.findall(r'\b\w+\b', skills_section.lower())
        for word in words:
            if word in tech_skills:
                skills.append({
                    'id': f"skill-{hash(word)}-{len(skills)}",
                    'name': word.title(),
                    'category': 'technical',
                    'level': 'intermediate'
                })
        
        logger.info(f"🛠️ {len(skills)} compétences trouvées")
        return skills

    def extract_languages(self, text: str) -> List[Dict[str, Any]]:
        """Extrait les langues"""
        logger.info("🔍 Extraction des langues...")
        languages = []
        
        languages_section = self._find_section(text, 'languages')
        if not languages_section:
            return languages
        
        # Langues communes
        common_languages = {
            'français': 'native', 'french': 'native',
            'anglais': 'B2', 'english': 'B2',
            'espagnol': 'B1', 'spanish': 'B1',
            'allemand': 'B1', 'german': 'B1',
            'italien': 'B1', 'italian': 'B1'
        }
        
        for lang, level in common_languages.items():
            if re.search(r'\b' + lang + r'\b', languages_section, re.IGNORECASE):
                languages.append({
                    'id': f"lang-{hash(lang)}-{len(languages)}",
                    'name': lang.title(),
                    'level': level
                })
        
        logger.info(f"🗣️ {len(languages)} langues trouvées")
        return languages

    def _find_section(self, text: str, section_type: str) -> str:
        """Trouve une section spécifique dans le texte"""
        keywords = self.section_keywords.get(section_type, [])
        
        lines = text.split('\n')
        section_content = ""
        in_section = False
        
        for i, line in enumerate(lines):
            line_clean = line.strip()
            if not line_clean:
                continue
                
            # Vérifie si cette ligne est un titre de section
            for keyword in keywords:
                if re.search(keyword, line_clean, re.IGNORECASE):
                    in_section = True
                    section_content = line_clean + "\n"
                    
                    # Collecte les lignes suivantes jusqu'à la prochaine section ou fin
                    for j in range(i + 1, len(lines)):
                        next_line = lines[j].strip()
                        if not next_line:
                            continue
                            
                        # Arrêt si on trouve une nouvelle section (titre en majuscules ou avec des mots-clés spécifiques)
                        if self._is_new_section_title(next_line):
                            break
                            
                        section_content += next_line + "\n"
                    
                    return section_content
        
        return ""
    
    def _is_new_section_title(self, line: str) -> bool:
        """Détecte si une ligne est un titre de nouvelle section"""
        line_clean = line.strip().lower()
        
        # Liste des titres de sections possibles
        section_titles = [
            'formation', 'éducation', 'education', 'expérience', 'experience', 'expe.*rience',
            'compétences', 'compé.*tences', 'skills', 'langues', 'languages', 'projets',
            'certifications', 'loisirs', 'centres d\'intérêt', 'références', 'divers'
        ]
        
        for title in section_titles:
            if re.search(title, line_clean):
                return True
                
        return False

    def _extract_company(self, text: str) -> str:
        """Extrait le nom de l'entreprise"""
        # Cherche après des mots-clés comme "chez", "at", etc.
        patterns = [
            r'(?:chez|at|@)\s+([A-Z][^\n,.-]{2,30})',
            r'([A-Z][A-Za-z\s&]{2,30})(?:\s*[-–]\s*)',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text)
            if match:
                return match.group(1).strip()
        
        return "Entreprise"

    def _extract_position(self, text: str) -> str:
        """Extrait l'intitulé du poste"""
        lines = [line.strip() for line in text.split('\n') if line.strip()]
        for line in lines:
            if len(line) > 5 and len(line) < 100 and not re.search(r'\d{4}', line):
                return line
        return "Poste"

    def _extract_location(self, text: str) -> str:
        """Extrait la localisation"""
        # Cherche des patterns de ville/pays
        location_pattern = r'([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,?\s*[A-Z][a-z]+)'
        match = re.search(location_pattern, text)
        return match.group(1) if match else ""

    def _extract_description(self, text: str) -> str:
        """Extrait la description du poste"""
        lines = text.split('\n')
        description_lines = []
        
        for line in lines:
            line = line.strip()
            if (len(line) > 20 and 
                not re.search(r'\d{4}', line) and 
                not any(keyword in line.lower() for keyword in ['entreprise', 'company', 'poste'])):
                description_lines.append(line)
        
        return ' '.join(description_lines[:3])  # Max 3 lignes

    def _parse_start_date(self, dates: tuple) -> str:
        """Parse la date de début"""
        if dates and len(dates) > 0:
            return str(dates[0])
        return ""

    def _parse_end_date(self, dates: tuple) -> str:
        """Parse la date de fin"""
        if dates and len(dates) > 1:
            end_date = dates[1].lower()
            if any(word in end_date for word in ['présent', 'aujourd\'hui', 'actuel', 'current']):
                return ""
            return str(dates[1])
        return ""

    def _is_current_position(self, dates: tuple) -> bool:
        """Détermine si c'est le poste actuel"""
        if dates and len(dates) > 1:
            end_date = dates[1].lower()
            return any(word in end_date for word in ['présent', 'aujourd\'hui', 'actuel', 'current'])
        return False

    def parse_cv(self, pdf_path: str) -> Dict[str, Any]:
        """Parse complet d'un CV PDF"""
        logger.info(f"🚀 Début du parsing de: {pdf_path}")
        
        # Extraction du texte
        text = self.extract_text_from_pdf(pdf_path)
        if not text:
            logger.error("❌ Impossible d'extraire le texte du PDF")
            return self._empty_cv_data()
        
        # Nettoyage du texte
        cleaned_text = self.clean_text(text)
        
        # Extraction des données structurées
        result = {
            "personalInfo": self.extract_personal_info(cleaned_text),
            "experiences": self.extract_experiences(cleaned_text),
            "education": self.extract_education(cleaned_text),
            "skills": self.extract_skills(cleaned_text),
            "languages": self.extract_languages(cleaned_text)
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
    parser = argparse.ArgumentParser(description='Parser de CV PDF pour CV Genius')
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
    cv_parser = CVParser()
    result = cv_parser.parse_cv(args.pdf_path)
    
    # Sortie
    json_output = json.dumps(result, indent=2, ensure_ascii=False)
    
    if args.output:
        with open(args.output, 'w', encoding='utf-8') as f:
            f.write(json_output)
        logger.info(f"✅ Résultat de pdf_parser sauvegardé dans: {args.output}")
    else:
        print(json_output)

if __name__ == "__main__":
    main() 