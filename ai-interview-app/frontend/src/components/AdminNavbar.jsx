import React from 'react';
import './AdminNavbar.css';

export default function AdminNavbar({ onLogout, adminName }) {
  return (
    <nav className="admin-navbar">
      <div className="navbar-logo">🛡️ Admin Panel</div>
      <div className="navbar-center">
        <span className="admin-welcome">Welcome, {adminName}</span>
      </div>
      <button className="navbar-logout" onClick={onLogout}>Logout</button>
    </nav>
  );
}
