import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './CandidateDashboard.css';
import CandidateNavbar from '../components/CandidateNavbar';
import EditProfileModal from '../components/EditProfileModal';
import InterviewSelector from '../components/InterviewSelector';
import InterviewBrowser from '../components/InterviewBrowser';
import InterviewAnalytics from '../components/InterviewAnalytics';
import CandidateReports from '../components/CandidateReports';
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
  const [activeView, setActiveView] = useState('browse'); // 'browse', 'start', 'analytics', or 'reports'

  const navTabs = [
    { key: 'browse', label: 'Browse Jobs' },
    { key: 'start', label: 'Practice Test' },
    { key: 'analytics', label: 'Analytics' },
    { key: 'reports', label: 'Reports' }
  ];

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

  const profileCompletion = profile?.completed
    ? 100
    : Math.min(
      100,
      [profile?.name, profile?.email, profile?.phone, profile?.bio, profile?.skills?.length].filter(Boolean).length * 20
    );

  const profileStatusText = profileCompletion === 100
    ? 'Profile complete and ready for interview workflows'
    : 'Complete your profile to improve job matching and analytics quality';

  if (loading) return <div className="candidate-dashboard-state">Loading your dashboard...</div>;
  if (error) return <div className="candidate-dashboard-state error">{error}</div>;
  if (!profile) return null;

  return (
    <div className="candidate-dashboard-shell">
      <CandidateNavbar onLogout={handleLogout} />
      <div className="candidate-dashboard">
        <aside className="dashboard-sidebar" id="profile">
          <img
            src={profile.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(profile.name)}
            alt="avatar"
            className="avatar"
          />
          <h2>{profile.name}</h2>
          <p className="role">Candidate Workspace</p>
          <p className="email">{profile.email}</p>

          <div className="profile-meter">
            <div className="profile-meter-top">
              <span>Profile completion</span>
              <strong>{profileCompletion}%</strong>
            </div>
            <div className="profile-meter-track">
              <span style={{ width: `${profileCompletion}%` }} />
            </div>
            <p>{profileStatusText}</p>
          </div>

          {!profile.completed && (
            <button className="edit-profile-btn" onClick={() => setShowEdit(true)}>Complete Profile</button>
          )}
          {profile.completed && <>
            <p className="phone">{profile.phone}</p>
            <p className="bio">{profile.bio}</p>
            <div className="skills-list">
              <strong>Skills</strong>
              <ul>
                {profile.skills && profile.skills.length > 0 ? profile.skills.map((s, i) => <li key={i}>{s}</li>) : <li>None</li>}
              </ul>
            </div>
            <button className="edit-profile-btn" onClick={() => setShowEdit(true)}>Edit Profile</button>
          </>}
        </aside>

        <main className="dashboard-main">
          <section className="dashboard-hero">
            <div className="hero-copy">
              <p className="hero-eyebrow">Candidate Dashboard</p>
              <h1>Interview readiness at a glance</h1>
              <p>
                Manage applications, run AI practice interviews, and track your performance progress from one place.
              </p>
            </div>

            <div className="hero-actions">
              <button className="primary-action" onClick={() => navigate('/candidate/interview')}>
                Start Practice Interview
              </button>
              <button className="secondary-action" onClick={() => setActiveView('browse')}>
                Browse Jobs
              </button>
            </div>
          </section>

          <section className="dashboard-kpis">
            <article className="kpi-card">
              <p>Active View</p>
              <strong>{navTabs.find((tab) => tab.key === activeView)?.label || 'Overview'}</strong>
            </article>
            <article className="kpi-card">
              <p>Skills Added</p>
              <strong>{profile.skills?.length || 0}</strong>
            </article>
            <article className="kpi-card">
              <p>Profile Status</p>
              <strong>{profile.completed ? 'Complete' : 'In Progress'}</strong>
            </article>
            <article className="kpi-card">
              <p>Contact Ready</p>
              <strong>{profile.phone ? 'Yes' : 'No'}</strong>
            </article>
          </section>

          <section className="dashboard-nav-tabs" aria-label="Candidate dashboard views">
            {navTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={activeView === tab.key ? 'active' : ''}
                onClick={() => setActiveView(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </section>

          <section className="dashboard-content-card">
            {activeView === 'browse' ? (
              <InterviewBrowser />
            ) : activeView === 'analytics' ? (
              <InterviewAnalytics />
            ) : activeView === 'reports' ? (
              <CandidateReports />
            ) : (
              <>
                <div className="start-view-header">
                  <h2>Practice Interview Setup</h2>
                  <p>
                    Select an interview track below or launch a direct AI practice session for quick preparation.
                  </p>
                </div>
                <InterviewSelector
                  candidateProfile={profile}
                  onRegister={(iv, candidate) => {
                    alert(`Registered for ${iv.title} as ${candidate.name} (${candidate.email})`);
                  }}
                />
              </>
            )}
          </section>

          <section className="dashboard-footer-grid">
            <article className="dashboard-section compact">
              <h3>Recommended Next Step</h3>
              <p>
                {profile.completed
                  ? 'Continue with a practice interview and review your analytics to improve response quality.'
                  : 'Complete your profile first so recruiters and job matching workflows can evaluate your background accurately.'}
              </p>
            </article>

            <article className="dashboard-section compact">
              <h3>Profile Actions</h3>
              <div className="footer-actions">
                <button className="secondary-action" onClick={() => setShowEdit(true)}>Update Profile</button>
                <button className="secondary-action" onClick={() => setActiveView('reports')}>Open Reports</button>
              </div>
            </article>
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
