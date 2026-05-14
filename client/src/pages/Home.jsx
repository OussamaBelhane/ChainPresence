import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useWeb3 } from '../context/Web3Context.jsx'
import { User, LogOut, ChevronRight, Activity, Globe, ShieldCheck } from 'lucide-react'

export default function Home() {
  const { role, account, userName, disconnectWallet } = useWeb3()
  const navigate = useNavigate()

  const roleMap = {
    STUDENT:   '/student',
    PROFESSOR: '/professor',
    ADMIN:     '/admin',
  }

  const dest = roleMap[role]

  return (
    <div className="min-h-screen bg-black swiss-grid content-start">
      {/* Header Bar */}
      <header className="col-span-12 flex justify-between items-center py-6 border-b border-zinc-900 mb-12">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white flex items-center justify-center">
            <Activity size={16} className="text-black" />
          </div>
          <span className="font-bold tracking-tighter uppercase text-xl">ChainPresence</span>
        </div>
        
        <div className="flex items-center gap-8">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Network Status</span>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs font-mono text-zinc-300 uppercase">Synchronized</span>
            </div>
          </div>
          <button onClick={disconnectWallet} className="text-zinc-500 hover:text-white transition-colors">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="col-span-12 lg:col-span-8 animate-reveal">
        <div className="mb-16">
          <span className="text-xs font-bold text-zinc-500 uppercase tracking-[0.4em] mb-4 block">Identity Verified</span>
          <h1 className="s-heading text-huge mb-6">Welcome,<br/>{userName || 'User'}</h1>
          <p className="text-zinc-400 text-lg font-light max-w-xl leading-relaxed">
            Your identity has been authenticated via the Ethereum blockchain. 
            Your assigned role grants you access to specific protocol operations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="s-card p-8 flex flex-col justify-between aspect-square md:aspect-video">
            <div>
              <div className="w-10 h-10 bg-zinc-800 flex items-center justify-center mb-6">
                <ShieldCheck size={20} className="text-zinc-400" />
              </div>
              <h3 className="text-xl font-bold uppercase tracking-tight mb-2">Access Control</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Role: <span className="text-white font-mono">{role || 'NOT_ASSIGNED'}</span>
              </p>
            </div>
            
            {dest ? (
              <button onClick={() => navigate(dest)} className="s-btn-primary w-full group">
                <span>Enter Dashboard</span>
                <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
            ) : (
              <div className="mt-4 p-4 bg-red-950/20 border border-red-900 text-red-500 text-[10px] uppercase font-bold tracking-widest">
                Account Not Authorized
              </div>
            )}
          </div>

          <div className="s-card p-8 bg-zinc-900/30 border-dashed">
             <div className="w-10 h-10 bg-zinc-800 flex items-center justify-center mb-6">
                <Globe size={20} className="text-zinc-400" />
              </div>
              <h3 className="text-xl font-bold uppercase tracking-tight mb-2">Protocol Details</h3>
              <div className="space-y-4 mt-6">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Contract Address</span>
                  <span className="text-xs font-mono text-zinc-400 truncate select-all">{account}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Status</span>
                  <span className="text-xs font-mono text-green-500 uppercase">Authenticated</span>
                </div>
              </div>
          </div>
        </div>
      </main>

      {/* Sidebar / Info */}
      <aside className="col-span-12 lg:col-span-4 lg:pl-12 mt-12 lg:mt-0 animate-reveal" style={{ animationDelay: '0.1s' }}>
        <div className="border-t lg:border-t-0 lg:border-l border-zinc-900 lg:pl-12 pt-12 lg:pt-0 h-full">
          <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-8">System Logs</h4>
          <div className="space-y-6">
            {[
              { t: '12:00:01', m: 'Node connection established' },
              { t: '12:00:02', m: 'Smart contract ABI loaded' },
              { t: '12:00:05', m: `Session authenticated for ${account?.slice(0, 8)}...` },
              { t: '12:00:06', m: 'Redirecting to secure environment' }
            ].map((log, i) => (
              <div key={i} className="flex gap-4">
                <span className="text-[10px] font-mono text-zinc-700">{log.t}</span>
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-tighter">{log.m}</span>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  )
}
