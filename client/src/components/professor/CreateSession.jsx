import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWeb3 } from '../../context/Web3Context'
import toast from 'react-hot-toast'
import axios from 'axios'

const API_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000'

export default function CreateSession() {
  const navigate = useNavigate()
  const { contract, account } = useWeb3()
  const [loading, setLoading] = useState(false)
  const [courses, setCourses] = useState([])
  const [formData, setFormData] = useState({
    courseId: '',
    courseName: '',
    duration: '60',
  })

  useEffect(() => {
    const fetchCourses = async () => {
      if (!account) return
      try {
        const { data } = await axios.get(`${API_URL}/api/enrollments/professor/${account}`)
        const unique = []
        const seen = new Set()
        data.enrollments.forEach(e => {
          if (!seen.has(e.courseId)) {
            seen.add(e.courseId)
            unique.push({ id: e.courseId, name: e.courseName })
          }
        })
        setCourses(unique)
      } catch (err) {
        console.error('Failed to fetch courses:', err)
      }
    }
    fetchCourses()
  }, [account])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!contract) return
    setLoading(true)
    const toastId = toast.loading('Registering on Ledger...')
    try {
      const tx = await contract.openSession(formData.courseId, formData.courseName, Number(formData.duration))
      await tx.wait()
      toast.success('Session Scheduled', { id: toastId })
      setTimeout(() => navigate('/professor/list'), 1500);
    } catch (err) {
      toast.error(err.message || 'Transaction failed', { id: toastId })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="animate-reveal">
      <header className="mb-24">
        <span className="text-[10px] font-black tracking-[0.3em] text-slate-500 uppercase">
          FACULTY MANAGEMENT
        </span>
        <h1 className="text-6xl font-black text-white mt-4 uppercase tracking-tighter">
          Schedule Session
        </h1>
      </header>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-12">
        <div className="space-y-12">
          <div className="space-y-3">
            <label className="input-label-swiss">Registered Courses</label>
            <select 
              className="input-swiss bg-surface"
              onChange={(e) => {
                const c = courses.find(x => x.id === e.target.value)
                if (c) setFormData({...formData, courseId: c.id, courseName: c.name})
              }}
            >
              <option value="">-- SELECT COURSE --</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.id})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="input-label-swiss">Course ID</label>
              <input 
                required className="input-swiss" placeholder="e.g. CS101"
                value={formData.courseId}
                onChange={e => setFormData({...formData, courseId: e.target.value})}
              />
            </div>
            <div className="space-y-3">
              <label className="input-label-swiss">Course Name</label>
              <input 
                required className="input-swiss" placeholder="e.g. Smart Contracts"
                value={formData.courseName}
                onChange={e => setFormData({...formData, courseName: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="input-label-swiss">Duration (Minutes)</label>
            <select 
              className="input-swiss bg-surface"
              value={formData.duration}
              onChange={e => setFormData({...formData, duration: e.target.value})}
            >
              <option value="15">15 MINUTES</option>
              <option value="30">30 MINUTES</option>
              <option value="60">60 MINUTES</option>
              <option value="120">120 MINUTES</option>
            </select>
          </div>
        </div>

        <div className="pt-12 flex items-center gap-8">
           <button 
             type="submit" 
             disabled={loading}
             className="btn-primary w-full md:w-auto px-16 h-16"
           >
             {loading ? 'TRANSMITTING...' : 'START SESSION'}
           </button>
           <button 
             type="button" 
             onClick={() => navigate('/professor')}
             className="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors"
           >
             CANCEL
           </button>
        </div>
      </form>
    </div>
  )
}
