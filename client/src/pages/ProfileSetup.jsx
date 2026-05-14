import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWeb3 } from '../context/Web3Context.jsx'
import { ArrowRight, ShieldCheck, Clock, UserCircle } from 'lucide-react'
import LoadingSpinner from '../components/shared/LoadingSpinner.jsx'
import { motion } from 'framer-motion'
import axios from 'axios'
import toast from 'react-hot-toast'

const API_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000'

export default function ProfileSetup() {
  const { account, role, refreshRole } = useWeb3()
  const navigate = useNavigate()

  const [prenom, setPrenom] = useState('')
  const [nom,    setNom]    = useState('')
  const [studentId, setStudentId] = useState('')
  const [roleWanted, setRoleWanted] = useState('STUDENT')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(() => localStorage.getItem('cp_pending') === '1')

  useEffect(() => {
    if (role && role !== 'UNKNOWN') {
      localStorage.removeItem('cp_pending')
      if (role === 'STUDENT') navigate('/student')
      else if (role === 'PROFESSOR') navigate('/professor')
      else if (role === 'ADMIN') navigate('/admin')
    }
  }, [role, navigate])

  const handleRequest = async (e) => {
    e.preventDefault()
    if (!prenom || !nom) return toast.error('Required fields missing.')

    setLoading(true)
    try {
      await axios.post(`${API_URL}/api/auth/register-request`, {
        address: account,
        name: `${prenom} ${nom}`,
        studentId,
        role: roleWanted
      })
      localStorage.setItem('cp_pending', '1')
      setSubmitted(true)
      toast.success('Registration request submitted!')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Submission failed.')
    } finally {
      setLoading(false)
    }
  }

  const checkStatus = async () => {
    const toastId = toast.loading('Checking blockchain for approval...')
    const { role: newRole } = await refreshRole(account)
    if (newRole && newRole !== 'UNKNOWN') {
      toast.success('Approved!', { id: toastId })
    } else {
      toast.error('Still awaiting admin approval.', { id: toastId })
    }
  }

  if (submitted) return (
    <PendingApprovalView 
      onCheck={checkStatus} 
      onLogout={() => {
        localStorage.removeItem('cp_pending');
        navigate('/login');
      }} 
    />
  )

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-6 relative overflow-hidden font-sans">
      <div className="bg-grid" />
      <div className="bg-noise" />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-[500px] w-full z-10">
        <div className="glass p-10">
          <header className="mb-10">
            <div className="flex items-center gap-4 mb-6">
              <ShieldCheck className="w-6 h-6 text-white" />
              <span className="text-[10px] font-black tracking-[0.4em] text-slate-500 uppercase">PROTOCOL ACCESS</span>
            </div>
            <h1 className="text-4xl font-black text-white uppercase tracking-tighter leading-none mb-4">
              Request <br/> Access
            </h1>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              New identity detected. Submit your credentials for administrator verification on the cryptographic ledger.
            </p>
          </header>

          <form onSubmit={handleRequest} className="space-y-8">
            <div className="grid grid-cols-2 gap-px bg-white/5 border border-white/5">
               <div className="p-6 bg-[#0A0A0A]/50">
                  <label className="input-label-swiss">First Name</label>
                  <input type="text" className="bg-transparent border-none w-full p-0 text-base font-bold text-white focus:ring-0 placeholder:text-slate-800" placeholder="Jean" value={prenom} onChange={(e) => setPrenom(e.target.value)} required disabled={loading} />
               </div>
               <div className="p-8 bg-[#0A0A0A]/50">
                  <label className="input-label-swiss">Last Name</label>
                  <input type="text" className="bg-transparent border-none w-full p-0 text-base font-bold text-white focus:ring-0 placeholder:text-slate-800" placeholder="Dupont" value={nom} onChange={(e) => setNom(e.target.value)} required disabled={loading} />
               </div>
            </div>

            <div className="bg-white/5 border border-white/5 p-6 bg-[#0A0A0A]/50">
              <label className="input-label-swiss">Student/Staff ID (Optional)</label>
              <input type="text" className="bg-transparent border-none w-full p-0 text-base font-bold text-white focus:ring-0 placeholder:text-slate-800" placeholder="ID-123456" value={studentId} onChange={(e) => setStudentId(e.target.value)} disabled={loading} />
            </div>

            <div className="space-y-4">
              <label className="input-label-swiss">Intended Role</label>
              <div className="grid grid-cols-2 gap-px bg-white/5 border border-white/5">
                 <button 
                  type="button" 
                  onClick={() => setRoleWanted('STUDENT')} 
                  className={`p-4 text-[10px] font-black tracking-widest transition-all ${roleWanted === 'STUDENT' ? 'bg-white text-black' : 'text-slate-500 hover:text-white bg-[#0A0A0A]/50'}`}
                 >
                   STUDENT
                 </button>
                 <button 
                  type="button" 
                  onClick={() => setRoleWanted('PROFESSOR')} 
                  className={`p-4 text-[10px] font-black tracking-widest transition-all ${roleWanted === 'PROFESSOR' ? 'bg-white text-black' : 'text-slate-500 hover:text-white bg-[#0A0A0A]/50'}`}
                 >
                   PROFESSOR
                 </button>
              </div>
            </div>

            <div className="pt-4">
              <button type="submit" className="btn-primary w-full group" disabled={loading}>
                {loading ? 'TRANSMITTING...' : (
                  <div className="flex items-center justify-center gap-3">
                    <span>SUBMIT REQUEST</span>
                    <ArrowRight size={14} className="group-hover:translate-x-2 transition-transform" />
                  </div>
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  )
}

function PendingApprovalView({ onCheck, onLogout }) {
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-6 text-center font-sans">
      <div className="bg-grid" />
      <div className="bg-noise" />
      
      <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="max-w-[420px] w-full">
         <div className="glass p-12 flex flex-col items-center">
            <div className="w-20 h-20 rounded-full border border-white/10 flex items-center justify-center text-white mb-8 animate-pulse">
               <Clock size={32} strokeWidth={1.5} />
            </div>
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-4">Request <br/> Pending</h2>
            <p className="text-xs text-slate-500 leading-relaxed mb-8 font-medium">
              Your cryptographic identity request has been broadcast. A protocol administrator must verify your credentials on-chain before access is granted.
            </p>
            
            <div className="w-full p-6 border border-white/5 bg-white/[0.02] flex items-center gap-6 text-left mb-8">
               <div className="w-10 h-10 flex items-center justify-center bg-white/5 text-white">
                  <UserCircle size={24} />
               </div>
               <div>
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">CURRENT STATUS</p>
                  <p className="text-xs font-black text-white uppercase tracking-tight">AWAITING VERIFICATION</p>
               </div>
            </div>

            <button onClick={onCheck} className="btn-primary w-full mb-4">CHECK LEDGER STATUS</button>
            <button 
              onClick={onLogout}
              className="text-[9px] font-black text-slate-500 hover:text-white uppercase tracking-[0.3em] transition-colors"
            >
              SWITCH ACCOUNT
            </button>
         </div>
      </motion.div>
    </div>
  )
}
