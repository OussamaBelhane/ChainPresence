import React from 'react'
import { Routes, Route } from 'react-router-dom'
import ProfessorDashboard from '../components/professor/ProfessorDashboard.jsx'
import CreateSession from '../components/professor/CreateSession.jsx'
import SessionList from '../components/professor/SessionList.jsx'
import ProfessorReports from '../components/professor/ProfessorReports.jsx'
import EnrollmentManager from '../components/professor/EnrollmentManager.jsx'

export default function ProfessorView() {
  return (
    <div className="w-full">
      <Routes>
        <Route index           element={<ProfessorDashboard />} />
        <Route path="session"  element={<CreateSession />} />
        <Route path="list"     element={<SessionList />} />
        <Route path="reports"  element={<ProfessorReports />} />
        <Route path="enrollments" element={<EnrollmentManager />} />
      </Routes>
    </div>
  )
}
