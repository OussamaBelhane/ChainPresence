import React, { createContext, useContext } from 'react'
import { useWeb3 } from './Web3Context.jsx'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const { role, account, userName, isConnected } = useWeb3()

  const isStudent   = role === 'STUDENT'
  const isProfessor = role === 'PROFESSOR'
  const isAdmin     = role === 'ADMIN'

  return (
    <AuthContext.Provider value={{ role, account, userName, isConnected, isStudent, isProfessor, isAdmin }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
