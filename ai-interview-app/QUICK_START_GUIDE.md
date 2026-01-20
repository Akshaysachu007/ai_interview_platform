# AI Interview System - Quick Start Guide

## 🚀 Getting Started

### Prerequisites
- Node.js installed
- MongoDB running
- Backend and Frontend running

---

## 📋 Step-by-Step Usage

### 1️⃣ Start the Backend Server

```bash
cd backend
npm install
npm start
```

The server will start on `http://localhost:5000`

### 2️⃣ Run the Demo Script (Optional - For Testing)

```bash
cd backend
npm run demo
```

This will automatically:
- Register a test candidate
- Start an interview
- Generate questions for Computer Science (Medium difficulty)
- Submit answers (both normal and AI-generated)
- Simulate malpractices (tab switches, voice analysis, face detection)
- Complete the interview and show results

### 3️⃣ Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend will start on `http://localhost:5173`

---

## 🎯 Using the Web Interface

### Login/Register
1. Go to `http://localhost:5173`
2. Register as a candidate
3. Login with your credentials

### Start an Interview
1. Navigate to the AI Interview page
2. Select your **Stream** (e.g., Computer Science, Data Science, etc.)
3. Select **Difficulty** (Easy, Medium, Hard)
4. Click **"Start Interview"**

### During the Interview

#### ✅ Answer Questions
- Read each AI-generated question
- Type your answer in the text area
- Click "Submit Answer"
- The system will automatically detect if your answer is AI-generated

#### 🚨 Malpractice Detection (Automatic)

**Tab Switching Detection:**
- Try switching to another tab/window
- The system will automatically detect and log it
- You'll see the count increase in the Malpractice Monitor

**AI Answer Detection:**
- Submit a natural answer: ✓ Will pass
- Submit an AI-generated answer with patterns like:
  - "Certainly! Furthermore, moreover..."
  - Perfect formal structure
  - The system will flag it with confidence score

#### 🧪 Demo Features (For Testing)

Click these buttons to simulate:
- **Voice Analysis** - Simulates voice pattern detection
- **Face Detection (1/2/0 faces)** - Simulates camera monitoring

### Complete the Interview
1. After answering all questions, click **"Complete Interview"**
2. View your final score and malpractice summary
3. See if the interview was flagged

---

## 📊 API Testing with Postman/cURL

### 1. Register Candidate
```bash
curl -X POST http://localhost:5000/api/candidate/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:5000/api/candidate/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

Save the returned token!

### 3. Start Interview
```bash
curl -X POST http://localhost:5000/api/interview/start \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "stream": "Computer Science",
    "difficulty": "Medium"
  }'
```

### 4. Submit Answer
```bash
curl -X POST http://localhost:5000/api/interview/submit-answer \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "interviewId": "INTERVIEW_ID_FROM_STEP_3",
    "questionIndex": 0,
    "answer": "Your answer here..."
  }'
```

### 5. Report Tab Switch
```bash
curl -X POST http://localhost:5000/api/interview/report-tab-switch \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "interviewId": "INTERVIEW_ID"
  }'
```

### 6. Complete Interview
```bash
curl -X POST http://localhost:5000/api/interview/complete \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "interviewId": "INTERVIEW_ID"
  }'
```

### 7. Get Interview Stats
```bash
curl -X GET http://localhost:5000/api/interview/stats/summary \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🎓 College Project Demonstration Script

### Scenario 1: Clean Interview (High Score)
1. Start interview with "Computer Science" - "Easy"
2. Answer all questions naturally
3. Don't switch tabs
4. Complete interview
5. **Expected Result:** Score ~95-100, Status: Completed

### Scenario 2: Interview with Malpractices (Flagged)
1. Start interview with "Data Science" - "Medium"
2. Submit 2-3 AI-generated answers (use ChatGPT responses)
3. Switch tabs 4-5 times
4. Simulate multiple voice detection
5. Complete interview
6. **Expected Result:** Score ~40-60, Status: Flagged

### Scenario 3: Show Different Streams
1. Start interviews with different streams:
   - Computer Science → Programming questions
   - Data Science → ML/Statistics questions
   - Business Management → Leadership questions
2. Show how questions adapt to the stream

---

## 🧪 Testing AI Detection

### Normal Answer (Will Pass ✓)
```
"Object-Oriented Programming is a programming paradigm that uses 
objects containing data and methods. The main concepts are 
encapsulation, inheritance, and polymorphism."
```

### AI-Generated Answer (Will be Detected ⚠️)
```
"Certainly! Object-Oriented Programming is a fundamental paradigm. 
Furthermore, it encompasses various sophisticated principles. 
Moreover, it provides numerous advantages. Consequently, modern 
applications utilize OOP extensively. In conclusion, OOP is 
essential for contemporary software development."
```

The AI detector looks for:
- Formal transitions (Furthermore, Moreover, Consequently)
- Perfect sentence structure
- Overly academic language
- Typical AI response patterns

---

## 📈 Understanding the Scoring System

### Base Score: 100 points

### Deductions:
- **Tab Switch:** -5 points each
- **AI-Generated Answer:** -20 points each
- **Multiple Voices:** -15 points each
- **Face Not Detected:** -10 points each
- **Multiple Faces:** -15 points each

### Severity Multipliers:
- **Low Severity:** 0.5x deduction
- **Medium Severity:** 1x deduction
- **High Severity:** 1.5x deduction

### Flagging Criteria:
- More than 2 high-severity malpractices
- Score below 40
- Multiple AI-generated answers detected

---

## 🎥 Demo Presentation Tips

### For Professors/Judges:

1. **Introduction (2 min)**
   - Explain the problem: Online interview fraud
   - Show the solution: AI-powered detection

2. **Feature Demo (5 min)**
   - Stream-based question generation
   - Real-time malpractice detection
   - Scoring algorithm

3. **Live Demo (5 min)**
   - Run the demo script OR
   - Do a live interview with intentional violations
   - Show the results and flagging

4. **Technical Deep Dive (3 min)**
   - Show the code structure
   - Explain AI detection algorithms
   - Discuss the API architecture

5. **Q&A**

---

## 🔧 Troubleshooting

### Backend won't start
- Check if MongoDB is running
- Verify `.env` file has MONGO_URI and JWT_SECRET

### Demo script fails
- Ensure backend is running first
- Check token authentication

### Frontend errors
- Clear browser cache
- Check if token is stored in localStorage
- Verify backend URL in API calls

### No questions generated
- Check if stream name matches exactly
- Verify difficulty level is correct

---

## 📝 Environment Variables

Create `.env` file in backend folder:

```env
MONGO_URI=mongodb://localhost:27017/ai-interview
JWT_SECRET=your_super_secret_key_here_123456
PORT=5000
```

---

## 🎯 Key Demonstration Points

✅ **AI Question Generation**
- Questions automatically generated based on stream
- Different difficulty levels
- Diverse question categories

✅ **AI Answer Detection**
- Pattern matching for AI indicators
- Confidence scoring
- Real-time detection

✅ **Tab Switch Monitoring**
- Automatic detection
- Severity escalation
- Real-time tracking

✅ **Voice Analysis**
- Multiple speaker detection
- Voice pattern changes
- High-severity flagging

✅ **Automated Scoring**
- Penalty-based system
- Severity-weighted deductions
- Fair evaluation

✅ **Comprehensive Reporting**
- Detailed malpractice logs
- Statistics and analytics
- Interview flagging

---

## 🚀 Next Steps / Future Enhancements

1. Integrate real AI APIs (OpenAI GPT, Google Gemini)
2. Add webcam face detection with computer vision
3. Implement real voice analysis with audio APIs
4. Add video recording for review
5. Create admin dashboard for recruiters
6. Add real-time notifications
7. Implement plagiarism detection for answers

---

## 📞 Support

For questions or issues:
- Check the AI_FEATURES_README.md for detailed API documentation
- Review the code comments
- Test with the demo script first

---

## ✅ Checklist for College Project Submission

- [ ] Backend running successfully
- [ ] Frontend accessible
- [ ] Demo script works
- [ ] Can start an interview
- [ ] Questions generate based on stream
- [ ] AI detection works
- [ ] Tab switching tracked
- [ ] Interview completion works
- [ ] Scoring system accurate
- [ ] Documentation complete
- [ ] Presentation ready

---

**Good luck with your project demonstration! 🎓🚀**
