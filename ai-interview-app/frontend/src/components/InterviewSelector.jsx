import React, { useState, useEffect } from 'react';

// Example static data for recruiters and streams (replace with backend fetch later)
const recruiters = [
  { name: 'TechCorp', streams: ['Frontend', 'Backend', 'AI/ML'] },
  { name: 'InnoSoft', streams: ['Full Stack', 'DevOps', 'QA'] },
  { name: 'DataWorks', streams: ['Data Science', 'Analytics', 'AI/ML'] },
];

// Example static data for interviews (replace with backend fetch later)
const interviews = [
  { id: 1, recruiter: 'TechCorp', stream: 'Frontend', title: 'React Developer Interview', date: '2025-11-20' },
  { id: 2, recruiter: 'TechCorp', stream: 'AI/ML', title: 'ML Engineer Interview', date: '2025-11-25' },
  { id: 3, recruiter: 'InnoSoft', stream: 'Full Stack', title: 'Full Stack Developer', date: '2025-12-01' },
  { id: 4, recruiter: 'DataWorks', stream: 'Data Science', title: 'Data Scientist', date: '2025-12-05' },
];

export default function InterviewSelector({ candidateProfile, onRegister }) {
  const [selectedRecruiter, setSelectedRecruiter] = useState('');
  const [selectedStream, setSelectedStream] = useState('');
  const [filteredStreams, setFilteredStreams] = useState([]);
  const [filteredInterviews, setFilteredInterviews] = useState([]);

  useEffect(() => {
    if (selectedRecruiter) {
      const rec = recruiters.find(r => r.name === selectedRecruiter);
      setFilteredStreams(rec ? rec.streams : []);
      setSelectedStream('');
    } else {
      setFilteredStreams([]);
      setSelectedStream('');
    }
  }, [selectedRecruiter]);

  useEffect(() => {
    if (selectedRecruiter && selectedStream) {
      setFilteredInterviews(
        interviews.filter(iv => iv.recruiter === selectedRecruiter && iv.stream === selectedStream)
      );
    } else {
      setFilteredInterviews([]);
    }
  }, [selectedRecruiter, selectedStream]);

  return (
    <div className="interview-selector">
      <h3>Find and Register for Interviews</h3>
      <div className="selector-row">
        <label>Recruiter:
          <select value={selectedRecruiter} onChange={e => setSelectedRecruiter(e.target.value)}>
            <option value="">Select Recruiter</option>
            {recruiters.map(r => <option key={r.name} value={r.name}>{r.name}</option>)}
          </select>
        </label>
        <label>Stream:
          <select value={selectedStream} onChange={e => setSelectedStream(e.target.value)} disabled={!selectedRecruiter}>
            <option value="">Select Stream</option>
            {filteredStreams.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
      </div>
      <div className="interview-list">
        {filteredInterviews.length === 0 ? (
          <p>No interviews available for this selection.</p>
        ) : (
          <ul>
            {filteredInterviews.map(iv => (
              <li key={iv.id}>
                <strong>{iv.title}</strong> - {iv.date}
                <button style={{ marginLeft: 16 }} onClick={() => onRegister(iv, candidateProfile)}>
                  Register
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
