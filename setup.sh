#!/bin/bash

# QuantumFlow AI & QML Setup Script
# This script automates the installation process

set -e  # Exit on error

echo "🚀 QuantumFlow AI & QML Toolkit Setup"
echo "======================================"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Python version
echo "📋 Checking Python version..."
PYTHON_CMD=""
if command -v python3.11 &> /dev/null; then
    PYTHON_CMD="python3.11"
    echo -e "${GREEN}✓ Found Python 3.11${NC}"
elif command -v python3.10 &> /dev/null; then
    PYTHON_CMD="python3.10"
    echo -e "${GREEN}✓ Found Python 3.10${NC}"
else
    echo -e "${RED}✗ Python 3.10 or 3.11 not found${NC}"
    echo -e "${YELLOW}Please install Python 3.10 or 3.11 (NOT 3.13)${NC}"
    exit 1
fi

# Check Node.js
echo ""
echo "📋 Checking Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✓ Found Node.js $NODE_VERSION${NC}"
else
    echo -e "${RED}✗ Node.js not found${NC}"
    echo -e "${YELLOW}Please install Node.js 18 or higher${NC}"
    exit 1
fi

# Backend setup
echo ""
echo "🔧 Setting up backend..."
cd backend

# Create virtual environment
if [ ! -d ".venv" ]; then
    echo "Creating virtual environment..."
    $PYTHON_CMD -m venv .venv
    echo -e "${GREEN}✓ Virtual environment created${NC}"
else
    echo -e "${YELLOW}Virtual environment already exists${NC}"
fi

# Activate virtual environment
echo "Activating virtual environment..."
source .venv/bin/activate

# Install dependencies
echo "Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt
echo -e "${GREEN}✓ Backend dependencies installed${NC}"

# Check for .env file
if [ ! -f ".env" ]; then
    echo ""
    echo -e "${YELLOW}⚠️  No .env file found${NC}"
    echo "Creating .env from template..."
    cp .env.example .env
    echo ""
    echo -e "${RED}IMPORTANT: Edit backend/.env and add your Gemini API key!${NC}"
    echo "Get your key from: https://makersuite.google.com/app/apikey"
    echo ""
    read -p "Press Enter to continue after adding your API key..."
else
    echo -e "${GREEN}✓ .env file exists${NC}"
fi

cd ..

# Frontend setup
echo ""
echo "🎨 Setting up frontend..."
cd frontend

# Install npm dependencies
if [ ! -d "node_modules" ]; then
    echo "Installing Node.js dependencies..."
    npm install
    echo -e "${GREEN}✓ Frontend dependencies installed${NC}"
else
    echo -e "${YELLOW}Node modules already exist, skipping install${NC}"
    echo "Run 'npm install' manually if you need to update dependencies"
fi

cd ..

# Success message
echo ""
echo -e "${GREEN}======================================"
echo "✓ Setup Complete!"
echo "======================================${NC}"
echo ""
echo "📚 Next Steps:"
echo ""
echo "1. Configure Gemini API Key:"
echo "   ${YELLOW}Edit backend/.env and add your GEMINI_API_KEY${NC}"
echo ""
echo "2. Start the backend (Terminal 1):"
echo "   ${YELLOW}cd backend${NC}"
echo "   ${YELLOW}source .venv/bin/activate${NC}"
echo "   ${YELLOW}uvicorn app.main:app --reload${NC}"
echo ""
echo "3. Start the frontend (Terminal 2):"
echo "   ${YELLOW}cd frontend${NC}"
echo "   ${YELLOW}npm run dev${NC}"
echo ""
echo "4. Open your browser:"
echo "   ${YELLOW}http://localhost:5173${NC}"
echo ""
echo "📖 For detailed instructions, see:"
echo "   - AI_QML_SETUP.md"
echo "   - IMPLEMENTATION_SUMMARY.md"
echo ""
echo "🎉 Happy Quantum Computing!"
echo ""
