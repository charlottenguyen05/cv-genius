#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CV Genius - ATS-optimized PDF Parser (Option A - PyMuPDF + Heuristics)
Dual language support: English and French.
"""

import re
import json
import sys
import io
import argparse
from pathlib import Path
from typing import Dict, List, Any, Tuple, Optional
import logging
import unicodedata

import pymupdf
from langdetect import detect, detect_langs

# Configuration du logging
logging.basicConfig(level=logging.WARNING, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Month name → number mapping (English + French, full + abbreviated)
# ---------------------------------------------------------------------------
MONTH_MAP = {
    # English full
    'january': '01', 'february': '02', 'march': '03', 'april': '04',
    'may': '05', 'june': '06', 'july': '07', 'august': '08',
    'september': '09', 'october': '10', 'november': '11', 'december': '12',
    # English abbreviated
    'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04',
    'jun': '06', 'jul': '07', 'aug': '08',
    'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12',
    # French full
    'janvier': '01', 'février': '02', 'mars': '03', 'avril': '04',
    'mai': '05', 'juin': '06', 'juillet': '07', 'août': '08',
    'septembre': '09', 'octobre': '10', 'novembre': '11', 'décembre': '12',
    # French abbreviated
    'janv': '01', 'févr': '02', 'avr': '04',
    'juil': '07', 'sept': '09', 'déc': '12',
}


class ATSParser:
    def __init__(self):
        # Contact Patterns
        self.email_pattern = re.compile(r'\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b')
        self.phone_pattern = re.compile(r'(?:\+?[\d\s.-]{8,20})')
        self.linkedin_pattern = re.compile(r'(?:https?://)?(?:www\.)?(?:linkedin\.com/in/|in/)[\w-]+/?', re.IGNORECASE)
        self.github_pattern = re.compile(r'(?:https?://)?(?:www\.)?github\.com/[\w-]+/?', re.IGNORECASE)
        self.url_pattern = re.compile(r'https?://[\w.-]+\.[a-zA-Z]{2,}[\w/.-]*', re.IGNORECASE)
        
        # Date Patterns (Years)
        self.year_pattern = re.compile(r'\b(19\d{2}|20\d{2})\b')
        
        # Robust date-range pattern:
        # Matches "June 2020 – Present", "Aug. 2018 – May 2021", "Sep 2018 - Present", etc.
        self.date_range_pattern = re.compile(
            r'([A-Za-zÀ-ÿ.]+\.?\s+\d{4})\s*[–\-—]+\s*(Present|Présent|[A-Za-zÀ-ÿ.]+\.?\s+\d{4})',
            re.IGNORECASE
        )

        # Bullet point pattern — matches lines starting with common bullet characters
        self.bullet_pattern = re.compile(r'^[\s]*[•–\-▪◦‣⁃►▸]\s')
        
        # Language Dictionaries
        self.headers = {
            'en': {
                'experience': [r'\bexperience\b', r'\bwork history\b', r'\bemployment\b', r'\bprofessional experience\b'],
                'education': [r'\beducation\b', r'\bacademic background\b', r'\bstudies\b'],
                'projects': [r'\bprojects\b', r'\bpersonal projects\b', r'\bacademic projects\b'],
                'skills': [r'\bskills\b', r'\btechnologies\b', r'\bcore competencies\b', r'\btechnical skills\b'],
                'languages': [r'\blanguages\b']
            },
            'fr': {
                'experience': [r'\bexpériences?\b', r'\bexpérience professionnelle\b', r'\bparcours professionnel\b'],
                'education': [r'\bformations?\b', r'\bétudes?\b', r'\bparcours académique\b'],
                'projects': [r'\bprojets?\b', r'\bprojets personnels?\b', r'\bréalisations?\b'],
                'skills': [r'\bcompétences?\b', r'\btechnologies?\b', r'\bcompétences techniques\b', r'\batouts?\b'],
                'languages': [r'\blangues?\b', r'\bcompétences linguistiques\b']
            }
        }
        
        # Common tech skills dictionary for heuristics
        self.tech_skills = {
            'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'ruby', 'php', 'go', 'rust', 'swift', 'kotlin',
            'react', 'angular', 'vue', 'next.js', 'node.js', 'express', 'django', 'flask', 'spring', 'hibernate',
            'sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch', 'firebase', 'supabase',
            'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'git', 'github', 'gitlab', 'ci/cd',
            'html', 'css', 'sass', 'tailwind', 'bootstrap', 'flutter', 'react native',
            'fastapi', 'jquery', 'wordpress', 'material-ui', 'junit', 'travisci',
            'pandas', 'numpy', 'matplotlib', 'r', 'c/c++',
            'google cloud platform', 'vs code', 'visual studio', 'pycharm', 'intellij', 'eclipse',
            'maven', 'celery',
        }

        # Skill category mappings for structured parsing
        self.skill_category_map = {
            'languages': 'technical',
            'frameworks': 'technical',
            'developer tools': 'technical',
            'libraries': 'technical',
            'tools': 'technical',
            'outils': 'technical',
            'langages': 'technical',
            'bibliothèques': 'technical',
        }

    def detect_language(self, text: str) -> str:
        try:
            lang = detect(text)
            if lang in ['fr', 'en']:
                return lang
            return 'en' # Default fallback
        except:
            return 'en'

    def extract_blocks_pymupdf(self, pdf_path: str) -> List[str]:
        """Extract text blocks using PyMuPDF to preserve columns and flow."""
        try:
            doc = pymupdf.open(pdf_path)
            all_text_blocks = []
            
            for page in doc:
                blocks = page.get_text("blocks")
                # PyMuPDF blocks format: (x0, y0, x1, y1, "lines in block", block_no, block_type)
                # block_type 0 = text. We sort them top-to-bottom, left-to-right loosely.
                text_blocks = [b[4].strip() for b in blocks if b[6] == 0]
                all_text_blocks.extend([b for b in text_blocks if b])
                
            return all_text_blocks
        except Exception as e:
            logger.error(f"Error reading PDF with PyMuPDF: {e}")
            return []

    def normalize_text(self, text: str) -> str:
        return unicodedata.normalize('NFC', text)

    def identify_section(self, line: str, lang: str) -> str:
        line_clean = line.strip().lower()
        # Only check short lines as potential headers
        if len(line_clean) > 50:
            return None
            
        for section, patterns in self.headers[lang].items():
            for pattern in patterns:
                if re.search(pattern, line_clean):
                    return section
        return None

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def _is_bullet_block(self, block: str) -> bool:
        """Detect if a block is a bullet-point description (not a header)."""
        first_line = block.strip().split('\n')[0].strip()
        return bool(self.bullet_pattern.match(first_line))

    def _parse_month_year(self, text: str) -> str:
        """Convert 'June 2020', 'Aug. 2018', 'Sep 2018' → '2020-06'.
        Returns just the year if month cannot be determined."""
        text = text.strip().rstrip('.')
        parts = text.split()
        if len(parts) < 2:
            # Maybe just a year
            m = re.search(r'\b(19\d{2}|20\d{2})\b', text)
            return m.group(1) if m else ""

        month_str = parts[0].lower().rstrip('.')
        year_str = parts[1]

        month_num = MONTH_MAP.get(month_str, '')
        if month_num and re.match(r'^(19|20)\d{2}$', year_str):
            return f"{year_str}-{month_num}"

        # Fallback: return just year
        m = re.search(r'\b(19\d{2}|20\d{2})\b', text)
        return m.group(1) if m else ""

    def _parse_date_range(self, text: str) -> Tuple[str, str, bool]:
        """Parse date ranges like 'June 2020 – Present' or 'Aug. 2018 – May 2021'.
        Returns (startDate, endDate, isCurrentPosition)."""
        match = self.date_range_pattern.search(text)
        if not match:
            # Fallback: try to find years
            years = self.year_pattern.findall(text)
            start = years[0] if years else ""
            end = years[1] if len(years) > 1 else ""
            is_current = 'present' in text.lower() or 'présent' in text.lower()
            return (start, end, is_current)

        start_str = match.group(1)
        end_str = match.group(2)

        start_date = self._parse_month_year(start_str)
        is_current = end_str.lower() in ('present', 'présent')
        end_date = "" if is_current else self._parse_month_year(end_str)

        return (start_date, end_date, is_current)

    def _has_date_range(self, text: str) -> bool:
        """Check if a text contains a recognisable date range."""
        return bool(self.date_range_pattern.search(text))

    def _find_date_line(self, lines: List[str]) -> Tuple[int, str, str, bool]:
        """Find the line containing a date range in a list of lines.
        Returns (line_index, startDate, endDate, isCurrentPosition).
        Returns (-1, '', '', False) if not found."""
        for i, line in enumerate(lines):
            if self._has_date_range(line):
                start, end, is_current = self._parse_date_range(line)
                return (i, start, end, is_current)
        return (-1, '', '', False)

    # ------------------------------------------------------------------
    # Main parse entry
    # ------------------------------------------------------------------

    def parse_cv(self, pdf_path: str) -> Dict[str, Any]:

        
        blocks = self.extract_blocks_pymupdf(pdf_path)
        if not blocks:
            logger.error("❌ Failed to extract text blocks.")
            return self._empty_cv_data()
            
        full_text = "\n\n".join(blocks)
        full_text = self.normalize_text(full_text)
        
        lang = self.detect_language(full_text)

        
        # Segment into sections
        sections = {
            'personalInfo': [],
            'experience': [],
            'education': [],
            'projects': [],
            'skills': [],
            'languages': []
        }
        
        current_section = 'personalInfo'
        
        for block in blocks:
            # Check if this block is a header (usually first line of block)
            lines = block.split('\n')
            first_line = lines[0].strip()
            
            detected_sec = self.identify_section(first_line, lang)
            if detected_sec:
                current_section = detected_sec
                # If block has more than just header, add the rest
                if len(lines) > 1:
                    sections[current_section].append("\n".join(lines[1:]))
            else:
                sections[current_section].append(block)
                
        # Parse each section
        result = {
            "personalInfo": self.parse_personal_info(sections['personalInfo'], full_text),
            "experiences": self.parse_experience(sections['experience']),
            "education": self.parse_education(sections['education']),
            "projects": self.parse_projects(sections['projects']),
            "skills": self.parse_skills(sections['skills'], full_text),
            "languages": self.parse_languages(sections['languages'])
        }
        

        return result

    def parse_personal_info(self, blocks: List[str], full_text: str) -> Dict[str, str]:
        info = {}
        
        # Try to find Name in first block
        if blocks:
            lines = blocks[0].split('\n')
            if lines:
                info['name'] = lines[0].strip()
                
        # Search entire text for contact info (it might be anywhere)
        email_match = self.email_pattern.search(full_text)
        if email_match:
            info['email'] = email_match.group()
            
        linkedin_match = self.linkedin_pattern.search(full_text)
        if linkedin_match:
            linkedin_url = linkedin_match.group()
            if not linkedin_url.startswith('http'):
                linkedin_url = 'https://' + linkedin_url
            info['linkedin'] = linkedin_url
            
        github_match = self.github_pattern.search(full_text)
        if github_match:
            github_url = github_match.group()
            if not github_url.startswith('http'):
                github_url = 'https://' + github_url
            info['website'] = github_url
            
        # Try to find a phone number, filter out years
        phone_matches = self.phone_pattern.findall(full_text)
        for pm in phone_matches:
            clean_pm = re.sub(r'[\s.-]', '', pm)
            if len(clean_pm) >= 9 and not clean_pm.startswith('19') and not clean_pm.startswith('20'):
                info['phone'] = pm.strip()
                break
                
        return info

    # ------------------------------------------------------------------
    # Experience parsing
    # ------------------------------------------------------------------

    def parse_experience(self, blocks: List[str]) -> List[Dict[str, Any]]:
        """Parse experience blocks.

        Expected block structure from PyMuPDF:
          Header block (multi-line):
            Line 0: Position / Title
            Line 1: Date range  (e.g. "June 2020 – Present")
            Line 2: Company name
            Line 3: Location    (e.g. "College Station, TX")
          Bullet blocks (single-line each):
            "• Did something great"

        The key insight: bullet blocks should be appended as description
        to the most recent header, NOT treated as new experiences.
        """
        experiences = []
        current_exp = None

        for block in blocks:
            # ---- Bullet block → append to current experience description ----
            if self._is_bullet_block(block):
                if current_exp is not None:
                    bullet_text = block.strip()
                    if current_exp['description']:
                        current_exp['description'] += "\n" + bullet_text
                    else:
                        current_exp['description'] = bullet_text
                continue

            # ---- Non-bullet block → likely a new experience header ----
            lines = [l.strip() for l in block.split('\n') if l.strip()]

            if not lines:
                continue

            # Save previous experience
            if current_exp is not None:
                experiences.append(current_exp)

            # Parse the header block
            # Find which line contains the date range
            date_idx, start_date, end_date, is_current = self._find_date_line(lines)

            position = ""
            company = ""
            location = ""

            if date_idx >= 0:
                # Lines before the date line are position/title
                position = " ".join(lines[:date_idx]) if date_idx > 0 else ""
                # Lines after the date line: first is company, second is location
                after_date = lines[date_idx + 1:]
                company = after_date[0] if len(after_date) > 0 else ""
                location = after_date[1] if len(after_date) > 1 else ""
            else:
                # No date found — treat first line as position, rest as company/location
                position = lines[0]
                company = lines[1] if len(lines) > 1 else ""
                location = lines[2] if len(lines) > 2 else ""

            current_exp = {
                'id': f"exp-{len(experiences)}",
                'position': position,
                'company': company,
                'location': location,
                'startDate': start_date,
                'endDate': end_date,
                'description': "",
                'isCurrentPosition': is_current
            }

        # Don't forget the last experience
        if current_exp is not None:
            experiences.append(current_exp)

        return experiences

    # ------------------------------------------------------------------
    # Education parsing
    # ------------------------------------------------------------------

    def parse_education(self, blocks: List[str]) -> List[Dict[str, Any]]:
        """Parse education blocks.

        Expected block structure from PyMuPDF:
          Header block (multi-line):
            Line 0: Institution   (e.g. "Southwestern University")
            Line 1: Location      (e.g. "Georgetown, TX")
            Line 2: Degree + Field (e.g. "Bachelor of Arts in Computer Science, Minor in Business")
            Line 3: Date range    (e.g. "Aug. 2018 – May 2021")
          Bullet blocks (if any):
            "• GPA: 3.8/4.0"
        """
        education = []
        current_edu = None

        for block in blocks:
            # ---- Bullet block → append to current education description ----
            if self._is_bullet_block(block):
                if current_edu is not None:
                    bullet_text = block.strip()
                    if current_edu['description']:
                        current_edu['description'] += "\n" + bullet_text
                    else:
                        current_edu['description'] = bullet_text
                continue

            # ---- Non-bullet block → likely a new education entry ----
            lines = [l.strip() for l in block.split('\n') if l.strip()]

            if not lines:
                continue

            # Save previous education
            if current_edu is not None:
                education.append(current_edu)

            # Find the date line
            date_idx, start_date, end_date, _ = self._find_date_line(lines)

            institution = ""
            location = ""
            degree = ""
            field = ""

            if date_idx >= 0:
                # Lines before the date contain institution, location, degree
                before_date = lines[:date_idx]

                if len(before_date) >= 3:
                    # Standard format: institution, location, degree+field
                    institution = before_date[0]
                    location = before_date[1]
                    degree_line = before_date[2]
                    degree, field = self._parse_degree_field(degree_line)
                elif len(before_date) == 2:
                    institution = before_date[0]
                    # Second line could be location or degree — check if it looks like a location
                    if self._looks_like_location(before_date[1]):
                        location = before_date[1]
                    else:
                        degree_line = before_date[1]
                        degree, field = self._parse_degree_field(degree_line)
                elif len(before_date) == 1:
                    institution = before_date[0]
            else:
                # No date found — best effort
                institution = lines[0] if lines else ""
                if len(lines) > 1:
                    location = lines[1]
                if len(lines) > 2:
                    degree, field = self._parse_degree_field(lines[2])

            current_edu = {
                'id': f"edu-{len(education)}",
                'institution': institution,
                'location': location,
                'degree': degree,
                'field': field,
                'startDate': start_date,
                'endDate': end_date,
                'description': ""
            }

        if current_edu is not None:
            education.append(current_edu)

        return education

    def _parse_degree_field(self, text: str) -> Tuple[str, str]:
        """Split a degree line into degree and field.
        E.g. 'Bachelor of Arts in Computer Science, Minor in Business'
        → ('Bachelor of Arts in Computer Science', 'Minor in Business')
        """
        # Try splitting on comma
        parts = [p.strip() for p in text.split(',')]
        if len(parts) >= 2:
            degree = parts[0]
            field = ', '.join(parts[1:])
            return (degree, field)
        return (text, "")

    def _looks_like_location(self, text: str) -> bool:
        """Heuristic: a location usually contains a comma followed by a 2-letter state/country code,
        or common location words."""
        # Pattern: "City, ST" or "City, State" or "City, Country"
        if re.search(r',\s*[A-Z]{2}\b', text):
            return True
        if re.search(r',\s*\w+$', text) and len(text) < 40:
            return True
        return False

    # ------------------------------------------------------------------
    # Projects parsing
    # ------------------------------------------------------------------

    def parse_projects(self, blocks: List[str]) -> List[Dict[str, Any]]:
        """Parse project blocks.

        Expected block structure from PyMuPDF:
          Header block (2 lines):
            Line 0: "ProjectName | Tech1, Tech2, Tech3"
            Line 1: "June 2020 – Present"
          Bullet blocks:
            "• Did something"
        """
        projects = []
        current_proj = None

        for block in blocks:
            # ---- Bullet block → append to current project description ----
            if self._is_bullet_block(block):
                if current_proj is not None:
                    bullet_text = block.strip()
                    if current_proj['description']:
                        current_proj['description'] += "\n" + bullet_text
                    else:
                        current_proj['description'] = bullet_text
                continue

            # ---- Non-bullet block → likely a new project header ----
            lines = [l.strip() for l in block.split('\n') if l.strip()]

            if not lines:
                continue

            # Save previous project
            if current_proj is not None:
                projects.append(current_proj)

            # Parse project name and technologies from first line
            first_line = lines[0]
            name, technologies = self._parse_project_name_tech(first_line)

            # Parse dates from remaining lines
            start_date = ""
            end_date = ""
            is_current = False
            remaining_lines = lines[1:]

            for line in remaining_lines:
                if self._has_date_range(line):
                    start_date, end_date, is_current = self._parse_date_range(line)
                    break

            current_proj = {
                'id': f"proj-{len(projects)}",
                'name': name,
                'technologies': technologies,
                'startDate': start_date,
                'endDate': end_date,
                'description': ""
            }

        if current_proj is not None:
            projects.append(current_proj)

        return projects

    def _parse_project_name_tech(self, line: str) -> Tuple[str, str]:
        """Split 'Gitlytics | Python, Flask, React, PostgreSQL, Docker'
        into ('Gitlytics', 'Python, Flask, React, PostgreSQL, Docker').
        """
        if '|' in line:
            parts = line.split('|', 1)
            name = parts[0].strip()
            technologies = parts[1].strip()
            return (name, technologies)
        return (line.strip(), "")

    # ------------------------------------------------------------------
    # Skills parsing
    # ------------------------------------------------------------------

    def parse_skills(self, blocks: List[str], full_text: str) -> List[Dict[str, Any]]:
        """Parse skills, supporting both structured and unstructured formats.
        
        Structured format (common in ATS-optimized CVs):
            Languages: Java, Python, C/C++, SQL (Postgres), JavaScript, HTML/CSS, R
            Frameworks: React, Node.js, Flask, JUnit, WordPress, Material-UI, FastAPI
            Developer Tools: Git, Docker, TravisCI, Google Cloud Platform, VS Code, ...
            Libraries: pandas, NumPy, Matplotlib
        """
        skills = []
        found_skills = set()

        # First, try to parse structured format from skill blocks
        for block in blocks:
            for line in block.split('\n'):
                line = line.strip()
                if not line:
                    continue

                # Check if line matches "Category: skill1, skill2, ..." pattern
                colon_match = re.match(r'^([^:]+):\s*(.+)$', line)
                if colon_match:
                    category_label = colon_match.group(1).strip().lower()
                    skills_str = colon_match.group(2).strip()

                    # Determine category
                    category = self.skill_category_map.get(category_label, 'technical')

                    # Split skills by comma
                    for skill_name in skills_str.split(','):
                        skill_name = skill_name.strip()
                        if skill_name and skill_name.lower() not in found_skills:
                            found_skills.add(skill_name.lower())
                            skills.append({
                                'id': f"skill-{len(skills)}",
                                'name': skill_name,
                                'category': category,
                                'level': 'intermediate'
                            })

        # If no structured skills found, fall back to dictionary matching
        if not skills:
            skills_text = " ".join(blocks).lower() if blocks else full_text.lower()
            words = re.findall(r'[a-z0-9+#.-]+', skills_text)

            for word in words:
                if word in self.tech_skills and word not in found_skills:
                    found_skills.add(word)
                    skills.append({
                        'id': f"skill-{len(skills)}",
                        'name': word.title() if word != 'ios' else 'iOS',
                        'category': 'technical',
                        'level': 'intermediate'
                    })
                
        return skills

    def parse_languages(self, blocks: List[str]) -> List[Dict[str, Any]]:
        languages = []
        lang_text = " ".join(blocks).lower()
        
        common_langs = {
            'anglais': 'Anglais', 'english': 'English',
            'français': 'Français', 'french': 'French',
            'espagnol': 'Espagnol', 'spanish': 'Spanish',
            'allemand': 'Allemand', 'german': 'German',
            'vietnamien': 'Vietnamien', 'vietnamese': 'Vietnamese'
        }
        
        for key, name in common_langs.items():
            if key in lang_text:
                level = 'intermediate'
                if 'natif' in lang_text or 'native' in lang_text or 'maternelle' in lang_text:
                    level = 'native'
                elif 'bilingue' in lang_text or 'fluent' in lang_text:
                    level = 'fluent'
                    
                languages.append({
                    'id': f"lang-{len(languages)}",
                    'name': name,
                    'level': level
                })
                
        return languages

    def _empty_cv_data(self) -> Dict[str, Any]:
        return {
            "personalInfo": {},
            "experiences": [],
            "education": [],
            "projects": [],
            "skills": [],
            "languages": []
        }

def main():
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    parser = argparse.ArgumentParser(description='CV Genius ATS-optimized PDF Parser')
    parser.add_argument('pdf_path', help='Path to PDF file')
    parser.add_argument('--output', '-o', help='Output JSON file (optional)')
    parser.add_argument('--verbose', '-v', action='store_true', help='Verbose mode')
    
    args = parser.parse_args()
    
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
        
    if not Path(args.pdf_path).exists():
        logger.error(f"❌ File not found: {args.pdf_path}")
        sys.exit(1)
        
    ats_parser = ATSParser()
    result = ats_parser.parse_cv(args.pdf_path)
    
    json_output = json.dumps(result, indent=2, ensure_ascii=False)
    
    if args.output:
        with open(args.output, 'w', encoding='utf-8') as f:
            f.write(json_output)

    else:
        print(json_output)

if __name__ == "__main__":
    main()