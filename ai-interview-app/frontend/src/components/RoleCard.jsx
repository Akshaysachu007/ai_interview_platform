import React from 'react'

export default function RoleCard({ role, subtitle, selected, onClick, icon }) {
  return (
    <button
      className={`role-card ${selected ? 'selected' : ''}`}
      onClick={() => onClick(role)}
      aria-pressed={selected}
    >
      <div className="role-icon" aria-hidden>
        {icon}
      </div>
      <div className="role-info">
        <div className="role-name">{role}</div>
        {subtitle && <div className="role-sub">{subtitle}</div>}
      </div>
    </button>
  )
}
