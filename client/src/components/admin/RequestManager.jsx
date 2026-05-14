import React, { useEffect, useState } from 'react'
import { useWeb3 } from '../../context/Web3Context.jsx'
import axios from 'axios'
import LoadingSpinner from '../shared/LoadingSpinner.jsx'
import { WalletChip } from '../shared/PremiumElements'
import { Check, X, Clock, UserCheck, Inbox } from 'lucide-react'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'

const API_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000'

export default function RequestManager() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)

  const loadRequests = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/auth/requests`)
      setRequests(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadRequests() }, [])

  const handleApprove = async (address) => {
    try {
      toast.loading('Committing to chain...', { id: 'approve' })
      const { data } = await axios.post(`${API_URL}/api/auth/requests/${address}/approve`)
      if (data.success) {
        toast.success('User Provisioned on-chain!', { id: 'approve' })
        loadRequests()
      }
    } catch (err) {
      toast.error('Approval failed.', { id: 'approve' })
    }
  }

  const pending = requests.filter(r => r.status === 'pending')

  if (loading) return <div className="flex justify-center py-12"><LoadingSpinner /></div>

  return (
    <div className="space-y-8 animate-reveal">
      <header>
         <h2 className="text-[20px] font-[var(--font-display)] font-[800] tracking-tight">Access Requests</h2>
         <p className="text-[13px] text-[var(--text-muted)] mt-1">Pending cryptographic onboarding requests ({pending.length})</p>
      </header>

      {pending.length === 0 ? (
        <div className="card-accent bg-[var(--bg-elevated)] p-12 flex flex-col items-center text-center">
           <div className="w-16 h-16 rounded-full bg-[var(--bg-app)] flex items-center justify-center text-[var(--text-muted)] mb-4">
              <Inbox size={32} />
           </div>
           <h3 className="text-[16px] font-bold">Queue Empty</h3>
           <p className="text-[13px] text-[var(--text-muted)] max-w-[240px] mt-2">All registration requests have been processed.</p>
        </div>
      ) : (
        <div className="space-y-4">
           <AnimatePresence>
             {pending.map((req) => (
                <motion.div 
                  key={req.address}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="card bg-[var(--bg-elevated)] p-6 hover:border-[var(--border-strong)] transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
                >
                   <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${req.role === 'PROFESSOR' ? 'bg-[var(--violet-dim)] text-[var(--violet)]' : 'bg-[var(--accent-dim)] text-[var(--accent)]'}`}>
                         <UserCheck size={24} />
                      </div>
                      <div>
                         <div className="flex items-center gap-3">
                            <h4 className="text-[16px] font-bold">{req.name}</h4>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter ${req.role === 'PROFESSOR' ? 'bg-[var(--violet-dim)] text-[var(--violet)]' : 'bg-[var(--accent-dim)] text-[var(--accent)]'}`}>
                               {req.role}
                            </span>
                         </div>
                         <div className="mt-1 flex items-center gap-4">
                            <WalletChip address={req.address} />
                            <span className="text-[11px] text-[var(--text-muted)]">{req.studentId || 'No Staff ID'}</span>
                         </div>
                      </div>
                   </div>

                   <div className="flex gap-3">
                      <button 
                        onClick={() => handleApprove(req.address)}
                        className="btn-primary py-2 px-6"
                      >
                         <Check size={16} className="mr-2" />
                         Approve
                      </button>
                      <button className="btn-ghost py-2 px-3">
                         <X size={16} />
                      </button>
                   </div>
                </motion.div>
             ))}
           </AnimatePresence>
        </div>
      )}
    </div>
  )
}
