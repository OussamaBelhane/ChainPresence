import React, { useState } from 'react'
import { Check, ExternalLink } from 'lucide-react'
import { copyToClipboard } from '../../utils/formatters'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * WalletChip: High-end address display
 */
export function WalletChip({ address }) {
  const truncated = `${address?.slice(0, 6)}...${address?.slice(-4)}`

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-white/5 border border-white/10 hover:border-white/20 transition-all cursor-default">
      <span className="text-[10px] font-black tracking-widest text-white uppercase">
        {address ? truncated : 'DISCONNECTED'}
      </span>
    </div>
  )
}

/**
 * TxHash: Minimalist transaction link
 */
export function TxHash({ hash }) {
  const [copied, setCopied] = useState(false)
  const truncated = `${hash?.slice(0, 6)}...${hash?.slice(-4)}`

  const handleCopy = async () => {
    await copyToClipboard(hash)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="flex items-center gap-2 cursor-pointer group" onClick={handleCopy}>
      <span className="text-[10px] font-mono text-slate-500 group-hover:text-white transition-colors">{truncated}</span>
      <AnimatePresence mode="wait">
        {copied ? <Check size={10} className="text-emerald-400" /> : <ExternalLink size={10} className="text-slate-700" />}
      </AnimatePresence>
    </div>
  )
}

/**
 * StatCard: Swiss Style data visualization
 * Large, bold numbers with small uppercase labels above.
 */
export const StatCard = ({ label, value }) => (
  <div className="glass p-8 hover:bg-white/[0.02] transition-all">
    <p className="text-[8px] font-medium tracking-[0.3em] text-slate-500 uppercase mb-4">{label}</p>
    <h3 className="text-4xl font-black text-white tracking-tighter leading-none">
      {value}
    </h3>
  </div>
)

/**
 * Avatar: Initials
 */
export function Avatar({ name }) {
  const initials = name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??'
  return (
    <div className="w-10 h-10 flex items-center justify-center bg-white text-black font-black text-xs uppercase">
      {initials}
    </div>
  )
}
