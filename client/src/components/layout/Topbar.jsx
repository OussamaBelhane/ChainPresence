import React from 'react'
import { useWeb3 } from '../../context/Web3Context.jsx'
import { truncateAddress } from '../../utils/formatters.js'

export default function Topbar({ title }) {
  const { account } = useWeb3()

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between px-8 lg:px-10 py-4 glass">
      <div className="flex items-center gap-12">
        <h1 className="text-xs font-black tracking-[0.2em] text-slate-500 uppercase">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-8">
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">AUTHENTICATED</span>
          <span className="text-xs font-mono text-white">{truncateAddress(account)}</span>
        </div>
      </div>
    </header>
  )
}
