import React, { useState, useEffect } from 'react';
import './DashboardStats.css';

const API_URL = import.meta.env.VITE_API_URL;

export default function DashboardStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_URL}/admin/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setStats(data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading statistics...</div>;

  return (
    <div className="dashboard-stats">
      <h2>System Overview</h2>
      
      <div className="stats-grid">
        <div className="stat-card blue">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <h3>{stats?.totalCandidates || 0}</h3>
            <p>Total Candidates</p>
          </div>
        </div>
        
        <div className="stat-card purple">
          <div className="stat-icon">👔</div>
          <div className="stat-info">
            <h3>{stats?.totalRecruiters || 0}</h3>
            <p>Total Recruiters</p>
          </div>
        </div>
        
        <div className="stat-card green">
          <div className="stat-icon">✓</div>
          <div className="stat-info">
            <h3>{stats?.verifiedRecruiters || 0}</h3>
            <p>Verified Recruiters</p>
          </div>
        </div>
        
        <div className="stat-card orange">
          <div className="stat-icon">⏳</div>
          <div className="stat-info">
            <h3>{stats?.pendingRecruiters || 0}</h3>
            <p>Pending Verification</p>
          </div>
        </div>
        
        <div className="stat-card teal">
          <div className="stat-icon">💳</div>
          <div className="stat-info">
            <h3>{stats?.subscribedRecruiters || 0}</h3>
            <p>Subscribed Recruiters</p>
          </div>
        </div>
        
        <div className="stat-card pink">
          <div className="stat-icon">📅</div>
          <div className="stat-info">
            <h3>{stats?.weeklySubscribers || 0}</h3>
            <p>Weekly Plans</p>
          </div>
        </div>
        
        <div className="stat-card indigo">
          <div className="stat-icon">📆</div>
          <div className="stat-info">
            <h3>{stats?.monthlySubscribers || 0}</h3>
            <p>Monthly Plans</p>
          </div>
        </div>
        
        <div className="stat-card red">
          <div className="stat-icon">📝</div>
          <div className="stat-info">
            <h3>{stats?.recentLogs || 0}</h3>
            <p>Logs (24h)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
