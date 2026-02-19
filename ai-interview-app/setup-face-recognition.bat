@echo off
echo ============================================
echo  Face Recognition Setup - Windows
echo ============================================
echo.

echo Checking Python installation...
python --version
if errorlevel 1 (
    echo ERROR: Python not found! Please install Python 3.8+ from python.org
    pause
    exit /b 1
)

echo.
echo Installing face recognition dependencies...
echo This may take 5-10 minutes...
echo.

cd backend\python

echo [1/6] Installing numpy...
pip install numpy==1.24.3

echo [2/6] Installing Pillow...
pip install Pillow==10.0.0

echo [3/6] Installing cmake (required for dlib)...
pip install cmake==3.27.0

echo [4/6] Installing dlib (this may take several minutes)...
echo NOTE: This requires Visual Studio C++ Build Tools
echo If this fails, please install from: https://visualstudio.microsoft.com/downloads/
pip install dlib==19.24.2

echo [5/6] Installing face_recognition...
pip install face_recognition==1.3.0

echo [6/6] Installing resume parsing dependencies...
pip install pdfplumber==0.11.0
pip install python-docx==1.1.0

echo.
echo ============================================
echo  Testing Installation
echo ============================================
echo.

echo Testing face_recognition import...
python -c "import face_recognition; print('✓ face_recognition installed successfully')"
if errorlevel 1 (
    echo ERROR: face_recognition import failed
    pause
    exit /b 1
)

echo Testing face verification script...
echo {"reference_photo":"data:image/jpeg;base64,test","current_photo":"data:image/jpeg;base64,test"} | python face_verification.py 2>nul
echo.

echo ============================================
echo  Setup Complete!
echo ============================================
echo.
echo Face recognition is now ready to use.
echo.
echo To test manually, run:
echo   python face_verification.py
echo.
pause
