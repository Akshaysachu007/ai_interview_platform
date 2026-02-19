#!/bin/bash

echo "================================"
echo "Python Resume Parser - Setup"
echo "================================"
echo ""

echo "Checking Python installation..."
if ! command -v python3 &> /dev/null; then
    echo "[ERROR] Python 3 is not installed"
    echo "Please install Python 3.8+ from your package manager:"
    echo "  Ubuntu/Debian: sudo apt-get install python3 python3-pip"
    echo "  macOS: brew install python3"
    exit 1
fi

echo "[OK] Python is installed"
python3 --version
echo ""

echo "Installing Python dependencies..."
cd backend/python
python3 -m pip install -r requirements.txt

if [ $? -ne 0 ]; then
    echo ""
    echo "[ERROR] Failed to install dependencies"
    echo "Try running: python3 -m pip install --upgrade pip"
    exit 1
fi

echo ""
echo "================================"
echo "[SUCCESS] Setup Complete!"
echo "================================"
echo ""
echo "Python resume parser is ready to use."
echo "The backend will now be able to extract text from:"
echo "  - PDF files (.pdf)"
echo "  - Word documents (.docx)"
echo ""
echo "Start your backend server to test the feature."
echo ""
