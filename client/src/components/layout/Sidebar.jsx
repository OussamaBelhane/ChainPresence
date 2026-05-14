import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { 
  LogOut, 
  ShieldCheck
} from 'lucide-react'
import { useWeb3 } from '../../context/Web3Context'

export default function Sidebar() {
  const { account, logout, disconnectWallet, role } = useWeb3()
  const navigate = useNavigate()

  const getNavItems = () => {
    const base = [{ name: 'OVERVIEW', path: `/${role?.toLowerCase()}` }]
    
    if (role === 'ADMIN') {
      return [
        ...base,
        { name: 'IDENTITY INDEX', path: '/admin/users' },
        { name: 'PROVISION USER', path: '/admin/register' },
        { name: 'SECURITY LOGS', path: '/admin/logs' },
      ]
    }

    if (role === 'PROFESSOR') {
      return [
        ...base,
        { name: 'ENROLLMENTS', path: '/professor/enrollments' },
        { name: 'CREATE SESSION', path: '/professor/session' },
        { name: 'SESSION LOGS', path: '/professor/list' },
        { name: 'ANALYTICS', path: '/professor/reports' },
      ]
    }

    if (role === 'STUDENT') {
      return [
        ...base,
        { name: 'COURSE CATALOG', path: '/student/catalog' },
        { name: 'ATTENDANCE LEDGER', path: '/student/history' },
      ]
    }

    return base
  }

  const navItems = getNavItems()

  return (
    <aside className="w-60 h-screen fixed left-0 top-0 glass hidden lg:flex flex-col z-50">
      {/* Brand */}
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <ShieldCheck size={18} className="text-white" />
          <span className="text-xs font-black uppercase tracking-tighter text-white">
            CHAINPRESENCE
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            end={item.path === `/${role?.toLowerCase()}`}
            className={({ isActive }) => `
              relative flex items-center px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300
              ${isActive 
                ? 'text-white' 
                : 'text-slate-500 hover:text-white hover:translate-x-1'
              }
            `}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute left-0 w-1 h-4 bg-cobalt" />
                )}
                {item.name}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-8 border-t border-white/10">
        <div className="mb-6">
           <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">NETWORK</p>
           <p className="text-[10px] font-medium text-white uppercase">GANACHE • LOCALHOST</p>
        </div>

        <button 
          onClick={() => { logout(); disconnectWallet(); navigate('/login'); }}
          className="btn-outline w-full !text-rose-500 !border-rose-500/20 hover:!bg-rose-500 hover:!text-white"
        >
          DISCONNECT
        </button>
      </div>
    </aside>
  )
}
