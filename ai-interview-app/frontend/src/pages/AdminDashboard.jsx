import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';
import AdminNavbar from '../components/AdminNavbar';
import RecruiterManagement from '../components/RecruiterManagement';
import PricingSettings from '../components/PricingSettings';
import SystemLogs from '../components/SystemLogs';
import DashboardStats from '../components/DashboardStats';

const API_URL = import.meta.env.VITE_API_URL;

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem('adminToken');
  });
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/admin');
    }
  }, [isAuthenticated, navigate]);

  const adminName = localStorage.getItem('adminName') || 'Admin';
  const adminEmail = localStorage.getItem('adminEmail') || '';

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminName');
    localStorage.removeItem('adminEmail');
    setIsAuthenticated(false);
    navigate('/admin');
  };

  if (!isAuthenticated) return null;

  return (
    <div className="admin-dashboard">
      <AdminNavbar onLogout={handleLogout} adminName={adminName} />
      
      <div className="dashboard-content">
        <div className="dashboard-header">
          <h1>Admin Dashboard</h1>
          <p>Welcome back, {adminName}</p>
        </div>

        <div className="dashboard-tabs">
          <button 
            className={activeTab === 'dashboard' ? 'active' : ''}
            onClick={() => setActiveTab('dashboard')}
          >
            📊 Overview
          </button>
          <button 
            className={activeTab === 'recruiters' ? 'active' : ''}
            onClick={() => setActiveTab('recruiters')}
          >
            👔 Recruiters
          </button>
          <button 
            className={activeTab === 'pricing' ? 'active' : ''}
            onClick={() => setActiveTab('pricing')}
          >
            💰 Pricing
          </button>
          <button 
            className={activeTab === 'logs' ? 'active' : ''}
            onClick={() => setActiveTab('logs')}
          >
            📋 Logs
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'dashboard' && <DashboardStats />}
          {activeTab === 'recruiters' && <RecruiterManagement />}
          {activeTab === 'pricing' && <PricingSettings />}
          {activeTab === 'logs' && <SystemLogs />}
        </div>
      </div>
    </div>
  );
}
