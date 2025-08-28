import { createConfig, http } from 'wagmi'
import { sepolia } from 'wagmi/chains'
import {  metaMask } from 'wagmi/connectors'

// Your deployed contract information
export const COMMUNAL_SCORE_TOKEN_ADDRESS = '0x494431f194ae0ad6328af03ac850c38a0aa639f9'

// Wagmi configuration for Sepolia testnet
export const config = createConfig({
  chains: [sepolia],
  connectors: [
    
    metaMask(),
    
  ],
  transports: {
    [sepolia.id]: http('https://eth-sepolia.g.alchemy.com/v2/k7BADKO5COc8bS0-URA5H'),
  },
  // Force default chain to Sepolia
  ssr: true,
})

// Contract ABI - Essential functions from your CommunalScoreToken
export const COMMUNAL_SCORE_TOKEN_ABI = [
  {
    "type": "function",
    "name": "redeem",
    "inputs": [
      {"name": "to", "type": "address"},
      {"name": "amount", "type": "uint256"},
      {"name": "reason", "type": "string"}
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "mint",
    "inputs": [
      {"name": "to", "type": "address"},
      {"name": "amount", "type": "uint256"},
      {"name": "reason", "type": "string"}
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "balanceOf",
    "inputs": [{"name": "account", "type": "address"}],
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "totalSupply",
    "inputs": [],
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "name",
    "inputs": [],
    "outputs": [{"name": "", "type": "string"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "symbol",
    "inputs": [],
    "outputs": [{"name": "", "type": "string"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "decimals",
    "inputs": [],
    "outputs": [{"name": "", "type": "uint8"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "owner",
    "inputs": [],
    "outputs": [{"name": "", "type": "address"}],
    "stateMutability": "view"
  },
  {
    "type": "event",
    "name": "TokensRedeemed",
    "inputs": [
      {"name": "to", "type": "address", "indexed": true},
      {"name": "amount", "type": "uint256", "indexed": false},
      {"name": "reason", "type": "string", "indexed": false}
    ]
  }
] as const

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}
