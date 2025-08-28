'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import AddEventModal from '@/components/dashboard/AddEventModal'
import { Button } from '@/components/ui/button'
import { useUser } from '@/contexts/UserContext'
import { useRouter } from 'next/navigation'
import { WalletConnection, WalletBalance } from '@/components/wallet/WalletConnection'

interface Event {
  id: string
  event_name: string
  metric_1: number
  metric_2: number
  calculated_score: number
  calculated_token_amount: number
  created_at: string
}

export default function Dashboard() {
  const { user, signOut } = useAuth()
  const { userProfile, loading: userLoading } = useUser();
  const router = useRouter();

  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddEvent, setShowAddEvent] = useState(false)

  useEffect(() => {
    if (!userLoading && userProfile?.is_Admin) {
      router.push('/admin/dashboard');
    }
  }, [userProfile, userLoading, router]);

  const fetchEvents = useCallback(async () => {
    if (!user) return

    setLoading(true);
    try {
      // Fetch user events
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (eventsError) {
        console.error('Error fetching events:', eventsError)
      } else {
        setEvents(eventsData || [])
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      fetchEvents()
    }
  }, [user, fetchEvents])

  const handleEventAdded = (newEvent: Event) => {
    setEvents([newEvent, ...events])
    setShowAddEvent(false)
    // We don't need to fetch profile data again, it's handled by the context
  }

  if (loading || userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  // Render nothing or a placeholder if redirecting
  if (userProfile?.is_Admin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Community Dashboard</h1>
              <p className="text-gray-600">Welcome back, {user?.email}</p>
            </div>
            <Button
              onClick={signOut}
              variant="destructive"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Wallet Connection Section */}
        <div className="mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Wallet</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <WalletConnection />
            <WalletBalance />
          </div>
        </div>
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                    <span className="text-white font-bold">#</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Events
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {events.length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                    <span className="text-white font-bold">⭐</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Avg Score
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {events.length > 0 
                        ? (events.reduce((acc, event) => acc + event.calculated_score, 0) / events.length).toFixed(1)
                        : '0.0'
                      }
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Add Event Button */}
        <div className="mb-6">
          <Button
            onClick={() => setShowAddEvent(true)}
            className="inline-flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add New Event
          </Button>
        </div>

        {/* Events List */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Past Events</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Your community participation history
            </p>
          </div>
          
          {events.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-gray-400 text-xl">📅</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No events yet</h3>
              <p className="text-gray-500 mb-4">Start participating in community events to earn tokens!</p>
              <Button
                onClick={() => setShowAddEvent(true)}
              >
                Add Your First Event
              </Button>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {events.map((event) => (
                <li key={event.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-indigo-600 truncate">
                          {event.event_name}
                        </h4>
                        <div className="mt-2 sm:flex sm:justify-between">
                          <div className="sm:flex">
                            <p className="flex items-center text-sm text-gray-500">
                              <span className="mr-4">Metric 1: {event.metric_1}</span>
                              <span>Metric 2: {event.metric_2}</span>
                            </p>
                          </div>
                          <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                            <p>
                              {new Date(event.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="ml-4 flex-shrink-0 text-right">
                        <div className="text-sm font-medium text-gray-900">
                          Score: {event.calculated_score.toFixed(1)}
                        </div>
                        <div className="text-sm text-green-600 font-medium">
                          +{event.calculated_token_amount.toFixed(2)} tokens
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>

      {/* Add Event Modal */}
      <AddEventModal
        open={showAddEvent}
        onClose={() => setShowAddEvent(false)}
        onEventAdded={handleEventAdded}
      />
    </div>
  )
}
