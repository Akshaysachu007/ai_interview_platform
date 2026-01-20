import React from 'react';
import './RecruiterNavbar.css';

export default function RecruiterNavbar({ onLogout }) {
  return (
    <nav className="recruiter-navbar">
      <div className="navbar-logo">AI Interview</div>
      <ul className="navbar-links">
        <li><a href="/recruiter/dashboard">Dashboard</a></li>
        <li><a href="#profile">Profile</a></li>
        <li><a href="#interviews">Interviews</a></li>
        <li><a href="#settings">Settings</a></li>
      </ul>
      <button className="navbar-logout" onClick={onLogout}>Logout</button>
    </nav>
  );
}
