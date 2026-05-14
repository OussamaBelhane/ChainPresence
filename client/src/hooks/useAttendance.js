import { useState, useCallback } from 'react'
import { useContract } from './useContract.js'
import { useWeb3 } from '../context/Web3Context.jsx'
import { parseTxError } from '../utils/contractHelpers.js'

/**
 * Hook providing attendance-related contract actions and state.
 */
export function useAttendance() {
  const contract      = useContract()
  const { account }   = useWeb3()
  const [loading,  setLoading]  = useState(false)
  const [txHash,   setTxHash]   = useState(null)
  const [txStatus, setTxStatus] = useState(null) // 'pending' | 'mining' | 'confirmed' | 'error'
  const [error,    setError]    = useState(null)

  const resetTx = () => {
    setTxHash(null)
    setTxStatus(null)
    setError(null)
  }

  /**
   * Execute a contract write function with full tx lifecycle tracking.
   * @param {Function} txFn - async function that returns a transaction
   */
  const executeTx = useCallback(async (txFn) => {
    resetTx()
    setLoading(true)
    setTxStatus('pending')

    try {
      const tx = await txFn()
      setTxHash(tx.hash)
      setTxStatus('mining')

      await tx.wait()
      setTxStatus('confirmed')

      return tx
    } catch (err) {
      const message = parseTxError(err)
      setError(message)
      setTxStatus('error')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // ─── Student actions ───────────────────────────────────────────────────────
  const checkIn = useCallback(async (sessionId, signature) => {
    return executeTx(() => contract.checkIn(sessionId, signature || '0x'))
  }, [contract, executeTx])

  // ─── Professor actions ─────────────────────────────────────────────────────
  const openSession = useCallback(async (courseId, courseName, duration, locationHash) => {
    return executeTx(() => contract.openSession(courseId, courseName, duration, locationHash || ''))
  }, [contract, executeTx])

  const closeSession = useCallback(async (sessionId) => {
    return executeTx(() => contract.closeSession(sessionId))
  }, [contract, executeTx])

  // ─── Admin actions ─────────────────────────────────────────────────────────
  const registerStudent = useCallback(async (wallet, name) => {
    return executeTx(() => contract.registerStudent(wallet, name))
  }, [contract, executeTx])

  const registerProfessor = useCallback(async (wallet, name) => {
    return executeTx(() => contract.registerProfessor(wallet, name))
  }, [contract, executeTx])

  const removeUser = useCallback(async (wallet) => {
    return executeTx(() => contract.removeUser(wallet))
  }, [contract, executeTx])

  const changeUserRole = useCallback(async (wallet, newRole) => {
    return executeTx(() => contract.changeUserRole(wallet, newRole))
  }, [contract, executeTx])

  return {
    loading, txHash, txStatus, error, resetTx,
    checkIn, openSession, closeSession,
    registerStudent, registerProfessor, removeUser, changeUserRole,
  }
}
