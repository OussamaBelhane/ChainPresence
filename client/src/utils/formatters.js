/**
 * formatters.js
 * Display formatting utilities.
 */

/**
 * Truncate an Ethereum address: 0x1234...abcd
 */
export function truncateAddress(address, front = 6, back = 4) {
  if (!address) return ''
  return `${address.slice(0, front)}...${address.slice(-back)}`
}

/**
 * Truncate a transaction hash similarly.
 */
export function truncateTxHash(hash) {
  return truncateAddress(hash, 8, 6)
}

/**
 * Format a Unix timestamp to a localised date/time string.
 */
export function formatTimestamp(ts) {
  if (!ts) return '—'
  return new Date(ts * 1000).toLocaleString()
}

/**
 * Format a Unix timestamp to a short date only.
 */
export function formatDate(ts) {
  if (!ts) return '—'
  return new Date(ts * 1000).toLocaleDateString()
}

/**
 * Convert seconds remaining to MM:SS countdown string.
 */
export function formatCountdown(secondsRemaining) {
  if (secondsRemaining <= 0) return '00:00'
  const m = Math.floor(secondsRemaining / 60).toString().padStart(2, '0')
  const s = (secondsRemaining % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

/**
 * Copy text to clipboard.
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}
