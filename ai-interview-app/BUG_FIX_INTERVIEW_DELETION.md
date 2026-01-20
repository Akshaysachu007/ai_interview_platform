# Bug Fix: Interview Deletion Not Reflecting on Candidate Dashboard

## Problem
When a recruiter deleted an interview, it was not immediately removed from the candidate's "Available Interviews" list on the candidate dashboard. Candidates would still see deleted interviews until they manually refreshed the page or changed the stream filter.

## Root Cause
The `InterviewBrowser` component only fetched available interviews when:
1. The component first mounted
2. The `selectedStream` filter changed
3. The view toggled between 'available' and 'myApplications'

There was no mechanism to:
- Periodically refresh the interview list
- Manually refresh the interview list

When a recruiter deleted an interview using the DELETE endpoint, the interview was correctly removed from the MongoDB database. However, candidates who already had the list loaded in their browser would not see this change until they triggered one of the above conditions.

## Solution Implemented

### 1. Auto-Refresh (30 seconds)
Added a `useEffect` hook that sets up an interval to automatically refresh the available interviews list every 30 seconds:

```javascript
useEffect(() => {
  if (view === 'available') {
    const intervalId = setInterval(() => {
      fetchAvailableInterviews();
      setLastRefresh(Date.now());
    }, 30000); // 30 seconds

    return () => clearInterval(intervalId);
  }
}, [view, selectedStream]);
```

**Key Features:**
- Only runs when viewing 'available' interviews (not for 'myApplications')
- Properly cleans up the interval when component unmounts or view changes
- Updates `lastRefresh` timestamp for future UI enhancements

### 2. Manual Refresh Button
Added a refresh button in the UI that allows candidates to manually refresh the interview list:

```javascript
const handleManualRefresh = () => {
  if (view === 'available') {
    fetchAvailableInterviews();
  } else {
    fetchMyApplications();
  }
};
```

**UI Features:**
- Visible refresh icon button with "Refresh" label
- Spinning animation while loading
- Disabled state when already loading
- Works for both 'available' and 'myApplications' views

### 3. Visual Feedback
Added CSS animations for better user experience:

```css
.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
```

## Files Modified

1. **frontend/src/components/InterviewBrowser.jsx**
   - Added `lastRefresh` state variable
   - Added auto-refresh `useEffect` hook
   - Added `handleManualRefresh` function
   - Updated UI to include refresh button
   - Imported `RefreshCw` icon from lucide-react

2. **frontend/src/components/InterviewBrowser.css**
   - Added `.spinning` class with rotation animation
   - Added hover styles for refresh button

## Testing Steps

1. **Manual Test:**
   - Log in as a candidate
   - Navigate to "Browse Interviews" view
   - Note the available interviews
   - Log in as a recruiter (in another browser/incognito)
   - Delete one of the interviews
   - Return to candidate view
   - Wait 30 seconds or click "Refresh" button
   - Verify the deleted interview is no longer visible

2. **Auto-Refresh Test:**
   - Open candidate dashboard
   - Keep it on "Available Interviews" view
   - Delete an interview as recruiter
   - Wait 30 seconds
   - Verify the list automatically updates

3. **Manual Refresh Test:**
   - Open candidate dashboard
   - Delete an interview as recruiter
   - Click the "Refresh" button
   - Verify the list updates immediately

## Benefits

1. **Real-time Updates:** Candidates see near real-time updates (within 30 seconds) of available interviews
2. **User Control:** Candidates can manually refresh when needed
3. **Better UX:** Visual feedback with spinning icon during refresh
4. **No Page Reload:** Updates happen smoothly without full page refresh
5. **Performance:** Interval is cleared when not viewing available interviews, preventing unnecessary API calls

## Future Enhancements (Optional)

1. **WebSocket Integration:** For true real-time updates without polling
2. **Last Refresh Indicator:** Show "Last updated X seconds ago" near the refresh button
3. **Optimistic UI Updates:** Immediately hide deleted interviews without waiting for server response
4. **Toast Notifications:** Show subtle notification when list auto-refreshes
5. **Configurable Refresh Interval:** Allow users to adjust refresh frequency in settings
