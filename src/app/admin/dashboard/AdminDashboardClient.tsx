'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Database } from '@/lib/database.types';
import { getTransactionsForEvent } from '../actions';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useWriteContract, useWaitForTransactionReceipt, useAccount, useSwitchChain, useChainId, useConnect, useDisconnect } from 'wagmi';
import { COMMUNAL_SCORE_TOKEN_ADDRESS, COMMUNAL_SCORE_TOKEN_ABI } from '@/lib/wagmi';
import { supabase } from '@/lib/supabase';
import { parseUnits } from 'viem';
import { sepolia } from 'wagmi/chains';

type Event = Database['public']['Tables']['events']['Row'];
type Transaction = Database['public']['Tables']['transactions']['Row'];

interface AdminDashboardClientProps {
  initialEvents: Event[];
}

export default function AdminDashboardClient({ initialEvents }: AdminDashboardClientProps) {
  const [events, setEvents] = useState<Event[]>(initialEvents);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isDialogVisible, setIsDialogVisible] = useState(false);
  const [isConfirmationDialogVisible, setIsConfirmationDialogVisible] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const { signOut } = useAuth();
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { connect, connectors, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  
  // Check if we're on the correct network (Sepolia)
  const isOnCorrectNetwork = chainId === sepolia.id;
  
  // Wagmi hooks for contract interaction
  const { writeContract, data: hash, error, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const handleRowClick = async (event: Event) => {
    setSelectedEvent(event);
    const fetchedTransactions = await getTransactionsForEvent(event.id);
    setTransactions(fetchedTransactions);
    setIsDialogVisible(true);
  };

  const handleSendTokens = async () => {
    if (!selectedEvent || !isConnected || !address) {
      alert('Please connect your admin wallet first');
      return;
    }

    // Check if we're on the correct network
    if (!isOnCorrectNetwork) {
      try {
        alert('Switching to Sepolia testnet...');
        await switchChain({ chainId: sepolia.id });
        // Wait a moment for the network switch to complete
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        alert('Please manually switch to Sepolia testnet in MetaMask');
        return;
      }
    }

    setIsSending(true);

    try {
      // 1. Get user's wallet address from database
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('wallet_address')
        .eq('id', selectedEvent.user_id)
        .single();

      if (userError || !userData?.wallet_address) {
        alert('User has not connected their wallet yet');
        setIsSending(false);
        return;
      }

      // 2. Convert token amount to Wei (18 decimals)
      const tokenAmount = selectedEvent.calculated_token_amount || 0;
      const tokenAmountWei = parseUnits(tokenAmount.toString(), 18);

      // 3. Call smart contract redeem function
      writeContract({
        address: COMMUNAL_SCORE_TOKEN_ADDRESS,
        abi: COMMUNAL_SCORE_TOKEN_ABI,
        functionName: 'redeem',
        args: [
          userData.wallet_address as `0x${string}`,
          tokenAmountWei,
          `Event: ${selectedEvent.event_name}`
        ],
      });

    } catch (error) {
      console.error('Error sending tokens:', error);
      alert('Failed to send tokens. Please try again.');
      setIsSending(false);
    }
  };

  // Handle transaction confirmation
  const handleTransactionConfirmed = async () => {
    if (!isConfirmed || !hash || !selectedEvent) return;

    try {
      // 4. Save transaction to database
      const { error: txError } = await supabase
        .from('transactions')
        .insert({
          user_id: selectedEvent.user_id,
          event_id: selectedEvent.id,
          amount: selectedEvent.calculated_token_amount,
          transaction_hash: hash,
        });

      if (txError) {
        console.error('Error saving transaction:', txError);
      }

      // 5. Mark event as redeemed
      const { error: eventError } = await supabase
        .from('events')
        .update({ is_redeemed: true })
        .eq('id', selectedEvent.id);

      if (eventError) {
        console.error('Error updating event:', eventError);
      }

      // 6. Update local state
      setEvents(events.map(event => 
        event.id === selectedEvent.id 
          ? { ...event, is_redeemed: true }
          : event
      ));

      // 7. Show success message
      setConfirmationMessage(
        `✅ Success! ${selectedEvent.calculated_token_amount} CST tokens transferred to user.\nTransaction: ${hash}`
      );
      setIsDialogVisible(false);
      setIsConfirmationDialogVisible(true);
      setIsSending(false);

    } catch (error) {
      console.error('Error handling transaction confirmation:', error);
      setIsSending(false);
    }
  };

  // Watch for transaction confirmation
  if (isConfirmed && hash && selectedEvent && isSending) {
    handleTransactionConfirmed();
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <p className="text-gray-600">Manage events and token distributions</p>
        </div>
        <div className="flex items-center gap-4">
          
          <Button onClick={() => router.push('/')}>Go to Home</Button>
          <Button onClick={signOut} variant="destructive">Sign Out</Button>
        </div>
      </div>

      {/* Admin Wallet Management Section */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Wallet Management</h2>
        
        {isConnected ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Wallet Status */}
            <div className={`border rounded-lg p-4 ${
              isOnCorrectNetwork 
                ? 'bg-green-50 border-green-200' 
                : 'bg-orange-50 border-orange-200'
            }`}>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Connection Status</h3>
              <div className="space-y-2">
                <p className={`text-sm ${
                  isOnCorrectNetwork ? 'text-green-700' : 'text-orange-700'
                }`}>
                  {isOnCorrectNetwork ? '🟢 Connected to Sepolia' : '🟡 Wrong Network'}
                </p>
                <p className="text-xs text-gray-600 font-mono">
                  {address}
                </p>
                {!isOnCorrectNetwork && (
                  <p className="text-xs text-orange-600">
                    Network will auto-switch when sending tokens
                  </p>
                )}
              </div>
            </div>

            {/* Wallet Actions */}
            <div className="border rounded-lg p-4 bg-gray-50 border-gray-200">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Actions</h3>
              <div className="space-y-3">
                <Button
                  onClick={() => disconnect()}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  🔌 Disconnect Wallet
                </Button>
                {!isOnCorrectNetwork && (
                  <Button
                    onClick={() => switchChain({ chainId: sepolia.id })}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    🔄 Switch to Sepolia
                  </Button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-blue-600 text-2xl">🔗</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Connect Admin Wallet</h3>
            <p className="text-sm text-gray-500 mb-6">
              Connect the admin wallet that has CST tokens to send rewards to users.
            </p>
            <div className="flex justify-center gap-3">
              {connectors.map((connector) => (
                <Button
                  key={connector.uid}
                  onClick={() => connect({ connector })}
                  disabled={isConnecting}
                  variant={connector.name.toLowerCase().includes('metamask') ? 'default' : 'outline'}
                >
                  {isConnecting ? 'Connecting...' : `Connect ${connector.name}`}
                </Button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-4">
              Expected admin wallet: 0x33673...8Be65
            </p>
          </div>
        )}
      </div>

      <div className="bg-white shadow rounded-lg p-4">
        <h2 className="text-xl font-semibold mb-2">All Events</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tokens</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Redeemed</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {events.map((event) => (
                <tr key={event.id} onClick={() => handleRowClick(event)} className="hover:bg-gray-50 cursor-pointer">
                  <td className="px-6 py-4 whitespace-nowrap">{event.event_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{event.user_id}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{event.calculated_score}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{event.calculated_token_amount}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{event.is_redeemed ? 'Yes' : 'No'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {selectedEvent && (
        <Dialog open={isDialogVisible} onOpenChange={setIsDialogVisible}>
          <DialogContent className='bg-white'>
            <DialogHeader>
              <DialogTitle>Event Details</DialogTitle>
              <DialogDescription>
                Detailed information about the event and its transactions.
              </DialogDescription>
            </DialogHeader>
            <div className="overflow-y-auto max-h-[70vh] space-y-6 p-1">
              <div className="border rounded-lg p-4 bg-gray-50/50">
                <div className="grid gap-y-2">
                  {Object.entries(selectedEvent).map(([key, value], index) => (
                    <div key={key} className={`grid grid-cols-3 items-center gap-4 p-2 rounded-md ${index % 2 === 0 ? 'bg-white' : 'bg-gray-100'}`}>
                      <p className="col-span-1 font-medium text-sm text-gray-600 capitalize">{key.replace(/_/g, ' ')}</p>
                      <p className="col-span-2 text-sm text-gray-800">{String(value)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border rounded-lg p-4 bg-gray-50/50">
                  <h3 className="font-semibold text-lg mb-4 text-gray-800">Transactions</h3>
                  {transactions.length > 0 ? (
                      <div className="overflow-x-auto rounded-lg border">
                          <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-100">
                                  <tr>
                                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction Hash</th>
                                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                  </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                  {transactions.map((tx) => (
                                      <tr key={tx.id} className="hover:bg-gray-100 transition-colors">
                                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-mono">{tx.transaction_hash}</td>
                                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{tx.amount}</td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                      </div>
                  ) : (
                      <p className="text-sm text-gray-500 mt-2">No transactions for this event.</p>
                  )}
              </div>
            </div>
            <DialogFooter>
              <button 
                className='bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors' 
                onClick={() => setIsDialogVisible(false)}
                disabled={isSending || isPending || isConfirming}
              >
                Cancel
              </button>
              
              {!isConnected ? (
                <div className="text-red-600 text-sm">
                  ⚠️ Please connect your admin wallet first
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {!isOnCorrectNetwork && (
                    <div className="text-orange-600 text-sm">
                      🟡 Will switch to Sepolia testnet when sending
                    </div>
                  )}
                  <button 
                  className={`px-4 py-2 rounded-md transition-colors text-white ${
                    isSending || isPending || isConfirming
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : Boolean(selectedEvent?.is_redeemed)
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-500 hover:bg-blue-600'
                  }`}
                  onClick={handleSendTokens}
                  disabled={isSending || isPending || isConfirming || Boolean(selectedEvent?.is_redeemed)}
                >
                  {Boolean(selectedEvent?.is_redeemed) ? (
                    '✅ Already Redeemed'
                  ) : isSending || isPending ? (
                    '🔄 Sending Transaction...'
                  ) : isConfirming ? (
                    '⏳ Confirming...'
                  ) : (
                    `Send ${selectedEvent?.calculated_token_amount} CST tokens`
                  )}
                  </button>
                </div>
              )}
              
              {error && (
                <div className="text-red-600 text-sm mt-2">
                  Error: {error.message}
                </div>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {isConfirmationDialogVisible && (
        <Dialog open={isConfirmationDialogVisible} onOpenChange={setIsConfirmationDialogVisible}>
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle>Transfer Confirmation</DialogTitle>
            </DialogHeader>
            <p>{confirmationMessage}</p>
            <DialogFooter>
              <Button onClick={() => setIsConfirmationDialogVisible(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
