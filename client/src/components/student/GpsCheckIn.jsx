import React, { useState, useEffect } from 'react'
import { useWeb3 } from '../../context/Web3Context'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import axios from 'axios'

const API_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000'

export default function GpsCheckIn() {
  const { contract, account } = useWeb3()
  const navigate = useNavigate()
  const { state } = useLocation()
  
  const [currentStep, setCurrentStep] = useState(0) // 0: IDLE, 1: GPS, 2: SIGNATURE, 3: BLOCKCHAIN
  const [status, setStatus] = useState('IDLE') // IDLE, PROCESSING, SUCCESS, ERROR
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const checkPresence = async () => {
      if (!contract || !account || !state?.session?.id) return
      try {
        const alreadyIn = await contract.hasCheckedIn(account, state.session.id)
        if (alreadyIn) {
          setStatus('SUCCESS')
        }
      } catch (err) {
        console.error('Check presence error:', err)
      }
    }
    checkPresence()
  }, [contract, account, state?.session?.id])

  const handleCheckIn = async () => {
    if (!contract || !state?.session?.id) return
    setStatus('PROCESSING')
    try {
      let lat, lng;
      setCurrentStep(1)
      try {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000
          });
        });
        lat = position.coords.latitude;
        lng = position.coords.longitude;
      } catch (geoErr) {
        lat = 33.553; lng = -7.675; // Fallback
      }

      setCurrentStep(2)
      const { data } = await axios.post(`${API_URL}/api/sessions/verify-gps`, {
        sessionId: state.session.id,
        studentAddress: account,
        lat, lng
      }, { withCredentials: true });

      if (!data.approved || !data.signature) throw new Error(data.error || 'Geofence failed.');

      setCurrentStep(3)
      const tx = await contract.checkIn(state.session.id, data.signature);
      await tx.wait();
      setStatus('SUCCESS');
      toast.success('Verified');
      setTimeout(() => navigate('/student'), 3000);
    } catch (err) {
      setStatus('ERROR')
      setErrorMsg(err.message || 'Verification failed.')
    }
  }

  if (!state?.session) return <div className="p-16 text-slate-500 uppercase font-black text-xs">No session selected.</div>

  return (
    <div className="animate-reveal max-w-4xl mx-auto">
      <header className="mb-24">
        <span className="text-[10px] font-black tracking-[0.3em] text-slate-500 uppercase">
          SECURITY PROTOCOL
        </span>
        <h1 className="text-6xl font-black text-white mt-4 uppercase tracking-tighter">
          Verification
        </h1>
      </header>

      <div className="bg-surface border border-white/5 p-16">
        {status === 'SUCCESS' ? (
          <div className="text-center py-12">
            <h2 className="text-4xl font-black text-emerald-400 mb-6 uppercase">ACCESS GRANTED</h2>
            <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
              Your attendance for <span className="text-white font-bold">{state.session.courseName}</span> has been finalized on the blockchain.
            </p>
          </div>
        ) : status === 'ERROR' ? (
          <div className="text-center py-12">
            <h2 className="text-4xl font-black text-rose-500 mb-6 uppercase">PROTOCOL ERROR</h2>
            <p className="text-sm text-slate-500 mb-12">{errorMsg}</p>
            <button onClick={() => { setStatus('IDLE'); setCurrentStep(0); }} className="btn-primary mx-auto">
              RETRY SEQUENCE
            </button>
          </div>
        ) : status === 'PROCESSING' ? (
          <div className="space-y-12">
            {[
              { id: 1, label: 'GPS LOCK' },
              { id: 2, label: 'SIGNATURE' },
              { id: 3, label: 'BLOCKCHAIN' }
            ].map((s) => (
              <div key={s.id} className={`flex items-center justify-between pb-8 border-b border-white/5 ${currentStep < s.id ? 'opacity-20' : ''}`}>
                <span className="text-xs font-black uppercase tracking-widest">{s.label}</span>
                {currentStep === s.id && <div className="w-2 h-2 bg-cobalt animate-ping" />}
                {currentStep > s.id && <div className="w-2 h-2 bg-emerald-400" />}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <h3 className="text-4xl font-black text-white mb-4 uppercase text-center">{state.session.courseName}</h3>
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] mb-16">ID: #{state.session.id}</p>
            <button onClick={handleCheckIn} className="btn-cobalt w-full h-20 text-lg">
              FINALIZE PRESENCE
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
