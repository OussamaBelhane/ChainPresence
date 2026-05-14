import React from 'react'
import { formatTimestamp, formatCountdown } from '../../utils/formatters.js'

export default function SessionCard({ session, onCheckIn }) {
  const now       = Math.floor(Date.now() / 1000)
  const expiresAt = session.openedAt + session.duration * 60
  const remaining = Math.max(0, expiresAt - now)

  return (
    <div
      className="card animate-slide-up"
      style={{ border: '1px solid var(--border-accent)' }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="badge badge-open">● LIVE</span>
            <span className="text-xs px-2 py-0.5 rounded-full font-mono"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
              #{session.id}
            </span>
          </div>
          <h4 className="text-base font-semibold mt-1" style={{ fontFamily: 'Syne, sans-serif' }}>
            {session.courseName}
          </h4>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Course ID: {session.courseId}
          </p>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Opened: {formatTimestamp(session.openedAt)}
          </p>
          {session.locationHash && (
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              📍 {session.locationHash}
            </p>
          )}
        </div>

        <div className="flex flex-col items-start sm:items-end gap-3">
          {/* Countdown */}
          <div className="text-center">
            <p
              className="text-2xl font-bold font-mono"
              style={{ color: remaining < 120 ? 'var(--danger)' : 'var(--accent)' }}
            >
              {formatCountdown(remaining)}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>remaining</p>
          </div>

          {onCheckIn && (
            <button
              id={`checkin-btn-${session.id}`}
              onClick={onCheckIn}
              className="btn-primary text-sm px-5 py-2.5"
              disabled={remaining === 0}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
              </svg>
              Scan QR & Check In
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
