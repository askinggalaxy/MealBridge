'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/utils/supabase/client'
import { ReviewDialog } from './review-dialog'
import { toast } from 'sonner'

// ReviewButton: shows a "Leave review" button if the current user is allowed to rate
// the counterpart for a reservation/donation and has not already reviewed them.
// Real Supabase queries are used to determine eligibility (completed reservation, existing rating).
export function ReviewButton(props: {
  donationId: string
  currentUserId: string
  donorId: string
  recipientId: string | null
  reservationStatus?: 'pending' | 'accepted' | 'declined' | 'completed' | 'canceled'
  className?: string
  size?: 'sm' | 'default' | 'lg' | 'icon'
  label?: string
}) {
  const { donationId, currentUserId, donorId, recipientId, reservationStatus, className, size, label } = props
  const supabase = createClient()

  // UI state
  const [eligible, setEligible] = useState<boolean>(false)
  const [ratedId, setRatedId] = useState<string | null>(null)
  const [alreadyReviewed, setAlreadyReviewed] = useState<boolean>(false)
  const [open, setOpen] = useState<boolean>(false)

  useEffect(() => {
    let mounted = true

    const run = async () => {
      try {
        // Must have a recipient to define counterpart relation on a reservation
        if (!donationId || !currentUserId || !donorId) return

        // Determine counterpart: if current user is donor -> counterpart is recipient; else -> donor
        let counterpart: string | null = null

        // If recipientId provided via props (on reservations page), use it; otherwise we will query below (for safety)
        if (currentUserId === donorId) {
          counterpart = recipientId ?? null
        } else {
          counterpart = donorId
        }

        // If counterpart not known or reservation not completed yet, check if there's any completed reservation for the donation involving current user
        if (!counterpart || reservationStatus !== 'completed') {
          const { data: resv, error: resErr } = await supabase
            .from('reservations')
            .select('*')
            .eq('donation_id', donationId)
            .eq('status', 'completed')

          if (resErr) {
            console.error('Failed to fetch reservations for eligibility:', resErr.message)
          }
          const list = (resv ?? []) as any[]
          // If user is donor, find completed reservation for this donation and take its recipient as counterpart
          if (currentUserId === donorId) {
            const completed = list[0]
            counterpart = completed?.recipient_id ?? counterpart
          } else {
            // If user is a recipient, confirm that there is a completed reservation for this donation involving them
            const mine = list.find((r) => r.recipient_id === currentUserId)
            if (!mine) counterpart = null
          }
        }

        if (!counterpart) {
          if (mounted) {
            setEligible(false)
            setRatedId(null)
          }
          return
        }

        // Check if current user already reviewed counterpart for this donation
        const { data: existing, error: ratingErr } = await supabase
          .from('ratings')
          .select('id')
          .eq('donation_id', donationId)
          .eq('rater_id', currentUserId)
          .eq('rated_id', counterpart)
          .maybeSingle()

        if (ratingErr && ratingErr.code !== 'PGRST116') {
          console.error('Failed to check existing rating:', ratingErr.message)
        }

        if (mounted) {
          setRatedId(counterpart)
          setAlreadyReviewed(!!existing)
          // Eligibility: reservation completed + no existing rating + user must be donor or recipient of this donation
          const isParty = currentUserId === donorId || currentUserId === counterpart
          const isCompleted = reservationStatus === 'completed' || !!ratedId // we checked completed reservations above
          setEligible(isParty && !!counterpart && !existing && isCompleted)
        }
      } catch (e: any) {
        console.error(e)
      }
    }

    run()
    return () => {
      mounted = false
    }
  }, [donationId, currentUserId, donorId, recipientId, reservationStatus])

  // Handle post-success UI update
  const handleSuccess = () => {
    setAlreadyReviewed(true)
    setEligible(false)
    toast.success('Review submitted')
  }

  if (!eligible || !ratedId || alreadyReviewed) return null

  return (
    <>
      <Button size={size ?? 'sm'} className={className ?? 'bg-green-600 hover:bg-green-700'} onClick={() => setOpen(true)}>
        {label ?? 'Leave review'}
      </Button>
      <ReviewDialog
        open={open}
        onClose={() => setOpen(false)}
        donationId={donationId}
        ratedId={ratedId}
        onSuccess={handleSuccess}
      />
    </>
  )
}
