import React, { useEffect, useState } from 'react'
import { useWeb3 } from '../../context/Web3Context.jsx'
import { fetchProfessorSessions } from '../../utils/contractHelpers.js'
import { StatCard } from '../shared/PremiumElements'
import { useNavigate } from 'react-router-dom'
import { DashboardSkeleton } from '../shared/Skeleton'
import axios from 'axios'

export default function ProfessorDashboard() {
  const { contract, account, userName } = useWeb3()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    students: 0,
    avgRate: 0,
    thisWeek: 0
  })

  useEffect(() => {
    const load = async () => {
      if (!contract || !account) return
      try {
        const mine = await fetchProfessorSessions(contract, account)
        const now = Math.floor(Date.now() / 1000)
        const oneWeekAgo = now - (7 * 24 * 60 * 60)
        const thisWeek = mine.filter(s => Number(s.openedAt) > oneWeekAgo).length
        const allAttendees = await Promise.all(
          mine.map((s) => contract.getSessionAttendees(s.id))
        )
        const uniqueStudents = new Set(allAttendees.flat()).size
        let totalRate = 0
        const { data: enrollRes } = await axios.get(`${import.meta.env.VITE_SERVER_URL || 'http://localhost:5000'}/api/enrollments/professor/${account}`)
        const approvedEnrollments = (enrollRes.enrollments || []).filter(e => e.status === 'APPROVED')
        const myStudentAddresses = new Set(approvedEnrollments.map(e => e.studentAddress.toLowerCase()))
        
        if (myStudentAddresses.size > 0 && mine.length > 0) {
          mine.forEach((s, i) => {
            // Count how many of the enrolled students actually attended this session
            const attendees = allAttendees[i].filter(addr => myStudentAddresses.has(addr.toLowerCase())).length
            totalRate += (attendees / myStudentAddresses.size) * 100
          })
          totalRate = Math.round(totalRate / mine.length)
        }
        
        setStats({
          total: mine.length,
          students: uniqueStudents,
          avgRate: totalRate,
          thisWeek,
        })
      } catch (err) {
        console.error('ProfessorDashboard load error:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [contract, account])

  if (loading) return <DashboardSkeleton />

  return (
    <div className="animate-reveal">
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
        <div>
          <span className="text-[10px] font-black tracking-[0.3em] text-slate-500 uppercase">
            FACULTY MANAGEMENT
          </span>
          <h1 className="text-4xl font-black text-white mt-2 uppercase tracking-tight">
            Control Panel
          </h1>
          <p className="text-xs text-white/60 mt-3 font-normal max-w-lg leading-relaxed">
            Administrative oversight for cryptographic attendance verification and academic records management.
          </p>
        </div>

        <button 
          onClick={() => navigate('/professor/session')}
          className="btn-primary"
        >
          CREATE NEW SESSION
        </button>
      </div>

      {/* --- METRICS --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-white/5 border border-white/5 mb-12">
        <StatCard label="TOTAL SESSIONS" value={stats.total} />
        <StatCard label="UNIQUE STUDENTS" value={stats.students} />
        <StatCard label="AVG ATTENDANCE" value={`${stats.avgRate}%`} />
        <StatCard label="THIS WEEK" value={stats.thisWeek} />
      </div>

      {/* --- ACTION MODULES --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-white/5 border border-white/5">
        <div className="bg-surface p-8 hover:bg-white/5 transition-all">
          <h2 className="text-xl font-black text-white mb-2 uppercase">SESSION LOGS</h2>
          <p className="text-xs text-slate-500 leading-relaxed mb-6 font-normal">
            Monitor real-time student check-ins for active sessions and manage classroom presence audits.
          </p>
          <button 
            onClick={() => navigate('/professor/logs')}
            className="btn-outline w-full"
          >
            OPEN LOGS
          </button>
        </div>

        <div className="bg-surface p-8 hover:bg-white/5 transition-all">
          <h2 className="text-xl font-black text-white mb-2 uppercase">ACADEMIC AUDIT</h2>
          <p className="text-xs text-slate-500 leading-relaxed mb-6 font-normal">
            Generate detailed attendance reports and student consistency analytics.
          </p>
          <button 
            onClick={() => navigate('/professor/reports')}
            className="btn-outline w-full"
          >
            VIEW ANALYTICS
          </button>
        </div>
      </div>
    </div>
  )
}
