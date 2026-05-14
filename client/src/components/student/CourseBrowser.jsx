import React, { useEffect, useState } from 'react'
import { useWeb3 } from '../../context/Web3Context'
import { fetchAllSessions } from '../../utils/contractHelpers'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'

const API_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000'

export default function CourseBrowser() {
  const { contract, account, userName } = useWeb3()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [courses, setCourses] = useState([])
  const [enrollments, setEnrollments] = useState([])

  useEffect(() => {
    const load = async () => {
      if (!contract || !account) return
      try {
        const allSessions = await fetchAllSessions(contract)
        const uniqueCourses = []
        const seen = new Set()
        allSessions.forEach(s => {
          if (!seen.has(s.courseId)) {
            seen.add(s.courseId)
            uniqueCourses.push({
              courseId: s.courseId,
              courseName: s.courseName,
              professorAddress: s.professor
            })
          }
        })
        setCourses(uniqueCourses)
        const { data } = await axios.get(`${API_URL}/api/enrollments/student/${account}`, {
          withCredentials: true
        })
        setEnrollments(data.enrollments || [])
      } catch (err) {
        console.error('CourseBrowser error:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [contract, account])

  const handleApply = async (course) => {
    const toastId = toast.loading('Submitting application...')
    try {
      const { data } = await axios.post(`${API_URL}/api/enrollments/apply`, {
        courseId: course.courseId,
        courseName: course.courseName,
        professorAddress: course.professorAddress,
        studentName: userName || "Anonymous Student"
      }, { withCredentials: true })
      setEnrollments([...enrollments, data.enrollment])
      toast.success('Submitted', { id: toastId })
    } catch (err) {
      toast.error('Failed', { id: toastId })
    }
  }

  const getEnrollmentStatus = (courseId) => {
    return enrollments.find(e => e.courseId === courseId)?.status
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
            STUDENT PLATFORM
          </span>
          <h1 className="text-6xl font-black text-white mt-4 uppercase tracking-tighter">
            Course Catalog
          </h1>
        </div>
        <button onClick={() => navigate('/student')} className="btn-outline">
          BACK TO DASHBOARD
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-white/5 border border-white/5">
        {courses.length === 0 ? (
          <div className="col-span-full py-32 text-center bg-surface">
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em]">NO COURSES AVAILABLE</p>
          </div>
        ) : (
          courses.map((course) => {
            const status = getEnrollmentStatus(course.courseId)
            return (
              <div key={course.courseId} className="bg-surface p-12 hover:bg-white/[0.03] transition-all">
                <div className="mb-8">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{course.courseId}</span>
                  <h3 className="text-3xl font-black text-white mt-2 uppercase">{course.courseName}</h3>
                </div>
                
                <div className="mb-12">
                   <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1">FACULTY ADVISOR</p>
                   <p className="text-[10px] font-mono text-white truncate">{course.professorAddress}</p>
                </div>

                <div>
                  {!status ? (
                    <button 
                      onClick={() => handleApply(course)}
                      className="btn-primary w-full"
                    >
                      REQUEST ENROLLMENT
                    </button>
                  ) : (
                    <div className={`py-4 text-[10px] font-black text-center uppercase tracking-widest border border-white/10 ${
                      status === 'APPROVED' ? 'text-emerald-400 border-emerald-400/20' :
                      status === 'PENDING' ? 'text-amber-400 border-amber-400/20' :
                      'text-rose-400 border-rose-400/20'
                    }`}>
                      {status === 'APPROVED' ? 'ENROLLMENT ACTIVE' : 
                       status === 'PENDING' ? 'UNDER REVIEW' : 
                       'DENIED'}
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
