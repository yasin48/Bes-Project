'use client'

import { useState } from 'react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

export function WalletConnection() {
  const { address, isConnected } = useAccount()
  const { connect, connectors, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const { user } = useAuth()
  const [isSaving, setIsSaving] = useState(false)

  const saveWalletAddress = async (walletAddress: string) => {
    if (!user) return

    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          email: user.email || '',
          wallet_address: walletAddress,
        })

      if (error) {
        console.error('Error saving wallet address:', error)
      } else {
        console.log('Wallet address saved successfully')
      }
    } catch (error) {
      console.error('Error saving wallet address:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleConnect = (connector: any) => {
    connect({ connector })
  }

  const handleDisconnect = () => {
    disconnect()
  }

  // Save wallet address when connected
  if (isConnected && address && user && !isSaving) {
    saveWalletAddress(address)
  }

  if (isConnected && address) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-900">Wallet Connected</h3>
            <p className="text-sm text-gray-500 font-mono">
              {address.slice(0, 6)}...{address.slice(-4)}
            </p>
          </div>
          <Button 
            onClick={handleDisconnect}
            variant="destructive"
            size="sm"
          >
            Disconnect
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="text-center">
        <div className="w-12 h-12 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <span className="text-blue-600 text-xl">🔗</span>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Connect Your Wallet</h3>
        <p className="text-sm text-gray-500 mb-6">
          Connect your wallet to receive tokens for your community participation.
        </p>
        
        <div className="space-y-3">
          {connectors.map((connector) => (
            <Button
              key={connector.uid}
              onClick={() => handleConnect(connector)}
              disabled={isPending}
              className="w-full"
              variant={connector.name.toLowerCase().includes('metamask') ? 'default' : 'outline'}
            >
              {isPending ? 'Connecting...' : `Connect ${connector.name}`}
            </Button>
          ))}
        </div>
        
        <p className="text-xs text-gray-400 mt-4">
          Make sure you're on the Sepolia testnet
        </p>
      </div>
    </div>
  )
}

export function WalletBalance() {
  const { address, isConnected } = useAccount()
  
  if (!isConnected || !address) {
    return null
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-4">
      <div className="flex items-center">
        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
          <span className="text-white text-sm font-bold">💰</span>
        </div>
        <div>
          <h4 className="text-sm font-medium text-gray-900">Wallet Address</h4>
          <p className="text-xs text-gray-600 font-mono">{address}</p>
        </div>
      </div>
    </div>
  )
}
