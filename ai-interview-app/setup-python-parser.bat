@echo off
echo ================================
echo Python Resume Parser - Setup
echo ================================
echo.

echo Checking Python installation...
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH
    echo Please install Python 3.8+ from https://www.python.org/downloads/
    echo Make sure to check "Add Python to PATH" during installation
    pause
    exit /b 1
)

echo [OK] Python is installed
python --version
echo.

echo Installing Python dependencies...
cd backend\python
python -m pip install -r requirements.txt

if errorlevel 1 (
    echo.
    echo [ERROR] Failed to install dependencies
    echo Try running: python -m pip install --upgrade pip
    pause
    exit /b 1
)

echo.
echo ================================
echo [SUCCESS] Setup Complete!
echo ================================
echo.
echo Python resume parser is ready to use.
echo The backend will now be able to extract text from:
echo   - PDF files (.pdf)
echo   - Word documents (.docx)
echo.
echo Start your backend server to test the feature.
echo.
pause
