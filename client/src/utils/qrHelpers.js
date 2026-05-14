/**
 * qrHelpers.js
 * Utilities for QR code payload validation on the client side.
 */

import { ethers } from 'ethers'

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000'

/**
 * Parse and validate the QR code JSON payload.
 * Returns { valid, payload, error }
 */
export function parseQRPayload(raw) {
  try {
    const payload = JSON.parse(raw)

    if (!payload.sessionId || !payload.expiresAt || !payload.serverSignature) {
      return { valid: false, error: 'Invalid QR code format.' }
    }

    const now = Math.floor(Date.now() / 1000)
    if (now > payload.expiresAt) {
      return { valid: false, error: 'QR code has expired. Ask your professor to regenerate it.' }
    }

    return { valid: true, payload, error: null }
  } catch {
    return { valid: false, error: 'Could not read QR code.' }
  }
}

/**
 * Request a new QR code from the backend for a given session.
 */
export async function fetchQRCode(sessionId, professorAddress) {
  const res = await fetch(`${SERVER_URL}/api/sessions/qr-code`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ sessionId, professorAddress }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to generate QR code')
  }

  return res.json() // { qrData, expiresAt, payload }
}
