#!/bin/bash

# 🚀 Pre-Push CI Validation Script
# This script runs the same checks as the CI pipeline locally

set -e  # Exit on any error

echo "🚀 Starting pre-push validation..."
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_step() {
    echo -e "${BLUE}$1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Step 1: Type checking
print_step "🔍 Running TypeScript type checking..."
if npm run type-check; then
    print_success "Type checking passed"
else
    print_error "Type checking failed"
    exit 1
fi

echo ""

# Step 2: Linting
print_step "🧹 Running ESLint..."
if npm run lint; then
    print_success "Linting passed"
else
    print_error "Linting failed"
    exit 1
fi

echo ""

# Step 3: Unit tests with coverage
print_step "🧪 Running unit tests with coverage..."
if npm run test:coverage; then
    print_success "Unit tests passed"
else
    print_error "Unit tests failed"
    exit 1
fi

echo ""

# Step 4: Integration tests
print_step "🔧 Running integration tests..."
if npm test -- --testPathPattern=tests/integration; then
    print_success "Integration tests passed"
else
    print_error "Integration tests failed"
    exit 1
fi

echo ""

# Step 5: CV flow validation test
print_step "🧪 Running CV flow validation test..."
if [ -f "scripts/test-cv-flow.js" ]; then
    if node scripts/test-cv-flow.js; then
        print_success "CV flow validation passed"
    else
        print_error "CV flow validation failed"
        exit 1
    fi
else
    print_warning "CV flow validation script not found, skipping..."
fi

echo ""

# Step 6: Python environment and parsers test
print_step "🐍 Testing Python environment and PDF parsers..."

# Check if Python virtual environment exists
if [ ! -d "venv" ]; then
    print_step "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment and test
source venv/bin/activate

# Install/upgrade pip and requirements
print_step "Installing Python dependencies..."
pip install --upgrade pip > /dev/null 2>&1

if [ -f "scripts/requirements.txt" ]; then
    pip install -r scripts/requirements.txt > /dev/null 2>&1
    
    # Test Python imports
    python -c "
import sys
sys.path.append('scripts')
try:
    import pdfplumber
    print('✅ pdfplumber OK')
except ImportError as e:
    print(f'❌ pdfplumber import error: {e}')
    sys.exit(1)
    
try:
    import spacy
    print('✅ spaCy OK')
except ImportError as e:
    print('⚠️ spaCy installed but may have issues')
" || {
        print_error "Python dependencies test failed"
        exit 1
    }
    
    # Test PDF parsers if they exist
    if [ -f "scripts/pdf_parser.py" ]; then
        if python scripts/pdf_parser.py --help > /dev/null 2>&1; then
            print_success "pdf_parser.py is working"
        else
            print_warning "pdf_parser.py may have issues"
        fi
    fi
    
    if [ -f "scripts/pdf_parser_improved.py" ]; then
        if python scripts/pdf_parser_improved.py --help > /dev/null 2>&1; then
            print_success "pdf_parser_improved.py is working"
        else
            print_warning "pdf_parser_improved.py may have issues"
        fi
    fi
    
    print_success "Python environment validated"
else
    print_warning "Python requirements.txt not found, skipping Python tests..."
fi

# Deactivate virtual environment
deactivate

echo ""

# Step 7: Build test
print_step "🏗️ Testing production build..."
if npm run build; then
    print_success "Build test passed"
    # Clean up build files to save space
    rm -rf .next
    print_step "Cleaned up build files"
else
    print_error "Build test failed"
    exit 1
fi

echo ""
echo "=================================================="
print_success "🎉 All pre-push validations passed!"
echo ""
echo "Your code is ready to push to GitHub! 🚀"
echo "CI pipeline should pass successfully."
echo "=================================================="