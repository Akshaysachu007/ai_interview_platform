import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

// Custom hooks
import {
  useWebcam,
  useFaceAnalysis,
  useVoiceInput,
  useTextToSpeech,
  useInterviewTimer,
  useMalpracticeTracker
} from '../hooks/useInterviewHooks';

// UI Components
import {
  QuestionCard,
  AnswerSection,
  FaceMonitor,
  ProctorStats,
  ResultsCard,
  InterviewSetup
} from '../components/InterviewComponents';

const AIInterview = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(location.search);
  const acceptedInterviewId = urlParams.get('id');

  // ============== STATE ==============
  const [stream, setStream] = useState('Computer Science');
  const [difficulty, setDifficulty] = useState('Medium');
  const [loading, setLoading] = useState(false);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [interviewCompleted, setInterviewCompleted] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [results, setResults] = useState(null);
  const [interviewId, setInterviewId] = useState(null);
  const [isFromAcceptedApplication, setIsFromAcceptedApplication] = useState(false);
  const [voiceAvailable, setVoiceAvailable] = useState(true);
  const [timerStarted, setTimerStarted] = useState(false);

  // ============== CUSTOM HOOKS ==============
  const { videoRef, webcamActive, startWebcam, stopWebcam } = useWebcam();
  const { faceMetrics, analyzeFrameViaAPI, disconnect: disconnectFaceAnalysis } = useFaceAnalysis();
  const { isListening, transcript, interimTranscript, startListening, stopListening } = useVoiceInput();
  const { isSpeaking, speak, stop: stopSpeaking } = useTextToSpeech();
  const { remainingTime, startTimer, pauseTimer, resetTimer, formatTime } = useInterviewTimer(30);
  const { malpractices, addTabSwitch, addAIDetection, addFaceViolation, reset: resetMalpractices } = useMalpracticeTracker();

  // ============== CANVAS REF ==============
  const canvasRef = React.useRef(null);
  const analyzeIntervalRef = React.useRef(null);

  // ============== API SETUP ==============
  const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    headers: {
      Authorization: `Bearer ${localStorage.getItem('candidateToken')}`
    }
  });

  // ============== EFFECTS ==============

  // Test voice availability
  useEffect(() => {
    const hasSpeechRecognition = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    setVoiceAvailable(hasSpeechRecognition);
  }, []);

  // Load accepted interview
  useEffect(() => {
    if (acceptedInterviewId && !interviewStarted) {
      loadAcceptedInterview(acceptedInterviewId);
    }
  }, [acceptedInterviewId]);

  // Start webcam and face analysis when interview starts
  useEffect(() => {
    if (interviewStarted && !interviewCompleted && !webcamActive) {
      startWebcam();
      startFaceAnalysisLoop();
      startTimer();
      setTimerStarted(true);
    }

    return () => {
      if (interviewCompleted) {
        stopWebcam();
        disconnectFaceAnalysis();
        pauseTimer();
      }
    };
  }, [interviewStarted, interviewCompleted, webcamActive]);

  // Detect tab switching
  useEffect(() => {
    if (!interviewStarted || interviewCompleted) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        reportTabSwitch();
        addTabSwitch();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [interviewStarted, interviewCompleted, interviewId]);

  // Update answer from voice transcript
  useEffect(() => {
    if (transcript) {
      setAnswer(prev => prev + transcript);
    }
  }, [transcript]);

  // ============== FUNCTIONS ==============

  const startFaceAnalysisLoop = () => {
    if (analyzeIntervalRef.current) clearInterval(analyzeIntervalRef.current);

    analyzeIntervalRef.current = setInterval(() => {
      if (videoRef.current && videoRef.current.srcObject) {
        analyzeFrameViaAPI(videoRef.current);
      }
    }, 200); // Analyze every 200ms (5 FPS)
  };

  const loadAcceptedInterview = async (id) => {
    try {
      setLoading(true);
      const response = await api.get(`/interview/${id}`);
      const interview = response.data;

      setStream(interview.stream);
      setDifficulty(interview.difficulty);
      setInterviewId(id);
      setIsFromAcceptedApplication(true);

      if (interview.status === 'in-progress') {
        setInterviewStarted(true);
        setQuestions(interview.questions);
        setCurrentQuestionIndex(interview.currentQuestionIndex || 0);
      }

      alert(`✅ Interview loaded: ${interview.stream} - ${interview.difficulty}`);
    } catch (error) {
      console.error('Load interview error:', error);
      alert('Failed to load interview');
      navigate('/candidate/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const startInterview = async () => {
    try {
      setLoading(true);

      const requestBody = isFromAcceptedApplication
        ? { interviewId }
        : { stream, difficulty };

      const response = await api.post('/interview/start', requestBody);

      setInterviewId(response.data.interviewId);
      setQuestions(response.data.questions);
      setInterviewStarted(true);
      resetMalpractices();

      localStorage.setItem('activeInterviewId', response.data.interviewId);

      // Auto-speak first question
      if (response.data.questions.length > 0) {
        setTimeout(() => speak(response.data.questions[0].question), 500);
      }

      alert('✅ Interview started!');
    } catch (error) {
      console.error('Start interview error:', error);
      alert('Error starting interview: ' + error.response?.data?.message);
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!answer.trim()) {
      alert('Please provide an answer');
      return;
    }

    stopListening();

    try {
      setLoading(true);

      const response = await api.post('/interview/submit-answer', {
        interviewId,
        questionIndex: currentQuestionIndex,
        answer
      });

      if (response.data.aiDetection?.isAiGenerated) {
        addAIDetection();
        alert('⚠️ AI-generated content detected');
      }

      setAnswer('');
      
      if (currentQuestionIndex < questions.length - 1) {
        const nextIndex = currentQuestionIndex + 1;
        setCurrentQuestionIndex(nextIndex);
        setTimeout(() => speak(questions[nextIndex].question), 500);
      } else {
        alert('✅ All questions answered!');
      }
    } catch (error) {
      console.error('Submit answer error:', error);
      alert('Error: ' + error.response?.data?.message);
    } finally {
      setLoading(false);
    }
  };

  const skipQuestion = async () => {
    stopListening();
    stopSpeaking();

    try {
      setLoading(true);

      await api.post('/interview/submit-answer', {
        interviewId,
        questionIndex: currentQuestionIndex,
        answer: '[SKIPPED]',
        skipped: true
      });

      setAnswer('');

      if (currentQuestionIndex < questions.length - 1) {
        const nextIndex = currentQuestionIndex + 1;
        setCurrentQuestionIndex(nextIndex);
        setTimeout(() => speak(questions[nextIndex].question), 500);
      } else {
        alert('✅ All questions done!');
      }
    } catch (error) {
      console.error('Skip question error:', error);
      alert('Error: ' + error.response?.data?.message);
    } finally {
      setLoading(false);
    }
  };

  const previousQuestion = () => {
    stopListening();
    stopSpeaking();

    if (currentQuestionIndex > 0) {
      const prevIndex = currentQuestionIndex - 1;
      setCurrentQuestionIndex(prevIndex);
      setAnswer('');
      setTimeout(() => speak(questions[prevIndex].question), 500);
    } else {
      alert('⚠️ This is the first question');
    }
  };

  const completeInterview = async () => {
    try {
      setLoading(true);

      stopWebcam();
      stopListening();
      stopSpeaking();

      localStorage.removeItem('activeInterviewId');

      const response = await api.post('/interview/complete', { interviewId });

      setResults(response.data);
      setInterviewCompleted(true);

      alert(`🏁 Interview Complete!\nScore: ${response.data.score}/100`);

      setTimeout(() => navigate('/candidate/dashboard'), 2000);
    } catch (error) {
      console.error('Complete interview error:', error);
      alert('Error: ' + error.response?.data?.message);
    } finally {
      setLoading(false);
    }
  };

  const reportTabSwitch = async () => {
    try {
      await api.post('/interview/report-tab-switch', { interviewId });
    } catch (error) {
      console.error('Tab switch report error:', error);
    }
  };

  const getInterviewStats = async () => {
    try {
      const response = await api.get('/interview/stats/summary');
      const { totalInterviews, completedInterviews, averageScore } = response.data;

      alert(`📊 Your Statistics:\n\nTotal: ${totalInterviews}\nCompleted: ${completedInterviews}\nAverage Score: ${averageScore}/100`);
    } catch (error) {
      alert('Error fetching stats: ' + error.message);
    }
  };

  // ============== RENDER ==============

  if (!localStorage.getItem('candidateToken')) {
    return (
      <div className="ai-interview-container">
        <h2>⚠️ Please login first</h2>
        <a href="/candidate" style={{ color: '#3498db', fontSize: '1.2em' }}>Go to Login</a>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="ai-interview-container">
      <h1>🎯 AI-Powered Interview System</h1>
      <p className="subtitle">With Real-time Face Analysis</p>

      {/* SETUP PHASE */}
      {!interviewStarted && !interviewCompleted && (
        <InterviewSetup
          streams={['Computer Science', 'Data Science', 'AI/ML', 'Business']}
          difficulties={['Easy', 'Medium', 'Hard']}
          stream={stream}
          setStream={setStream}
          difficulty={difficulty}
          setDifficulty={setDifficulty}
          onStart={startInterview}
          onStats={getInterviewStats}
          loading={loading}
          isFromAccepted={isFromAcceptedApplication}
        />
      )}

      {/* ACTIVE INTERVIEW */}
      {interviewStarted && !interviewCompleted && (
        <div className="interview-section">
          <div className="interview-header">
            <h2>📝 Interview in Progress</h2>
            <div className="interview-info">
              <span className="badge">Q {currentQuestionIndex + 1}/{questions.length}</span>
              <span className="badge">⏱️ {formatTime()}</span>
              <span className={`badge ${!faceMetrics?.face_detected ? 'badge-danger' : 'badge-success'}`}>
                {faceMetrics?.face_detected ? '✅ Monitored' : '⚠️ Check Camera'}
              </span>
            </div>
          </div>

          <div className="interview-layout">
            {/* LEFT: Face Monitoring */}
            <div className="left-column">
              <FaceMonitor
                videoRef={videoRef}
                canvasRef={canvasRef}
                faceMetrics={faceMetrics}
                webcamActive={webcamActive}
              />
              <ProctorStats faceMetrics={faceMetrics} malpractices={malpractices} />
            </div>

            {/* RIGHT: Questions & Answers */}
            <div className="right-column">
              <QuestionCard
                question={currentQuestion}
                questionIndex={currentQuestionIndex}
                totalQuestions={questions.length}
                onReadAloud={() => speak(currentQuestion?.question)}
                isReading={isSpeaking}
              />

              <AnswerSection
                answer={answer}
                setAnswer={setAnswer}
                isListening={isListening}
                interimTranscript={interimTranscript}
                voiceAvailable={voiceAvailable}
                onStartVoice={startListening}
                onStopVoice={stopListening}
                loading={loading}
                onSubmit={submitAnswer}
                onSkip={skipQuestion}
                onPrevious={previousQuestion}
                onComplete={completeInterview}
              />
            </div>
          </div>
        </div>
      )}

      {/* RESULTS PHASE */}
      {interviewCompleted && results && (
        <div className="results-section">
          <h2>🎉 Interview Completed!</h2>
          <ResultsCard results={results} />
          <div className="button-group">
            <button className="btn btn-primary" onClick={() => {
              setInterviewStarted(false);
              setInterviewCompleted(false);
              setQuestions([]);
              setAnswer('');
              setResults(null);
              resetMalpractices();
            }}>
              🔄 New Interview
            </button>
            <button className="btn btn-secondary" onClick={getInterviewStats}>
              📊 Statistics
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIInterview;
