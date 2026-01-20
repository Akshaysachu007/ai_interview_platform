# 🎯 Quick Reference Card - Voice Features

## For Students

### Starting the Interview
```
1. Go to: http://localhost:4173
2. Login with your candidate account
3. Click "🚀 Start AI Interview" on dashboard
4. Allow webcam + microphone permissions
5. Select stream and difficulty
6. Click "Start Interview"
```

### During Interview

#### Listen to Question
- 🔊 Question reads automatically
- Click "Read Question Aloud" to replay
- Click "Stop" to stop audio

#### Answer by Voice
```
1. Click: 🎤 Start Voice Answer
2. Speak clearly into microphone
3. Watch text appear in real-time
4. Click: 🔴 Stop Recording
5. Edit text if needed
6. Click: ✅ Submit Answer
```

#### Answer by Typing
```
1. Click in text area
2. Type your answer
3. Click: ✅ Submit Answer
```

#### Mix Both
```
1. Type some text
2. Click microphone
3. Add voice text
4. Edit combined answer
5. Submit
```

## For Professors (Demo)

### Demo Flow
```
1. "Let me show you the voice features"
2. Start interview
3. "The AI reads the question automatically"
4. Click microphone button
5. Speak: "This is a voice answer demonstration"
6. "Notice the real-time transcription"
7. Stop recording
8. "The text can be edited before submission"
9. Submit answer
10. "Next question reads automatically"
```

### Key Selling Points
✅ Accessibility - helps visually impaired students  
✅ Natural interaction - speak instead of type  
✅ Security - all monitoring continues during voice  
✅ Flexibility - voice OR typing, student's choice  
✅ Real-time - instant transcription feedback  
✅ Accurate - powered by Google's Speech API

## Troubleshooting

### Problem: Webcam not showing
**Fix:** Already fixed! Video should display now
- Refresh page if needed
- Check camera permissions

### Problem: Voice not recording
**Check:**
- Using Chrome or Edge?
- Microphone permission granted?
- Microphone working in other apps?

### Problem: Questions not speaking
**Check:**
- System volume not muted?
- Browser has audio permission?

### Problem: Voice transcription inaccurate
**Tips:**
- Speak clearly and slowly
- Reduce background noise
- Check microphone position
- Try different microphone if available

## Browser Requirements

**Best:** Google Chrome or Microsoft Edge  
**Good:** Brave (adjust shields for voice - see [BRAVE_BROWSER_GUIDE.md](BRAVE_BROWSER_GUIDE.md))  
**OK:** Firefox (typing only)  
**Limited:** Safari (typing only)

**Brave Users:** Voice requires disabling fingerprint blocking. See [BRAVE_BROWSER_GUIDE.md](BRAVE_BROWSER_GUIDE.md)

## Quick Tips

### For Best Voice Recognition
- Speak at normal pace
- Pause between sentences
- Use clear pronunciation
- Minimize background noise
- Position microphone correctly

### For Best Demo
- Use good microphone
- Quiet room
- Practice run first
- Show both voice and typing
- Highlight real-time transcription

## Feature Status

| Feature | Status | Browser |
|---------|--------|---------|
| Webcam Display | ✅ Working | All |
| Face Detection | ✅ Working | All |
| Text-to-Speech | ✅ Working | All |
| Speech-to-Text | ✅ Working | Chrome/Edge/Brave* |
| Typing Input | ✅ Working | All |
| Hybrid Mode | ✅ Working | Chrome/Edge/Brave* |

*Brave requires adjusting privacy shields - see [BRAVE_BROWSER_GUIDE.md](BRAVE_BROWSER_GUIDE.md)

## Support Contact

**Technical Issues:**
- Check VOICE_FEATURES_GUIDE.md
- Check CHANGES_SUMMARY.md
- Review browser console for errors

**Demo Questions:**
- See PROFESSOR_DEMO_GUIDE.md
- Practice with TESTING_CHECKLIST.md

---

**Quick Access Links:**
- Interview: http://localhost:4173/candidate/interview
- Dashboard: http://localhost:4173/candidate/dashboard
- Backend API: http://localhost:5000/api

**Important:** Keep both servers running:
- Backend: Port 5000
- Frontend: Port 4173
