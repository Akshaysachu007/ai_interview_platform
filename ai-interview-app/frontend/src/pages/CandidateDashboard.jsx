import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './CandidateDashboard.css';
import CandidateNavbar from '../components/CandidateNavbar';
import EditProfileModal from '../components/EditProfileModal';
import InterviewSelector from '../components/InterviewSelector';
import InterviewBrowser from '../components/InterviewBrowser';
import InterviewAnalytics from '../components/InterviewAnalytics';
import '../components/InterviewSelector.css';

const API_URL = import.meta.env.VITE_API_URL;

export default function CandidateDashboard() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem('candidateToken');
  });
  const [profile, setProfile] = useState(null);
  const [showEdit, setShowEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [activeView, setActiveView] = useState('browse'); // 'browse', 'start', or 'analytics'
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/candidate');
      return;
    }
    const fetchProfile = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('candidateToken');
        const res = await fetch(`${API_URL}/candidate/profile`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        let data;
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          data = await res.json();
        } else {
          throw new Error('Server returned an unexpected response.');
        }
        if (!res.ok) throw new Error(data.message || 'Could not fetch profile');
        setProfile(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [isAuthenticated, navigate, showEdit]);

  // Example interview data
  const attendedInterviews = [];
  const upcomingInterviews = [];

  const handleSaveProfile = async (updated) => {
    try {
      setSaving(true);
      const token = localStorage.getItem('candidateToken');
      
      // If resume file is provided, parse it using Python backend
      if (updated.resumeFile && updated.resumeFile.base64 && updated.resumeFile.type) {
        console.log('📋 Sending resume to Python backend for extraction and parsing...');
        
        const parseRes = await fetch(`${API_URL}/candidate/resume/parse`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ 
            fileBase64: updated.resumeFile.base64,
            fileType: updated.resumeFile.type
          })
        });

        const parseData = await parseRes.json();
        
        if (parseRes.ok && parseData.extractedData) {
          console.log('✅ Resume parsed successfully. Profile completeness:', parseData.profileCompleteness);
          
          // Update profile was already done by the parse endpoint
          // Just refresh the profile data
          setProfile(parseData.profile);
          setShowEdit(false);
          setSaving(false);
          alert(`✅ Resume parsed successfully!\n\nProfile completeness: ${parseData.profileCompleteness}%\n\nExtracted:\n- Name: ${parseData.extractedData.personalDetails?.fullName || 'N/A'}\n- Skills: ${parseData.extractedData.skills?.hardSkills?.length || 0} hard skills\n- Experience: ${parseData.extractedData.workExperience?.length || 0} positions`);
          return;
        } else {
          console.warn('⚠️ Resume parsing failed:', parseData.error);
          alert(`Failed to parse resume: ${parseData.message}\n\n${parseData.hint || ''}`);
          setSaving(false);
          return;
        }
      }
      
      // Regular profile update (when no resume or parsing failed)
      const res = await fetch(`${API_URL}/candidate/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...updated, completed: true })
      });
      let data;
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        throw new Error('Server returned an unexpected response.');
      }
      if (!res.ok) throw new Error(data.message || 'Could not update profile');
      setProfile(data);
      setShowEdit(false);
      setSaving(false);
    } catch (err) {
      setSaving(false);
      alert(err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('candidateToken');
    setIsAuthenticated(false);
    window.location.href = '/';
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;
  if (!profile) return null;

  return (
    <div>
      <CandidateNavbar onLogout={handleLogout} />
      <div className="candidate-dashboard">
        <aside className="dashboard-sidebar" id="profile">
          <img src={profile.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(profile.name)} alt="avatar" className="avatar" />
          <h2>{profile.name}</h2>
          <p className="role">Candidate</p>
          <p className="email">{profile.email}</p>
          {!profile.completed && (
            <button className="edit-profile-btn" onClick={() => setShowEdit(true)}>Complete Profile</button>
          )}
          {profile.completed && <>
            <p className="phone">{profile.phone}</p>
            <p className="bio">{profile.bio}</p>
            <div className="skills-list">
              <strong>Skills:</strong>
              <ul>
                {profile.skills && profile.skills.length > 0 ? profile.skills.map((s, i) => <li key={i}>{s}</li>) : <li>None</li>}
              </ul>
            </div>
            <button className="edit-profile-btn" onClick={() => setShowEdit(true)}>Edit Profile</button>
          </>}
        </aside>
        <main className="dashboard-main">
          <div style={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
            color: 'white', 
            padding: '30px', 
            borderRadius: '12px', 
            marginBottom: '30px',
            textAlign: 'center'
          }}>
            <h2 style={{ marginBottom: '15px', fontSize: '2em' }}>🎯 AI-Powered Interview System</h2>
            <p style={{ marginBottom: '20px', fontSize: '1.1em' }}>
              Browse available interviews, apply to recruiters, and start your AI-monitored practice interviews
            </p>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button 
                onClick={() => setActiveView('browse')}
                style={{
                  background: activeView === 'browse' ? 'white' : 'rgba(255,255,255,0.3)',
                  color: activeView === 'browse' ? '#667eea' : 'white',
                  border: '2px solid white',
                  padding: '12px 30px',
                  fontSize: '1em',
                  fontWeight: 'bold',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                📋 Browse Interviews
              </button>
              <button 
                onClick={() => setActiveView('start')}
                style={{
                  background: activeView === 'start' ? 'white' : 'rgba(255,255,255,0.3)',
                  color: activeView === 'start' ? '#667eea' : 'white',
                  border: '2px solid white',
                  padding: '12px 30px',
                  fontSize: '1em',
                  fontWeight: 'bold',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                🎯 Practice Interview
              </button>
              <button 
                onClick={() => setActiveView('analytics')}
                style={{
                  background: activeView === 'analytics' ? 'white' : 'rgba(255,255,255,0.3)',
                  color: activeView === 'analytics' ? '#667eea' : 'white',
                  border: '2px solid white',
                  padding: '12px 30px',
                  fontSize: '1em',
                  fontWeight: 'bold',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                📊 Analytics
              </button>
            </div>
          </div>

          {activeView === 'browse' ? (
            <InterviewBrowser />
          ) : activeView === 'analytics' ? (
            <InterviewAnalytics />
          ) : (
            <>
              <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                <button 
                  onClick={() => navigate('/candidate/interview')}
                  style={{
                    background: '#667eea',
                    color: 'white',
                    border: 'none',
                    padding: '15px 40px',
                    fontSize: '1.2em',
                    fontWeight: 'bold',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                    transition: 'transform 0.2s'
                  }}
                  onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
                  onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                >
                  🚀 Start Practice Interview
                </button>
              </div>
              <InterviewSelector candidateProfile={profile} onRegister={(iv, candidate) => {
                alert(`Registered for ${iv.title} as ${candidate.name} (${candidate.email})!`);
              }} />
            </>
          )}

          <section className="dashboard-section" id="interviews">
            <h3>Upcoming Interviews</h3>
            {upcomingInterviews.length === 0 ? (
              <p style={{color: 'black'}}>No upcoming interviews.</p>
            ) : (
              <ul>
                {upcomingInterviews.map((iv) => (
                  <li key={iv.id}>
                    <strong>{iv.title}</strong> - {iv.date} <span className="status scheduled">{iv.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section className="dashboard-section">
            <h3>Attended Interviews</h3>
            {attendedInterviews.length === 0 ? (
              <p style={{color:'black'}}>No attended interviews.</p>
            ) : (
              <ul>
                {attendedInterviews.map((iv) => (
                  <li key={iv.id}>
                    <strong>{iv.title}</strong> - {iv.date} <span className="status completed">{iv.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </main>
        {showEdit && (
          <EditProfileModal 
            profile={profile} 
            onSave={handleSaveProfile} 
            onClose={() => setShowEdit(false)} 
            saving={saving}
          />
        )}
      </div>
    </div>
  );
}
