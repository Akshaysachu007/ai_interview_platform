// Custom React hooks for AI Interview System
import { useState, useCallback, useRef, useEffect } from 'react';

// ✅ PRIMARY HOOK - Face Detection
export { useMediaPipeJS } from './useMediaPipeJS';


/**
 * Hook: Voice input (speech-to-text)
 */
export const useVoiceInput = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const recognitionRef = useRef(null);

  const startListening = useCallback(() => {
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        console.warn('Speech recognition not available');
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        console.log('🎤 Listening...');
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        let interim = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcryptText = event.results[i][0].transcript;
          
          if (event.results[i].isFinal) {
            setTranscript(prev => prev + transcryptText + ' ');
          } else {
            interim += transcryptText;
          }
        }
        
        setInterimTranscript(interim);
      };

      recognition.onerror = (err) => console.error('❌ Recognition error:', err);
      
      recognition.onend = () => {
        console.log('🛑 Listening stopped');
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('❌ Voice recognition error:', err);
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, []);

  const clearTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    clearTranscript
  };
};


/**
 * Hook: Text-to-speech (question reading)
 */
export const useTextToSpeech = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const speak = useCallback((text) => {
    if (!('speechSynthesis' in window)) {
      console.warn('Text-to-speech not supported');
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, []);

  const stop = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  return { isSpeaking, speak, stop };
};


/**
 * Hook: Interview timer
 */
export const useInterviewTimer = (initialMinutes = 30) => {
  const [remainingTime, setRemainingTime] = useState(initialMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (!isRunning || remainingTime <= 0) return;

    const timer = setInterval(() => {
      setRemainingTime(prev => {
        if (prev <= 1) {
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, remainingTime]);

  const startTimer = useCallback(() => setIsRunning(true), []);
  const pauseTimer = useCallback(() => setIsRunning(false), []);
  const resetTimer = useCallback((minutes) => {
    setRemainingTime(minutes * 60);
    setIsRunning(false);
  }, []);

  const formatTime = () => {
    const mins = Math.floor(remainingTime / 60);
    const secs = remainingTime % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  return { remainingTime, isRunning, startTimer, pauseTimer, resetTimer, formatTime };
};


/**
 * Hook: Malpractice tracking
 */
export const useMalpracticeTracker = () => {
  const [malpractices, setMalpractices] = useState({
    tabSwitches: 0,
    aiDetections: 0,
    faceViolations: 0,
    warnings: []
  });

  const addTabSwitch = useCallback(() => {
    setMalpractices(prev => ({
      ...prev,
      tabSwitches: prev.tabSwitches + 1,
      warnings: [...prev.warnings, `⚠️ Tab switch detected at ${new Date().toLocaleTimeString()}`]
    }));
  }, []);

  const addAIDetection = useCallback(() => {
    setMalpractices(prev => ({
      ...prev,
      aiDetections: prev.aiDetections + 1,
      warnings: [...prev.warnings, `🤖 AI-generated answer detected at ${new Date().toLocaleTimeString()}`]
    }));
  }, []);

  const addFaceViolation = useCallback(() => {
    setMalpractices(prev => ({
      ...prev,
      faceViolations: prev.faceViolations + 1,
      warnings: [...prev.warnings, `👤 Face violation detected at ${new Date().toLocaleTimeString()}`]
    }));
  }, []);

  const reset = useCallback(() => {
    setMalpractices({
      tabSwitches: 0,
      aiDetections: 0,
      faceViolations: 0,
      warnings: []
    });
  }, []);

  return { malpractices, addTabSwitch, addAIDetection, addFaceViolation, reset };
};
