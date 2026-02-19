import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pdfFile, setPdfFile] = useState(null);
  const [extractedQuestions, setExtractedQuestions] = useState([]);
  const [uploadingPdf, setUploadingPdf] = useState(false);

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
      alert(`✅ Successfully extracted ${data.questions.length} questions from PDF!`);
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
        customQuestions: allCustomQuestions
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
        throw new Error(data.message || 'Failed to create interview');
      }

      alert(`✅ Interview created successfully!\n\n` +
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
          <h2>Create New Interview</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
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

          <div className="form-group">
            <label htmlFor="stream">Stream *</label>
            <select
              id="stream"
              value={formData.stream}
              onChange={(e) => setFormData({ ...formData, stream: e.target.value })}
              required
            >
              {streams.map(stream => (
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
              {difficulties.map(level => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          </div>
          
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
              <small style={{color: '#666', fontSize: '0.85rem'}}>
                Total questions (AI + custom, 1-20)
              </small>
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
              <small style={{color: '#666', fontSize: '0.85rem'}}>
                Interview duration (5-180 min)
              </small>
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="jobDescription">Job Description *</label>
            <textarea
              id="jobDescription"
              value={formData.jobDescription}
              onChange={(e) => setFormData({ ...formData, jobDescription: e.target.value })}
              placeholder="Describe the role, responsibilities, and requirements. This will be used to calculate ATS scores when candidates apply with their resumes."
              rows={6}
              required
            />
            <small style={{color: '#666', fontSize: '0.85rem'}}>
              💡 Tip: Include key skills, experience requirements, and qualifications. This helps match candidates better!
            </small>
          </div>
          
          <div className="form-group">
            <label htmlFor="customQuestions">Custom Questions (Optional)</label>
            <textarea
              id="customQuestions"
              value={formData.customQuestions}
              onChange={(e) => setFormData({ ...formData, customQuestions: e.target.value })}
              placeholder="Add your own questions here, one per line&#10;Example:&#10;Explain your experience with React hooks&#10;Describe a challenging project you worked on&#10;What is your approach to debugging?"
              rows={5}
            />
            <small style={{color: '#666', fontSize: '0.85rem'}}>
              ✏️ Add custom questions (one per line). These will be shuffled with AI-generated questions.
            </small>
          </div>
          
          <div className="form-group">
            <label htmlFor="pdfUpload">Or Upload Questions from PDF (Optional)</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                id="pdfUpload"
                type="file"
                accept="application/pdf"
                onChange={handlePdfUpload}
                disabled={uploadingPdf}
                style={{ flex: 1 }}
              />
              {uploadingPdf && <span>⏳ Extracting...</span>}
              {extractedQuestions.length > 0 && (
                <span style={{ color: '#28a745', fontWeight: 'bold' }}>
                  ✅ {extractedQuestions.length} questions extracted
                </span>
              )}
            </div>
            <small style={{color: '#666', fontSize: '0.85rem'}}>
              📄 Upload a PDF with questions. The system will automatically extract them.
            </small>
          </div>
          
          <div className="form-group">
            <label htmlFor="requiredSkills">Required Skills</label>
            <input
              id="requiredSkills"
              type="text"
              value={formData.requiredSkills}
              onChange={(e) => setFormData({ ...formData, requiredSkills: e.target.value })}
              placeholder="e.g., JavaScript, React, Node.js (comma-separated)"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="preferredSkills">Preferred Skills</label>
            <input
              id="preferredSkills"
              type="text"
              value={formData.preferredSkills}
              onChange={(e) => setFormData({ ...formData, preferredSkills: e.target.value })}
              placeholder="e.g., TypeScript, MongoDB, AWS (comma-separated)"
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Additional Notes (Optional)</label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Add any additional information about this interview..."
              rows={3}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Interview'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
