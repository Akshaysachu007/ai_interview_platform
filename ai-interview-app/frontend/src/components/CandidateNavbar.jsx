import React from 'react';
import './CandidateNavbar.css';

export default function CandidateNavbar({ onLogout }) {
  return (
    <nav className="candidate-navbar">
      <div className="navbar-logo">AI Interview</div>
      <ul className="navbar-links">
        <li><a href="/candidate/dashboard">Dashboard</a></li>
        <li><a href="/candidate/interview">🎯 AI Interview</a></li>
        <li><a href="#profile">Profile</a></li>
        <li><a href="#interviews">Interviews</a></li>
        <li><a href="#settings">Settings</a></li>
      </ul>
      <button className="navbar-logout" onClick={onLogout}>Logout</button>
    </nav>
  );
}
