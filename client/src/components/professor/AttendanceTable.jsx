import React, { useEffect, useState } from 'react'
import { useWeb3 } from '../../context/Web3Context.jsx'
import axios from 'axios'

const API_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000'

export default function AttendanceTable({ sessionId, onBack }) {
  const { contract } = useWeb3()
  const [loading, setLoading] = useState(true)
  const [allStudents, setAllStudents] = useState([])
  const [session, setSession] = useState(null)
  const [stats, setStats] = useState({ present: 0, absent: 0 })

  useEffect(() => {
    const load = async () => {
      if (!contract || !sessionId) return
      try {
        const [s, list] = await Promise.all([
          contract.getSession(sessionId),
          contract.getSessionAttendees(sessionId)
        ])
        const currentSession = {
          id: Number(s.id),
          courseName: s.courseName,
          courseId: s.courseId,
          isOpen: s.isOpen
        }
        setSession(currentSession)
        const { data } = await axios.get(`${API_URL}/api/enrollments/course/${currentSession.courseId}`)
        const enrollments = (data.enrollments || []).filter(e => e.status === 'APPROVED')
        
        const attendeeSet = new Set(list.map(a => a.toLowerCase()))
        const enrollmentMap = new Map(enrollments.map(e => [e.studentAddress.toLowerCase(), e]))
        
        // Merge: Start with all enrollments
        const baseStudents = enrollments.map(e => ({
          address: e.studentAddress,
          isPresent: attendeeSet.has(e.studentAddress.toLowerCase())
        }))

        // Add students present on-chain but NOT in the enrollment list
        list.forEach(addr => {
          if (!enrollmentMap.has(addr.toLowerCase())) {
            baseStudents.push({
              address: addr,
              isPresent: true,
              isExternal: true
            })
          }
        })

        // Fetch real names from blockchain for everyone
        const resolved = await Promise.all(baseStudents.map(async (s) => {
          const blockchainName = await contract.userNames(s.address);
          return {
            ...s,
            name: blockchainName || (s.isExternal ? "External / Unregistered" : "Anonymous Student")
          };
        }));

        setAllStudents(resolved.sort((a, b) => (a.isPresent === b.isPresent) ? 0 : a.isPresent ? -1 : 1))
        setStats({ present: list.length, absent: Math.max(0, enrollments.length - list.filter(a => enrollmentMap.has(a.toLowerCase())).length) })
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [contract, sessionId])

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
            AUDIT REPORT
          </span>
          <h1 className="text-6xl font-black text-white mt-4 uppercase tracking-tighter">
            {session?.courseName}
          </h1>
          <p className="text-xs text-slate-500 mt-6 font-mono uppercase tracking-widest">
            SESSION #{sessionId} • {stats.present} PRESENT • {stats.absent} ABSENT
          </p>
        </div>
        <button onClick={onBack} className="btn-outline">
          CLOSE AUDIT
        </button>
      </header>

      <div className="bg-surface border border-white/5 overflow-x-auto">
        <table className="swiss-table">
          <thead>
            <tr>
              <th className="w-4/12">STUDENT IDENTITY</th>
              <th className="w-4/12">WALLET ADDRESS</th>
              <th className="w-4/12 text-right">STATUS</th>
            </tr>
          </thead>
          <tbody>
            {allStudents.length === 0 ? (
              <tr>
                <td colSpan="3" className="py-24 text-center text-slate-600 font-normal italic">
                  NO STUDENTS ENROLLED IN THIS COURSE.
                </td>
              </tr>
            ) : (
              allStudents.map((s, i) => (
                <tr key={i}>
                  <td>
                    <span className="text-sm font-black text-white block uppercase">{s.name}</span>
                  </td>
                  <td className="text-xs font-mono text-slate-500">
                    {s.address}
                  </td>
                  <td className="text-right">
                    {s.isPresent ? (
                      <span className="text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em]">PRESENT</span>
                    ) : (
                      <span className="text-rose-500 text-[10px] font-black uppercase tracking-[0.2em]">ABSENT</span>
                    )}
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
