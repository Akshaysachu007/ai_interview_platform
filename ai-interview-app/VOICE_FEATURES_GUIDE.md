# 🎤 Voice Features Guide

## Overview
The AI Interview system now includes **bidirectional voice interaction**:
- 🔊 **AI speaks questions aloud** (Text-to-Speech)
- 🎤 **Candidates answer by voice** (Speech-to-Text)
- ⌨️ **Typing option still available**

## Features Implemented

### 1. Text-to-Speech (AI Reads Questions)
**How it works:**
- When a question appears, AI automatically reads it aloud
- Uses browser's built-in Speech Synthesis API
- Clear, natural voice at optimal speed (0.9x for clarity)

**Controls:**
- 🔊 **"Read Question Aloud"** button - Manually replay the question
- 🛑 **"Stop"** button - Appears while speaking, stops audio immediately
- Visual indicator shows when AI is speaking

**Auto-play:**
- First question reads automatically after interview starts
- Next question reads automatically after submitting previous answer
- Small delay (0.5s) ensures UI is ready

### 2. Speech-to-Text (Voice Answers)
**How it works:**
- Click 🎤 **"Start Voice Answer"** to begin recording
- Speak your answer naturally
- Text appears in real-time in the answer box
- Click 🔴 **"Stop Recording"** when finished

**Features:**
- **Continuous recording** - speak as long as needed
- **Real-time transcription** - see words as you speak
- **Accumulative text** - continues from previous text
- **Visual feedback:**
  - Green pulsing button while recording
  - "🎙️ Listening..." indicator
  - Green border around text area

**Browser compatibility:**
- Best in **Google Chrome** (uses Web Speech API)
- May not work in Firefox/Safari (browser limitation)

### 3. Hybrid Input Mode
**Flexibility:**
- Use voice OR typing - your choice
- Switch anytime during the interview
- Voice text appears in the same answer box
- Edit voice-transcribed text before submitting

**Workflow:**
1. AI reads question aloud (automatic)
2. Choose input method:
   - **Voice:** Click microphone → Speak → Stop recording
   - **Type:** Click in text area → Type answer
   - **Both:** Record voice, then edit/add text manually
3. Submit answer as usual

## Usage Instructions

### For Students (Candidates)

1. **Start Interview:**
   - Select stream and difficulty
   - Click "🚀 Start AI Interview"
   - Grant webcam and microphone permissions

2. **Listen to Question:**
   - AI reads question automatically
   - Replay anytime with "🔊 Read Question Aloud"

3. **Answer by Voice:**
   ```
   Click: 🎤 Start Voice Answer
   Speak: Your complete answer
   Watch: Text appears in real-time
   Click: 🔴 Stop Recording
   Edit: Fine-tune text if needed
   Click: ✅ Submit Answer
   ```

4. **Answer by Typing:**
   - Click in text area
   - Type your answer
   - Click "✅ Submit Answer"

5. **Move to Next Question:**
   - Next question appears automatically
   - AI reads it aloud
   - Repeat process

### For Professors (Demo)

**Demonstrate:**
1. Voice input with real-time transcription
2. Text-to-speech question reading
3. Webcam monitoring during voice input
4. Malpractice detection works with voice answers too

**Show features:**
- "The AI can read questions aloud for accessibility"
- "Candidates can answer naturally by speaking"
- "Voice is transcribed to text for AI analysis"
- "All malpractice detection continues during voice input"

## Technical Details

### APIs Used
1. **Web Speech API - SpeechRecognition:**
   - Continuous: true (allows long answers)
   - InterimResults: true (real-time display)
   - Language: en-US

2. **Web Speech API - SpeechSynthesis:**
   - Rate: 0.9 (slightly slower for clarity)
   - Pitch: 1 (normal)
   - Volume: 1 (full)

### State Management
```javascript
// New state variables
const [isListening, setIsListening] = useState(false);
const [isSpeaking, setIsSpeaking] = useState(false);
const recognitionRef = useRef(null);
```

### Browser Support
- ✅ **Chrome/Edge:** Full support (recommended)
- ✅ **Brave:** Supported (requires Brave Shields adjustment - see [BRAVE_BROWSER_GUIDE.md](BRAVE_BROWSER_GUIDE.md))
- ⚠️ **Firefox:** Limited (typing only, no voice recognition)
- ⚠️ **Safari:** Limited (typing only, no voice recognition)
- 📱 **Mobile:** Varies by browser

**For Brave Users:** The voice feature requires adjusting privacy shields. Click the 🦁 Brave icon → Turn OFF "Block fingerprinting" → Refresh page. See detailed guide: [BRAVE_BROWSER_GUIDE.md](BRAVE_BROWSER_GUIDE.md)

## Accessibility Benefits

1. **Visual Impairment:**
   - Questions read aloud automatically
   - No need to read screen

2. **Motor Impairment:**
   - Voice input reduces typing needs
   - Easier than keyboard interaction

3. **Learning Differences:**
   - Hear questions for better comprehension
   - Speak naturally vs struggling with typing

4. **Non-native Speakers:**
   - Hear pronunciation
   - Speak at own pace

## Webcam Integration

**Important:** Webcam monitoring continues during voice input
- Face detection remains active
- All malpractice checks still work
- Video visible throughout

**Fixed Issues:**
- Video element now displays camera feed correctly
- Added `playsInline`, `onLoadedMetadata` handler
- Explicit `video.play()` call ensures playback
- Video styled with `display: block`

## Testing Checklist

### Text-to-Speech
- [ ] First question reads automatically on start
- [ ] "Read Question Aloud" button replays question
- [ ] "Stop" button appears while speaking
- [ ] Next question reads after answer submission
- [ ] Voice is clear and understandable

### Speech-to-Text
- [ ] Microphone permission requested
- [ ] Recording starts on button click
- [ ] Text appears in real-time
- [ ] Recording stops on button click
- [ ] Transcribed text is accurate
- [ ] Can edit transcribed text

### Hybrid Mode
- [ ] Can switch between voice and typing
- [ ] Voice text accumulates with typed text
- [ ] Submit works with voice-generated text
- [ ] AI detection analyzes voice answers

### Webcam
- [ ] Video feed visible when interview starts
- [ ] Face detection works during voice input
- [ ] Border color changes based on face count
- [ ] Status updates (Face Detected/No Face)

## Troubleshooting

### "Speech recognition not supported"
**Solution:** Use Google Chrome, Microsoft Edge, or Brave browser (with shields adjusted)

### Voice not transcribing
**Check:**
1. Microphone permission granted?
2. Using Chrome/Edge/Brave browser?
3. **Brave users:** Is fingerprinting protection disabled? (See [BRAVE_BROWSER_GUIDE.md](BRAVE_BROWSER_GUIDE.md))
4. Microphone working (test in other apps)?
5. Speaking clearly and loudly enough?

### Brave Browser - Voice Blocked
**Solution for Brave users:**
1. Click 🦁 Brave Shields icon (top-right)
2. Turn OFF "Block fingerprinting"
3. Refresh the page
4. Allow microphone when prompted
5. **Full guide:** [BRAVE_BROWSER_GUIDE.md](BRAVE_BROWSER_GUIDE.md)

### Questions not reading aloud
**Check:**
1. System volume not muted?
2. Browser audio permissions?
3. Text-to-speech enabled in OS?

### Webcam not showing face
**Solution:** Should now be fixed with latest update
- Video element includes playsInline
- Automatic play() call after metadata loads
- Display explicitly set to 'block'

## Future Enhancements (Optional)

1. **Voice Selection:** Choose male/female voice
2. **Speed Control:** Adjust reading speed
3. **Language Support:** Multi-language recognition
4. **Confidence Display:** Show transcription confidence
5. **Noise Filtering:** Background noise reduction
6. **Pause/Resume:** Pause voice input temporarily

## Demo Script

**For Professor Presentation:**

> "Our AI interview system now includes cutting-edge voice interaction:
> 
> 1. **The AI speaks**: Questions are read aloud automatically, making the system more accessible.
> 
> 2. **The candidate speaks**: Instead of typing, candidates can answer naturally by voice. Watch as their words appear in real-time.
> 
> 3. **Seamless integration**: Voice answers are transcribed to text and analyzed by our AI detection algorithms, just like typed answers.
> 
> 4. **Complete monitoring**: The webcam continues monitoring during voice input, detecting multiple faces, face absence, and other malpractices.
> 
> 5. **Flexibility**: Candidates can choose voice OR typing, or even combine both methods.
> 
> This makes our system more natural, accessible, and user-friendly while maintaining all security features."

---

**Implementation Date:** December 2024  
**Status:** ✅ Fully Functional  
**Browser:** Chrome/Edge Recommended
