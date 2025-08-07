#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Vercel Python API endpoint for PDF parsing
"""
import json
import tempfile
import os
from http.server import BaseHTTPRequestHandler
import sys
from pathlib import Path

# Import parser directly - copy the class here for Vercel deployment
import re
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

try:
    import pdfplumber
except ImportError:
    pdfplumber = None

class ImprovedCVParser:
    """Parser CV amélioré avec détection de sections optimisée"""
    
    def __init__(self):
        self.email_pattern = re.compile(r'\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b')
        self.phone_patterns = [
            re.compile(r'(?:\+33|0)\s?[1-9](?:[\s.-]?\d{2}){4}'),  # Français
            re.compile(r'\+?(?:\d{1,3}[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}'),  # International
        ]
        self.linkedin_pattern = re.compile(r'(?:https?://)?(?:www\.)?(?:linkedin\.com/in/|in/)[\w-]+/?', re.IGNORECASE)
        self.github_pattern = re.compile(r'(?:https?://)?(?:www\.)?github\.com/[\w-]+/?', re.IGNORECASE)

    def extract_text_from_pdf(self, pdf_path: str) -> str:
        """Extrait le texte d'un PDF avec pdfplumber"""
        if not pdfplumber:
            return ""
        try:
            with pdfplumber.open(pdf_path) as pdf:
                text = ""
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
                return text.strip()
        except Exception as e:
            logger.error(f"Erreur extraction PDF: {e}")
            return ""

    def extract_personal_info(self, text: str) -> dict:
        """Extrait les informations personnelles"""
        info = {}
        lines = text.split('\n')
        
        if lines:
            first_line = lines[0].strip()
            if first_line and not '@' in first_line and not '+' in first_line:
                info['name'] = first_line
        
        email_match = self.email_pattern.search(text)
        if email_match:
            info['email'] = email_match.group()
        
        for pattern in self.phone_patterns:
            phone_match = pattern.search(text)
            if phone_match:
                info['phone'] = phone_match.group()
                break
                
        return info

    def parse_cv(self, pdf_path: str) -> dict:
        """Parse complet d'un CV PDF"""
        if not pdfplumber:
            return self._empty_cv_data()
            
        text = self.extract_text_from_pdf(pdf_path)
        if not text:
            return self._empty_cv_data()
        
        return {
            "personalInfo": self.extract_personal_info(text),
            "experiences": [],
            "education": [],
            "skills": [],
            "languages": []
        }

    def _empty_cv_data(self) -> dict:
        return {
            "personalInfo": {},
            "experiences": [],
            "education": [],
            "skills": [],
            "languages": []
        }

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            # Get content length
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            # Parse multipart data (simplified for PDF file)
            boundary = self.headers['Content-Type'].split('boundary=')[1]
            
            # Extract PDF file from multipart data
            pdf_data = self._extract_pdf_from_multipart(post_data, boundary)
            
            if not pdf_data:
                self._send_error_response(400, "No PDF file found in request")
                return
            
            # Save to temporary file
            with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as temp_file:
                temp_file.write(pdf_data)
                temp_path = temp_file.name
            
            try:
                # Parse the PDF
                parser = ImprovedCVParser()
                result = parser.parse_cv(temp_path)
                
                # Send success response
                self._send_success_response(result)
                
            finally:
                # Clean up temporary file
                if os.path.exists(temp_path):
                    os.unlink(temp_path)
                    
        except Exception as e:
            self._send_error_response(500, f"Internal server error: {str(e)}")
    
    def _extract_pdf_from_multipart(self, data, boundary):
        """Extract PDF data from multipart form data"""
        try:
            boundary_bytes = f'--{boundary}'.encode()
            parts = data.split(boundary_bytes)
            
            for part in parts:
                if b'filename=' in part and b'.pdf' in part:
                    # Find the start of the file data (after double CRLF)
                    file_start = part.find(b'\r\n\r\n')
                    if file_start != -1:
                        return part[file_start + 4:]
            return None
        except:
            return None
    
    def _send_success_response(self, data):
        """Send successful JSON response"""
        response = {
            "success": True,
            "data": data,
            "message": "CV parsed successfully"
        }
        
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(response, ensure_ascii=False).encode('utf-8'))
    
    def _send_error_response(self, status_code, message):
        """Send error JSON response"""
        response = {
            "success": False,
            "error": message
        }
        
        self.send_response(status_code)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(response).encode('utf-8'))
    
    def do_OPTIONS(self):
        """Handle CORS preflight requests"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers() 