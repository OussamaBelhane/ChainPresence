import React from 'react'
import { Routes, Route } from 'react-router-dom'
import AdminDashboard from '../components/admin/AdminDashboard.jsx'
import RegisterUser from '../components/admin/RegisterUser.jsx'
import UserList from '../components/admin/UserList.jsx'
import AuditLogs from '../components/admin/AuditLogs.jsx'

export default function AdminView() {
  return (
    <div className="w-full">
      <Routes>
        <Route index            element={<AdminDashboard />} />
        <Route path="register"  element={<RegisterUser />} />
        <Route path="users"     element={<UserList />} />
        <Route path="logs"      element={<AuditLogs />} />
      </Routes>
    </div>
  )
}
