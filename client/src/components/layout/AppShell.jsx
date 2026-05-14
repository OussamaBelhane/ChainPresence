import React from 'react'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import { motion, AnimatePresence } from 'framer-motion'
import { useWeb3 } from '../../context/Web3Context'
import { useLocation } from 'react-router-dom'

export default function AppShell({ children }) {
  const { role } = useWeb3()
  const location = useLocation()

  const getPageTitle = () => {
    const path = location.pathname
    if (path.includes('/admin')) return 'ADMINISTRATION'
    if (path.includes('/professor')) return 'FACULTY MANAGEMENT'
    if (path.includes('/student')) return 'STUDENT PLATFORM'
    return 'CHAINPRESENCE'
  }

  return (
    <div className="bg-[#0A0A0A] min-h-screen font-sans relative overflow-x-hidden">
      <div className="bg-grid" />
      <div className="bg-noise" />
      
      <Sidebar />

      <main className="lg:pl-60 flex flex-col min-h-screen">
        <Topbar title={getPageTitle()} />
        
        <div className="flex-1 p-6 lg:p-10 max-w-[1600px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}
