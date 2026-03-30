import React, { useState } from 'react';
import { X } from 'lucide-react';
import './InterviewCreation.css';

const API_URL = import.meta.env.VITE_API_URL;

export default function InterviewCreation({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    stream: 'Computer Science',
    difficulty: 'Medium',
    description: '',
    jobDescription: '',
    title: '',
    company: '',
    requiredSkills: '',
    preferredSkills: '',
    questionCount: 5,
    timeLimit: 30,
    customQuestions: ''
  });
  const [violationThresholds, setViolationThresholds] = useState({
    noFace: 0,
    multipleFace: 0,
    lookingAway: 0,
    tabSwitch: 0,
    voiceChange: 0,
    aiAnswer: 0
  });
  const [showThresholds, setShowThresholds] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pdfFile, setPdfFile] = useState(null);
  const [extractedQuestions, setExtractedQuestions] = useState([]);
  const [uploadingPdf, setUploadingPdf] = useState(false);

  const thresholdFields = [
    { key: 'noFace', label: 'No Face Detected' },
    { key: 'multipleFace', label: 'Multiple Faces' },
    { key: 'lookingAway', label: 'Looking Away' },
    { key: 'tabSwitch', label: 'Tab Switches' },
    { key: 'voiceChange', label: 'Voice Changes' },
    { key: 'aiAnswer', label: 'AI Answers' }
  ];

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

  const handlePdfUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file');
      return;
    }
    
    setPdfFile(file);
    setUploadingPdf(true);
    setError('');
    
    try {
      const token = localStorage.getItem('recruiterToken');
      const formData = new FormData();
      formData.append('pdf', file);
      
      const response = await fetch(`${API_URL}/recruiter/extract-questions-from-pdf`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to extract questions from PDF');
      }
      
      setExtractedQuestions(data.questions || []);
      alert(`Successfully extracted ${data.questions.length} questions from PDF.`);
    } catch (err) {
      console.error('PDF upload error:', err);
      setError(err.message);
      setPdfFile(null);
    } finally {
      setUploadingPdf(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('recruiterToken');
      
      // Parse custom questions from textarea (one per line)
      const customQuestionsFromText = formData.customQuestions
        ? formData.customQuestions.split('\n')
            .map(q => q.trim())
            .filter(q => q.length > 0)
            .map(q => ({ question: q, addedBy: 'recruiter' }))
        : [];
      
      // Combine text questions and PDF questions
      const allCustomQuestions = [
        ...customQuestionsFromText,
        ...extractedQuestions
      ];
      
      // Parse skills from comma-separated strings to arrays
      const payload = {
        ...formData,
        requiredSkills: formData.requiredSkills 
          ? formData.requiredSkills.split(',').map(s => s.trim()).filter(s => s)
          : [],
        preferredSkills: formData.preferredSkills
          ? formData.preferredSkills.split(',').map(s => s.trim()).filter(s => s)
          : [],
        questionCount: parseInt(formData.questionCount) || 5,
        timeLimit: parseInt(formData.timeLimit) || 30,
        customQuestions: allCustomQuestions,
        violationThresholds
      };
      
      console.log('📤 Creating interview with:', {
        questionCount: payload.questionCount,
        timeLimit: payload.timeLimit,
        customQuestions: allCustomQuestions.length
      });
      
      const response = await fetch(`${API_URL}/recruiter/create-interview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create job');
      }

      alert(`Job created successfully.\n\n` +
            `• Total Questions: ${data.config.questionCount}\n` +
            `• Time Limit: ${data.config.timeLimit} minutes\n` +
            `• Custom Questions: ${data.config.customQuestions}\n` +
            `• AI Questions: ${data.config.questionCount - data.config.customQuestions}\n\n` +
            `Candidates can now apply!`);
      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch (err) {
      console.error('Create interview error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <p className="modal-eyebrow">Interview Setup</p>
            <h2>Create New Job</h2>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <section className="form-section">
            <h3>Role Details</h3>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="title">Job Title</label>
                <input
                  id="title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Senior Software Engineer"
                />
              </div>

              <div className="form-group">
                <label htmlFor="company">Company Name</label>
                <input
                  id="company"
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="e.g., Tech Corp Inc."
                />
              </div>
            </div>
            <div className="form-grid form-grid-3">
              <div className="form-group">
                <label htmlFor="stream">Stream *</label>
                <select
                  id="stream"
                  value={formData.stream}
                  onChange={(e) => setFormData({ ...formData, stream: e.target.value })}
                  required
                >
                  {streams.map((stream) => (
                    <option key={stream} value={stream}>{stream}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="difficulty">Difficulty Level *</label>
                <select
                  id="difficulty"
                  value={formData.difficulty}
                  onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                  required
                >
                  {difficulties.map((level) => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="timeLimit">Time Limit (minutes) *</label>
                <input
                  id="timeLimit"
                  type="number"
                  min="5"
                  max="180"
                  value={formData.timeLimit}
                  onChange={(e) => setFormData({ ...formData, timeLimit: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="jobDescription">Job Description *</label>
              <textarea
                id="jobDescription"
                value={formData.jobDescription}
                onChange={(e) => setFormData({ ...formData, jobDescription: e.target.value })}
                placeholder="Describe responsibilities, required experience, and selection expectations."
                rows={5}
                required
              />
              <small className="field-hint">
                Include responsibilities, required skills, and qualifications for better candidate matching.
              </small>
            </div>
          </section>

          <section className="form-section">
            <h3>Questions Configuration</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="questionCount">Number of Questions *</label>
                <input
                  id="questionCount"
                  type="number"
                  min="1"
                  max="20"
                  value={formData.questionCount}
                  onChange={(e) => setFormData({ ...formData, questionCount: e.target.value })}
                  required
                />
                <small className="field-hint">Total questions (AI + custom), between 1 and 20.</small>
              </div>

              <div className="form-group">
                <label htmlFor="customQuestions">Custom Questions (Optional)</label>
                <textarea
                  id="customQuestions"
                  value={formData.customQuestions}
                  onChange={(e) => setFormData({ ...formData, customQuestions: e.target.value })}
                  placeholder="Add one question per line"
                  rows={4}
                />
                <small className="field-hint">Each line is treated as one custom question.</small>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="pdfUpload">Upload Questions from PDF (Optional)</label>
              <div className="pdf-upload-row">
                <input
                  id="pdfUpload"
                  type="file"
                  accept="application/pdf"
                  onChange={handlePdfUpload}
                  disabled={uploadingPdf}
                />
                {uploadingPdf && <span className="upload-state loading">Extracting...</span>}
                {!uploadingPdf && extractedQuestions.length > 0 && (
                  <span className="upload-state success">{extractedQuestions.length} questions extracted</span>
                )}
                {!uploadingPdf && pdfFile && extractedQuestions.length === 0 && (
                  <span className="upload-state pending">{pdfFile.name}</span>
                )}
              </div>
              <small className="field-hint">Upload a PDF and the system will auto-extract interview questions.</small>
            </div>
          </section>

          <section className="form-section">
            <h3>Skills and Notes</h3>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="requiredSkills">Required Skills</label>
                <input
                  id="requiredSkills"
                  type="text"
                  value={formData.requiredSkills}
                  onChange={(e) => setFormData({ ...formData, requiredSkills: e.target.value })}
                  placeholder="e.g., JavaScript, React, Node.js"
                />
              </div>

              <div className="form-group">
                <label htmlFor="preferredSkills">Preferred Skills</label>
                <input
                  id="preferredSkills"
                  type="text"
                  value={formData.preferredSkills}
                  onChange={(e) => setFormData({ ...formData, preferredSkills: e.target.value })}
                  placeholder="e.g., TypeScript, MongoDB, AWS"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="description">Additional Notes (Optional)</label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Add any additional information about this job"
                rows={3}
              />
            </div>
          </section>

          <section className="form-section thresholds-section">
            <button
              type="button"
              className="threshold-toggle-btn"
              onClick={() => setShowThresholds(!showThresholds)}
            >
              {showThresholds ? 'Hide' : 'Configure'} Auto-Termination Thresholds
            </button>

            {showThresholds && (
              <div className="thresholds-panel">
                <p className="threshold-note">
                  Set max violations before auto-terminating an interview. Use 0 to disable a threshold.
                </p>
                <div className="threshold-grid">
                  {thresholdFields.map(({ key, label }) => (
                    <div key={key} className="threshold-item">
                      <label>{label}</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={violationThresholds[key]}
                        onChange={(e) => setViolationThresholds((prev) => ({
                          ...prev,
                          [key]: Math.max(0, parseInt(e.target.value) || 0)
                        }))}
                        placeholder="0"
                      />
                    </div>
                  ))}
                </div>
                <small className="field-hint">Example: Tab Switches set to 5 will terminate after 5 violations.</small>
              </div>
            )}
          </section>

          {error && <div className="error-message">{error}</div>}

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Job'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
