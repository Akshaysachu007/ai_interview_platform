# Python-Based Resume Parser Implementation

## ✨ What Changed

The system now uses **Python** for robust PDF/DOCX text extraction instead of browser-based PDF.js parsing.

### Architecture

```
Frontend → Upload File (base64) → Backend Node.js → Python Script → Extract Text → AI Parsing → Profile Update
```

## 🔧 Setup Instructions

### 1. Install Python Dependencies

**Windows:**
```bash
setup-python-parser.bat
```

**Linux/Mac:**
```bash
chmod +x setup-python-parser.sh
./setup-python-parser.sh
```

**Manual Installation:**
```bash
cd backend/python
pip install -r requirements.txt
```

### 2. Verify Installation

```bash
python backend/python/resume_extractor.py
# Should show usage information
```

### 3. Required Python Version
- Python 3.8 or higher
- pip (Python package manager)

## 📦 Python Dependencies

- **PyPDF2** (3.0.1): PDF text extraction
- **python-docx** (1.1.0): DOCX text extraction

## 🚀 How It Works

### 1. **Frontend** ([EditProfileModal.jsx](frontend/src/components/EditProfileModal.jsx))
- User uploads PDF/DOCX file
- File is read as base64
- Sent to backend with file type

### 2. **Backend** ([candidate.js](backend/routes/candidate.js))
- Receives base64 file + type
- Calls Python extractor service
- Extracts raw text using Python

### 3. **Python Script** ([resume_extractor.py](backend/python/resume_extractor.py))
- Decodes base64 content
- Extracts text using appropriate library
- Returns structured JSON response

### 4. **AI Processing** ([aiService.js](backend/services/aiService.js))
- Takes extracted text
- Uses OpenAI to parse and structure
- Populates candidate profile

## 🔄 API Updates

### Resume Parse Endpoint

**Before:**
```javascript
POST /api/candidate/resume/parse
{
  "resumeText": "plain text..."
}
```

**After (supports both):**
```javascript
POST /api/candidate/resume/parse
{
  // Option 1: Direct text (backward compatible)
  "resumeText": "plain text...",
  
  // Option 2: File-based extraction (NEW)
  "fileBase64": "data:application/pdf;base64,...",
  "fileType": "pdf"
}
```

## ✅ Advantages of Python Approach

| Feature | PDF.js (Old) | Python (New) |
|---------|-------------|--------------|
| **Reliability** | ⚠️ Browser-dependent | ✅ Server-side, consistent |
| **DOCX Support** | ❌ Not supported | ✅ Full support |
| **PDF Quality** | ⚠️ Basic extraction | ✅ Advanced extraction |
| **Security** | ⚠️ Client-side processing | ✅ Server-side validation |
| **File Size** | ⚠️ Memory intensive | ✅ Handled by server |
| **Maintenance** | ⚠️ Multiple dependencies | ✅ Simple, 2 packages |

## 🧪 Testing

### Test the Python Extractor Directly

```bash
# Create test JSON
echo '{"fileBase64":"JVBERi0xLjQKJeLjz9...", "fileType":"pdf"}' | python backend/python/resume_extractor.py
```

### Expected Response

**Success:**
```json
{
  "success": true,
  "text": "Resume content here...",
  "length": 1234,
  "fileType": "pdf"
}
```

**Error:**
```json
{
  "success": false,
  "error": "Error message here"
}
```

## 🔍 Troubleshooting

### Python Not Found
```
Error: Python is not installed or not in PATH
```
**Solution:** Install Python 3.8+ and add to PATH

### Module Not Found
```
Error: No module named 'PyPDF2'
```
**Solution:** Run `pip install -r backend/python/requirements.txt`

### Extraction Failed
```
Error: PDF extraction error: ...
```
**Solution:** 
- Ensure PDF is not corrupted
- Try converting to newer PDF format
- Check if PDF has text (not scanned image)

## 📝 Fallback Behavior

If Python extraction fails, the system will:
1. Check if `resumeText` was provided directly
2. Use that as fallback
3. Show helpful error message if both fail

## 🎯 Future Enhancements

- [ ] Support for scanned PDFs using OCR (Tesseract)
- [ ] Support for older .doc files (requires antiword)
- [ ] Batch processing for multiple resumes
- [ ] PDF metadata extraction
- [ ] Resume template detection

## 📄 Files Modified/Added

### New Files
- ✅ `backend/python/resume_extractor.py` - Python extraction script
- ✅ `backend/python/requirements.txt` - Python dependencies
- ✅ `backend/python/README.md` - Python module documentation
- ✅ `backend/services/pythonResumeExtractor.js` - Node.js wrapper
- ✅ `setup-python-parser.bat` - Windows setup script
- ✅ `setup-python-parser.sh` - Linux/Mac setup script

### Modified Files
- ✅ `backend/routes/candidate.js` - Added file-based parsing
- ✅ `frontend/src/components/EditProfileModal.jsx` - Removed PDF.js, send file
- ✅ `frontend/src/pages/CandidateDashboard.jsx` - Updated to use file API

## 🎓 Key Learnings

1. **Python is Better for Document Processing**: Libraries like PyPDF2 and python-docx are more mature and reliable than JavaScript alternatives.

2. **Hybrid Architecture Works**: Combining Node.js backend with Python scripts leverages the best of both ecosystems.

3. **Graceful Degradation**: Supporting both direct text input and file-based extraction ensures backward compatibility.

4. **Server-Side Processing**: Moving PDF parsing to the server improves security and reliability.

---

**Status:** ✅ Ready for Production (after Python setup)
