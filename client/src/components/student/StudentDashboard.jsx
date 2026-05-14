import React, { useEffect, useState } from 'react'
import { useWeb3 } from '../../context/Web3Context.jsx'
import { CheckCircle2, Clock } from 'lucide-react'
import { StatCard } from '../shared/PremiumElements'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { DashboardSkeleton } from '../shared/Skeleton'

const API_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000'

export default function StudentDashboard() {
  const { contract, account, userName } = useWeb3()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    rate: 0,
    attended: 0,
    total: 0,
    absences: 0
  })
  const [activeSessions, setActiveSessions] = useState([])
  const [enrolledCourseIds, setEnrolledCourseIds] = useState(new Set())
  const [attendedSessionIds, setAttendedSessionIds] = useState(new Set())

  useEffect(() => {
    const load = async () => {
      if (!contract || !account) return
      try {
        const { data: enrollData } = await axios.get(`${API_URL}/api/enrollments/student/${account}`)
        const approvedCourseIds = new Set(
          (enrollData.enrollments || [])
            .filter(e => e.status === 'APPROVED')
            .map(e => e.courseId.trim().toLowerCase())
        )
        setEnrolledCourseIds(approvedCourseIds)

        const [attendedIds] = await Promise.all([
          contract.getStudentAttendance(account)
        ])
        setAttendedSessionIds(new Set(attendedIds.map(id => id.toString())))

        const { data } = await axios.get(`${API_URL}/api/sessions/active?studentAddress=${account}`)
        setActiveSessions(data.sessions || [])

        const allSessions = await contract.getAllSessions();
        const relevantSessions = allSessions.filter(s => {
          const chainId = s.courseId.trim().toLowerCase();
          return approvedCourseIds.has(chainId);
        });
        
        const attended = attendedIds.length
        const total = relevantSessions.length
        
        setStats({
          rate: total > 0 ? Math.round((attended / total) * 100) : 0,
          attended,
          total,
          absences: Math.max(0, total - attended)
        })
      } catch (err) {
        console.error('StudentDashboard load error:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [contract, account])

  const filteredSessions = activeSessions.filter(s => {
    const chainId = (s.courseId || '').trim().toLowerCase()
    return enrolledCourseIds.has(chainId)
  })

  if (loading) return <DashboardSkeleton />

  return (
    <div className="animate-reveal">
      {/* --- HEADER --- */}
      <div className="mb-24">
        <span className="text-[10px] font-black tracking-[0.3em] text-slate-500 uppercase">
          STUDENT PLATFORM
        </span>
        <h1 className="text-6xl font-black text-white mt-4 uppercase">
          Participation Index
        </h1>
        <p className="text-sm text-slate-500 mt-6 font-normal">
          Connected Learner: <span className="text-white font-bold">{userName || 'STUDENT'}</span>
        </p>
      </div>

      {/* --- METRICS --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-white/5 border border-white/5 mb-24">
        <StatCard label="ATTENDANCE RATE" value={`${stats.rate}%`} />
        <StatCard label="TOTAL ATTENDED" value={stats.attended} />
        <StatCard label="CLASSES MISSED" value={stats.absences} />
        <StatCard label="PLATFORM SESSIONS" value={stats.total} />
      </div>

      {/* --- LIVE SESSIONS --- */}
      <div className="space-y-12">
        <h2 className="text-xs font-black text-white uppercase tracking-[0.3em] border-b border-white/10 pb-4">
          ACTIVE ACADEMIC SESSIONS
        </h2>

        {filteredSessions.length === 0 ? (
          <div className="py-24 flex flex-col items-center justify-center text-center bg-surface border border-white/5">
            <Clock size={32} className="text-slate-800 mb-6" />
            <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest">No Active Sessions</h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-px bg-white/5 border border-white/5">
            {filteredSessions.map((session) => (
              <div 
                key={session.id}
                className={`flex flex-col md:flex-row items-start md:items-center justify-between p-12 bg-surface hover:bg-white/[0.03] transition-all group ${
                  attendedSessionIds.has(session.id.toString()) ? 'opacity-50' : ''
                }`}
              >
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    {session.isActivated ? (
                      <span className="px-2 py-1 bg-cobalt text-white text-[9px] font-black uppercase tracking-widest">LIVE NOW</span>
                    ) : (
                      <span className="px-2 py-1 bg-slate-800 text-slate-400 text-[9px] font-black uppercase tracking-widest">PENDING</span>
                    )}
                  </div>
                  <h3 className="text-2xl font-black text-white uppercase">{session.courseName}</h3>
                  <p className="text-[10px] font-mono text-slate-500 mt-2 uppercase tracking-widest">
                    {session.courseId} • SESSION #{session.id}
                  </p>
                </div>
                
                <div className="mt-8 md:mt-0">
                   {session.isActivated ? (
                     attendedSessionIds.has(session.id.toString()) ? (
                       <div className="flex items-center gap-2 px-6 py-3 bg-white/5 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                         <CheckCircle2 size={14} />
                         VERIFIED
                       </div>
                     ) : (
                       <button 
                         onClick={() => navigate('/student/checkin', { state: { session } })}
                         className="btn-cobalt px-10"
                       >
                          VERIFY PRESENCE
                       </button>
                     )
                   ) : (
                     <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest bg-white/5 px-6 py-3">
                       WAITING FOR PROFESSOR
                     </span>
                   )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
