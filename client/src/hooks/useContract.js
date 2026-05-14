import { useWeb3 } from '../context/Web3Context.jsx'

/**
 * Returns the contract instance from Web3Context.
 * Throws if not connected.
 */
export function useContract() {
  const { contract } = useWeb3()
  return contract
}
