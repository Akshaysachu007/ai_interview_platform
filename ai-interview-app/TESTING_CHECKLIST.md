# 🧪 Testing Checklist - AI Interview System

## Pre-Testing Setup

### ✅ Backend Setup
```bash
cd backend
npm install
npm start
```
- [ ] Backend starts without errors
- [ ] MongoDB connection successful
- [ ] Server running on port 5000

### ✅ Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
- [ ] Frontend starts without errors
- [ ] No compilation errors
- [ ] Accessible at http://localhost:5173

---

## 🧪 Feature Testing

### 1. Authentication Tests

#### Register
- [ ] Can register new candidate
- [ ] Email validation works
- [ ] Password is hashed

#### Login
- [ ] Can login with correct credentials
- [ ] Invalid credentials rejected
- [ ] JWT token received

### 2. AI Question Generation

#### Start Interview
- [ ] Select stream dropdown works
- [ ] Select difficulty dropdown works
- [ ] Click "Start Interview" generates questions
- [ ] Questions are relevant to selected stream
- [ ] 5 questions generated

**Test Combinations:**
- [ ] Computer Science - Easy
- [ ] Computer Science - Medium
- [ ] Computer Science - Hard
- [ ] Data Science - Medium
- [ ] AI/ML - Hard
- [ ] Business Management - Easy

**Verify:**
- [ ] CS questions are programming-related
- [ ] Data Science questions are ML/stats-related
- [ ] Business questions are management-related

### 3. AI Answer Detection

#### Natural Answer Test
**Input:**
```
"Object-Oriented Programming is a paradigm that uses objects with data 
and methods. Key concepts include encapsulation and inheritance."
```

- [ ] Answer submitted successfully
- [ ] AI confidence < 50%
- [ ] Not flagged as AI-generated
- [ ] No warning message

#### AI-Generated Answer Test
**Input:**
```
"Certainly! Object-Oriented Programming is a fundamental paradigm. 
Furthermore, it encompasses various sophisticated principles including 
encapsulation and inheritance. Moreover, it provides numerous advantages 
for software development. Consequently, modern applications extensively 
leverage OOP. In conclusion, OOP is essential for contemporary programming."
```

- [ ] Answer submitted successfully
- [ ] AI confidence > 60%
- [ ] Flagged as AI-generated
- [ ] Warning message displayed
- [ ] Malpractice counter increases

### 4. Tab Switching Detection

#### Test Procedure:
1. Start interview
2. Switch to another tab/window
3. Return to interview

**Verify:**
- [ ] Tab switch detected automatically
- [ ] Counter increments
- [ ] Shown in malpractice monitor
- [ ] Warning added to list

**Test Multiple Switches:**
- [ ] Switch 1 time → Low severity
- [ ] Switch 3 times → Medium severity
- [ ] Switch 5+ times → High severity
- [ ] Warning message after 3+ switches

### 5. Voice Analysis (Simulation)

#### Test Procedure:
1. During interview, click "Simulate Voice Analysis"

**Verify:**
- [ ] API call succeeds
- [ ] Analysis result displayed
- [ ] If multiple voices detected → warning shown
- [ ] Malpractice logged if detected

### 6. Face Detection (Simulation)

#### Test 1 Face (Normal)
- [ ] Click "Face Detection (1 face)"
- [ ] No issue detected
- [ ] Status: OK

#### Test 2 Faces (Multiple People)
- [ ] Click "Face Detection (2 faces)"
- [ ] Issue detected
- [ ] Warning displayed
- [ ] Malpractice logged
- [ ] Type: multiple_faces

#### Test 0 Faces (No Face)
- [ ] Click "Face Detection (0 faces)"
- [ ] Issue detected
- [ ] Warning displayed
- [ ] Malpractice logged
- [ ] Type: face_not_detected

### 7. Interview Completion

#### Complete Interview
- [ ] Answer all 5 questions
- [ ] Click "Complete Interview"
- [ ] Processing completes
- [ ] Score calculated
- [ ] Results displayed

**Verify Results Show:**
- [ ] Final score (0-100)
- [ ] Status (Completed/Flagged)
- [ ] Duration in minutes
- [ ] Total malpractices
- [ ] Breakdown by type

### 8. Scoring System

#### Clean Interview (Expected: ~95-100)
1. Start interview
2. Answer all questions naturally
3. No tab switches
4. No violations
5. Complete interview

- [ ] Score: 95-100
- [ ] Status: Completed
- [ ] No flags

#### Interview with Violations (Expected: ~40-60)
1. Start interview
2. Submit 2 AI-generated answers (-40 points)
3. Switch tabs 4 times (-20 points)
4. Trigger multiple voices (-15 points)
5. Complete interview

- [ ] Score: 40-60 range
- [ ] Status: Flagged
- [ ] High severity count > 2

### 9. Statistics & Reporting

#### View Statistics
- [ ] Click "View My Statistics"
- [ ] Total interviews shown
- [ ] Completed count correct
- [ ] Flagged count correct
- [ ] Average score calculated
- [ ] Malpractice breakdown shown

#### Interview Details
- [ ] Can view individual interview
- [ ] All questions listed
- [ ] Answers shown
- [ ] Malpractices logged with timestamps
- [ ] All details accurate

---

## 🤖 Automated Demo Test

```bash
cd backend
npm run demo
```

**Verify Demo:**
- [ ] Registers test candidate
- [ ] Starts interview successfully
- [ ] Generates 5 questions
- [ ] Submits normal answer → Not flagged
- [ ] Submits AI answer → Detected
- [ ] Reports tab switches (3x)
- [ ] Runs voice analysis
- [ ] Runs face detection
- [ ] Completes interview
- [ ] Shows final score
- [ ] Shows malpractices summary
- [ ] Fetches statistics
- [ ] All steps complete without errors

---

## 🔍 API Testing (Postman/cURL)

### Test Each Endpoint:

#### 1. Register Candidate
```bash
curl -X POST http://localhost:5000/api/candidate/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@test.com","password":"test123"}'
```
- [ ] Status: 201
- [ ] Message: "Registered successfully"

#### 2. Login
```bash
curl -X POST http://localhost:5000/api/candidate/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'
```
- [ ] Status: 200
- [ ] Token received

#### 3. Start Interview
```bash
curl -X POST http://localhost:5000/api/interview/start \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"stream":"Computer Science","difficulty":"Medium"}'
```
- [ ] Status: 201
- [ ] Interview ID received
- [ ] 5 questions returned

#### 4. Submit Answer
```bash
curl -X POST http://localhost:5000/api/interview/submit-answer \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"interviewId":"ID","questionIndex":0,"answer":"Your answer"}'
```
- [ ] Status: 200
- [ ] AI detection result returned

#### 5. Report Tab Switch
```bash
curl -X POST http://localhost:5000/api/interview/report-tab-switch \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"interviewId":"ID"}'
```
- [ ] Status: 200
- [ ] Switch count incremented

#### 6. Complete Interview
```bash
curl -X POST http://localhost:5000/api/interview/complete \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"interviewId":"ID"}'
```
- [ ] Status: 200
- [ ] Score calculated
- [ ] Status determined

---

## 🎯 Edge Cases & Error Handling

### Authentication Errors
- [ ] No token → 401 Unauthorized
- [ ] Invalid token → 401 Token not valid
- [ ] Expired token → 401 Token expired

### Validation Errors
- [ ] Missing stream → 400 Bad Request
- [ ] Missing difficulty → 400 Bad Request
- [ ] Invalid interview ID → 404 Not Found
- [ ] Empty answer → 400 Bad Request

### Permission Errors
- [ ] Access another user's interview → 403 Forbidden
- [ ] Modify completed interview → Error handled

### Database Errors
- [ ] MongoDB disconnected → Error message
- [ ] Duplicate email → "Email already registered"

---

## 📱 UI/UX Testing

### Layout & Design
- [ ] Mobile responsive
- [ ] All buttons clickable
- [ ] Proper spacing
- [ ] Readable fonts
- [ ] Color contrast good

### User Flow
- [ ] Clear instructions
- [ ] Progress indicators
- [ ] Error messages helpful
- [ ] Success feedback clear
- [ ] Navigation intuitive

### Performance
- [ ] Page loads quickly
- [ ] No lag when typing
- [ ] Smooth transitions
- [ ] API responses fast (<500ms)

---

## 🚀 Final Verification

### Complete System Test
1. [ ] Fresh backend start
2. [ ] Fresh frontend start
3. [ ] Register new user
4. [ ] Login
5. [ ] Navigate to /candidate/interview
6. [ ] Complete full interview flow
7. [ ] View results
8. [ ] Check statistics
9. [ ] All features working

### Documentation Check
- [ ] README.md clear and helpful
- [ ] AI_FEATURES_README.md accurate
- [ ] QUICK_START_GUIDE.md tested
- [ ] All examples work
- [ ] API docs match implementation

### Code Quality
- [ ] No console errors (except intentional logs)
- [ ] No warnings
- [ ] Clean code structure
- [ ] Comments present
- [ ] Consistent formatting

---

## ✅ Pre-Demo Checklist

### Before Presentation:
- [ ] Run full system test
- [ ] Test automated demo script
- [ ] Prepare 2-3 test scenarios
- [ ] Review all documentation
- [ ] Have backup data ready
- [ ] MongoDB running
- [ ] Backend stable
- [ ] Frontend accessible
- [ ] Network stable

### Demo Materials Ready:
- [ ] Laptop charged
- [ ] Backup slides/screenshots
- [ ] Code examples prepared
- [ ] Architecture diagrams
- [ ] Statistics to show
- [ ] Q&A prep done

---

## 📊 Test Results Summary

### Test Run Date: _____________

**Total Tests:** _____ / _____
**Passed:** _____
**Failed:** _____
**Skipped:** _____

### Critical Issues Found:
1. ____________________________
2. ____________________________
3. ____________________________

### Notes:
_________________________________
_________________________________
_________________________________

---

## 🎯 Success Criteria

✅ **All tests passing**
✅ **No critical bugs**
✅ **Demo script works**
✅ **UI is responsive**
✅ **API endpoints functional**
✅ **Documentation accurate**
✅ **Ready for demonstration**

---

**Testing completed: [ ] YES [ ] NO**

**System ready for demo: [ ] YES [ ] NO**

**Last tested by: _____________**

**Date: _____________**
