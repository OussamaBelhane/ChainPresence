import React, { useEffect, useState } from 'react'
import { useWeb3 } from '../../context/Web3Context'
import { fetchProfessorSessions } from '../../utils/contractHelpers'
import { useNavigate } from 'react-router-dom'
import { StatCard } from '../shared/PremiumElements'
import { DashboardSkeleton } from '../shared/Skeleton'
import axios from 'axios'

export default function ProfessorReports() {
  const { contract, account } = useWeb3()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState({
    sessions: [],
    totalAttendees: 0,
    avgPerSession: 0,
    engagementScore: 0,
    students: []
  })

  useEffect(() => {
    const load = async () => {
      if (!contract || !account) return
      try {
        const [mine, enrollRes] = await Promise.all([
          fetchProfessorSessions(contract, account),
          axios.get(`${import.meta.env.VITE_SERVER_URL || 'http://localhost:5000'}/api/enrollments/professor/${account}`)
        ])
        
        const approvedEnrollments = (enrollRes.data.enrollments || []).filter(e => e.status === 'APPROVED')
        const allAttendees = await Promise.all(
          mine.map(s => contract.getSessionAttendees(s.id))
        )

        // Flatten all attendees for quick lookup
        const attendanceMap = new Map(); // address -> count
        allAttendees.forEach(sessionList => {
          sessionList.forEach(addr => {
            const normalized = addr.toLowerCase();
            attendanceMap.set(normalized, (attendanceMap.get(normalized) || 0) + 1);
          });
        });

        // Calculate per-student stats
        const studentStats = await Promise.all(
          approvedEnrollments.reduce((acc, enrollment) => {
            const addr = enrollment.studentAddress.toLowerCase();
            if (acc.some(s => s.address === addr)) return acc;
            
            const attendedCount = attendanceMap.get(addr) || 0;
            const rate = mine.length > 0 ? Math.round((attendedCount / mine.length) * 100) : 0;
            
            acc.push({
              address: addr,
              attendedCount,
              rate
            });
            return acc;
          }, []).map(async (s) => {
            const name = await contract.userNames(s.address);
            return { ...s, name: name || 'Anonymous Student' };
          })
        );

        const total = allAttendees.reduce((acc, curr) => acc + curr.length, 0)
        const avg = mine.length > 0 ? total / mine.length : 0
        const score = studentStats.length > 0 ? Math.round(studentStats.reduce((a, b) => a + b.rate, 0) / studentStats.length) : 0
        
        setData({
          sessions: mine,
          totalAttendees: total,
          avgPerSession: avg.toFixed(1),
          engagementScore: score,
          students: studentStats.sort((a, b) => b.rate - a.rate)
        })
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [contract, account])

  const handleExportCSV = () => {
    if (data.students.length === 0) return;
    
    const headers = ["Student Name", "Wallet Address", "Sessions Attended", "Attendance Rate"];
    const rows = data.students.map(s => [
      s.name,
      s.address,
      s.attendedCount,
      `${s.rate}%`
    ]);
    
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `academic_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <DashboardSkeleton />

  const topStudents = data.students.slice(0, 5)
  const atRiskStudents = data.students.filter(s => s.rate < 50).slice(0, 5)

  return (
    <div className="animate-reveal">
      <header className="mb-12 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-black tracking-[0.3em] text-slate-500 uppercase">
            ANALYTICS ENGINE
          </span>
          <h1 className="text-4xl font-black text-white mt-2 uppercase tracking-tighter">
            Academic Audit
          </h1>
        </div>
        <button onClick={() => navigate('/professor')} className="btn-outline">
          BACK TO DASHBOARD
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/5 border border-white/5 mb-12">
        <StatCard label="PLATFORM CHECK-INS" value={data.totalAttendees} />
        <StatCard label="AVG PER SESSION" value={data.avgPerSession} />
        <StatCard label="ENGAGEMENT SCORE" value={`${data.engagementScore}%`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-white/5 border border-white/5 mb-12">
        {/* TOP PERFORMERS */}
        <div className="bg-surface p-8 border-r border-white/5">
          <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-8 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            Top Participants
          </h3>
          <div className="space-y-6">
            {topStudents.length === 0 ? (
               <p className="text-xs text-slate-600 italic uppercase">No enrollment data.</p>
            ) : (
              topStudents.map((s, i) => (
                <div key={i} className="flex items-center justify-between group">
                  <div>
                    <span className="text-sm font-black text-white block uppercase group-hover:text-emerald-400 transition-colors">{s.name}</span>
                    <span className="text-[9px] font-mono text-slate-600 uppercase mt-1 block">{s.address.slice(0, 10)}...{s.address.slice(-4)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-black text-white">{s.rate}%</span>
                    <span className="text-[9px] font-mono text-slate-600 block uppercase">Consistency</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* AT RISK */}
        <div className="bg-surface p-8">
          <h3 className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-8 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-rose-500" />
            At-Risk Students
          </h3>
          <div className="space-y-6">
            {atRiskStudents.length === 0 ? (
               <p className="text-xs text-slate-600 italic uppercase">No students below 50% attendance.</p>
            ) : (
              atRiskStudents.map((s, i) => (
                <div key={i} className="flex items-center justify-between group">
                  <div>
                    <span className="text-sm font-black text-white block uppercase group-hover:text-rose-400 transition-colors">{s.name}</span>
                    <span className="text-[9px] font-mono text-slate-600 uppercase mt-1 block">{s.address.slice(0, 10)}...{s.address.slice(-4)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-black text-rose-500">{s.rate}%</span>
                    <span className="text-[9px] font-mono text-slate-600 block uppercase text-rose-900">Critical</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* SESSION LEDGER */}
      <div className="bg-surface p-12 border border-white/5">
        <div className="flex items-center justify-between mb-12">
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Master Session Ledger</h3>
          <button 
            onClick={handleExportCSV}
            className="text-[10px] font-black text-white border-b border-white pb-1 hover:text-slate-400 hover:border-slate-400 transition-all"
          >
            EXPORT FULL CSV
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           {data.sessions.slice(0, 9).map((s, i) => (
             <div key={i} className="py-4 border-b border-white/5 flex justify-between items-center">
                <span className="text-xs font-black text-white uppercase">{s.courseName}</span>
                <span className="text-[10px] font-mono text-slate-500">{s.openedAt > 0 ? new Date(s.openedAt * 1000).toLocaleDateString() : "UNACTIVATED"}</span>
             </div>
           ))}
        </div>
      </div>
    </div>
  )
}
