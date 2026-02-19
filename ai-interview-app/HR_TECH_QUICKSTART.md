# HR Tech Integration Engine - Quick Start Guide

## 🚀 What's New

Your AI Interview App now includes an **Advanced HR Tech Integration Engine** with three powerful features:

### Task 1: Resume Parsing & Profile Building
Automatically extract candidate information from resumes using AI.

### Task 2: Smart Notification Logic  
Only notify candidates with **≥60% skill match** to reduce spam.

### Task 3: Resume Validation & Scoring
Score resumes 0-100 against job descriptions with gap analysis.

---

## ⚡ Quick Testing

### 1. Parse a Resume (Task 1)

```bash
# Login as candidate first
curl -X POST http://localhost:5000/api/candidate/login \
  -H "Content-Type: application/json" \
  -d '{"email": "candidate@test.com", "password": "password"}'

# Use the token from login response
curl -X POST http://localhost:5000/api/candidate/resume/parse \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "resumeText": "John Doe\njohn.doe@example.com\n+1-555-0123\nlinkedin.com/in/johndoe\nSan Francisco, CA\n\nSenior Software Engineer\nTech Corp | 2020-2023\nLed development of React applications\n\nEducation:\nStanford University, BS Computer Science, 2020\n\nSkills: JavaScript, React, Node.js, AWS, Docker, MongoDB, Python, SQL\n\nCertifications:\n- AWS Certified Solutions Architect\n- Professional Scrum Master"
  }'
```

**Expected Response:**
```json
{
  "message": "Resume parsed successfully",
  "extractedData": {
    "personalDetails": { "fullName": "John Doe", ... },
    "workExperience": [...],
    "education": [...],
    "certifications": [...],
    "skills": {
      "hardSkills": ["JavaScript", "React", ...],
      "softSkills": [...]
    }
  },
  "profileCompleteness": 85
}
```

---

### 2. Check Skill Match (Task 2)

```bash
# Get skill match for a specific job
curl http://localhost:5000/api/candidate/interviews/INTERVIEW_ID/skill-match \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**
```json
{
  "matchPercentage": 85,
  "shouldApply": true,
  "matchedSkills": ["JavaScript", "React", "Node.js", "MongoDB"],
  "missingSkills": ["Kubernetes", "GraphQL"],
  "totalRequired": 10,
  "totalMatched": 8,
  "message": "Great match! You have 8 out of 10 required skills."
}
```

---

### 3. Validate Resume Against Job (Task 3)

```bash
# Score resume against job description
curl -X POST http://localhost:5000/api/candidate/interviews/INTERVIEW_ID/validate \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**
```json
{
  "message": "Resume validated successfully",
  "score": 85,
  "breakdown": {
    "keywordMatch": 38,
    "experienceRelevance": 25,
    "educationalAlignment": 18,
    "overallFit": 9
  },
  "gapAnalysis": [
    "Missing experience in AWS cloud services",
    "Recommendation: Obtain AWS certification",
    "Strong match in React and Node.js"
  ],
  "strengths": ["5+ years in React", "Strong JavaScript"],
  "weaknesses": ["No cloud experience", "Limited DevOps"],
  "recommendation": "Recommended",
  "canApply": true
}
```

---

## 📋 New API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/candidate/resume/parse` | Parse resume and extract profile |
| GET | `/api/candidate/interviews/:id/skill-match` | Check skill match percentage |
| POST | `/api/candidate/interviews/:id/validate` | Score resume against job |
| GET | `/api/candidate/resume/scores` | View all validation scores |

---

## 🗄️ Database Changes

### Candidate Model - New Fields

```javascript
{
  // Resume data
  resumeText: String,
  resumeUrl: String,
  lastResumeUpdate: Date,
  
  // Extracted profile
  personalDetails: { fullName, linkedinUrl, location },
  workExperience: [{ company, role, duration, description }],
  education: [{ institution, degree, field, year }],
  certifications: [String],
  extractedSkills: { hardSkills: [], softSkills: [] },
  profileCompleteness: Number (0-100)
}
```

### Interview Model - New Fields

```javascript
{
  // Job details
  title: String,
  company: String,
  jobDescription: String,
  
  // Requirements
  requiredSkills: [String],
  preferredSkills: [String],
  requirements: {
    minExperience: Number,
    educationLevel: String
  },
  
  // Candidate scores
  applicationScores: [{
    candidateId: ObjectId,
    score: Number (0-100),
    breakdown: {},
    gapAnalysis: [],
    recommendation: String
  }]
}
```

---

## 🔧 How It Works

### Resume Parsing Flow
1. Candidate submits resume text
2. GPT-4o extracts structured data
3. Profile auto-populated with extracted info
4. Profile completeness calculated (0-100%)

### Smart Notification Flow  
1. Recruiter creates job with required skills
2. System finds candidates in same stream
3. Calculates skill match for each candidate
4. Only notifies if match ≥ 60%
5. Notification includes match percentage

### Resume Scoring Flow
1. Candidate clicks "Validate" on a job
2. AI compares resume vs job requirements
3. Scores across 4 criteria (total 100 points)
4. Generates gap analysis and recommendations
5. Stores score in interview for recruiter

---

## 🎯 Smart Notification Logic

### Matching Algorithm

```javascript
// Example: Job requires 10 skills
requiredSkills = ["JavaScript", "React", "Node.js", "AWS", "Docker", 
                  "Kubernetes", "MongoDB", "GraphQL", "TypeScript", "CI/CD"]

// Candidate has 8 matching skills
candidateSkills = ["JavaScript", "React", "Node.js", "AWS", "Docker",
                   "MongoDB", "Python", "SQL"]

// Match: 8/10 = 80%
matchPercentage = 80

// Notify? 80% ≥ 60% ✅ YES
shouldNotify = true
```

### Notification Message

```
🎯 80% Match - Senior React Developer

An interview application is available that matches your skill set: 
Senior React Developer at Tech Corp. You match 8/10 required skills!

Matched: JavaScript, React, Node.js, AWS, Docker, MongoDB
Missing: Kubernetes, GraphQL, TypeScript, CI/CD
```

---

## 📊 Scoring Breakdown

| Category | Max Points | Description |
|----------|-----------|-------------|
| Keyword Match | 40 | Essential tools & technologies present |
| Experience Relevance | 30 | Years in similar roles |
| Educational Alignment | 20 | Degree requirements met |
| Overall Fit | 10 | Soft skills & cultural fit |
| **TOTAL** | **100** | |

### Recommendation Levels

- **80-100**: Highly Recommended (Excellent match)
- **60-79**: Recommended (Good match)
- **40-59**: Consider (Partial match)
- **0-39**: Not Recommended (Poor match)

---

## ⚙️ Configuration Required

### Environment Variables

Ensure these are set in `.env`:

```bash
# Required for AI features
OPENAI_API_KEY=sk-proj-...

# MongoDB
MONGODB_URI=mongodb://localhost:27017/ai-interview

# JWT Secret
JWT_SECRET=your_secret_here
```

### Testing Without OpenAI API

The system includes fallback methods:
- Regex-based resume parsing
- Simple skill matching
- Basic scoring algorithm

---

## 🧪 Testing Checklist

- [ ] Parse a sample resume
- [ ] Check extracted data is correct
- [ ] Create job with required skills
- [ ] Verify smart notifications sent
- [ ] Test skill match calculation
- [ ] Validate resume against job
- [ ] Check score is reasonable
- [ ] Review gap analysis output
- [ ] Test with 59% match (should not notify)
- [ ] Test with 60% match (should notify)

---

## 🐛 Common Issues

### Issue: "OpenAI API key not found"
**Solution**: Add `OPENAI_API_KEY` to `.env` file

### Issue: Profile completeness is 0
**Solution**: Resume text may be incomplete. Include contact info, experience, and skills.

### Issue: No notifications received
**Solution**: Check if skill match ≥ 60%. View match percentage first.

### Issue: Score seems wrong
**Solution**: Ensure job has `requiredSkills` array populated.

---

## 📖 Full Documentation

See [HR_TECH_INTEGRATION_ENGINE.md](./HR_TECH_INTEGRATION_ENGINE.md) for:
- Complete system architecture
- Detailed API reference
- Database schema
- AI prompts and algorithms
- Security considerations
- Future enhancements

---

## 🎓 Example Usage Scenario

### Scenario: Software Engineer Application

1. **Candidate uploads resume**
   - System extracts: 8 years experience, CS degree, 15 skills
   - Profile completeness: 90%

2. **Recruiter posts "Senior React Developer" job**
   - Required: JavaScript, React, Node.js, AWS, Docker, TypeScript
   - 6 required skills

3. **Smart notification triggers**
   - Candidate has: JavaScript, React, Node.js, AWS, Python, SQL
   - Match: 4/6 = 67% ✅
   - Notification sent with 67% match

4. **Candidate validates resume**
   - Score: 78/100
   - Recommendation: "Recommended"
   - Gap: "Consider learning TypeScript and Docker"
   - Strengths: "8+ years experience, strong React skills"

5. **Candidate applies with confidence**
   - Knows score upfront
   - Has actionable feedback
   - Recruiter sees pre-scored application

---

## 🚦 Next Steps

1. ✅ Start backend server: `npm run dev`
2. ✅ Test resume parsing endpoint
3. ✅ Create job with required skills
4. ✅ Verify smart notifications work
5. ✅ Test validation scoring
6. ✅ Review generated gap analysis

---

**Need Help?**
- Check [HR_TECH_INTEGRATION_ENGINE.md](./HR_TECH_INTEGRATION_ENGINE.md)
- Review server logs for detailed errors
- Test with provided curl commands
- Ensure OpenAI API key is valid

---

*Powered by GPT-4o and Advanced AI Algorithms*
