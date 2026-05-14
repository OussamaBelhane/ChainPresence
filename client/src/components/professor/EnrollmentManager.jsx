import React, { useEffect, useState } from 'react'
import { useWeb3 } from '../../context/Web3Context'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'

const API_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000'

export default function EnrollmentManager() {
  const { account } = useWeb3()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [enrollments, setEnrollments] = useState([])
  const [filter, setFilter] = useState('PENDING')

  const fetchEnrollments = async () => {
    if (!account) return
    try {
      const { data } = await axios.get(`${API_URL}/api/enrollments/professor/${account}`, {
        withCredentials: true
      })
      setEnrollments(data.enrollments || [])
    } catch (err) {
      console.error(err)
      toast.error('Load failed')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEnrollments()
  }, [account])

  const handleUpdateStatus = async (id, status) => {
    const toastId = toast.loading(`Processing...`)
    try {
      await axios.put(`${API_URL}/api/enrollments/${id}/status`, { status }, { withCredentials: true })
      toast.success(`Updated`, { id: toastId })
      fetchEnrollments()
    } catch (err) {
      toast.error('Failed', { id: toastId })
    }
  }

  const filteredEnrollments = enrollments.filter(e => e.status === filter)

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
            Enrollments
          </h1>
        </div>
        <div className="flex gap-2">
          {['PENDING', 'APPROVED', 'REJECTED'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-6 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${
                filter === f ? 'bg-white text-black' : 'bg-surface text-slate-500 border border-white/5'
              }`}
            >
              {f}
              {f === 'PENDING' && enrollments.filter(e => e.status === 'PENDING').length > 0 && (
                <span className="ml-2">({enrollments.filter(e => e.status === 'PENDING').length})</span>
              )}
            </button>
          ))}
        </div>
      </header>

      <div className="bg-surface border border-white/5 overflow-x-auto">
        <table className="swiss-table">
          <thead>
            <tr>
              <th className="w-5/12">STUDENT IDENTITY</th>
              <th className="w-3/12">COURSE TARGET</th>
              <th className="w-4/12 text-right">ACTION</th>
            </tr>
          </thead>
          <tbody>
            {filteredEnrollments.length === 0 ? (
              <tr>
                <td colSpan="3" className="py-24 text-center text-slate-600 font-normal italic">
                  NO {filter} APPLICATIONS FOUND.
                </td>
              </tr>
            ) : (
              filteredEnrollments.map((req) => (
                <tr key={req.id}>
                  <td>
                    <span className="text-lg font-black text-white block uppercase tracking-tight">{req.studentName}</span>
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-1">{req.studentAddress}</span>
                  </td>
                  <td>
                    <span className="text-xs font-black text-white uppercase">{req.courseId}</span>
                  </td>
                  <td className="text-right">
                    <div className="flex justify-end gap-6">
                      {filter === 'PENDING' ? (
                        <>
                          <button onClick={() => handleUpdateStatus(req.id, 'APPROVED')} className="text-[10px] font-black text-emerald-400 uppercase tracking-widest hover:underline">APPROVE</button>
                          <button onClick={() => handleUpdateStatus(req.id, 'REJECTED')} className="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:underline">REJECT</button>
                        </>
                      ) : (
                        <span className={`text-[10px] font-black uppercase tracking-widest ${filter === 'APPROVED' ? 'text-emerald-400' : 'text-rose-500'}`}>{filter}</span>
                      )}
                    </div>
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
