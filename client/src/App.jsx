import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useWeb3 } from './context/Web3Context.jsx'
import AppShell from './components/layout/AppShell.jsx'
import LoadingSpinner from './components/shared/LoadingSpinner.jsx'

// Pages
import LoginPage from './pages/LoginPage.jsx'
import ProfileSetup from './pages/ProfileSetup.jsx'
import StudentView from './pages/StudentView.jsx'
import ProfessorView from './pages/ProfessorView.jsx'
import AdminView from './pages/AdminView.jsx'

/**
 * AuthGuard - Protects routes by checking connection AND session status.
 */
function AuthGuard({ children, allowedRoles = [] }) {
  const { isConnected, isLoggedIn, role, loading } = useWeb3()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A] relative overflow-hidden">
        <div className="bg-grid opacity-20" />
        <div className="bg-noise" />
        <LoadingSpinner />
      </div>
    )
  }
  
  // If not connected OR not logged in via SIWE, go to login
  if (!isConnected || !isLoggedIn) {
    return <Navigate to="/login" replace />
  }
  
  // If user has no role but is logged in, they need to request access
  // ONLY if loading is finished
  if (isLoggedIn && (!role || role === 'UNKNOWN') && window.location.pathname !== '/setup') {
    return <Navigate to="/setup" replace />
  }

  // Role-based access control
  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />
  }

  return <AppShell>{children}</AppShell>
}

export default function App() {
  const { role, isConnected, isLoggedIn, loading } = useWeb3()

  // Wait for initial context loading to avoid flash redirects
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A] relative overflow-hidden">
        <div className="bg-grid opacity-20" />
        <div className="bg-noise" />
        <LoadingSpinner />
      </div>
    )
  }

  // Logic: Are we "fully authenticated"?
  const isAuthenticated = isConnected && isLoggedIn

  return (
    <Routes>
      {/* Public / Auth */}
      <Route 
        path="/login" 
        element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />} 
      />
      
      <Route 
        path="/setup" 
        element={isAuthenticated ? <ProfileSetup /> : <Navigate to="/login" replace />} 
      />

      {/* Protected Dashboards */}
      <Route path="/student/*" element={<AuthGuard allowedRoles={['STUDENT']}><StudentView /></AuthGuard>} />
      <Route path="/professor/*" element={<AuthGuard allowedRoles={['PROFESSOR']}><ProfessorView /></AuthGuard>} />
      <Route path="/admin/*" element={<AuthGuard allowedRoles={['ADMIN']}><AdminView /></AuthGuard>} />

      {/* Root Redirection */}
      <Route path="/" element={
        !isAuthenticated ? <Navigate to="/login" replace /> :
        role === 'STUDENT' ? <Navigate to="/student" replace /> :
        role === 'PROFESSOR' ? <Navigate to="/professor" replace /> :
        role === 'ADMIN' ? <Navigate to="/admin" replace /> :
        <Navigate to="/setup" replace />
      } />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
