import React from 'react'
import { Routes, Route } from 'react-router-dom'
import StudentDashboard from '../components/student/StudentDashboard.jsx'
import AttendanceHistory from '../components/student/AttendanceHistory.jsx'
import GpsCheckIn from '../components/student/GpsCheckIn.jsx'
import CourseBrowser from '../components/student/CourseBrowser.jsx'

export default function StudentView() {
  return (
    <div className="w-full">
      <Routes>
        <Route index           element={<StudentDashboard />} />
        <Route path="history"  element={<AttendanceHistory />} />
        <Route path="checkin"  element={<GpsCheckIn />} />
        <Route path="catalog"  element={<CourseBrowser />} />
      </Routes>
    </div>
  )
}
