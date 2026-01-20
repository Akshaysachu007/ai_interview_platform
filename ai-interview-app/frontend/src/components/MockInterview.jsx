import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Clock, Target, BookOpen } from 'lucide-react';
import './MockInterview.css';

const API_URL = import.meta.env.VITE_API_URL;

export default function MockInterview() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    stream: 'Computer Science',
    difficulty: 'Medium',
    duration: 30
  });
  const [loading, setLoading] = useState(false);

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

  const difficulties = ['Easy', 'Medium', 'Hard'];
  const durations = [15, 30, 45, 60];

  const handleStartMock = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('candidateToken');
      const response = await fetch(`${API_URL}/interview/mock/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to start mock interview');
      }

      // Navigate to AI interview page with mock interview ID
      navigate('/ai-interview', { 
        state: { 
          interviewId: data.interviewId,
          isMock: true,
          stream: data.stream,
          difficulty: data.difficulty
        } 
      });
    } catch (err) {
      console.error('Start mock interview error:', err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mock-interview-container">
      <div className="mock-header">
        <h2>🎯 Practice Mock Interview</h2>
        <p>Prepare yourself with AI-powered practice interviews</p>
      </div>

      <div className="mock-form">
        <div className="form-group">
          <label>
            <BookOpen size={18} />
            Select Stream
          </label>
          <select 
            value={formData.stream}
            onChange={(e) => setFormData({ ...formData, stream: e.target.value })}
          >
            {streams.map(stream => (
              <option key={stream} value={stream}>{stream}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>
            <Target size={18} />
            Difficulty Level
          </label>
          <div className="difficulty-buttons">
            {difficulties.map(level => (
              <button
                key={level}
                className={`difficulty-btn ${formData.difficulty === level ? 'active' : ''} ${level.toLowerCase()}`}
                onClick={() => setFormData({ ...formData, difficulty: level })}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>
            <Clock size={18} />
            Duration (minutes)
          </label>
          <div className="duration-buttons">
            {durations.map(duration => (
              <button
                key={duration}
                className={`duration-btn ${formData.duration === duration ? 'active' : ''}`}
                onClick={() => setFormData({ ...formData, duration })}
              >
                {duration} min
              </button>
            ))}
          </div>
        </div>

        <div className="mock-info">
          <h3>What to Expect:</h3>
          <ul>
            <li>✅ 5 AI-generated questions based on your selected stream</li>
            <li>✅ Real-time AI detection of your answers</li>
            <li>✅ Proctoring features active (just like real interview)</li>
            <li>✅ Detailed performance report after completion</li>
            <li>✅ No recruiter - practice at your own pace</li>
          </ul>
        </div>

        <button 
          className="start-mock-btn"
          onClick={handleStartMock}
          disabled={loading}
        >
          {loading ? (
            <>Starting...</>
          ) : (
            <>
              <Play size={20} />
              Start Mock Interview
            </>
          )}
        </button>
      </div>
    </div>
  );
}
