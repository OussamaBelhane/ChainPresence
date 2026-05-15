import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import { Web3Provider } from './context/Web3Context.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import './index.css'

// Web3Modal + Wagmi Imports
import { createWeb3Modal, defaultWagmiConfig } from '@web3modal/wagmi/react'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { localhost } from 'wagmi/chains'

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'placeholder_id_for_local_dev'

if (!import.meta.env.VITE_WALLETCONNECT_PROJECT_ID) {
  console.warn('VITE_WALLETCONNECT_PROJECT_ID is missing in .env. Some wallet features may be limited.')
}

// 1. Create Restricted wagmiConfig
const metadata = {
  name: 'ChainPresence',
  description: 'Decentralized Attendance Protocol',
  url: window.location.origin,
  icons: ['https://avatars.githubusercontent.com/u/37784886']
}

const customLocalhost = {
  ...localhost,
  rpcUrls: {
    default: { http: [import.meta.env.VITE_GANACHE_URL || 'http://127.0.0.1:7545'] },
    public: { http: [import.meta.env.VITE_GANACHE_URL || 'http://127.0.0.1:7545'] },
  },
}

const chains = [customLocalhost]
const config = defaultWagmiConfig({ 
  chains, 
  projectId, 
  metadata,
  auth: {
    email: false,
    socials: [],
    showWallets: true,
    walletFeatures: false
  },
  enableEmail: false,
  enableSocials: false
})

// 2. Create Modal with MetaMask ALWAYS featured
createWeb3Modal({ 
  wagmiConfig: config, 
  projectId, 
  chains,
  enableAnalytics: false,
  enableOnramp: false,
  enableEmail: false,
  enableSocials: false,
  featuredWalletIds: [
    'c5744173831395483584775d8a3a8383', // MetaMask
  ],
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#6366F1',
    '--w3m-border-radius-master': '1px',
    '--w3m-font-family': 'Outfit, sans-serif',
  }
})

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Web3Provider>
            <AuthProvider>
              <App />
              <Toaster position="top-right" />
            </AuthProvider>
          </Web3Provider>
        </BrowserRouter>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
)
