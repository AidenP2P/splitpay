// lib/wagmi.ts
import { createConfig, http } from 'wagmi'
import { base } from 'viem/chains'
import { QueryClient } from '@tanstack/react-query'

// Client react-query (pour gérer le cache)
export const queryClient = new QueryClient()

// Ici on choisit la chaîne "Base mainnet"
const CHAIN = base

export const wagmiConfig = createConfig({
  chains: [CHAIN],
  transports: {
    [CHAIN.id]: http(), // utilise le RPC du wallet
  },
})
