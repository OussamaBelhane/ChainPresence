import React, { useEffect, useState } from 'react'
import { useWeb3 } from '../../context/Web3Context.jsx'
import { useAttendance } from '../../hooks/useAttendance.js'
import { truncateAddress } from '../../utils/formatters.js'
import RoleBadge from '../shared/RoleBadge.jsx'
import LoadingSpinner from '../shared/LoadingSpinner.jsx'
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
    if (!window.confirm(`Remove user "${name}" (${truncateAddress(addr)})?`)) return
    try {
      await removeUser(addr)
      toast.success(`User "${name}" removed.`)
      load()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const handleChangeRole = async (addr, name, currentRole, newRole) => {
    if (currentRole === newRole) return
    if (!window.confirm(`Change role of "${name}" to ${newRole}?`)) return
    try {
      await changeUserRole(addr, newRole)
      toast.success(`Role for "${name}" updated to ${newRole}.`)
      load()
    } catch (err) {
      toast.error(err.message)
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
    <div className="px-4 sm:px-6 py-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold" style={{ fontFamily: 'Syne, sans-serif' }}>
          Registered Users
        </h2>
        <div className="flex gap-3 flex-wrap">
          <input
            className="input text-sm w-48"
            placeholder="Search name or address…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="select text-sm w-36"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="All">All Roles</option>
            <option value="STUDENT">Students</option>
            <option value="PROFESSOR">Professors</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center py-12">
          <p style={{ color: 'var(--text-secondary)' }}>No users found.</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="card hidden sm:block overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
                    {['Name', 'Wallet', 'Role', 'Actions'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider"
                        style={{ color: 'var(--text-secondary)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => (
                    <tr key={u.address} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td className="px-4 py-3 font-medium">{u.name || '—'}</td>
                      <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>
                        {u.address}
                      </td>
                      <td className="px-4 py-3"><RoleBadge role={u.role} /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <select
                            className="select text-xs py-1 px-2 w-28"
                            value={u.role}
                            disabled={txLoading}
                            onChange={(e) => handleChangeRole(u.address, u.name, u.role, e.target.value)}
                          >
                            <option value="STUDENT">Student</option>
                            <option value="PROFESSOR">Professor</option>
                          </select>
                          <button
                            className="btn-danger text-xs px-3 py-1.5"
                            disabled={txLoading}
                            onClick={() => handleRemove(u.address, u.name)}
                          >
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden space-y-3">
            {filtered.map((u) => (
              <div key={u.address} className="card">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">{u.name || '—'}</p>
                    <p className="text-xs font-mono mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {truncateAddress(u.address)}
                    </p>
                  </div>
                  <RoleBadge role={u.role} />
                </div>
                <div className="flex gap-2 mt-3">
                  <select
                    className="select text-xs flex-1 py-1.5"
                    value={u.role}
                    disabled={txLoading}
                    onChange={(e) => handleChangeRole(u.address, u.name, u.role, e.target.value)}
                  >
                    <option value="STUDENT">Student</option>
                    <option value="PROFESSOR">Professor</option>
                  </select>
                  <button
                    className="btn-danger text-xs flex-1 py-1.5"
                    onClick={() => handleRemove(u.address, u.name)}
                    disabled={txLoading}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
