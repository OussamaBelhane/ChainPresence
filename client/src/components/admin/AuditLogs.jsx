import React from 'react'
import { Shield, ShieldAlert, Activity, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function AuditLogs() {
  const navigate = useNavigate()

  const logs = [
    { id: 1, event: 'Identity Provisioned', user: 'Alex River', status: 'Success', time: '2 mins ago' },
    { id: 2, event: 'New Session Opened', user: 'Dr. Sarah Miller', status: 'On-Chain', time: '15 mins ago' },
    { id: 3, event: 'Role Grant: ADMIN', user: '0x87ba...6bd1', status: 'Verified', time: '1 hour ago' },
    { id: 4, event: 'Security Audit', user: 'System', status: 'Optimal', time: '3 hours ago' },
  ]

  return (
    <div className="p-8 animate-reveal">
      <button 
        onClick={() => navigate('/admin')}
        className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors mb-8 bg-transparent border-none cursor-pointer"
      >
        <ArrowLeft size={16} />
        <span className="text-sm font-medium">Back to Terminal</span>
      </button>

      <div className="flex items-center gap-4 mb-10">
        <div className="w-12 h-12 rounded-2xl bg-violet-500/10 flex items-center justify-center ring-1 ring-violet-500/20">
          <ShieldAlert className="text-violet-400" size={24} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Security Audit Logs</h1>
          <p className="text-sm text-slate-500 mt-1">Real-time monitoring of protocol access and identity provisioning.</p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="grid grid-cols-4 px-6 py-4 border-b border-white/5 bg-white/5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          <span>Event Type</span>
          <span>Initiator</span>
          <span>Status</span>
          <span>Timestamp</span>
        </div>
        <div className="divide-y divide-white/5">
          {logs.map((log) => (
            <div key={log.id} className="grid grid-cols-4 px-6 py-5 items-center hover:bg-white/[0.02] transition-colors">
              <span className="text-sm font-bold text-white">{log.event}</span>
              <span className="text-sm text-slate-400">{log.user}</span>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                <span className="text-xs font-medium text-emerald-400">{log.status}</span>
              </div>
              <span className="text-xs font-mono text-slate-600">{log.time}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 p-6 rounded-2xl bg-violet-500/5 ring-1 ring-violet-500/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield size={20} className="text-violet-400" />
          <p className="text-sm text-slate-400">All protocol interactions are cryptographically signed and stored in the backend audit trail.</p>
        </div>
        <button className="text-xs font-bold text-violet-400 uppercase tracking-widest hover:text-violet-300 transition-colors bg-transparent border-none cursor-pointer">
          Export Full Report
        </button>
      </div>
    </div>
  )
}
