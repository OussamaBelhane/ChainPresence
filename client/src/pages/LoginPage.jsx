import React from 'react'
import { useWeb3 } from '../context/Web3Context.jsx'
import { motion } from 'framer-motion'
import { useWeb3Modal } from '@web3modal/wagmi/react'

export default function LoginPage() {
  const { isConnected, login, isLoggedIn, error } = useWeb3()
  const { open } = useWeb3Modal()

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-8">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        className="max-w-[480px] w-full"
      >
        <div className="card !p-16 border border-white/10">
          <header className="mb-16">
            <span className="text-[10px] font-black tracking-[0.3em] text-slate-500 uppercase">
              IDENTITY GATEWAY
            </span>
            <h1 className="text-5xl font-black text-white mt-4 uppercase tracking-tighter">
              Login
            </h1>
            <p className="text-sm text-slate-500 mt-8 leading-relaxed font-normal">
               Enterprise-grade attendance tracking via decentralized identity protocols.
            </p>
          </header>

          <div className="w-full space-y-4">
             {!isConnected ? (
                <button 
                  onClick={() => open()} 
                  className="btn-primary w-full h-16"
                >
                   CONNECT WALLET
                </button>
             ) : !isLoggedIn ? (
                <button 
                  onClick={login} 
                  className="btn-cobalt w-full h-16"
                >
                   SIGN AUTHENTICATION
                </button>
             ) : (
                <div className="py-8 border-y border-white/5 text-center">
                  <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em]">
                    IDENTITY VERIFIED
                  </span>
                  <p className="text-[10px] text-slate-600 uppercase tracking-widest mt-2">ESTABLISHING SESSION...</p>
                </div>
             )}

             {error && (
                <div className="p-4 bg-rose-500/10 text-rose-500 text-[10px] text-center font-black uppercase tracking-widest">
                   {error}
                </div>
             )}
          </div>

          <footer className="mt-16 pt-12 border-t border-white/10 w-full">
             <div className="flex justify-between items-center">
                <div>
                  <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">ENCRYPTION</p>
                  <p className="text-[10px] font-mono text-white">SHA-256 / AES</p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">STATUS</p>
                  <p className="text-[10px] font-mono text-white">SECURE</p>
                </div>
             </div>
          </footer>
        </div>
      </motion.div>
    </div>
  )
}
