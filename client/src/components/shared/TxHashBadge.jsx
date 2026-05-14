import React, { useState } from 'react'
import { truncateTxHash, copyToClipboard } from '../../utils/formatters.js'

export default function TxHashBadge({ hash, label = null }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    const ok = await copyToClipboard(hash)
    if (ok) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const explorerUrl = `http://localhost:7546` // local Ganache — no real explorer

  if (!hash) return null

  return (
    <button
      onClick={handleCopy}
      title={hash}
      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-mono transition-all duration-150"
      style={{
        background: 'rgba(0,229,179,0.08)',
        color: 'var(--accent)',
        border: '1px solid rgba(0,229,179,0.18)',
      }}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="20 12 20 22 4 22 4 12" />
        <rect x="8" y="2" width="8" height="6" rx="1" />
      </svg>
      {label || truncateTxHash(hash)}
      {copied && <span style={{ color: 'var(--text-secondary)', fontFamily: 'system-ui' }}>✓</span>}
    </button>
  )
}
