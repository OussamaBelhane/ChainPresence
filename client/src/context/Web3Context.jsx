import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import { ethers } from 'ethers'
import { SiweMessage } from 'siwe'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAccount, useDisconnect, useWalletClient, usePublicClient } from 'wagmi'
import { BrowserProvider, JsonRpcSigner } from 'ethers'

// Set axios defaults for cookies
axios.defaults.withCredentials = true
const API_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000'

const CONTRACT_ABI = [
  "function registerStudent(address wallet, string name) external",
  "function registerProfessor(address wallet, string name) external",
  "function removeUser(address wallet) external",
  "function openSession(string courseId, string courseName, uint256 duration) external returns (uint256)",
  "function activateSession(uint256 sessionId, string locationHash) external",
  "function closeSession(uint256 sessionId) external",
  "function checkIn(uint256 sessionId, bytes calldata signature) external",
  "function getSession(uint256 id) external view returns (tuple(uint256 id, string courseId, string courseName, address professor, uint128 openedAt, uint128 closedAt, bool isOpen, bool isActivated, uint256 duration, string locationHash))",
  "function getActiveSessions() external view returns (uint256[])",
  "function getSessionAttendees(uint256 sessionId) external view returns (address[])",
  "function getStudentAttendance(address student) external view returns (uint256[])",
  "function getAttendanceRate(address student) external view returns (uint256)",
  "function getAllSessions() external view returns (tuple(uint256 id, string courseId, string courseName, address professor, uint128 openedAt, uint128 closedAt, bool isOpen, bool isActivated, uint256 duration, string locationHash)[])",
  "function getRegisteredStudents() external view returns (address[])",
  "function getRegisteredProfessors() external view returns (address[])",
  "function userNames(address) external view returns (string)",
  "function userRole(address) external view returns (string)",
  "function hasRole(bytes32 role, address account) external view returns (bool)",
  "function sessionCount() external view returns (uint256)",
  "function onboard(string name, string role, string secret) external",
  "function setUserName(address wallet, string name) external",
  "function gpsSigner() external view returns (address)",
  "function setGpsSigner(address signer) external"
]

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS

const Web3Context = createContext(null)

// Helper to convert wagmi walletClient to ethers signer
export function walletClientToSigner(walletClient) {
  const { account, chain, transport } = walletClient
  const network = {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts?.ensRegistry?.address,
  }
  const provider = new BrowserProvider(transport, network)
  const signer = new JsonRpcSigner(provider, account.address)
  return signer
}

export function Web3Provider({ children }) {
  const { address: account, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()

  const [role,        setRole]        = useState(null)
  const [userName,    setUserName]    = useState(null)
  const [isLoggedIn,  setIsLoggedIn]  = useState(false)
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState(null)
  const [isAuthenticating, setIsAuthenticating] = useState(false)

  // Contract instance
  const contract = useMemo(() => {
    if (!CONTRACT_ADDRESS || !walletClient) return null
    try {
      const sanitizedAddress = ethers.getAddress(CONTRACT_ADDRESS)
      const signer = walletClientToSigner(walletClient)
      return new ethers.Contract(sanitizedAddress, CONTRACT_ABI, signer)
    } catch (err) {
      console.error("Contract initialization failed:", err)
      return null
    }
  }, [walletClient])

  const refreshRole = useCallback(async (addr) => {
    if (!contract || !addr) return
    try {
      const r = await contract.userRole(addr).catch(() => '')
      const n = await contract.userNames(addr).catch(() => '')
      const normalizedRole = r ? r.replace('_ROLE', '') : 'UNKNOWN'
      setRole(normalizedRole)
      setUserName(n)
      return { role: normalizedRole, name: n }
    } catch (err) {
      console.error("refreshRole error:", err)
    }
  }, [contract])

  // --- SIWE LOGIN FLOW ---
  const login = useCallback(async () => {
    if (!account || !walletClient || isAuthenticating || isLoggedIn) return
    setIsAuthenticating(true)
    
    try {
      const { data: nonce } = await axios.get(`${API_URL}/api/auth/nonce?address=${account}`)
      
      const signer = walletClientToSigner(walletClient)
      const chainId = await signer.provider.getNetwork().then(n => Number(n.chainId))

      const message = new SiweMessage({
        domain: window.location.host,
        address: ethers.getAddress(account),
        statement: 'ChainPresence Protocol Authentication',
        uri: window.location.origin,
        version: '1',
        chainId: chainId,
        nonce: nonce
      });

      const signature = await signer.signMessage(message.prepareMessage());

      const { data } = await axios.post(`${API_URL}/api/auth/verify`, {
        message,
        signature
      });

      if (data.success) {
        setIsLoggedIn(true)
        const normalizedRole = data.role ? data.role.replace('_ROLE', '') : 'UNKNOWN'
        setRole(normalizedRole)
        if (contract) {
          const n = await contract.userNames(account).catch(() => '')
          setUserName(n)
        }
        localStorage.setItem('cp_auth', '1')
        toast.success('Authenticated Successfully')
      }
    } catch (err) {
      // Silence common user rejection or authorization errors
      if (err.code === 4001 || err.code === 4100 || err.message?.includes('user rejected')) {
        console.log('Authentication cancelled by user.')
        return
      }
      
      console.error('Login failed:', err)
      const msg = err.response?.data?.error || err.message || 'Authentication failed.'
      toast.error(msg)
    } finally {
      setIsAuthenticating(false)
    }
  }, [account, walletClient, isAuthenticating, isLoggedIn, contract])

  const logout = useCallback(async () => {
    try {
      await axios.post(`${API_URL}/api/auth/logout`)
      setIsLoggedIn(false)
      setRole(null)
      localStorage.removeItem('cp_auth')
      disconnect()
    } catch (err) {
      console.error('Logout failed:', err)
    }
  }, [disconnect])

  // Auto-reconnect & Check session status
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data } = await axios.get(`${API_URL}/api/auth/status`)
        if (data.user) {
          setIsLoggedIn(true)
          const normalizedRole = data.user.role ? data.user.role.replace('_ROLE', '') : 'UNKNOWN'
          if (normalizedRole !== 'UNKNOWN') {
            setRole(normalizedRole)
          }
          
          if (data.user.address) {
            await refreshRole(data.user.address)
          }
        }
      } catch (err) {
        // Not logged in
      } finally {
        setLoading(false)
      }
    }
    checkSession()
  }, [contract])

  useEffect(() => {
    if (isConnected && isLoggedIn && account && contract) {
      refreshRole(account)
    }
  }, [isConnected, isLoggedIn, account, contract, refreshRole])

  // Auto-trigger SIWE when connected but not logged in via backend
  useEffect(() => {
    if (isConnected && !isLoggedIn && account && walletClient && !loading && !isAuthenticating && !localStorage.getItem('cp_auth')) {
      login();
    }
  }, [isConnected, isLoggedIn, account, walletClient, loading, isAuthenticating, login]);

  // Handle sudden disconnect
  useEffect(() => {
    if (!isConnected && isLoggedIn) {
      setIsLoggedIn(false);
      setRole(null);
      localStorage.removeItem('cp_auth');
    }
  }, [isConnected, isLoggedIn]);

  return (
    <Web3Context.Provider
      value={{
        account, contract, role, userName,
        isConnected, isLoggedIn, loading, error,
        disconnectWallet: disconnect, refreshRole, login, logout
      }}
    >
      {children}
    </Web3Context.Provider>
  )
}

export function useWeb3() {
  const ctx = useContext(Web3Context)
  if (!ctx) throw new Error('useWeb3 must be used inside Web3Provider')
  return ctx
}
