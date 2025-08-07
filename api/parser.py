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

# Add scripts directory to path to import our parser
sys.path.append(str(Path(__file__).parent.parent / "scripts"))

try:
    from pdf_parser_improved import ImprovedCVParser
except ImportError:
    # Fallback if import fails
    class ImprovedCVParser:
        def parse_cv(self, pdf_path):
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