import React, { useEffect, useState } from 'react'
import { useWeb3 } from '../../context/Web3Context.jsx'
import { StatCard } from '../shared/PremiumElements'
import { 
  Shield, 
  Users, 
  Layers, 
  Activity, 
  Search, 
  UserPlus, 
  ArrowUpRight 
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import RequestManager from './RequestManager.jsx'

export default function AdminDashboard() {
  const { contract } = useWeb3()
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    students: 0,
    professors: 0,
    sessions: 0,
    health: '99.9%'
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      if (!contract) return
      try {
        const [s, p, count] = await Promise.all([
          contract.getRegisteredStudents(),
          contract.getRegisteredProfessors(),
          contract.sessionCount()
        ])
        setStats({
          students: s.length,
          professors: p.length,
          sessions: Number(count),
          health: 'OPTIMAL'
        })
      } catch (e) {
        console.error('AdminDashboard load error:', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [contract])

  if (loading) return (
    <div className="flex h-[400px] items-center justify-center">
      <div className="w-10 h-10 border-2 border-white/5 border-t-white rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="animate-reveal">
      {/* --- HEADER --- */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12">
        <div>
          <span className="text-[10px] font-black tracking-[0.3em] text-slate-500 uppercase">
            GOVERNANCE INTERFACE
          </span>
          <h1 className="text-4xl font-black text-white mt-2 uppercase tracking-tight">
            Protocol Center
          </h1>
          <p className="text-xs text-white/60 mt-3 font-normal max-w-lg leading-relaxed">
            Centralized administrative oversight for cryptographic identity verification and system health monitoring.
          </p>
        </div>

        <div className="flex items-center gap-4">
           <button 
            onClick={() => navigate('/admin/register')}
            className="btn-primary"
          >
            PROVISION NODE
          </button>
        </div>
      </header>

      {/* --- METRICS --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-white/5 border border-white/5 mb-12">
        <StatCard label="REGISTERED STUDENTS" value={stats.students} />
        <StatCard label="ACTIVE PROFESSORS" value={stats.professors} />
        <StatCard label="TOTAL SESSIONS" value={stats.sessions} />
        <StatCard label="SYSTEM STATUS" value={stats.health} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-px bg-white/5 border border-white/5">
        <div className="xl:col-span-2 bg-surface p-8 border-r border-white/5">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-white uppercase tracking-tighter">
              Identity Requests
            </h3>
            <div className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10">
              <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">LIVE LEDGER SYNC</span>
            </div>
          </div>
          <RequestManager />
        </div>

        <div className="bg-surface flex flex-col">
          <div className="p-8 border-b border-white/5">
            <h4 className="text-[10px] font-black text-slate-500 mb-6 uppercase tracking-widest">QUICK OPERATIONS</h4>
            <div className="space-y-px bg-white/5 border border-white/5">
              {[
                { label: 'Security Logs', path: '/admin/logs' },
                { label: 'Registry Index', path: '/admin/users' },
                { label: 'Contract Config', path: '/admin/settings' }
              ].map((link) => (
                <button
                  key={link.label}
                  onClick={() => navigate(link.path)}
                  className="w-full flex items-center justify-between p-4 bg-[#0A0A0A] hover:bg-white/5 transition-all group"
                >
                  <span className="text-[10px] font-black text-slate-400 group-hover:text-white uppercase tracking-wider">{link.label}</span>
                  <ArrowUpRight size={14} className="text-slate-700 group-hover:text-white transition-all" />
                </button>
              ))}
            </div>
          </div>

          <div className="p-8 flex-1 bg-white/[0.01]">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">INFRASTRUCTURE STATUS</span>
            </div>
            <div className="space-y-4">
               <div>
                  <p className="text-[9px] font-black text-slate-600 uppercase mb-1">MAINNET BRIDGE</p>
                  <p className="text-xs font-bold text-white font-mono tracking-tight">STABLE / SYNCED</p>
               </div>
               <div>
                  <p className="text-[9px] font-black text-slate-600 uppercase mb-1">AVG BLOCK TIME</p>
                  <p className="text-xs font-bold text-white font-mono tracking-tight">1.2s</p>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
