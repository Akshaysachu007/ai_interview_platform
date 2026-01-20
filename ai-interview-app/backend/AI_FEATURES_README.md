# AI Interview System - Backend Features Documentation

## Overview
This AI Interview System provides intelligent question generation and comprehensive malpractice detection for conducting fair and secure online interviews.

---

## 🎯 Key Features

### 1. **AI Question Generation**
Automatically generates relevant interview questions based on:
- **Stream/Domain**: Computer Science, IT, Data Science, AI/ML, Mechanical Engineering, Business Management, etc.
- **Difficulty Level**: Easy, Medium, Hard
- Dynamic question selection from curated question banks

### 2. **Malpractice Detection System**

#### a) **AI-Generated Answer Detection**
- Analyzes candidate answers for AI-generated content
- Pattern matching for common AI indicators:
  - Formal language patterns ("furthermore", "moreover", "consequently")
  - Perfect sentence structure
  - Typical AI response formats
- Confidence scoring (0-100%)
- Automatic flagging when confidence > 60%

#### b) **Tab/Window Switching Detection**
- Tracks when candidate switches tabs or windows
- Automatic severity escalation:
  - 1-2 switches: Low severity
  - 3-4 switches: Medium severity
  - 5+ switches: High severity
- Real-time alerts

#### c) **Multiple Voice Detection**
- Analyzes voice patterns during audio responses
- Detects:
  - Voice characteristic changes
  - Multiple speakers
  - Potential impersonation
- High severity flagging for multiple voices

#### d) **Face Detection Monitoring**
- Tracks faces in camera feed
- Detects:
  - No face present (candidate left)
  - Multiple faces (external help)
- Real-time monitoring throughout interview

### 3. **Automated Scoring System**
- Base score: 100 points
- Point deductions for malpractices:
  - Tab switch: -5 points each
  - Multiple voice: -15 points each
  - AI-generated answer: -20 points each
  - Face not detected: -10 points each
  - Multiple faces: -15 points each
- Severity multipliers applied (high: 1.5x, medium: 1x, low: 0.5x)

### 4. **Interview Flagging System**
- Automatic flagging when:
  - More than 2 high-severity malpractices detected
  - Score falls below threshold
- Status tracking: scheduled → in-progress → completed/flagged

---

## 📡 API Endpoints

### **Start Interview**
```http
POST /api/interview/start
Authorization: Bearer <token>
Content-Type: application/json

{
  "stream": "Computer Science",
  "difficulty": "Medium",
  "recruiterId": "recruiter_id"
}

Response:
{
  "message": "Interview started successfully",
  "interviewId": "64abc...",
  "questions": [
    {
      "question": "Explain the concept of Object-Oriented Programming...",
      "category": "Programming"
    }
  ],
  "stream": "Computer Science",
  "difficulty": "Medium"
}
```

### **Submit Answer**
```http
POST /api/interview/submit-answer
Authorization: Bearer <token>
Content-Type: application/json

{
  "interviewId": "64abc...",
  "questionIndex": 0,
  "answer": "Object-Oriented Programming is a paradigm..."
}

Response:
{
  "message": "Answer submitted successfully",
  "aiDetection": {
    "isAiGenerated": false,
    "confidence": 35,
    "warning": null
  }
}
```

### **Report Tab Switch**
```http
POST /api/interview/report-tab-switch
Authorization: Bearer <token>
Content-Type: application/json

{
  "interviewId": "64abc..."
}

Response:
{
  "message": "Tab switch recorded",
  "totalSwitches": 1,
  "warning": null
}
```

### **Report Voice Analysis**
```http
POST /api/interview/report-voice-analysis
Authorization: Bearer <token>
Content-Type: application/json

{
  "interviewId": "64abc...",
  "audioFeatures": {
    "pitch": 150,
    "frequency": 400,
    "duration": 45
  }
}

Response:
{
  "message": "Voice analysis completed",
  "analysis": {
    "multipleVoicesDetected": false,
    "confidence": 45,
    "numberOfSpeakers": 1,
    "details": "Consistent voice pattern throughout"
  },
  "warning": null
}
```

### **Report Face Detection**
```http
POST /api/interview/report-face-detection
Authorization: Bearer <token>
Content-Type: application/json

{
  "interviewId": "64abc...",
  "facesDetected": 1
}

Response:
{
  "message": "Face detection reported",
  "analysis": {
    "hasIssue": false,
    "type": null,
    "severity": "low",
    "facesCount": 1
  },
  "warning": null
}
```

### **Complete Interview**
```http
POST /api/interview/complete
Authorization: Bearer <token>
Content-Type: application/json

{
  "interviewId": "64abc..."
}

Response:
{
  "message": "Interview completed successfully",
  "score": 85,
  "status": "completed",
  "duration": 45,
  "malpracticesSummary": {
    "total": 2,
    "tabSwitches": 1,
    "voiceChanges": 0,
    "aiAnswers": 1
  },
  "flagged": false
}
```

### **Get Interview Details**
```http
GET /api/interview/:interviewId
Authorization: Bearer <token>

Response:
{
  "_id": "64abc...",
  "candidateId": { "name": "John Doe", "email": "john@example.com" },
  "stream": "Computer Science",
  "difficulty": "Medium",
  "questions": [...],
  "malpractices": [...],
  "score": 85,
  "status": "completed",
  "startTime": "2025-12-26T10:00:00Z",
  "endTime": "2025-12-26T10:45:00Z",
  "duration": 45
}
```

### **Get Candidate's All Interviews**
```http
GET /api/interview/candidate/all
Authorization: Bearer <token>

Response: [
  {
    "_id": "64abc...",
    "stream": "Computer Science",
    "difficulty": "Medium",
    "score": 85,
    "status": "completed",
    "createdAt": "2025-12-26T10:00:00Z"
  }
]
```

### **Get Interview Statistics**
```http
GET /api/interview/stats/summary
Authorization: Bearer <token>

Response:
{
  "totalInterviews": 5,
  "completedInterviews": 4,
  "flaggedInterviews": 1,
  "averageScore": 78,
  "totalMalpractices": 8,
  "malpracticeBreakdown": {
    "tabSwitches": 3,
    "voiceChanges": 2,
    "aiAnswers": 3
  }
}
```

---

## 🗄️ Data Models

### **Interview Model**
```javascript
{
  candidateId: ObjectId,
  recruiterId: ObjectId,
  stream: String (enum),
  difficulty: String (enum),
  questions: [{
    question: String,
    generatedAt: Date,
    answer: String,
    isAiGenerated: Boolean,
    aiConfidence: Number
  }],
  malpractices: [{
    type: String (enum),
    detectedAt: Date,
    severity: String (enum),
    details: String
  }],
  status: String (enum),
  score: Number,
  startTime: Date,
  endTime: Date,
  duration: Number,
  tabSwitchCount: Number,
  voiceChangesDetected: Number,
  aiAnswersDetected: Number
}
```

### **Question Model**
```javascript
{
  stream: String (enum),
  difficulty: String (enum),
  question: String,
  category: String,
  keywords: [String],
  isAiGenerated: Boolean,
  usageCount: Number
}
```

---

## 🔧 AI Service Functions

### **Question Generation**
```javascript
AIService.generateQuestions(stream, difficulty, count)
// Returns array of question objects with categories
```

### **AI Answer Detection**
```javascript
AIService.detectAIGeneratedAnswer(answer)
// Returns: { isAiGenerated, confidence, indicators }
```

### **Voice Analysis**
```javascript
AIService.analyzeVoice(audioFeatures)
// Returns: { multipleVoicesDetected, confidence, numberOfSpeakers, details }
```

### **Face Detection Analysis**
```javascript
AIService.analyzeFaceDetection(faceData)
// Returns: { hasIssue, type, severity, facesCount }
```

### **Score Calculation**
```javascript
AIService.calculateScore(answers, malpractices)
// Returns: final score (0-100)
```

---

## 🎓 Supported Streams

1. **Computer Science** - Algorithms, OOP, Data Structures, Programming
2. **Information Technology** - Cloud, Networking, Security, DevOps
3. **Data Science** - Statistics, ML basics, Data Analysis
4. **AI/ML** - Neural Networks, Deep Learning, NLP
5. **Mechanical Engineering** - Thermodynamics, Materials, Design
6. **Business Management** - Leadership, Strategy, Operations
7. **Electrical Engineering** *(can be added)*
8. **Civil Engineering** *(can be added)*
9. **Marketing** *(can be added)*
10. **Finance** *(can be added)*

---

## 🚀 Usage Flow

1. **Candidate starts interview** → Questions generated based on stream/difficulty
2. **Questions displayed** → Candidate provides answers
3. **Real-time monitoring**:
   - Tab switches tracked automatically
   - Voice analysis on audio responses
   - Face detection throughout interview
   - Answer AI-detection on submission
4. **Malpractices recorded** → Each violation logged with severity
5. **Interview completed** → Score calculated, status determined
6. **Results available** → Recruiter can review detailed report

---

## 📊 Malpractice Severity Levels

| Severity | Description | Impact |
|----------|-------------|---------|
| **Low** | Minor violations (1-2 tab switches) | Small point deduction |
| **Medium** | Moderate concerns (3-4 tab switches, medium AI confidence) | Moderate point deduction |
| **High** | Serious violations (multiple voices, high AI confidence, 5+ tab switches) | Large point deduction + potential flagging |

---

## 🔐 Security Features

- **JWT Authentication** required for all endpoints
- **Candidate authorization** checks on all interview operations
- **Real-time monitoring** prevents post-interview manipulation
- **Audit trail** with timestamps for all malpractices
- **Automatic flagging** for suspicious behavior

---

## 🎯 Demo Workflow for College Project

### **Step 1: Start Interview**
```bash
curl -X POST http://localhost:5000/api/interview/start \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "stream": "Computer Science",
    "difficulty": "Medium"
  }'
```

### **Step 2: Submit Answer (Normal)**
```bash
curl -X POST http://localhost:5000/api/interview/submit-answer \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "interviewId": "INTERVIEW_ID",
    "questionIndex": 0,
    "answer": "OOP is a programming paradigm that uses objects and classes to organize code."
  }'
```

### **Step 3: Submit AI-Generated Answer (Will be detected)**
```bash
curl -X POST http://localhost:5000/api/interview/submit-answer \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "interviewId": "INTERVIEW_ID",
    "questionIndex": 1,
    "answer": "Certainly! Object-Oriented Programming is a fundamental paradigm. Furthermore, it encompasses various principles. Moreover, it provides numerous advantages. In conclusion, OOP is essential for modern software development."
  }'
```

### **Step 4: Simulate Tab Switch**
```bash
curl -X POST http://localhost:5000/api/interview/report-tab-switch \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"interviewId": "INTERVIEW_ID"}'
```

### **Step 5: Complete Interview**
```bash
curl -X POST http://localhost:5000/api/interview/complete \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"interviewId": "INTERVIEW_ID"}'
```

---

## 📈 Expected Results

After following the demo workflow, you'll see:
- ✅ Questions generated based on stream
- ⚠️ AI-generated answer detected with confidence score
- ⚠️ Tab switch recorded
- 📊 Final score with deductions applied
- 🚩 Potential flagging if multiple violations

---

## 🛠️ Future Enhancements

1. **Real AI Integration** - OpenAI GPT, Google Gemini for question generation
2. **Advanced Voice Recognition** - Real voice biometric analysis
3. **Computer Vision** - Advanced face recognition and eye-tracking
4. **Plagiarism Detection** - Check answers against online sources
5. **Video Recording** - Store interview sessions for review
6. **Real-time Alerts** - Notify recruiters of suspicious activity
7. **Analytics Dashboard** - Visual reports and trends

---

## 📝 Notes for College Project Demonstration

1. **Show Question Generation**: Display how questions change based on stream selection
2. **Demonstrate AI Detection**: Submit normal vs AI-generated answers
3. **Show Tab Switching**: Switch tabs multiple times and show count increase
4. **Display Scoring Logic**: Explain point deduction system
5. **Show Final Report**: Display comprehensive interview results with all malpractices

This system demonstrates a complete AI-powered interview platform with practical security features!
