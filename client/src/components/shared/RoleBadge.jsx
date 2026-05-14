import React from 'react'

const roleConfig = {
  STUDENT:   { label: 'Student',   cls: 'badge-student' },
  PROFESSOR: { label: 'Professor', cls: 'badge-professor' },
  ADMIN:     { label: 'Admin',     cls: 'badge-admin' },
}

export default function RoleBadge({ role }) {
  const cfg = roleConfig[role] || { label: role || 'Unknown', cls: '' }
  return <span className={`badge ${cfg.cls}`}>{cfg.label}</span>
}
