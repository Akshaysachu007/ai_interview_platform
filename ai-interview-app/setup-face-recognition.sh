#!/bin/bash

echo "============================================"
echo " Face Recognition Setup - Linux/Mac"
echo "============================================"
echo

echo "Checking Python installation..."
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python 3 not found! Please install Python 3.8+"
    exit 1
fi

python3 --version

echo
echo "Installing system dependencies (requires sudo)..."
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    echo "Detected Linux system"
    sudo apt-get update
    sudo apt-get install -y build-essential cmake
    sudo apt-get install -y libopenblas-dev liblapack-dev
    sudo apt-get install -y libx11-dev libgtk-3-dev
elif [[ "$OSTYPE" == "darwin"* ]]; then
    # Mac
    echo "Detected macOS system"
    if ! command -v brew &> /dev/null; then
        echo "WARNING: Homebrew not found. Please install from https://brew.sh"
    else
        brew install cmake
    fi
fi

echo
echo "Installing face recognition dependencies..."
echo "This may take 5-10 minutes..."
echo

cd backend/python

echo "[1/6] Installing numpy..."
pip3 install numpy==1.24.3

echo "[2/6] Installing Pillow..."
pip3 install Pillow==10.0.0

echo "[3/6] Installing cmake..."
pip3 install cmake==3.27.0

echo "[4/6] Installing dlib (this may take several minutes)..."
pip3 install dlib==19.24.2

echo "[5/6] Installing face_recognition..."
pip3 install face_recognition==1.3.0

echo "[6/6] Installing resume parsing dependencies..."
pip3 install pdfplumber==0.11.0
pip3 install python-docx==1.1.0

echo
echo "============================================"
echo " Testing Installation"
echo "============================================"
echo

echo "Testing face_recognition import..."
python3 -c "import face_recognition; print('✓ face_recognition installed successfully')"

if [ $? -eq 0 ]; then
    echo
    echo "============================================"
    echo " Setup Complete!"
    echo "============================================"
    echo
    echo "Face recognition is now ready to use."
    echo
    echo "To test manually, run:"
    echo "  python3 face_verification.py"
    echo
else
    echo "ERROR: face_recognition import failed"
    exit 1
fi
