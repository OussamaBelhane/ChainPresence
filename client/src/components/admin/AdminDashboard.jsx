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
          health: '99.9%'
        })
      } catch (e) {
        console.error('AdminDashboard load error:', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [contract])

  const metrics = [
    { label: 'Registered Students', value: stats.students, icon: Users, trend: '+12%', color: 'indigo' },
    { label: 'Active Professors', value: stats.professors, icon: Shield, trend: '+2%', color: 'violet' },
    { label: 'Total Sessions', value: stats.sessions, icon: Layers, trend: '+24%', color: 'emerald' },
    { label: 'System Integrity', value: stats.health, icon: Activity, trend: 'Optimal', color: 'accent' },
  ]

  if (loading) return (
    <div className="flex h-[400px] items-center justify-center">
      <div className="w-10 h-10 border-2 border-white/5 border-t-indigo-500 rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="animate-reveal">
      {/* Background Ambience */}
      <div className="cyber-glow -top-24 -left-24 w-96 h-96 opacity-20" />
      <div className="cyber-glow -bottom-24 -right-24 w-96 h-96 opacity-10" />

      {/* --- HEADER --- */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-1.5 rounded-full bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.5)]" />
            <span className="text-[10px] font-bold tracking-[0.3em] text-slate-500 uppercase">
              Management Interface
            </span>
          </div>
          <h1 className="text-5xl font-black text-white tracking-tighter leading-tight">
            Governance <span className="text-violet-500">Center</span>
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative group hidden md:block">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-violet-400 transition-colors" size={16} />
            <input
              type="text"
              placeholder="Registry lookup..."
              className="bg-white/5 border border-white/5 rounded-2xl py-3 pl-12 pr-6 text-sm text-slate-300 w-64 focus:outline-none focus:border-violet-500/50 transition-all"
            />
          </div>
          
          <button 
            onClick={() => navigate('/admin/register')}
            className="btn-primary py-3 px-6"
          >
            <UserPlus size={16} />
            Provision Node
          </button>
        </div>
      </header>

      {/* --- METRICS --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {metrics.map((m, i) => (
          <StatCard key={i} {...m} />
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2">
          <div className="card p-8 min-h-[400px]">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-bold flex items-center gap-3">
                <Activity size={18} className="text-violet-400" />
                Access Requests
              </h3>
              <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Live Sync</span>
              </div>
            </div>
            <RequestManager />
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-7">
            <h4 className="text-xs font-bold text-slate-500 mb-6 uppercase tracking-widest">Quick Operations</h4>
            <div className="space-y-3">
              {[
                { label: 'Security Logs', path: '/admin/logs' },
                { label: 'Registry Index', path: '/admin/users' },
                { label: 'Contract Config', path: '/admin/settings' }
              ].map((link) => (
                <button
                  key={link.label}
                  onClick={() => navigate(link.path)}
                  className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all group"
                >
                  <span className="text-xs font-bold text-slate-300 group-hover:text-white uppercase tracking-wider">{link.label}</span>
                  <ArrowUpRight size={14} className="text-slate-600 group-hover:text-violet-400 transition-all" />
                </button>
              ))}
            </div>
          </div>

          <div className="card p-6 bg-violet-500/5 border-violet-500/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1.5 h-1.5 rounded-full bg-violet-500" />
              <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest">Protocol Status</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Mainnet node status: <span className="text-white font-mono">Syncing</span><br/>
              Average Block Time: <span className="text-white font-mono">1.2s</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
