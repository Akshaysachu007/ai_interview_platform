# Stream-Based Interview System Implementation Guide

## Overview
The AI Interview Application now supports a stream-based workflow where:
1. Recruiters create interviews for specific streams (e.g., Computer Science, Mechanical Engineering)
2. Candidates browse interviews by stream and apply
3. Recruiters review and accept/reject applications
4. Only accepted candidates can start interviews

## Backend Changes

### 1. Interview Model (`backend/models/Interview.js`)
- Added `applicationStatus` field with values: 'open', 'pending', 'accepted', 'rejected'
- Made `candidateId` optional (since interviews are created before candidates apply)

### 2. Interview Routes (`backend/routes/interview.js`)
**New Endpoints:**
- `GET /interview/available?stream=<stream>` - Get available interviews for candidates to browse
- `GET /interview/recruiters-by-stream?stream=<stream>` - Get recruiters by stream
- `POST /interview/apply/:interviewId` - Candidate applies for an interview
- `GET /interview/pending-applications` - Get pending applications (recruiter)
- `POST /interview/application/:interviewId/decision` - Accept/reject application (recruiter)

**Modified Endpoints:**
- `POST /interview/start` - Now checks if candidate is accepted before starting

### 3. Recruiter Routes (`backend/routes/recruiter.js`)
**New Endpoints:**
- `POST /recruiter/create-interview` - Create an open interview
- `GET /recruiter/my-interviews` - Get all recruiter's interviews
- `GET /recruiter/pending-applications` - Get pending applications
- `POST /recruiter/application/:interviewId/decision` - Accept/reject applications

### 4. Candidate Routes (`backend/routes/candidate.js`)
**New Endpoints:**
- `GET /candidate/interviews/available?stream=<stream>` - Browse available interviews
- `POST /candidate/interviews/:interviewId/apply` - Apply for an interview
- `GET /candidate/my-applications` - Get all applications
- `GET /candidate/interviews/accepted` - Get accepted interviews ready to start

## Frontend Changes

### 1. New Components

#### `InterviewCreation.jsx` & `InterviewCreation.css`
Modal component for recruiters to create new interviews:
- Select stream
- Select difficulty level
- Add optional description
- Creates interview with status 'open'

#### `ApplicationManagement.jsx` & `ApplicationManagement.css`
Component for recruiters to manage pending applications:
- View all pending applications
- See candidate details
- Accept or reject applications

#### `InterviewBrowser.jsx` & `InterviewBrowser.css`
Component for candidates to browse and apply for interviews:
- Filter by stream
- View available interviews with recruiter info
- Apply for interviews
- View application status (pending/accepted/rejected)
- Start accepted interviews

### 2. Updated Pages

#### `RecruiterDashboard.jsx`
- Added import for `InterviewCreation` and `ApplicationManagement`
- Added "Create Interview" button that opens modal
- Added "View Applications" button to switch to applications view
- Integrated application management into dashboard

#### `CandidateDashboard.jsx`
- Added import for `InterviewBrowser`
- Added view toggle between "Browse Interviews" and "Quick Start"
- Integrated interview browser for candidates to find and apply for interviews
- Updated UI to guide candidates through the application process

## Workflow

### For Recruiters:
1. **Create Interview**
   - Click "Create Interview" button
   - Select stream and difficulty
   - Interview is created with status 'open'

2. **Manage Applications**
   - Click "View Applications" to see pending applications
   - Review candidate information
   - Accept or reject each application
   - Accepted candidates can now start the interview

### For Candidates:
1. **Browse Interviews**
   - Click "Browse Interviews" in dashboard
   - Filter by stream (e.g., Computer Science, Data Science)
   - See available recruiters and interview details

2. **Apply for Interview**
   - Click "Apply Now" on desired interview
   - Application status changes to 'pending'
   - Wait for recruiter approval

3. **Start Interview**
   - Once accepted, interview appears in "My Applications" with "Accepted" status
   - Click "Start Interview" to begin
   - Complete the AI-monitored interview

## Available Streams
- Computer Science
- Information Technology
- Mechanical Engineering
- Electrical Engineering
- Civil Engineering
- Business Management
- Marketing
- Finance
- Data Science
- AI/ML

## API Authentication
All endpoints require authentication via JWT token in Authorization header:
```
Authorization: Bearer <token>
```

## Testing the Feature

1. **Test as Recruiter:**
   ```
   1. Login as recruiter
   2. Click "Create Interview"
   3. Select stream: "Computer Science", difficulty: "Medium"
   4. Submit
   5. Go to "View Applications" (initially empty)
   ```

2. **Test as Candidate:**
   ```
   1. Login as candidate
   2. Click "Browse Interviews"
   3. Select stream filter: "Computer Science"
   4. Click "Apply Now" on an interview
   5. Check "My Applications" tab
   ```

3. **Test Approval Flow:**
   ```
   1. Switch back to recruiter account
   2. Go to "View Applications"
   3. See pending application
   4. Click "Accept"
   5. Switch back to candidate
   6. See "Accepted" status in "My Applications"
   7. Click "Start Interview"
   ```

## Notes
- The system prevents duplicate applications (one candidate can't apply multiple times to the same recruiter)
- Rejected applications free up the interview slot (candidateId is cleared)
- Only accepted interviews can be started
- The old "Quick Start" flow is preserved for backward compatibility
