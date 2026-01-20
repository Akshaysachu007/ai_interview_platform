import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import RoleCard from '../components/RoleCard'

const ICONS = {
  Admin: (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L2 7l10 5 10-5-10-5z" fill="#4F46E5" />
      <path d="M2 17l10 5 10-5" fill="#6366F1" />
      <path d="M2 7v10c0 .6.3 1.1.8 1.4L12 21l9.2-2.6c.5-.3.8-.8.8-1.4V7" fill="#A78BFA" />
    </svg>
  ),
  Candidate: (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="8" r="3" fill="#06B6D4" />
      <path d="M4 20c0-4 4-6 8-6s8 2 8 6" fill="#99F6E4" />
    </svg>
  ),
  Recruiter: (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="7" width="18" height="12" rx="2" fill="#F59E0B" />
      <path d="M7 7V5a3 3 0 0 1 3-3h4a3 3 0 0 1 3 3v2" fill="#FDBA74" />
    </svg>
  ),
}

export default function LoginPage() {
  const [selected, setSelected] = useState('Admin')
  const navigate = useNavigate()

  return (
  <main className="login-page">
    <div className="login-container">
      <section className="login-card">
        <h1 className="title">Choose your role</h1>
        <div className="roles-grid">
          {['Admin', 'Candidate', 'Recruiter'].map((r) => (
            <RoleCard
              key={r}
              role={r}
              subtitle={r === selected ? 'Selected' : ''}
              selected={r === selected}
              onClick={(role) => setSelected(role)}
              icon={ICONS[r]}
            />
          ))}
        </div>

        <div className="actions">
          <button
            className="primary"
            onClick={() => navigate(`/${selected.toLowerCase()}`)}
          >
            Continue as {selected}
          </button>
        </div>
      </section>
    </div> 
  </main>
);
}
