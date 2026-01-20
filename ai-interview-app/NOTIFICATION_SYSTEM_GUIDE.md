# 🔔 NOTIFICATION SYSTEM IMPLEMENTATION GUIDE

## 📋 Overview
This notification system allows candidates to receive real-time notifications when interviews matching their stream are posted by recruiters.

---

## 🚀 Features Implemented

### 1. **Stream Selection for Candidates**
   - Candidates can now select their stream in their profile
   - Available streams:
     * Computer Science
     * Information Technology
     * Mechanical Engineering
     * Electrical Engineering
     * Civil Engineering
     * Business Management
     * Marketing
     * Finance
     * Data Science
     * AI/ML

### 2. **Automatic Notifications**
   - When a recruiter creates an interview, ALL candidates with matching stream get notified
   - Notifications include:
     * Interview stream
     * Difficulty level
     * Recruiter/company name
     * Quick link to apply

### 3. **Application Status Notifications**
   - Candidates get notified when their application is:
     * ✅ Accepted
     * ❌ Rejected

### 4. **Notification Management**
   - View all notifications
   - Mark as read/unread
   - Delete notifications
   - See unread count (badge)

---

## 📁 Files Created/Modified

### **New Files:**
1. `backend/models/Notification.js` - Notification database model
2. `backend/services/notificationService.js` - Notification logic
3. `backend/routes/notification.js` - API endpoints for notifications

### **Modified Files:**
1. `backend/models/Candidate.js` - Added `stream` and `notificationsEnabled` fields
2. `backend/routes/recruiter.js` - Added notification sending on interview creation
3. `backend/index.js` - Registered notification routes

---

## 🔌 API ENDPOINTS

### **For Candidates:**

#### 1. Get All Notifications
```http
GET /api/notifications
Headers: Authorization: Bearer <token>
Query Params:
  - page (default: 1)
  - limit (default: 20)
  - unreadOnly (true/false)

Response:
{
  "notifications": [...],
  "totalPages": 5,
  "currentPage": 1,
  "total": 100
}
```

#### 2. Get Unread Count
```http
GET /api/notifications/unread-count
Headers: Authorization: Bearer <token>

Response:
{
  "count": 5
}
```

#### 3. Mark Notification as Read
```http
PATCH /api/notifications/:notificationId/read
Headers: Authorization: Bearer <token>

Response:
{
  "message": "Notification marked as read",
  "notification": {...}
}
```

#### 4. Mark All as Read
```http
PATCH /api/notifications/mark-all-read
Headers: Authorization: Bearer <token>

Response:
{
  "message": "All notifications marked as read",
  "modifiedCount": 5
}
```

#### 5. Delete Notification
```http
DELETE /api/notifications/:notificationId
Headers: Authorization: Bearer <token>

Response:
{
  "message": "Notification deleted successfully"
}
```

#### 6. Delete All Notifications
```http
DELETE /api/notifications
Headers: Authorization: Bearer <token>

Response:
{
  "message": "All notifications deleted successfully",
  "deletedCount": 10
}
```

---

## 📝 NOTIFICATION OBJECT STRUCTURE

```javascript
{
  "_id": "65f7a8b9c1234567890abcde",
  "recipientId": "65f7a8b9c1234567890abcdf", // Candidate ID
  "type": "new_interview", // or "application_accepted", "application_rejected"
  "title": "New Computer Science Interview Available!",
  "message": "A new Medium level interview for Computer Science has been posted by TechCorp. Apply now!",
  "interviewId": "65f7a8b9c1234567890abce0", // Related interview
  "recruiterId": "65f7a8b9c1234567890abce1", // Recruiter who posted
  "stream": "Computer Science",
  "isRead": false,
  "isClicked": false,
  "readAt": null,
  "metadata": {
    "difficulty": "Medium",
    "recruiterName": "John Doe",
    "recruiterCompany": "TechCorp",
    "interviewStatus": "open"
  },
  "createdAt": "2024-01-09T10:30:00.000Z",
  "updatedAt": "2024-01-09T10:30:00.000Z"
}
```

---

## 🎯 HOW IT WORKS - STEP BY STEP

### **Step 1: Candidate Sets Stream**
```javascript
// Candidate updates profile with stream
PUT /api/candidate/profile
{
  "stream": "Computer Science",
  "notificationsEnabled": true
}
```

### **Step 2: Recruiter Creates Interview**
```javascript
// Recruiter creates new interview
POST /api/recruiter/create-interview
{
  "stream": "Computer Science",
  "difficulty": "Medium",
  "description": "Full Stack Developer Interview"
}

// Backend automatically:
// 1. Creates the interview
// 2. Finds all candidates with stream = "Computer Science"
// 3. Creates notification for each candidate
// 4. Returns response with notificationsSent count
```

### **Step 3: Candidates Receive Notifications**
```javascript
// Candidate checks notifications
GET /api/notifications

Response:
{
  "notifications": [
    {
      "title": "New Computer Science Interview Available!",
      "message": "A new Medium level interview...",
      "isRead": false,
      "createdAt": "2024-01-09T10:30:00.000Z"
    }
  ]
}
```

### **Step 4: Candidate Clicks Notification**
```javascript
// Mark as read when clicked
PATCH /api/notifications/65f7a8b9c1234567890abcde/read

// Navigate to interview page
// Candidate can apply for the interview
```

---

## 💻 FRONTEND IMPLEMENTATION GUIDE

### **1. Update Candidate Profile Component**

Add stream selector to profile form:

```jsx
// In CandidateProfile.jsx or EditProfile component

const [stream, setStream] = useState('');

const streams = [
  'Computer Science',
  'Information Technology',
  'Mechanical Engineering',
  'Electrical Engineering',
  'Civil Engineering',
  'Business Management',
  'Marketing',
  'Finance',
  'Data Science',
  'AI/ML'
];

// In the form:
<div className="form-group">
  <label>Select Your Stream</label>
  <select 
    value={stream} 
    onChange={(e) => setStream(e.target.value)}
    className="form-control"
  >
    <option value="">-- Select Stream --</option>
    {streams.map(s => (
      <option key={s} value={s}>{s}</option>
    ))}
  </select>
</div>

// When saving profile:
const handleSave = async () => {
  await fetch('/api/candidate/profile', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ stream, ...otherFields })
  });
};
```

---

### **2. Create Notification Component**

```jsx
// components/NotificationBell.jsx
import { useState, useEffect } from 'react';

function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // Fetch unread count
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchUnreadCount = async () => {
    const response = await fetch('/api/notifications/unread-count', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const data = await response.json();
    setUnreadCount(data.count);
  };

  const fetchNotifications = async () => {
    const response = await fetch('/api/notifications?limit=10', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const data = await response.json();
    setNotifications(data.notifications);
  };

  const markAsRead = async (notificationId) => {
    await fetch(`/api/notifications/${notificationId}/read`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    fetchUnreadCount();
    fetchNotifications();
  };

  const handleBellClick = () => {
    setShowDropdown(!showDropdown);
    if (!showDropdown) {
      fetchNotifications();
    }
  };

  return (
    <div className="notification-bell">
      <button onClick={handleBellClick} className="bell-button">
        🔔
        {unreadCount > 0 && (
          <span className="badge">{unreadCount}</span>
        )}
      </button>

      {showDropdown && (
        <div className="notification-dropdown">
          <h4>Notifications</h4>
          {notifications.length === 0 ? (
            <p>No notifications</p>
          ) : (
            notifications.map(notif => (
              <div 
                key={notif._id} 
                className={`notification-item ${notif.isRead ? 'read' : 'unread'}`}
                onClick={() => {
                  markAsRead(notif._id);
                  // Navigate to interview page
                  window.location.href = `/interviews/${notif.interviewId}`;
                }}
              >
                <h5>{notif.title}</h5>
                <p>{notif.message}</p>
                <small>{new Date(notif.createdAt).toLocaleString()}</small>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
```

---

### **3. Add to Navbar**

```jsx
// In CandidateNavbar.jsx
import NotificationBell from './NotificationBell';

function CandidateNavbar() {
  return (
    <nav>
      {/* ... other nav items ... */}
      <NotificationBell />
      {/* ... profile, logout ... */}
    </nav>
  );
}
```

---

### **4. Create Notifications Page**

```jsx
// pages/Notifications.jsx
import { useState, useEffect } from 'react';

function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all' or 'unread'

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  const fetchNotifications = async () => {
    const unreadParam = filter === 'unread' ? '?unreadOnly=true' : '';
    const response = await fetch(`/api/notifications${unreadParam}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const data = await response.json();
    setNotifications(data.notifications);
  };

  const markAllAsRead = async () => {
    await fetch('/api/notifications/mark-all-read', {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    fetchNotifications();
  };

  const deleteNotification = async (id) => {
    await fetch(`/api/notifications/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    fetchNotifications();
  };

  return (
    <div className="notifications-page">
      <h2>Notifications</h2>
      
      <div className="actions">
        <button onClick={() => setFilter('all')}>All</button>
        <button onClick={() => setFilter('unread')}>Unread</button>
        <button onClick={markAllAsRead}>Mark All as Read</button>
      </div>

      <div className="notifications-list">
        {notifications.map(notif => (
          <div key={notif._id} className="notification-card">
            <div className="notification-header">
              <h4>{notif.title}</h4>
              {!notif.isRead && <span className="unread-dot">🔴</span>}
            </div>
            <p>{notif.message}</p>
            <div className="notification-footer">
              <small>{new Date(notif.createdAt).toLocaleString()}</small>
              <button onClick={() => deleteNotification(notif._id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default NotificationsPage;
```

---

## 🎨 CSS STYLES

```css
/* NotificationBell.css */
.notification-bell {
  position: relative;
}

.bell-button {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  position: relative;
}

.bell-button .badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #ff4444;
  color: white;
  border-radius: 50%;
  padding: 2px 6px;
  font-size: 12px;
  font-weight: bold;
}

.notification-dropdown {
  position: absolute;
  top: 50px;
  right: 0;
  width: 400px;
  max-height: 500px;
  overflow-y: auto;
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  z-index: 1000;
}

.notification-item {
  padding: 15px;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  transition: background 0.2s;
}

.notification-item:hover {
  background: #f5f5f5;
}

.notification-item.unread {
  background: #e3f2fd;
  border-left: 4px solid #2196f3;
}

.notification-item h5 {
  margin: 0 0 5px 0;
  font-size: 14px;
}

.notification-item p {
  margin: 0 0 5px 0;
  font-size: 12px;
  color: #666;
}

.notification-item small {
  font-size: 11px;
  color: #999;
}
```

---

## 🧪 TESTING THE SYSTEM

### **Test 1: Create Candidate with Stream**
```bash
# 1. Register candidate
POST http://localhost:5000/api/candidate/register
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}

# 2. Login
POST http://localhost:5000/api/candidate/login
{
  "email": "john@example.com",
  "password": "password123"
}
# Save the token!

# 3. Update profile with stream
PUT http://localhost:5000/api/candidate/profile
Headers: Authorization: Bearer <your_token>
{
  "stream": "Computer Science",
  "notificationsEnabled": true
}
```

### **Test 2: Create Interview (Recruiter)**
```bash
# Login as recruiter first, then:
POST http://localhost:5000/api/recruiter/create-interview
Headers: Authorization: Bearer <recruiter_token>
{
  "stream": "Computer Science",
  "difficulty": "Medium",
  "description": "Full Stack Developer Interview"
}

# Response will show: "notificationsSent": 1
```

### **Test 3: Check Notifications (Candidate)**
```bash
# Get notifications
GET http://localhost:5000/api/notifications
Headers: Authorization: Bearer <candidate_token>

# Get unread count
GET http://localhost:5000/api/notifications/unread-count
Headers: Authorization: Bearer <candidate_token>
```

---

## 🔍 DEBUGGING

### Check console logs:
When an interview is created, you should see:
```
=============================================================
📢 SENDING NOTIFICATIONS FOR NEW INTERVIEW
   Stream: Computer Science
   Difficulty: Medium
=============================================================

✅ Found 5 candidates with stream: Computer Science

✅ Successfully created 5 notifications!
=============================================================

📢 Notification sent to 5 candidates
```

### Common Issues:

1. **No notifications sent**
   - Check if candidates have `stream` field set
   - Check if `notificationsEnabled` is true
   - Check console logs

2. **Notifications not showing**
   - Check Authorization header
   - Verify candidate is logged in
   - Check network tab in browser

3. **Database errors**
   - Make sure MongoDB is running
   - Check connection string
   - Restart server after changes

---

## 📊 MONITORING

### Database Queries:
```javascript
// Check all notifications
db.notifications.find().pretty()

// Check candidates with streams
db.candidates.find({ stream: { $exists: true } })

// Count unread notifications
db.notifications.countDocuments({ isRead: false })

// Check notification by candidate
db.notifications.find({ recipientId: ObjectId("...") })
```

---

## 🚀 NEXT STEPS / ENHANCEMENTS

1. **Real-time Notifications** (WebSocket/Socket.io)
   - Push notifications without refresh
   - Live badge updates

2. **Email Notifications**
   - Send email when new interview is posted
   - Daily digest of new interviews

3. **Push Notifications** (Browser)
   - Use Web Push API
   - Send even when app is closed

4. **Notification Preferences**
   - Let candidates choose which notifications they want
   - Frequency settings (immediate, daily, weekly)

5. **Mobile App Notifications**
   - Firebase Cloud Messaging (FCM)
   - Push to mobile devices

---

## ✅ CHECKLIST

- [x] Candidate model updated with stream field
- [x] Notification model created
- [x] Notification service implemented
- [x] Notification routes created
- [x] Interview creation sends notifications
- [x] Application decision sends notifications
- [x] API endpoints for managing notifications
- [ ] Frontend notification bell component
- [ ] Frontend notifications page
- [ ] CSS styling
- [ ] Testing completed

---

## 📞 SUPPORT

If you encounter any issues:
1. Check the console logs (both frontend and backend)
2. Verify database connections
3. Test API endpoints with Postman
4. Check authentication tokens
5. Review this guide for missed steps

---

**Congratulations! Your notification system is ready!** 🎉
