import React from 'react'
import { useWeb3 } from '../../context/Web3Context.jsx'
import { Shield, Lock, Search, ArrowRight } from 'lucide-react'
import LoadingSpinner from './LoadingSpinner.jsx'
import { motion } from 'framer-motion'

export default function ConnectWallet() {
  const { connectWallet, loading, error } = useWeb3()

  return (
    <div className="min-h-screen bg-[var(--bg-app)] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Cinematic Background Glow */}
      <div className="absolute w-[800px] h-[800px] rounded-full opacity-10 blur-[120px] pointer-events-none"
        style={{ 
          background: 'radial-gradient(circle, var(--accent) 0%, transparent 70%)',
          top: '50%', left: '50%', transform: 'translate(-50%, -50%)'
        }} 
      />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-[440px] w-full z-10"
      >
        <div className="card-accent bg-[var(--bg-surface)] p-10 flex flex-col items-center">
          {/* Logo Section */}
          <div className="text-center mb-8">
            <span className="text-4xl font-[800] tracking-[-0.04em] text-[var(--accent)] font-[var(--font-display)]">CP</span>
            <h1 className="text-2xl font-[700] mt-2 font-[var(--font-display)]">ChainPresence</h1>
            <p className="text-[13px] text-[var(--text-muted)] mt-2">
              Attendance on-chain. Proof you can't fake.
            </p>
          </div>

          <div className="divider" />

          {/* Feature Showcase */}
          <div className="w-full space-y-2 mb-10">
            <FeatureRow 
              icon={<Lock size={16} />} 
              title="Wallet identity" 
              desc="No password. Your signature is your proof." 
            />
            <FeatureRow 
              icon={<Shield size={16} />} 
              title="Immutable records" 
              desc="Every check-in is permanent on-chain." 
            />
            <FeatureRow 
              icon={<Search size={16} />} 
              title="Full transparency" 
              desc="Auditable by anyone, anytime." 
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="w-full mb-6 p-4 bg-[var(--danger-dim)] border border-[rgba(255,77,106,0.2)] rounded-[var(--radius-md)] text-[var(--danger)] text-xs">
              {error}
            </div>
          )}

          {/* Connect Action */}
          <button
            onClick={connectWallet}
            disabled={loading}
            className="btn-primary w-full group relative overflow-hidden"
          >
            {loading ? (
              <LoadingSpinner inline message="Authorizing..." />
            ) : (
              <div className="flex items-center justify-center gap-3">
                <img src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" alt="MetaMask" className="w-5 h-5" />
                <span>Connect MetaMask</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            )}
          </button>

          <p className="mt-5 text-[11px] text-[var(--text-muted)] font-medium">
            MetaMask required · Ganache local network
          </p>
        </div>

        {/* Global Footer Hint */}
        <p className="text-center mt-8 text-[11px] text-[var(--text-muted)] uppercase tracking-widest font-bold">
          Powered by Ethereum Protocol
        </p>
      </motion.div>
    </div>
  )
}

function FeatureRow({ icon, title, desc }) {
  return (
    <div className="flex gap-4 p-3 rounded-[var(--radius-md)] hover:bg-[var(--bg-hover)] transition-colors group">
      <div className="w-9 h-9 rounded-[var(--radius-md)] bg-[var(--bg-hover)] border border-[var(--border)] flex items-center justify-center text-[var(--accent)] group-hover:border-[var(--accent-border)] transition-colors">
        {icon}
      </div>
      <div className="flex-1">
        <h4 className="text-[13px] font-[500] text-[var(--text-primary)]">{title}</h4>
        <p className="text-[12px] text-[var(--text-muted)] leading-snug">{desc}</p>
      </div>
    </div>
  )
}
