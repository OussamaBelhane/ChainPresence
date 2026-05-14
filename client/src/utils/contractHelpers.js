/**
 * contractHelpers.js
 * Utility functions for contract interaction and error parsing.
 */

/**
 * Convert raw Solidity / ethers.js errors to human-readable messages.
 */
export function parseTxError(err) {
  const raw = err?.reason || err?.data?.message || err?.message || ''

  if (raw.includes('user rejected')) return 'Transaction cancelled in MetaMask.'
  if (raw.includes('Already checked in')) return 'You have already checked in to this session.'
  if (raw.includes('Session is closed')) return 'This session is closed — check-in is not allowed.'
  if (raw.includes('Session has expired')) return 'This session has expired.'
  if (raw.includes('Session does not exist')) return 'Session not found on-chain.'
  if (raw.includes('Already a student')) return 'This wallet is already registered as a student.'
  if (raw.includes('Already a professor')) return 'This wallet is already registered as a professor.'
  if (raw.includes('Not session owner')) return 'Only the professor who opened this session can close it.'
  if (raw.includes('insufficient funds')) return 'Insufficient funds for gas.'
  if (raw.includes('AccessControl')) return 'Permission denied — your role cannot perform this action.'
  if (raw.includes('Invalid address')) return 'Please enter a valid Ethereum address.'
  if (raw.includes('Name required')) return 'A display name is required.'

  return raw || 'Transaction failed. Please try again.'
}

/**
 * Format a session struct from the contract into a plain object.
 */
export function formatSession(raw) {
  if (!raw) return null;
  return {
    id:           raw.id ? Number(raw.id) : 0,
    courseId:     raw.courseId || 'Unknown',
    courseName:   raw.courseName || 'Unknown',
    professor:    raw.professor || '',
    scheduledAt:  raw.scheduledAt ? Number(raw.scheduledAt) : 0,
    openedAt:     raw.openedAt ? Number(raw.openedAt) : 0,
    closedAt:     raw.closedAt ? Number(raw.closedAt) : 0,
    isOpen:       !!raw.isOpen,
    isActivated:  !!raw.isActivated,
    duration:     raw.duration ? Number(raw.duration) : 0,
    locationHash: raw.locationHash || '',
  }
}

/**
 * Fetch and format all sessions from the contract.
 */
export async function fetchAllSessions(contract) {
  const raw = await contract.getAllSessions()
  return raw.map(formatSession)
}

/**
 * Fetch active session IDs and resolve to full session objects.
 */
export async function fetchActiveSessions(contract) {
  const ids = await contract.getActiveSessions()
  return Promise.all(ids.map((id) => contract.getSession(id).then(formatSession)))
}

/**
 * Fetch all sessions created by a specific professor.
 */
export async function fetchProfessorSessions(contract, professorAddress) {
  const all = await fetchAllSessions(contract)
  return all.filter(s => s.professor.toLowerCase() === professorAddress.toLowerCase())
}
