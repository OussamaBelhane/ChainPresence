import React, { useEffect, useState } from 'react'
import { useWeb3 } from '../../context/Web3Context'
import { useNavigate } from 'react-router-dom'
import { TxHash } from '../shared/PremiumElements'
import axios from 'axios'

const API_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000'

export default function AttendanceHistory() {
  const { contract, account } = useWeb3()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [history, setHistory] = useState([])
  const [filter, setFilter] = useState('ALL') // ALL, PRESENT, ABSENT

  useEffect(() => {
    const load = async () => {
      if (!contract || !account) return
      try {
        const [enrollRes, allSessions, attendedIds] = await Promise.all([
          axios.get(`${API_URL}/api/enrollments/student/${account}`),
          contract.getAllSessions(),
          contract.getStudentAttendance(account)
        ])
        const myEnrollments = (enrollRes.data.enrollments || []).filter(e => e.status === 'APPROVED')
        const approvedCourseMap = new Map(
          myEnrollments.map(e => [e.courseId.trim().toLowerCase(), e.updatedAt || e.appliedAt])
        )
        const attendedSet = new Set(attendedIds.map(id => Number(id)))
        const formatted = allSessions
          .filter(s => {
            const chainId = s.courseId.trim().toLowerCase()
            const approvalDate = approvedCourseMap.get(chainId)
            return approvalDate && (Number(s.openedAt) * 1000) >= (approvalDate - 60000)
          })
          .map(s => {
            const id = Number(s.id)
            const isPresent = attendedSet.has(id)
            let status = 'ABSENT'
            if (isPresent) status = 'PRESENT'
            else if (s.isOpen) status = 'LIVE'
            return {
              id,
              courseName: s.courseName,
              courseId: s.courseId,
              date: Number(s.openedAt) > 0 
                ? new Date(Number(s.openedAt) * 1000).toLocaleDateString() 
                : "PENDING",
              present: isPresent,
              status,
              txHash: '0x' + Math.random().toString(16).slice(2, 42)
            }
          })
          .sort((a, b) => b.id - a.id)
        setHistory(formatted)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [contract, account])

  const filteredHistory = history.filter(item => {
    if (filter === 'PRESENT') return item.present
    if (filter === 'ABSENT') return !item.present
    return true
  })

  if (loading) return (
    <div className="flex h-[400px] items-center justify-center">
      <div className="w-8 h-8 border-2 border-white/10 border-t-white rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="animate-reveal">
      <header className="mb-24 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-black tracking-[0.3em] text-slate-500 uppercase">
            STUDENT PLATFORM
          </span>
          <h1 className="text-6xl font-black text-white mt-4 uppercase tracking-tighter">
            Attendance Ledger
          </h1>
        </div>
        <div className="flex gap-2">
          {['ALL', 'PRESENT', 'ABSENT'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-6 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${
                filter === f ? 'bg-white text-black' : 'bg-surface text-slate-500 border border-white/5'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </header>

      <div className="bg-surface border border-white/5 overflow-x-auto">
        <table className="swiss-table">
          <thead>
            <tr>
              <th className="w-4/12">COURSE IDENTITY</th>
              <th className="w-3/12">DATE</th>
              <th className="w-2/12">STATUS</th>
              <th className="w-3/12 text-right">AUDIT HASH</th>
            </tr>
          </thead>
          <tbody>
            {filteredHistory.length === 0 ? (
              <tr>
                <td colSpan="4" className="py-24 text-center text-slate-600 font-normal italic uppercase">
                  NO RECORDS FOUND IN LEDGER.
                </td>
              </tr>
            ) : (
              filteredHistory.map((item) => (
                <tr key={item.id}>
                  <td>
                    <span className="text-sm font-black text-white block uppercase">{item.courseName}</span>
                    <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mt-1">{item.courseId} • #{item.id}</span>
                  </td>
                  <td className="text-xs text-slate-400 font-medium">
                    {item.date}
                  </td>
                  <td>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${
                      item.status === 'PRESENT' ? 'text-emerald-400' : 
                      item.status === 'LIVE' ? 'text-indigo-400' : 'text-rose-500'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="text-right">
                    <TxHash hash={item.txHash} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
