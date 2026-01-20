# 🦁 Brave Browser Compatibility Guide

## Voice Features in Brave Browser

The AI Interview System uses the **Web Speech API** for voice-to-text transcription. Brave browser, being privacy-focused, blocks this feature by default to protect user privacy.

---

## ✅ How to Enable Voice Features in Brave

### Quick Fix (Recommended)

1. **Open the Interview Page** in Brave
2. **Click the 🦁 Brave Shields icon** (top-right corner, next to address bar)
3. **Turn OFF "Block fingerprinting"** or set to "Allow all fingerprinting"
4. **Refresh the page** (F5 or Ctrl+R)
5. **Click the microphone button** to test voice input
6. **Allow microphone access** when prompted

---

## 🔧 Detailed Steps with Screenshots

### Step 1: Access Brave Shields
- Look for the **🦁 lion icon** in the top-right of your browser
- Click it to open the Brave Shields panel

### Step 2: Adjust Fingerprinting Settings
**Current Setting:** `Block fingerprinting` (default)  
**Change to:** `Allow all fingerprinting` or `Standard fingerprinting protection`

**Why?** The Web Speech API is considered a "fingerprinting" technology because it can potentially identify users. Brave blocks it by default.

### Step 3: Grant Microphone Permission
- After changing shields, refresh the page
- Click the 🎤 microphone button during interview
- Browser will prompt: "Allow microphone access?"
- Click **"Allow"**

---

## 🎯 Alternative Solutions

### Option 1: Use Typing Instead
- **No configuration needed**
- Simply type your answers in the text box
- All interview features work the same
- ✅ **Recommended for maximum privacy**

### Option 2: Disable Shields for This Site Only
```
1. Click 🦁 Brave Shields icon
2. Toggle "Shields" to OFF for this site
3. Refresh page
```
**Note:** This allows all features but reduces privacy protections.

### Option 3: Use a Different Browser
**Fully Compatible Browsers:**
- ✅ Google Chrome (full support)
- ✅ Microsoft Edge (full support)
- ⚠️ Firefox (typing only, no voice)
- ⚠️ Safari (typing only, no voice)

---

## 🔐 Privacy Considerations

### What Data Does Web Speech API Share?

When you enable voice features:
- **Audio is sent to Google servers** for transcription
- **Google may temporarily store** audio data (typically < 24 hours)
- **No permanent recording** by our application
- **Transcript only** is stored in interview database

### Brave Blocks This Because:
1. **Fingerprinting Risk** - Voice patterns can identify users
2. **Third-party Service** - Audio sent to Google servers
3. **Privacy Protection** - Prevents tracking across sites

### Our Application:
- ✅ **Does NOT store audio files**
- ✅ **Only stores text transcripts**
- ✅ **Typing works without any external services**
- ✅ **No difference in interview scoring** (voice vs typing)

---

## 🧪 Testing Voice Features

### Quick Test:
1. Enable Brave Shields adjustments (see above)
2. Go to interview page
3. Look for **🎤 microphone icon**
4. Click it and say: **"This is a test"**
5. Check if text appears in the answer box

### Console Check:
Open browser console (F12 → Console tab):

**✅ Working:**
```
🦁 Brave browser detected
✅ Web Speech API available in Brave (shields may need adjustment)
🎤 Speech recognition started
```

**❌ Blocked:**
```
🦁 Brave browser detected
⚠️ Web Speech API blocked by Brave shields
```

---

## 🆘 Troubleshooting

### Problem: Voice button is grayed out
**Solution:** 
- Check if Brave Shields are blocking Web Speech API
- Console shows: "Web Speech API blocked"
- Adjust shields as described above

### Problem: "Microphone Access Denied"
**Solution:**
```
1. Click 🔒 lock icon in address bar
2. Find "Microphone" permission
3. Change from "Block" to "Allow"
4. Refresh page
```

### Problem: "Network Error" when using voice
**Solution:**
- Brave is blocking connection to Google speech servers
- Turn OFF "Block Fingerprinting" in Shields
- Or use typing mode instead

### Problem: Voice works but accuracy is poor
**Tips:**
- Speak clearly and at normal pace
- Reduce background noise
- Position microphone correctly
- Use a quality microphone if available
- **Note:** This is not a Brave-specific issue

---

## 📊 Feature Compatibility Matrix

| Feature | Brave (Default) | Brave (Adjusted) | Chrome/Edge |
|---------|----------------|------------------|-------------|
| 🎤 Voice Input | ❌ Blocked | ✅ Works | ✅ Works |
| ⌨️ Typing | ✅ Works | ✅ Works | ✅ Works |
| 📷 Webcam | ✅ Works | ✅ Works | ✅ Works |
| 🤖 AI Detection | ✅ Works | ✅ Works | ✅ Works |
| 📊 Tab Switch Detection | ✅ Works | ✅ Works | ✅ Works |
| 🔊 Text-to-Speech | ✅ Works | ✅ Works | ✅ Works |

**Summary:** Only voice input requires Brave Shields adjustment. All other features work out-of-the-box.

---

## 🎓 For Interviewers/Recruiters

### Setting Up Demo in Brave:

If you're demonstrating the system in Brave:

1. **Before Demo:**
   - Adjust Brave Shields as described
   - Test voice input once
   - Ensure microphone permissions granted

2. **During Demo:**
   - Mention Brave compatibility
   - Show both voice AND typing options
   - Highlight privacy features

3. **Explaining to Users:**
   - "Brave protects privacy by blocking voice services"
   - "Users can adjust settings or simply type instead"
   - "No disadvantage - both methods work equally well"

---

## 🔗 Related Resources

- **Brave Privacy Features:** https://brave.com/privacy-features/
- **Web Speech API Documentation:** https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API
- **Project Voice Features Guide:** See `VOICE_FEATURES_GUIDE.md`

---

## 📝 Summary

**For Most Users:** Just use typing mode - it's simpler and works perfectly!

**For Voice Enthusiasts:**
1. Click 🦁 Brave Shields
2. Disable "Block fingerprinting"
3. Allow microphone
4. Enjoy voice input!

**Remember:** The interview system works equally well with both voice and typing. Choose what's comfortable for you! 🎯
