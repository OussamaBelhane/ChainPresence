import { useWeb3 } from '../context/Web3Context.jsx'

/**
 * Convenience hook exposing wallet state.
 */
export function useWallet() {
  const { account, isConnected, role, userName, connectWallet, disconnectWallet, error } = useWeb3()
  return { account, isConnected, role, userName, connectWallet, disconnectWallet, error }
}
