import React, { useEffect, useState } from 'react'
import { useWeb3 } from '../../context/Web3Context.jsx'
import { fetchProfessorSessions } from '../../utils/contractHelpers.js'
import { useNavigate } from 'react-router-dom'
import AttendanceTable from './AttendanceTable.jsx'
import axios from 'axios'
import toast from 'react-hot-toast'

const API_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000'

export default function SessionList() {
  const { contract, account } = useWeb3()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [sessions, setSessions] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [activatedIds, setActivatedIds] = useState(new Set())

  const load = async () => {
    if (!contract || !account) return
    try {
      const mine = await fetchProfessorSessions(contract, account)
      setSessions(mine.filter(Boolean).sort((a, b) => b.id - a.id))
      const openIds = mine.filter(s => s.isOpen).map(s => s.id)
      const statuses = await Promise.all(
        openIds.map(id => axios.get(`${API_URL}/api/sessions/status/${id}`).catch(() => ({ data: { isActivated: false } })))
      )
      const activatedSet = new Set()
      statuses.forEach((res, i) => {
        if (res.data?.isActivated) activatedSet.add(openIds[i])
      } )
      setActivatedIds(activatedSet)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [contract, account])

  const handleActivate = async (s) => {
    const toastId = toast.loading('Capturing GPS Anchor...')
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000
        });
      });
      const { latitude, longitude } = position.coords;
      const tx = await contract.activateSession(s.id, `${latitude.toFixed(4)},${longitude.toFixed(4)}`)
      await tx.wait()
      await axios.post(`${API_URL}/api/sessions/activate`, {
        sessionId: s.id,
        lat: latitude,
        lng: longitude
      })
      toast.success('Session Active', { id: toastId })
      load()
    } catch (err) {
      toast.error(err.message || 'Activation failed', { id: toastId })
    }
  }

  const handleClose = async (id) => {
    const toastId = toast.loading('Closing Session...')
    try {
      const tx = await contract.closeSession(id)
      await tx.wait()
      toast.success('Session Secured', { id: toastId })
      load()
    } catch (err) {
      toast.error(err.message, { id: toastId })
    }
  }

  if (selectedId) {
    return <AttendanceTable sessionId={selectedId} onBack={() => setSelectedId(null)} />
  }

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
            FACULTY MANAGEMENT
          </span>
          <h1 className="text-6xl font-black text-white mt-4 uppercase tracking-tighter">
            Session Logs
          </h1>
        </div>
        <button onClick={() => navigate('/professor')} className="btn-outline">
          BACK TO DASHBOARD
        </button>
      </header>

      <div className="bg-surface border border-white/5 overflow-x-auto">
        <table className="swiss-table">
          <thead>
            <tr>
              <th className="w-5/12">COURSE IDENTITY</th>
              <th className="w-3/12">EXECUTION TIME</th>
              <th className="w-2/12">STATUS</th>
              <th className="w-2/12 text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {sessions.length === 0 ? (
              <tr>
                <td colSpan="4" className="py-24 text-center text-slate-600 font-normal italic">
                  NO SESSION LOGS RECORDED.
                </td>
              </tr>
            ) : (
              sessions.map((s) => {
                const openedAt = s.openedAt ? Number(s.openedAt) : Date.now() / 1000;
                const openedDate = new Date(openedAt * 1000)
                const isLive = s.isOpen && s.isActivated
                const isScheduled = s.isOpen && !s.isActivated
                
                return (
                  <tr key={s.id} className={!s.isOpen ? 'opacity-30' : ''}>
                    <td>
                      <span className="text-base font-black text-white block uppercase tracking-tight">{s.courseName}</span>
                      <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mt-1">ID: #{s.id} • {s.courseId}</span>
                    </td>
                    <td className="text-xs text-slate-400 font-medium">
                      {openedDate.toLocaleDateString()} • {openedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                    </td>
                    <td>
                      {isLive ? (
                        <span className="text-emerald-400 text-[10px] font-black uppercase tracking-widest">LIVE</span>
                      ) : isScheduled ? (
                        <span className="text-indigo-400 text-[10px] font-black uppercase tracking-widest">INACTIVE</span>
                      ) : (
                        <span className="text-slate-600 text-[10px] font-black uppercase tracking-widest">CLOSED</span>
                      )}
                    </td>
                    <td className="text-right space-x-4">
                      {isScheduled && (
                        <button 
                          onClick={() => handleActivate(s)}
                          className="text-[10px] font-black text-cobalt uppercase hover:underline"
                        >
                          ACTIVATE
                        </button>
                      )}
                      {isLive && (
                        <button 
                          onClick={() => handleClose(s.id)}
                          className="text-[10px] font-black text-rose-500 uppercase hover:underline"
                        >
                          CLOSE
                        </button>
                      )}
                      <button 
                        onClick={() => setSelectedId(s.id)}
                        className="text-[10px] font-black text-white uppercase hover:underline"
                      >
                        AUDIT
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
