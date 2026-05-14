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
      const tid = toast.loading('Committing to ledger...')
      const { data } = await axios.post(`${API_URL}/api/auth/requests/${address}/approve`)
      if (data.success) {
        toast.success('Identity Provisioned!', { id: tid })
        loadRequests()
      }
    } catch (err) {
      toast.error('Approval failed.', { id: 'approve' })
    }
  }

  const pending = requests.filter(r => r.status === 'pending')

  if (loading) return <div className="flex justify-center py-12"><LoadingSpinner /></div>

  if (pending.length === 0) return (
    <div className="border border-white/5 bg-white/[0.01] p-16 flex flex-col items-center text-center">
       <div className="w-16 h-16 rounded-full border border-white/5 flex items-center justify-center text-slate-700 mb-6">
          <Inbox size={32} strokeWidth={1} />
       </div>
       <h3 className="text-sm font-black text-white uppercase tracking-widest">Registry Empty</h3>
       <p className="text-[10px] text-slate-500 uppercase tracking-tight mt-2">All identity requests have been processed.</p>
    </div>
  )

  return (
    <div className="space-y-px bg-white/5 border border-white/5">
       <AnimatePresence>
         {pending.map((req) => (
            <motion.div 
              key={req.address}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-[#0A0A0A] p-6 hover:bg-white/[0.02] transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
               <div className="flex items-center gap-6">
                  <div className={`w-12 h-12 flex items-center justify-center border ${req.role === 'PROFESSOR' ? 'border-white text-white' : 'border-white/10 text-slate-500'}`}>
                     <UserCheck size={24} strokeWidth={1.5} />
                  </div>
                  <div>
                     <div className="flex items-center gap-3">
                        <h4 className="text-base font-black text-white uppercase tracking-tight">{req.name}</h4>
                        <span className="text-[8px] font-black px-2 py-0.5 border border-white/10 text-slate-500 uppercase tracking-widest">
                           {req.role}
                        </span>
                     </div>
                     <div className="mt-2 flex items-center gap-6">
                        <WalletChip address={req.address} />
                        <span className="text-[10px] font-mono text-slate-600 uppercase">{req.studentId || 'NO STAFF ID'}</span>
                     </div>
                  </div>
               </div>

               <div className="flex gap-px bg-white/10">
                  <button 
                    onClick={() => handleApprove(req.address)}
                    className="bg-white text-black text-[10px] font-black px-6 py-3 uppercase tracking-widest hover:bg-slate-200 transition-colors"
                  >
                     APPROVE
                  </button>
                  <button className="bg-[#0A0A0A] text-slate-600 px-4 py-3 hover:text-white transition-colors">
                     <X size={16} />
                  </button>
               </div>
            </motion.div>
         ))}
       </AnimatePresence>
    </div>
  )
}
