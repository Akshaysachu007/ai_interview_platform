import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Brain,
  CheckCircle,
  Clock,
  Eye,
  FileText,
  LogOut,
  Play,
  Plus,
  Users,
  Video
} from 'lucide-react';
import InterviewCreation from '../components/InterviewCreation';
import ApplicationManagement from '../components/ApplicationManagement';
import RecruiterInterviews from '../components/RecruiterInterviews';
import LiveInterviewMonitor from '../components/LiveInterviewMonitor';
import AIReports from '../components/AIReports';
import RecruiterReports from '../components/RecruiterReports';
import './RecruiterDashboard.css';

const API_URL = import.meta.env.VITE_API_URL;

export default function RecruiterDashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeView, setActiveView] = useState('dashboard');
  const [dashboardStats, setDashboardStats] = useState(null);
  const [recentInterviews, setRecentInterviews] = useState([]);
  const [liveInterviews, setLiveInterviews] = useState([]);
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('recruiterToken');
    if (!token) {
      navigate('/recruiter');
      return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');
    const planType = urlParams.get('plan');

    if (sessionId && planType) {
      verifyPayment(sessionId, planType);
    } else {
      fetchProfile();
    }
  }, [navigate]);

  useEffect(() => {
    if (!profile || activeView !== 'dashboard') return undefined;

    const interval = setInterval(() => {
      fetchDashboardData();
    }, 30000);

    return () => clearInterval(interval);
  }, [profile, activeView]);

  const verifyPayment = async (sessionId, planType) => {
    try {
      const token = localStorage.getItem('recruiterToken');
      const res = await fetch(`${API_URL}/payment/verify-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ sessionId, planType })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Payment verification failed');
      }

      setProfile(data.recruiter);
      window.history.replaceState({}, document.title, '/recruiter/dashboard');
      fetchDashboardData();
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
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Server error' }));
        if (res.status === 401) {
          localStorage.removeItem('recruiterToken');
          navigate('/recruiter');
          return;
        }
        throw new Error(errorData.message || 'Failed to fetch profile');
      }

      const data = await res.json();
      setProfile(data);

      if (!data.subscriptionPlan || data.subscriptionPlan === 'none') {
        navigate('/recruiter/subscription');
        return;
      }

      if (data.subscriptionExpiry && new Date(data.subscriptionExpiry) < new Date()) {
        alert('Your subscription has expired. Please renew to continue.');
        navigate('/recruiter/subscription');
        return;
      }

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

      const interviewsRes = await fetch(`${API_URL}/recruiter/interviews`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!interviewsRes.ok) return;

      const interviews = await interviewsRes.json();
      const totalInterviews = interviews.length;
      const activeInterviews = interviews.filter((i) => i.status === 'in-progress').length;
      const completedToday = interviews.filter((i) => {
        if (i.status !== 'completed') return false;
        const today = new Date().toDateString();
        const completedDate = new Date(i.completedAt || i.updatedAt).toDateString();
        return today === completedDate;
      }).length;
      const pendingReview = interviews.filter((i) => i.status === 'completed' && !i.reviewed).length;
      const shortlisted = interviews.filter(
        (i) => i.score >= 70 && i.status === 'completed' && !i.flagged
      ).length;
      const flaggedCount = interviews.filter((i) => i.flagged).length;

      setDashboardStats({
        total: totalInterviews,
        active: activeInterviews,
        completedToday,
        pendingReview,
        shortlisted,
        flagged: flaggedCount
      });

      const sorted = [...interviews].sort(
        (a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)
      );
      setRecentInterviews(sorted.slice(0, 10));

      const live = interviews.filter((i) => i.status === 'in-progress');
      setLiveInterviews(live);

      if (live.length > 0) {
        pollLiveInterviews(live.map((i) => i._id));
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  const pollLiveInterviews = async (interviewIds) => {
    try {
      const token = localStorage.getItem('recruiterToken');
      const promises = interviewIds.map((id) =>
        fetch(`${API_URL}/interview/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        }).then((res) => (res.ok ? res.json() : null))
      );

      const results = await Promise.all(promises);
      setLiveInterviews(results.filter((r) => r !== null));
    } catch (err) {
      console.error('Error polling live interviews:', err);
    }
  };

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
    }

    if (d.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    }

    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'in-progress':
        return 'blue';
      case 'completed':
        return 'green';
      case 'pending':
        return 'yellow';
      case 'scheduled':
        return 'gray';
      default:
        return 'gray';
    }
  };

  const getProctoringBadge = (interview) => {
    if (interview.flagged) return 'flagged';
    if (interview.status !== 'completed') return 'pending';

    const totalViolations =
      (interview.malpractices?.tabSwitches || 0) +
      (interview.malpractices?.faceDetections?.filter((f) => f.facesDetected !== 1).length || 0);

    if (totalViolations === 0) return 'clean';
    if (totalViolations > 5) return 'flagged';
    return 'warning';
  };

  const calculateProgress = (interview) => {
    if (!interview.questions || interview.questions.length === 0) return 0;
    const answeredCount = interview.questions.filter((q) => q.answer).length;
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

  const navItems = [
    { key: 'dashboard', label: 'Overview', icon: BarChart3 },
    { key: 'applications', label: 'Applications', icon: Users },
    { key: 'interviews', label: 'Interviews', icon: FileText },
    { key: 'live', label: 'Live Monitor', icon: Video },
    { key: 'ai-reports', label: 'AI Evaluations', icon: Brain },
    { key: 'reports', label: 'Reports', icon: Activity }
  ];

  const stats = useMemo(() => {
    if (!dashboardStats) {
      return [
        { label: 'Live Interviews', value: '...', helper: 'Loading', icon: Play, color: 'blue' },
        { label: 'Pending Reviews', value: '...', helper: 'Loading', icon: Clock, color: 'orange' },
        { label: 'Completed Today', value: '...', helper: 'Loading', icon: CheckCircle, color: 'green' },
        { label: 'Flagged Cases', value: '...', helper: 'Loading', icon: AlertTriangle, color: 'red' }
      ];
    }

    return [
      {
        label: 'Live Interviews',
        value: dashboardStats.active.toString(),
        helper: dashboardStats.active > 0 ? 'Monitoring in progress' : 'No live sessions',
        icon: Play,
        color: 'blue'
      },
      {
        label: 'Pending Reviews',
        value: dashboardStats.pendingReview.toString(),
        helper: dashboardStats.pendingReview > 0 ? 'Action required' : 'Queue clear',
        icon: Clock,
        color: 'orange'
      },
      {
        label: 'Completed Today',
        value: dashboardStats.completedToday.toString(),
        helper: `${dashboardStats.total} total interviews`,
        icon: CheckCircle,
        color: 'green'
      },
      {
        label: 'Flagged Cases',
        value: dashboardStats.flagged.toString(),
        helper: `${dashboardStats.shortlisted} shortlisted candidates`,
        icon: AlertTriangle,
        color: 'red'
      }
    ];
  }, [dashboardStats]);

  const liveInterviewsData = liveInterviews.map((interview) => ({
    id: interview._id,
    name: interview.candidateName || 'Unknown Candidate',
    position: `${interview.stream} - ${interview.difficulty}`,
    duration: calculateDuration(interview),
    status: getProctoringBadge(interview),
    progress: calculateProgress(interview),
    interview
  }));

  const recentInterviewsData = recentInterviews.map((interview) => {
    const proctoringBadge = getProctoringBadge(interview);
    return {
      id: interview._id,
      name: interview.candidateName || 'Unknown Candidate',
      position: `${interview.stream} - ${interview.difficulty}`,
      status:
        interview.status === 'in-progress'
          ? 'In Progress'
          : interview.status === 'completed'
            ? 'Completed'
            : interview.status === 'pending'
              ? 'Pending'
              : 'Scheduled',
      score: interview.score ? `${interview.score}/100` : '-',
      proctoring: proctoringBadge,
      date: formatDateTime(interview.updatedAt || interview.createdAt),
      statusColor: getStatusColor(interview.status),
      interview
    };
  });

  const priorityInsights = [
    {
      title: 'Pending Reviews',
      text:
        dashboardStats?.pendingReview > 0
          ? `${dashboardStats.pendingReview} interviews are awaiting review.`
          : 'All completed interviews are reviewed.',
      actionLabel: 'Open Applications',
      action: () => setActiveView('applications')
    },
    {
      title: 'High Potential Candidates',
      text:
        dashboardStats?.shortlisted > 0
          ? `${dashboardStats.shortlisted} candidates crossed the shortlist score threshold.`
          : 'No shortlisted candidates yet. Keep evaluating completed interviews.',
      actionLabel: 'Open Reports',
      action: () => setActiveView('reports')
    },
    {
      title: 'Risk Alerts',
      text:
        dashboardStats?.flagged > 0
          ? `${dashboardStats.flagged} interviews were flagged by proctoring checks.`
          : 'No proctoring alerts detected in recent activity.',
      actionLabel: 'Open Live Monitor',
      action: () => setActiveView('live')
    }
  ];

  if (loading) return <div className="loading-screen">Loading dashboard...</div>;
  if (!profile) return null;

  const isSubscribed = profile.subscriptionPlan && profile.subscriptionPlan !== 'none';
  const isVerified = profile.verified;
  const canAccess = isSubscribed && isVerified;

  if (!canAccess) {
    return (
      <div className="access-denied">
        <div className="access-card">
          <h2>Access Restricted</h2>
          {!isSubscribed && <p>Please subscribe to access the recruiter dashboard.</p>}
          {isSubscribed && !isVerified && <p>Your account is awaiting admin verification.</p>}
          <button onClick={handleLogout}>Logout</button>
        </div>
      </div>
    );
  }

  return (
    <div className="recruiter-dashboard-pro">
      <header className="dashboard-header">
        <div className="header-left">
          <p className="header-eyebrow">Recruiter Workspace</p>
          <h1>{profile.companyName || 'Recruiter Dashboard'}</h1>
          <p className="header-subtitle">Track interview pipeline, review candidates, and make faster hiring decisions.</p>
        </div>

        <div className="header-right">
          <div className="profile-chip">
            <div className="profile-avatar">{profile.name?.charAt(0) || 'R'}</div>
            <div>
              <p className="profile-name">{profile.name}</p>
              <p className="profile-role">{profile.subscriptionPlan || 'Plan'} Plan</p>
            </div>
          </div>
          <button className="secondary-btn" onClick={() => navigate('/recruiter/subscription')}>
            Manage Plan
          </button>
          <button className="danger-btn" onClick={handleLogout}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </header>

      <section className="dashboard-tabs" aria-label="Recruiter dashboard views">
        {navItems.map((item) => (
          <button
            key={item.key}
            type="button"
            className={activeView === item.key ? 'active' : ''}
            onClick={() => setActiveView(item.key)}
          >
            <item.icon size={16} /> {item.label}
          </button>
        ))}
      </section>

      {activeView === 'dashboard' ? (
        <>
          <section className="stats-grid">
            {stats.map((stat) => (
              <article key={stat.label} className="stat-card">
                <div className={`stat-icon ${stat.color}`}>
                  <stat.icon size={20} />
                </div>
                <div>
                  <p className="stat-label">{stat.label}</p>
                  <h3 className="stat-value">{stat.value}</h3>
                  <p className="stat-helper">{stat.helper}</p>
                </div>
              </article>
            ))}
          </section>

          <section className="quick-actions">
            <button className="primary-btn" onClick={() => setShowCreateModal(true)}>
              <Plus size={16} /> Create Interview
            </button>
            <button className="secondary-btn" onClick={() => setActiveView('applications')}>
              <Users size={16} /> Review Applications
            </button>
            <button className="secondary-btn" onClick={() => setActiveView('live')}>
              <Video size={16} /> Open Live Monitor
            </button>
            <button className="secondary-btn" onClick={fetchDashboardData} disabled={loadingStats}>
              <Activity size={16} /> {loadingStats ? 'Refreshing...' : 'Refresh Data'}
            </button>
          </section>

          <section className="overview-grid">
            <article className="panel-card">
              <div className="panel-header">
                <h2>Live Assessments</h2>
                <span>{liveInterviewsData.length} active</span>
              </div>

              <div className="panel-body">
                {liveInterviewsData.length === 0 ? (
                  <div className="empty-state">
                    <Video size={42} />
                    <p>No live assessments at the moment.</p>
                    <button className="primary-btn" onClick={() => setShowCreateModal(true)}>
                      <Plus size={14} /> Create Interview
                    </button>
                  </div>
                ) : (
                  liveInterviewsData.map((interview) => (
                    <div key={interview.id} className="live-item">
                      <div>
                        <h4>{interview.name}</h4>
                        <p>{interview.position}</p>
                      </div>
                      <div className="live-meta">
                        <span>{interview.duration}</span>
                        <span>{interview.progress}% complete</span>
                      </div>
                      <div className="progress-track">
                        <span style={{ width: `${interview.progress}%` }} />
                      </div>
                      <button className="inline-link" onClick={() => setActiveView('live')}>
                        <Eye size={14} /> View Live Monitor
                      </button>
                    </div>
                  ))
                )}
              </div>
            </article>

            <article className="panel-card">
              <div className="panel-header">
                <h2>Priority Insights</h2>
                <span>AI Assisted</span>
              </div>

              <div className="insights-list">
                {priorityInsights.map((insight) => (
                  <div key={insight.title} className="insight-item">
                    <h4>{insight.title}</h4>
                    <p>{insight.text}</p>
                    <button className="inline-link" onClick={insight.action}>
                      {insight.actionLabel}
                    </button>
                  </div>
                ))}
              </div>
            </article>
          </section>

          <section className="panel-card table-panel">
            <div className="panel-header">
              <h2>Recent Interviews</h2>
              <span>Latest 10 records</span>
            </div>

            <div className="table-wrapper">
              <table className="interviews-table">
                <thead>
                  <tr>
                    <th>Candidate</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Score</th>
                    <th>Proctoring</th>
                    <th>Updated</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentInterviewsData.length === 0 ? (
                    <tr>
                      <td colSpan="7">
                        <div className="empty-state compact">
                          <FileText size={36} />
                          <p>No interview records yet.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    recentInterviewsData.map((interview) => (
                      <tr key={interview.id}>
                        <td>{interview.name}</td>
                        <td>{interview.position}</td>
                        <td>
                          <span className={`table-status ${interview.statusColor}`}>{interview.status}</span>
                        </td>
                        <td>{interview.score}</td>
                        <td>
                          <span className={`proctoring-badge ${interview.proctoring}`}>{interview.proctoring}</span>
                        </td>
                        <td>{interview.date}</td>
                        <td>
                          {interview.interview.status === 'completed' ? (
                            <button className="inline-link" onClick={() => navigate(`/interview/${interview.id}/report`)}>
                              View Report
                            </button>
                          ) : (
                            <button
                              className="inline-link"
                              onClick={() => {
                                if (interview.interview.status === 'in-progress') {
                                  setActiveView('live');
                                } else {
                                  setActiveView('interviews');
                                }
                              }}
                            >
                              Open
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : activeView === 'applications' ? (
        <ApplicationManagement />
      ) : activeView === 'interviews' ? (
        <RecruiterInterviews />
      ) : activeView === 'live' ? (
        <LiveInterviewMonitor />
      ) : activeView === 'ai-reports' ? (
        <AIReports />
      ) : activeView === 'reports' ? (
        <RecruiterReports />
      ) : null}

      {showCreateModal && (
        <InterviewCreation
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchDashboardData();
          }}
        />
      )}
    </div>
  );
}
