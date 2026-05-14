import React, { useState } from 'react'
import { ethers } from 'ethers'
import toast from 'react-hot-toast'
import { useAttendance } from '../../hooks/useAttendance.js'
import LoadingSpinner from '../shared/LoadingSpinner.jsx'
import { Shield, UserPlus, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'

export default function RegisterUser() {
  const { registerStudent, registerProfessor, loading, txStatus } = useAttendance()

  const [form,   setForm]   = useState({ wallet: '', name: '', role: 'STUDENT' })
  const [errors, setErrors] = useState({})

  const validate = () => {
    const e = {}
    if (!ethers.isAddress(form.wallet)) e.wallet = 'Enter a valid Ethereum address.'
    if (!form.name.trim())             e.name   = 'Full name is required.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (ev) => {
    ev.preventDefault()
    if (!validate()) return

    const tid = toast.loading('Initiating Onboarding...')
    try {
      if (form.role === 'STUDENT') {
        await registerStudent(form.wallet, form.name.trim())
        toast.success(`STUDENT "${form.name}" PROVISIONED`, { id: tid })
      } else {
        await registerProfessor(form.wallet, form.name.trim())
        toast.success(`PROFESSOR "${form.name}" PROVISIONED`, { id: tid })
      }
      setForm({ wallet: '', name: '', role: 'STUDENT' })
    } catch (err) {
      toast.error(err.message, { id: tid })
    }
  }

  const handleChange = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }))
    setErrors((er) => ({ ...er, [field]: undefined }))
  }

  const txLabel = {
    pending:   'WAITING FOR SIGNATURE…',
    mining:    'COMMITTING TO LEDGER…',
    confirmed: 'SUCCESSFUL!',
  }

  return (
    <div className="animate-reveal max-w-2xl">
      <header className="mb-12">
        <div className="flex items-center gap-3 mb-4">
           <Shield className="w-5 h-5 text-white" />
           <span className="text-[10px] font-black tracking-[0.3em] text-slate-500 uppercase">
             MANUAL PROVISIONING
           </span>
        </div>
        <h1 className="text-4xl font-black text-white uppercase tracking-tight">
          Register User
        </h1>
        <p className="text-xs text-white/60 mt-3 font-normal leading-relaxed">
          Manually authorize a cryptographic identity on the protocol without a public request.
        </p>
      </header>

      <form onSubmit={handleSubmit} noValidate className="space-y-px bg-white/5 border border-white/5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/5">
           <div className="bg-[#0A0A0A] p-8">
              <label className="input-label-swiss">Intended Role</label>
              <select
                className="bg-transparent border-none w-full p-0 text-lg font-bold text-white focus:ring-0 appearance-none cursor-pointer uppercase tracking-tight"
                value={form.role}
                onChange={handleChange('role')}
              >
                <option value="STUDENT" className="bg-[#0A0A0A]">STUDENT</option>
                <option value="PROFESSOR" className="bg-[#0A0A0A]">PROFESSOR</option>
              </select>
           </div>
           
           <div className="bg-[#0A0A0A] p-8">
              <label className="input-label-swiss">Identity (Full Name)</label>
              <input
                type="text"
                className="bg-transparent border-none w-full p-0 text-lg font-bold text-white focus:ring-0 placeholder:text-slate-800"
                placeholder="JEAN DUPONT"
                value={form.name}
                onChange={handleChange('name')}
              />
              {errors.name && <p className="text-[9px] font-black text-rose-500 uppercase mt-2">{errors.name}</p>}
           </div>
        </div>

        <div className="bg-[#0A0A0A] p-8">
          <label className="input-label-swiss">Cryptographic Address (Wallet)</label>
          <input
            type="text"
            className="bg-transparent border-none w-full p-0 text-lg font-mono font-bold text-white focus:ring-0 placeholder:text-slate-800"
            placeholder="0x..."
            value={form.wallet}
            onChange={handleChange('wallet')}
            spellCheck={false}
          />
          {errors.wallet && <p className="text-[9px] font-black text-rose-500 uppercase mt-2">{errors.wallet}</p>}
        </div>

        <div className="bg-[#0A0A0A] p-8">
           <button
            type="submit"
            className="btn-primary w-full group"
            disabled={loading}
           >
            {loading ? (
              <span className="animate-pulse">{txLabel[txStatus] || 'PROVISIONING…'}</span>
            ) : (
              <div className="flex items-center justify-center gap-3">
                 <UserPlus size={18} />
                 <span>REGISTER {form.role}</span>
                 <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
              </div>
            )}
           </button>
        </div>
      </form>
    </div>
  )
}
