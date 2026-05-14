import React from 'react'

export default function LoadingSpinner({ message = 'SYNCHRONIZING...', inline = false }) {
  if (inline) {
    return (
      <span className="inline-flex items-center gap-4">
        <div className="w-2 h-2 bg-white animate-pulse" />
        <span className="text-[10px] font-black uppercase tracking-widest">{message}</span>
      </span>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center gap-12 animate-reveal py-24">
      <div className="w-12 h-1 bg-white/10 relative overflow-hidden">
        <div className="absolute inset-0 bg-white w-1/3 animate-[loading_1.5s_infinite_linear]" />
      </div>

      <div className="flex flex-col items-center gap-2">
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-600">PROTOCOL STATUS</span>
        <p className="text-xs font-black text-white uppercase tracking-widest">{message}</p>
      </div>

      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
      `}</style>
    </div>
  )
}
