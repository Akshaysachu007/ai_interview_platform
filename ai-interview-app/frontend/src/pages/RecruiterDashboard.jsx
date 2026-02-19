import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Search, Calendar, Users, FileText, Video, BarChart3, Settings, Menu, X, Play, AlertTriangle, CheckCircle, Clock, Eye, Send, Plus, Filter, Download, Brain } from 'lucide-react';
import InterviewCreation from '../components/InterviewCreation';
import ApplicationManagement from '../components/ApplicationManagement';
import RecruiterInterviews from '../components/RecruiterInterviews';
import LiveInterviewMonitor from '../components/LiveInterviewMonitor';
import AIReports from '../components/AIReports';
import './RecruiterDashboard.css';

const API_URL = import.meta.env.VITE_API_URL;

export default function RecruiterDashboard() {
  const navigate = useNavigate();
  const [time, setTime] = useState(new Date());
  const [notifications, setNotifications] = useState(3);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeView, setActiveView] = useState('dashboard'); // 'dashboard', 'applications', 'interviews', or 'live'
  const [dashboardStats, setDashboardStats] = useState(null);
  const [recentInterviews, setRecentInterviews] = useState([]);
  const [liveInterviews, setLiveInterviews] = useState([]);
  const [loadingStats, setLoadingStats] = useState(false);

  // Debug API URL
  useEffect(() => {
    console.log('API_URL:', API_URL);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('recruiterToken');
    if (!token) {
      navigate('/recruiter');
      return;
    }
    
    // Check for payment success
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');
    const planType = urlParams.get('plan');
    
    if (sessionId && planType) {
      verifyPayment(sessionId, planType);
    } else {
      fetchProfile();
    }
  }, [navigate]);

  const verifyPayment = async (sessionId, planType) => {
    try {
      const token = localStorage.getItem('recruiterToken');
      const res = await fetch(`${API_URL}/payment/verify-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ sessionId, planType })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setProfile(data.recruiter);
        // Clear URL parameters
        window.history.replaceState({}, document.title, '/recruiter/dashboard');
        alert('🎉 Payment successful! Your subscription is now active.');
      } else {
        throw new Error(data.message || 'Payment verification failed');
      }
    } catch (err) {
      console.error('Payment verification error:', err);
      alert('Payment verification failed. Please contact support.');
      fetchProfile();
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('recruiterToken');
      const res = await fetch(`${API_URL}/recruiter/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Server error' }));
        console.error('Profile fetch failed:', errorData);
        if (res.status === 401) {
          localStorage.removeItem('recruiterToken');
          navigate('/recruiter');
          return;
        }
        throw new Error(errorData.message || 'Failed to fetch profile');
      }
      
      const data = await res.json();
      setProfile(data);
      
      // Redirect to subscription page if no active plan
      if (!data.subscriptionPlan || data.subscriptionPlan === 'none') {
        navigate('/recruiter/subscription');
        return;
      }
      
      // Check if subscription expired
      if (data.subscriptionExpiry && new Date(data.subscriptionExpiry) < new Date()) {
        alert('Your subscription has expired. Please renew to continue.');
        navigate('/recruiter/subscription');
        return;
      }
      
      if (!data.verified) {
        console.warn('Account awaiting admin verification');
      }
      
      // Fetch dashboard data after profile loads
      fetchDashboardData();
    } catch (err) {
      console.error('Error fetching profile:', err);
      alert('Failed to load profile. Please try refreshing the page.');
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoadingStats(true);
      const token = localStorage.getItem('recruiterToken');
      
      // Fetch all interviews for this recruiter
      const interviewsRes = await fetch(`${API_URL}/recruiter/interviews`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (interviewsRes.ok) {
        const interviews = await interviewsRes.json();
        
        // Calculate real statistics
        const totalInterviews = interviews.length;
        const activeInterviews = interviews.filter(i => i.status === 'in-progress').length;
        const completedToday = interviews.filter(i => {
          if (i.status !== 'completed') return false;
          const today = new Date().toDateString();
          const completedDate = new Date(i.completedAt || i.updatedAt).toDateString();
          return today === completedDate;
        }).length;
        const pendingReview = interviews.filter(i => 
          i.status === 'completed' && !i.reviewed
        ).length;
        const shortlisted = interviews.filter(i => 
          i.score >= 70 && i.status === 'completed' && !i.flagged
        ).length;
        const flaggedCount = interviews.filter(i => i.flagged).length;
        
        setDashboardStats({
          total: totalInterviews,
          active: activeInterviews,
          completedToday,
          pendingReview,
          shortlisted,
          flagged: flaggedCount
        });
        
        // Sort by date and get recent interviews
        const sorted = [...interviews].sort((a, b) => 
          new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)
        );
        setRecentInterviews(sorted.slice(0, 10));
        
        // Get live interviews
        const live = interviews.filter(i => i.status === 'in-progress');
        setLiveInterviews(live);
        
        // Fetch detailed info for live interviews
        if (live.length > 0) {
          pollLiveInterviews(live.map(i => i._id));
        }
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  // Poll live interviews for real-time updates
  const pollLiveInterviews = async (interviewIds) => {
    try {
      const token = localStorage.getItem('recruiterToken');
      const promises = interviewIds.map(id =>
        fetch(`${API_URL}/interview/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(res => res.ok ? res.json() : null)
      );
      
      const results = await Promise.all(promises);
      const validInterviews = results.filter(r => r !== null);
      setLiveInterviews(validInterviews);
    } catch (err) {
      console.error('Error polling live interviews:', err);
    }
  };

  // Auto-refresh dashboard data every 30 seconds
  useEffect(() => {
    if (profile && activeView === 'dashboard') {
      const interval = setInterval(() => {
        fetchDashboardData();
      }, 30000); // 30 seconds
      
      return () => clearInterval(interval);
    }
  }, [profile, activeView]);

  const handleLogout = () => {
    localStorage.removeItem('recruiterToken');
    localStorage.removeItem('recruiterName');
    navigate('/recruiter');
  };

  const formatDateTime = (date) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (d.toDateString() === today.toDateString()) {
      return `Today, ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (d.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'in-progress': return 'blue';
      case 'completed': return 'green';
      case 'pending': return 'yellow';
      case 'scheduled': return 'gray';
      default: return 'gray';
    }
  };

  const getProctoringBadge = (interview) => {
    if (interview.flagged) return 'flagged';
    if (interview.status !== 'completed') return 'pending';
    
    const totalViolations = (interview.malpractices?.tabSwitches || 0) + 
                           (interview.malpractices?.faceDetections?.filter(f => f.facesDetected !== 1).length || 0);
    
    if (totalViolations === 0) return 'clean';
    if (totalViolations > 5) return 'flagged';
    return 'warning';
  };

  const calculateProgress = (interview) => {
    if (!interview.questions || interview.questions.length === 0) return 0;
    const answeredCount = interview.questions.filter(q => q.answer).length;
    return Math.round((answeredCount / interview.questions.length) * 100);
  };

  const calculateDuration = (interview) => {
    if (!interview.createdAt) return '0:00';
    const start = new Date(interview.createdAt);
    const end = interview.completedAt ? new Date(interview.completedAt) : new Date();
    const diffMs = end - start;
    const minutes = Math.floor(diffMs / 60000);
    const seconds = Math.floor((diffMs % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const stats = dashboardStats ? [
    { 
      label: 'Active Interviews', 
      value: dashboardStats.active.toString(), 
      change: dashboardStats.active > 0 ? `${dashboardStats.active} live` : 'No active', 
      icon: Play, 
      color: 'blue' 
    },
    { 
      label: 'Pending Review', 
      value: dashboardStats.pendingReview.toString(), 
      change: dashboardStats.pendingReview > 0 ? 'Action needed' : 'All clear', 
      icon: Clock, 
      color: 'orange' 
    },
    { 
      label: 'Completed Today', 
      value: dashboardStats.completedToday.toString(), 
      change: `${dashboardStats.total} total`, 
      icon: CheckCircle, 
      color: 'green' 
    },
    { 
      label: 'Shortlisted', 
      value: dashboardStats.shortlisted.toString(), 
      change: `${dashboardStats.flagged} flagged`, 
      icon: Users, 
      color: 'purple' 
    }
  ] : [
    { label: 'Active Interviews', value: '...', change: 'Loading', icon: Play, color: 'blue' },
    { label: 'Pending Review', value: '...', change: 'Loading', icon: Clock, color: 'orange' },
    { label: 'Completed Today', value: '...', change: 'Loading', icon: CheckCircle, color: 'green' },
    { label: 'Shortlisted', value: '...', change: 'Loading', icon: Users, color: 'purple' }
  ];

  // Real live interviews data
  const liveInterviewsData = liveInterviews.map(interview => ({
    id: interview._id,
    name: interview.candidateName || 'Unknown Candidate',
    position: `${interview.stream} - ${interview.difficulty}`,
    duration: calculateDuration(interview),
    status: getProctoringBadge(interview),
    progress: calculateProgress(interview),
    interview: interview
  }));

  // Real recent interviews data
  const recentInterviewsData = recentInterviews.map(interview => {
    const proctoringBadge = getProctoringBadge(interview);
    return {
      id: interview._id,
      name: interview.candidateName || 'Unknown Candidate',
      position: `${interview.stream} - ${interview.difficulty}`,
      status: interview.status === 'in-progress' ? 'In Progress' : 
              interview.status === 'completed' ? 'Completed' : 
              interview.status === 'pending' ? 'Pending' : 'Unknown',
      score: interview.score ? `${interview.score}/100` : '-',
      proctoring: proctoringBadge,
      date: formatDateTime(interview.updatedAt || interview.createdAt),
      statusColor: getStatusColor(interview.status),
      interview: interview
    };
  });

  const liveInterviewsOld = [
    { name: 'John Doe', position: 'Software Engineer', duration: '15:32 / 45:00', status: 'clean', progress: 34 },
    { name: 'Sarah Williams', position: 'Data Analyst', duration: '28:45 / 60:00', status: 'clean', progress: 48 },
    { name: 'Mike Chen', position: 'Product Manager', duration: '42:10 / 45:00', status: 'warning', progress: 94 }
  ];

  const recentInterviewsOld = [
    { name: 'Sarah Johnson', position: 'Data Analyst', status: 'In Progress', score: '-', proctoring: 'clean', date: 'Today, 2:30 PM', statusColor: 'blue' },
    { name: 'Mike Chen', position: 'Sr. Developer', status: 'Completed', score: '85/100', proctoring: 'flagged', date: 'Yesterday, 4:00 PM', statusColor: 'green' },
    { name: 'Amy Williams', position: 'Marketing Manager', status: 'Under Review', score: '78/100', proctoring: 'clean', date: 'Dec 14, 10:00 AM', statusColor: 'yellow' },
    { name: 'David Brown', position: 'UX Designer', status: 'Scheduled', score: '-', proctoring: '-', date: 'Tomorrow, 11:00 AM', statusColor: 'gray' },
    { name: 'Lisa Garcia', position: 'Backend Developer', status: 'Violated', score: '-', proctoring: 'terminated', date: 'Dec 13, 3:00 PM', statusColor: 'red' }
  ];

  const aiInsights = [
    { 
      text: dashboardStats?.pendingReview > 0 
        ? `You have ${dashboardStats.pendingReview} candidates pending review` 
        : 'All interviews reviewed! Great job! 🎉', 
      type: dashboardStats?.pendingReview > 5 ? 'warning' : 'success', 
      action: 'Review Now' 
    },
    { 
      text: dashboardStats?.shortlisted > 0 
        ? `${dashboardStats.shortlisted} high-scoring candidates available` 
        : 'No shortlisted candidates yet', 
      type: 'success', 
      action: 'View Candidates' 
    },
    { 
      text: dashboardStats?.flagged > 0 
        ? `⚠️ ${dashboardStats.flagged} interviews flagged for review` 
        : '✅ No flagged interviews - all clean!', 
      type: dashboardStats?.flagged > 0 ? 'warning' : 'success', 
      action: 'View Details' 
    }
  ];

  const weekSchedule = [
    { day: 'MON', date: '16', count: 5 },
    { day: 'TUE', date: '17', count: 8 },
    { day: 'WED', date: '18', count: 3, today: true },
    { day: 'THU', date: '19', count: 6 },
    { day: 'FRI', date: '20', count: 4 }
  ];

  if (loading) return <div className="loading-screen">Loading...</div>;
  if (!profile) return null;

  // Check access
  const isSubscribed = profile.subscriptionPlan && profile.subscriptionPlan !== 'none';
  const isVerified = profile.verified;
  const canAccess = isSubscribed && isVerified;

  if (!canAccess) {
    return (
      <div className="access-denied">
        <div className="access-card">
          <h2>Access Restricted</h2>
          {!isSubscribed && <p>Please subscribe to access the dashboard</p>}
          {isSubscribed && !isVerified && <p>Your account is awaiting admin verification</p>}
          <button onClick={handleLogout}>Logout</button>
        </div>
      </div>
    );
  }

  return (
    <div className="recruiter-dashboard-modern">
      {/* Top Navigation */}
      <nav className="top-nav">
        <div className="nav-content">
          <div className="nav-left">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="menu-btn lg-hidden">
              <Menu size={24} />
            </button>
            <div className="logo-section">
              <div className="logo-icon">
                <Video size={24} />
              </div>
              <div className="logo-text">
                <h1>InterviewAI</h1>
                <p>Smart Recruitment Platform</p>
              </div>
            </div>
            <div className="nav-links">
              <a href="#" className="active">Dashboard</a>
              <a href="#">Interviews</a>
              <a href="#">Candidates</a>
              <a href="#">Analytics</a>
            </div>
          </div>
          <div className="nav-right">
            <div className="search-box">
              <Search size={16} />
              <input type="text" placeholder="Search candidates, interviews..." />
            </div>
            <button className="notif-btn">
              <Bell size={20} />
              {notifications > 0 && <span className="badge">{notifications}</span>}
            </button>
            <div className="user-menu">
              <div className="user-info">
                <p className="user-name">{profile.name}</p>
                <p className="user-role">{profile.companyName || 'Recruiter'}</p>
              </div>
              <div className="user-avatar">{profile.name?.charAt(0)}</div>
            </div>
          </div>
        </div>
      </nav>

      <div className="dashboard-layout">
        {/* Sidebar */}
        <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
          <button onClick={() => setSidebarOpen(false)} className="close-btn">
            <X size={24} />
          </button>
          
          <div className="sidebar-content">
            <div className="menu-section">
              <p className="menu-label">Main Menu</p>
              <nav className="menu-nav">
                <a 
                  href="#" 
                  className={`menu-item ${activeView === 'dashboard' ? 'active' : ''}`}
                  onClick={(e) => { e.preventDefault(); setActiveView('dashboard'); }}
                >
                  <BarChart3 size={20} />
                  Dashboard
                </a>
                <a 
                  href="#" 
                  className={`menu-item ${activeView === 'live' ? 'active' : ''}`}
                  onClick={(e) => { e.preventDefault(); setActiveView('live'); }}
                >
                  <Video size={20} />
                  🔴 Live Interviews
                </a>
                <a 
                  href="#" 
                  className={`menu-item ${activeView === 'applications' ? 'active' : ''}`}
                  onClick={(e) => { e.preventDefault(); setActiveView('applications'); }}
                >
                  <Users size={20} />
                  Applications
                </a>
                <a 
                  href="#" 
                  className={`menu-item ${activeView === 'interviews' ? 'active' : ''}`}
                  onClick={(e) => { e.preventDefault(); setActiveView('interviews'); }}
                >
                  <FileText size={20} />
                  All Interviews
                </a>
                <a 
                  href="#" 
                  className={`menu-item ${activeView === 'ai-reports' ? 'active' : ''}`}
                  onClick={(e) => { e.preventDefault(); setActiveView('ai-reports'); }}
                >
                  <Brain size={20} />
                  AI Evaluations
                </a>
                <a href="#" className="menu-item">
                  <AlertTriangle size={20} />
                  Proctoring Center
                </a>
              </nav>
            </div>

            <div className="menu-section">
              <p className="menu-label">Management</p>
              <nav className="menu-nav">
                <a href="#" className="menu-item">
                  <Calendar size={20} />
                  Schedule
                </a>
                <a href="#" className="menu-item">
                  <Settings size={20} />
                  Settings
                </a>
              </nav>
            </div>

            <div className="plan-card">
              <div className="plan-header">
                <span className="plan-badge">{profile.subscriptionPlan} Plan</span>
                <span className="plan-days">Active</span>
              </div>
              <div className="plan-progress">
                <div className="progress-bar" style={{ width: '60%' }}></div>
              </div>
              <p className="plan-usage">{dashboardStats?.total || 0} interviews conducted</p>
              <button className="upgrade-btn" onClick={() => navigate('/recruiter/subscription')}>
                Manage Plan
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="main-content">
          {/* Welcome Header */}
          <div className="welcome-section">
            <div>
              <h2>Welcome back, {profile.name}! 👋</h2>
              <p>Here's what's happening with your interviews today</p>
            </div>
            {loadingStats && (
              <div className="refresh-indicator">
                <div className="spinner"></div>
                <span>Refreshing data...</span>
              </div>
            )}
          </div>

          {/* Stats Grid */}
          <div className="stats-grid">
            {stats.map((stat, idx) => (
              <div key={idx} className="stat-card">
                <div className="stat-header">
                  <div className={`stat-icon ${stat.color}`}>
                    <stat.icon size={24} />
                  </div>
                  <span className="stat-change">{stat.change}</span>
                </div>
                <h3 className="stat-value">{stat.value}</h3>
                <p className="stat-label">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="quick-actions">
            <button className="action-btn primary" onClick={() => setShowCreateModal(true)}>
              <Plus size={20} />
              Create Interview
            </button>
            <button className="action-btn" onClick={() => setActiveView('applications')}>
              <Users size={20} />
              View Applications
            </button>
            <button className="action-btn" onClick={() => setActiveView('ai-reports')}>
              <Brain size={20} />
              AI Evaluations
            </button>
            <button className="action-btn" onClick={() => setActiveView('interviews')}>
              <FileText size={20} />
              My Interviews
            </button>
            <button className="action-btn" onClick={() => setActiveView('dashboard')}>
              <BarChart3 size={20} />
              Dashboard
            </button>
          </div>

          {/* Conditional Content */}
          {activeView === 'dashboard' ? (
            <>
              <div className="content-grid">
            {/* Live Interviews */}
            <div className="live-section">
              <div className="section-card">
                <div className="section-header live">
                  <div className="header-left">
                    <div className="live-indicator"></div>
                    <h3>Live Interviews</h3>
                    <span className="count-badge">{liveInterviewsData.length} in progress</span>
                  </div>
                </div>
                <div className="section-content">
                  {liveInterviewsData.length === 0 ? (
                    <div className="empty-state">
                      <Video size={48} style={{ opacity: 0.3 }} />
                      <p>No live interviews at the moment</p>
                      <button className="action-btn primary" onClick={() => setShowCreateModal(true)}>
                        <Plus size={16} /> Create Interview
                      </button>
                    </div>
                  ) : (
                    liveInterviewsData.map((interview, idx) => (
                      <div key={idx} className="interview-card">
                        <div className="interview-header">
                          <div>
                            <h4>{interview.name}</h4>
                            <p>{interview.position}</p>
                          </div>
                          <span className={`status-badge ${interview.status}`}>
                            {interview.status === 'clean' ? (
                              <><CheckCircle size={14} /> No Issues</>
                            ) : interview.status === 'warning' ? (
                              <><AlertTriangle size={14} /> Minor Issues</>
                            ) : (
                              <><AlertTriangle size={14} /> Flagged</>
                            )}
                          </span>
                        </div>
                        <div className="interview-progress">
                          <div className="progress-info">
                            <span>⏱️ {interview.duration}</span>
                            <span>{interview.progress}%</span>
                          </div>
                          <div className="progress-track">
                            <div className="progress-fill" style={{ width: `${interview.progress}%` }}></div>
                          </div>
                        </div>
                        <div className="interview-actions">
                          <button 
                            className="view-btn"
                            onClick={() => {
                              setActiveView('live');
                            }}
                          >
                            <Eye size={16} /> View Live
                          </button>
                          <button className="send-btn">
                            <Send size={16} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="side-sections">
              {/* Week Schedule */}
              <div className="section-card">
                <h3 className="section-title">
                  <Calendar size={20} />
                  This Week's Schedule
                </h3>
                <div className="schedule-list">
                  {weekSchedule.map((day, idx) => (
                    <div key={idx} className={`schedule-item ${day.today ? 'today' : ''}`}>
                      <div className="schedule-day">
                        <p className="day-name">{day.day}</p>
                        <p className="day-date">{day.date}</p>
                        {day.today && <span className="today-badge">Today</span>}
                      </div>
                      <span className="schedule-count">{day.count} interviews</span>
                    </div>
                  ))}
                </div>
                <button className="view-calendar-btn">View Full Calendar →</button>
              </div>

              {/* AI Insights */}
              <div className="section-card ai-card">
                <h3 className="section-title">🤖 AI Recommendations</h3>
                <div className="insights-list">
                  {aiInsights.map((insight, idx) => (
                    <div key={idx} className="insight-item">
                      <p>{insight.text}</p>
                      <button>{insight.action} →</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Interviews Table */}
          <div className="section-card">
            <div className="table-header">
              <h3>Recent Interviews</h3>
              <div className="table-actions">
                <button className="table-btn">
                  <Filter size={16} />
                  Filter
                </button>
                <button className="table-btn">
                  <Download size={16} />
                  Export
                </button>
              </div>
            </div>
            <div className="table-wrapper">
              <table className="interviews-table">
                <thead>
                  <tr>
                    <th>Candidate</th>
                    <th>Position</th>
                    <th>Status</th>
                    <th>Score</th>
                    <th>Proctoring</th>
                    <th>Scheduled</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recentInterviewsData.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '3rem' }}>
                        <div className="empty-state">
                          <FileText size={48} style={{ opacity: 0.3 }} />
                          <p>No interviews yet</p>
                          <button className="action-btn primary" onClick={() => setShowCreateModal(true)}>
                            <Plus size={16} /> Create Your First Interview
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    recentInterviewsData.map((interview, idx) => (
                      <tr key={idx}>
                        <td>
                          <div className="candidate-cell">
                            <div className="candidate-avatar">
                              {interview.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <span>{interview.name}</span>
                          </div>
                        </td>
                        <td>{interview.position}</td>
                        <td>
                          <span className={`table-status ${interview.statusColor}`}>
                            {interview.status}
                          </span>
                        </td>
                        <td className="score-cell">{interview.score}</td>
                        <td>
                          {interview.proctoring === 'clean' && <span className="proctoring-badge clean"><CheckCircle size={14} /> Clean</span>}
                          {interview.proctoring === 'warning' && <span className="proctoring-badge warning"><AlertTriangle size={14} /> Warning</span>}
                          {interview.proctoring === 'flagged' && <span className="proctoring-badge flagged"><AlertTriangle size={14} /> Flagged</span>}
                          {interview.proctoring === 'pending' && <span className="proctoring-badge none">Pending</span>}
                        </td>
                        <td>{interview.date}</td>
                        <td>
                          <button 
                            className="view-link"
                            onClick={() => {
                              // Navigate to interview details or live view
                              if (interview.interview.status === 'in-progress') {
                                setActiveView('live');
                              } else {
                                setActiveView('interviews');
                              }
                            }}
                          >
                            View →
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
            </>
          ) : activeView === 'applications' ? (
            <ApplicationManagement />
          ) : activeView === 'interviews' ? (
            <RecruiterInterviews />
          ) : activeView === 'live' ? (
            <LiveInterviewMonitor />
          ) : activeView === 'ai-reports' ? (
            <AIReports />
          ) : null}
        </main>
      </div>

      {/* Interview Creation Modal */}
      {showCreateModal && (
        <InterviewCreation
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            // Optionally refresh data
          }}
        />
      )}
    </div>
  );
}
