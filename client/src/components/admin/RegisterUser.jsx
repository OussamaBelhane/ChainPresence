import React, { useState } from 'react'
import { ethers } from 'ethers'
import toast from 'react-hot-toast'
import { useAttendance } from '../../hooks/useAttendance.js'
import LoadingSpinner from '../shared/LoadingSpinner.jsx'

export default function RegisterUser() {
  const { registerStudent, registerProfessor, loading, txStatus } = useAttendance()

  const [form,   setForm]   = useState({ wallet: '', name: '', role: 'STUDENT' })
  const [errors, setErrors] = useState({})

  const validate = () => {
    const e = {}
    if (!ethers.isAddress(form.wallet)) e.wallet = 'Enter a valid Ethereum address (0x…)'
    if (!form.name.trim())             e.name   = 'Full name is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (ev) => {
    ev.preventDefault()
    if (!validate()) return

    try {
      if (form.role === 'STUDENT') {
        await registerStudent(form.wallet, form.name.trim())
        toast.success(`Student "${form.name}" registered!`)
      } else {
        await registerProfessor(form.wallet, form.name.trim())
        toast.success(`Professor "${form.name}" registered!`)
      }
      setForm({ wallet: '', name: '', role: 'STUDENT' })
    } catch (err) {
      toast.error(err.message)
    }
  }

  const handleChange = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }))
    setErrors((er) => ({ ...er, [field]: undefined }))
  }

  const txLabel = {
    pending:   'Waiting for MetaMask…',
    mining:    'Transaction pending…',
    confirmed: 'Confirmed!',
  }

  return (
    <div className="px-4 sm:px-6 py-6 max-w-lg animate-fade-in">
      <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: 'Syne, sans-serif' }}>
        Register User
      </h2>

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            Role *
          </label>
          <select
            id="user-role"
            className="select"
            value={form.role}
            onChange={handleChange('role')}
          >
            <option value="STUDENT">Student</option>
            <option value="PROFESSOR">Professor</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            Wallet Address *
          </label>
          <input
            id="user-wallet"
            className="input font-mono text-sm"
            placeholder="0x..."
            value={form.wallet}
            onChange={handleChange('wallet')}
            spellCheck={false}
          />
          {errors.wallet && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{errors.wallet}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            Full Name *
          </label>
          <input
            id="user-name"
            className="input"
            placeholder="e.g. Alice Johnson"
            value={form.name}
            onChange={handleChange('name')}
          />
          {errors.name && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{errors.name}</p>}
        </div>

        <button
          id="register-user-btn"
          type="submit"
          className="btn-primary w-full py-4"
          disabled={loading}
        >
          {loading ? (
            <LoadingSpinner inline message={txLabel[txStatus] || 'Registering…'} />
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="19" y1="8" x2="19" y2="14" />
                <line x1="22" y1="11" x2="16" y2="11" />
              </svg>
              Register {form.role === 'STUDENT' ? 'Student' : 'Professor'}
            </>
          )}
        </button>
      </form>
    </div>
  )
}
