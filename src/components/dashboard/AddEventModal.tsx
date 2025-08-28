'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Event {
  id: string
  event_name: string
  metric_1: number
  metric_2: number
  calculated_score: number
  calculated_token_amount: number
  created_at: string
}

interface AddEventModalProps {
  open: boolean
  onClose: () => void
  onEventAdded: (event: Event) => void
}

export default function AddEventModal({ open, onClose, onEventAdded }: AddEventModalProps) {
  const { user } = useAuth()
  const [eventName, setEventName] = useState('')
  const [metric1, setMetric1] = useState('')
  const [metric2, setMetric2] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [calculatedScore, setCalculatedScore] = useState<number | null>(null)
  const [calculatedTokens, setCalculatedTokens] = useState<number | null>(null)

  // Calculate score and tokens whenever metrics change
  const calculateResults = (m1: number, m2: number) => {
    // Simple scoring algorithm: weighted average with bonus for high values
    const score = (m1 * 0.6 + m2 * 0.4) * (1 + Math.min(m1 + m2, 100) / 1000)
    const tokens = score * 0.1 // Convert score to tokens (10:1 ratio)
    
    setCalculatedScore(score)
    setCalculatedTokens(tokens)
  }

  const handleMetric1Change = (value: string) => {
    setMetric1(value)
    const m1 = parseFloat(value) || 0
    const m2 = parseFloat(metric2) || 0
    if (m1 >= 0 && m2 >= 0) {
      calculateResults(m1, m2)
    }
  }

  const handleMetric2Change = (value: string) => {
    setMetric2(value)
    const m1 = parseFloat(metric1) || 0
    const m2 = parseFloat(value) || 0
    if (m1 >= 0 && m2 >= 0) {
      calculateResults(m1, m2)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || calculatedScore === null || calculatedTokens === null) return

    setLoading(true)
    setError('')

    try {
      const eventData = {
        user_id: user.id,
        event_name: eventName,
        metric_1: Number(parseFloat(metric1).toFixed(2)),
        metric_2: Number(parseFloat(metric2).toFixed(2)),
        calculated_score: Number(calculatedScore.toFixed(2)),
        calculated_token_amount: Number(calculatedTokens.toFixed(2)),
      }
      const { data, error: insertError } = await supabase
        .from('events')
        .insert([eventData])
        .select()
        .single()

      if (insertError) {
        throw insertError
      }

      // Update user's total earnings
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email!,
          total_earnings: calculatedTokens,
        }, {
          onConflict: 'id',
          ignoreDuplicates: false,
        })
        .select()

      if (updateError) {
        console.error('Error updating profile:', updateError)
        // Don't throw here as the event was created successfully
      }

      onEventAdded(data)
    } catch (error: unknown) {
      console.error('Error adding event:', error)
      setError(error instanceof Error ? error.message : 'Failed to add event')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-white">
        <DialogHeader>
          <DialogTitle>Add New Event</DialogTitle>
          <DialogDescription className='bg-white'>
            Add a new community event to track your participation and earn tokens.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 bg-white">
          <div className="space-y-2">
            <Label htmlFor="eventName">Event Name</Label>
            <Input
              id="eventName"
              type="text"
              required
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="e.g., Community Cleanup Event"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="metric1">Metric 1</Label>
              <Input
                id="metric1"
                type="number"
                required
                min="0"
                step="1"
                value={metric1}
                onChange={(e) => handleMetric1Change(e.target.value)}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="metric2">Metric 2</Label>
              <Input
                id="metric2"
                type="number"
                required
                min="0"
                step="1"
                value={metric2}
                onChange={(e) => handleMetric2Change(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          {/* Results Section */}
          {calculatedScore !== null && calculatedTokens !== null && (
            <div className="bg-muted rounded-lg p-4 mt-4">
              <h4 className="text-sm font-medium mb-2">Calculated Results</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Calculated Score</p>
                  <p className="text-lg font-semibold text-primary">
                    {calculatedScore.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Token Amount</p>
                  <p className="text-lg font-semibold text-green-600">
                    {calculatedTokens.toFixed(2)} tokens
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Score = (Metric1 × 0.6 + Metric2 × 0.4) × bonus factor
              </p>
            </div>
          )}

          {error && (
            <div className="bg-destructive/15 border border-destructive/20 text-destructive px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || calculatedScore === null}
            >
              {loading ? 'Adding...' : 'Add Event'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
