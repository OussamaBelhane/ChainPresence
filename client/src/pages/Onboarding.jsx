import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWeb3 } from '../context/Web3Context.jsx'
import { useAttendance } from '../hooks/useAttendance.js'
import LoadingSpinner from '../components/shared/LoadingSpinner.jsx'
import toast from 'react-hot-toast'

export default function Onboarding() {
  const { account, refreshRole, contract } = useWeb3()
  const { loading: txLoading } = useAttendance()
  const navigate = useNavigate()

  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [role, setRole] = useState('') // 'STUDENT' | 'PROFESSOR' | 'ADMIN'
  const [secret, setSecret] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleOnboard = async () => {
    if (!name) return toast.error('Please enter your name')
    if (!role) return toast.error('Please select a role')
    if (role === 'ADMIN' && !secret) return toast.error('Admin secret is required')

    setIsSubmitting(true)
    try {
      // Call contract.onboard
      const tx = await contract.onboard(name, role, role === 'ADMIN' ? secret : '')
      toast.loading('Transaction pending...', { id: 'onboard' })
      await tx.wait()
      toast.success('Registration successful!', { id: 'onboard' })
      
      // Refresh role in context
      const { role: newRole } = await refreshRole()
      
      // Redirect
      if (newRole === 'STUDENT') navigate('/student')
      else if (newRole === 'PROFESSOR') navigate('/professor')
      else if (newRole === 'ADMIN') navigate('/admin')
      else navigate('/')
    } catch (err) {
      console.error(err)
      toast.error(err.reason || err.message || 'Onboarding failed', { id: 'onboard' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="animate-slide-up">
            <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: 'Syne, sans-serif' }}>
              Welcome to ChainPresence
            </h2>
            <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>
              Let's get you set up. What should we call you?
            </p>
            <input
              type="text"
              className="input w-full mb-6"
              placeholder="Your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
            <button
              disabled={!name}
              onClick={() => setStep(2)}
              className="btn-primary w-full py-4"
            >
              Continue →
            </button>
          </div>
        )
      case 2:
        return (
          <div className="animate-slide-up">
            <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: 'Syne, sans-serif' }}>
              Choose Your Role
            </h2>
            <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>
              Select the role that fits you best.
            </p>
            <div className="grid grid-cols-1 gap-3 mb-8">
              {[
                { id: 'STUDENT', label: 'I am a Student', desc: 'Check in to sessions and track attendance.' },
                { id: 'PROFESSOR', label: 'I am a Professor', desc: 'Create sessions and manage attendance.' },
                { id: 'ADMIN', label: 'System Admin', desc: 'Full control over the system (Key required).' },
              ].map((r) => (
                <button
                  key={r.id}
                  onClick={() => setRole(r.id)}
                  className={`p-4 rounded-xl text-left transition-all border ${
                    role === r.id 
                      ? 'border-[var(--accent)] bg-[rgba(0,229,179,0.08)]' 
                      : 'border-[var(--border)] hover:border-[var(--border-hover)]'
                  }`}
                >
                  <p className="font-bold">{r.label}</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{r.desc}</p>
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="btn-ghost flex-1">Back</button>
              <button
                disabled={!role}
                onClick={() => role === 'ADMIN' ? setStep(3) : handleOnboard()}
                className="btn-primary flex-[2] py-3"
              >
                {role === 'ADMIN' ? 'Next →' : 'Complete Registration'}
              </button>
            </div>
          </div>
        )
      case 3:
        return (
          <div className="animate-slide-up">
            <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: 'Syne, sans-serif' }}>
              Admin Verification
            </h2>
            <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>
              Please enter the Setup Secret to claim the Admin role.
            </p>
            <input
              type="password"
              className="input w-full mb-6"
              placeholder="Enter Setup Key"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              autoFocus
            />
            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="btn-ghost flex-1">Back</button>
              <button
                disabled={!secret || isSubmitting}
                onClick={handleOnboard}
                className="btn-primary flex-[2] py-3"
              >
                {isSubmitting ? 'Verifying...' : 'Verify & Register'}
              </button>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  if (!account) return null

  return (
    <div className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      {/* Dynamic backgrounds */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] bg-[var(--accent)]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] bg-[var(--danger)]" />
      </div>

      <div className="card max-w-md w-full relative z-10 backdrop-blur-xl border-[var(--border-accent)]" style={{ background: 'rgba(20,22,25,0.7)' }}>
        {isSubmitting ? (
          <div className="py-12 text-center">
            <LoadingSpinner message="Securing your identity on-chain..." />
          </div>
        ) : (
          renderStep()
        )}
      </div>
    </div>
  )
}
