'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

// ReviewDialog: a reusable dialog that allows a user to select a 1-5 star rating
// and optionally write a short comment. It POSTS to our real API route `/api/ratings`.
// No mocking/simulation: it performs an actual network request.
export function ReviewDialog(props: {
  open: boolean
  onClose: () => void
  donationId: string
  ratedId: string
  onSuccess?: () => void
}) {
  const { open, onClose, donationId, ratedId, onSuccess } = props

  // Local UI state for rating stars and comment input. We keep them controlled for UX clarity.
  const [rating, setRating] = useState<number>(5)
  const [hover, setHover] = useState<number | null>(null)
  const [comment, setComment] = useState<string>('')
  const [submitting, setSubmitting] = useState<boolean>(false)

  // Helper to render 5 stars, allowing hover and click selection.
  const renderStars = () => {
    return (
      <div className="flex gap-1" aria-label="Rate from 1 to 5 stars">
        {[1, 2, 3, 4, 5].map((i) => {
          const active = (hover ?? rating) >= i
          return (
            <button
              key={i}
              type="button"
              className={`text-2xl ${active ? 'text-yellow-500' : 'text-gray-300'}`}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onClick={() => setRating(i)}
              aria-label={`${i} star${i > 1 ? 's' : ''}`}
            >
              ★
            </button>
          )
        })}
      </div>
    )
  }

  // Submit handler: posts to /api/ratings with donation_id, rated_id, rating, comment.
  const handleSubmit = async () => {
    try {
      setSubmitting(true)
      const res = await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ donation_id: donationId, rated_id: ratedId, rating, comment }),
      })

      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j?.error || `Failed to submit review (${res.status})`)
      }

      toast.success('Thank you for your review!')
      onClose()
      onSuccess?.()
    } catch (err: any) {
      toast.error(err?.message || 'Failed to submit review')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Leave a review</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">Rate your experience</p>
            {renderStars()}
          </div>

          <div>
            <p className="text-sm text-gray-600 mb-2">Optional comment</p>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={2000}
              placeholder="Write a few words about your experience..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting} className="bg-green-600 hover:bg-green-700">
            {submitting ? 'Submitting...' : 'Submit review'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
