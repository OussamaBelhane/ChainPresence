import React, { useEffect, useState } from 'react'
import { useWeb3 } from '../../context/Web3Context.jsx'
import { useAttendance } from '../../hooks/useAttendance.js'
import { truncateAddress } from '../../utils/formatters.js'
import LoadingSpinner from '../shared/LoadingSpinner.jsx'
import { Search, UserX, UserCheck, Filter, ArrowUpRight } from 'lucide-react'
import toast from 'react-hot-toast'

export default function UserList() {
  const { contract } = useWeb3()
  const { removeUser, changeUserRole, loading: txLoading } = useAttendance()

  const [users,    setUsers]   = useState([])
  const [loading,  setLoading] = useState(true)
  const [search,   setSearch]  = useState('')
  const [roleFilter, setRoleFilter] = useState('All')

  const load = async () => {
    if (!contract) return
    setLoading(true)
    try {
      const [students, professors] = await Promise.all([
        contract.getRegisteredStudents(),
        contract.getRegisteredProfessors(),
      ])

      const studentData   = await Promise.all(
        students.map(async (addr) => ({
          address: addr,
          name:    await contract.userNames(addr).catch(() => ''),
          role:    'STUDENT',
        }))
      )
      const professorData = await Promise.all(
        professors.map(async (addr) => ({
          address: addr,
          name:    await contract.userNames(addr).catch(() => ''),
          role:    'PROFESSOR',
        }))
      )

      setUsers([...professorData, ...studentData])
    } catch (err) {
      console.error('UserList load error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [contract])

  const handleRemove = async (addr, name) => {
    const tid = toast.loading('Removing from chain...')
    try {
      await removeUser(addr)
      toast.success(`User "${name}" removed.`, { id: tid })
      load()
    } catch (err) {
      toast.error(err.message, { id: tid })
    }
  }

  const handleChangeRole = async (addr, name, currentRole, newRole) => {
    if (currentRole === newRole) return
    const tid = toast.loading('Updating role...')
    try {
      await changeUserRole(addr, newRole)
      toast.success(`Role for "${name}" updated.`, { id: tid })
      load()
    } catch (err) {
      toast.error(err.message, { id: tid })
    }
  }

  const filtered = users.filter((u) => {
    const matchSearch = !search || u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.address.toLowerCase().includes(search.toLowerCase())
    const matchRole = roleFilter === 'All' || u.role === roleFilter
    return matchSearch && matchRole
  })

  if (loading) return <div className="flex justify-center py-16"><LoadingSpinner /></div>

  return (
    <div className="animate-reveal">
      <header className="mb-12">
        <div className="flex items-center gap-3 mb-4">
           <Filter className="w-4 h-4 text-white" />
           <span className="text-[10px] font-black tracking-[0.3em] text-slate-500 uppercase">
             REGISTRY MANAGEMENT
           </span>
        </div>
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
           <div>
              <h1 className="text-4xl font-black text-white uppercase tracking-tight">
                Registered Users
              </h1>
              <p className="text-xs text-white/60 mt-3 font-normal leading-relaxed">
                Complete directory of authorized cryptographic identities within the protocol.
              </p>
           </div>
           
           <div className="flex gap-px bg-white/5 border border-white/5">
              <div className="bg-[#0A0A0A] p-3 flex items-center gap-4">
                 <Search className="text-slate-600" size={16} />
                 <input
                  className="bg-transparent border-none text-[11px] font-bold text-white focus:ring-0 placeholder:text-slate-800 uppercase tracking-widest w-48"
                  placeholder="SEARCH IDENTITY..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                 />
              </div>
              <select
                className="bg-[#0A0A0A] border-none text-[11px] font-black text-white focus:ring-0 cursor-pointer px-6 uppercase tracking-widest"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="All">ALL ROLES</option>
                <option value="STUDENT">STUDENTS</option>
                <option value="PROFESSOR">PROFESSORS</option>
              </select>
           </div>
        </div>
      </header>

      {filtered.length === 0 ? (
        <div className="border border-white/5 bg-white/[0.01] p-16 flex flex-col items-center text-center">
           <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">No identities matched your criteria.</p>
        </div>
      ) : (
        <div className="space-y-px bg-white/5 border border-white/5">
           {/* Desktop Header */}
           <div className="hidden lg:grid grid-cols-12 gap-6 p-6 bg-white/[0.02] border-b border-white/5">
              <div className="col-span-3 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">NAME</div>
              <div className="col-span-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">WALLET</div>
              <div className="col-span-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">ROLE</div>
              <div className="col-span-3 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] text-right">ACTIONS</div>
           </div>

           {filtered.map((u) => (
             <div key={u.address} className="lg:grid lg:grid-cols-12 gap-6 p-6 bg-[#0A0A0A] hover:bg-white/[0.01] transition-all border-b border-white/5 last:border-0 items-center">
                <div className="col-span-3 font-black text-white uppercase tracking-tight truncate">
                   {u.name || 'ANONYMOUS'}
                </div>
                
                <div className="col-span-4 font-mono text-[11px] text-slate-500 flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />
                   {u.address}
                </div>

                <div className="col-span-2">
                   <span className="text-[8px] font-black px-2 py-0.5 border border-white/10 text-slate-400 uppercase tracking-widest inline-block">
                      {u.role}
                   </span>
                </div>

                <div className="col-span-3 flex justify-end items-center gap-4">
                   <select
                    className="bg-transparent border-none text-[9px] font-black text-slate-500 hover:text-white focus:ring-0 cursor-pointer uppercase tracking-widest transition-colors"
                    value={u.role}
                    disabled={txLoading}
                    onChange={(e) => handleChangeRole(u.address, u.name, u.role, e.target.value)}
                   >
                     <option value="STUDENT" className="bg-[#0A0A0A]">CHANGE TO STUDENT</option>
                     <option value="PROFESSOR" className="bg-[#0A0A0A]">CHANGE TO PROFESSOR</option>
                   </select>

                   <button
                    onClick={() => handleRemove(u.address, u.name)}
                    disabled={txLoading}
                    className="text-[9px] font-black text-rose-500/50 hover:text-rose-500 uppercase tracking-widest transition-colors flex items-center gap-2 px-3 py-2 border border-white/5 hover:border-rose-500/20"
                   >
                      <UserX size={12} />
                      REMOVE
                   </button>
                </div>
             </div>
           ))}
        </div>
      )}
    </div>
  )
}
