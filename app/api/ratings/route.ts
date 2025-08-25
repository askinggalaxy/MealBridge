import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// POST /api/ratings
// Real implementation: inserts a rating (1-5) with optional comment for a completed donation
// Body: { donation_id: string, rated_id: string, rating: number, comment?: string }
// Security: relies on Supabase RLS to enforce that only donor/recipient involved in a completed reservation can rate.
export async function POST(req: Request) {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser()

  if (userErr || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = await req.json().catch(() => null) as {
    donation_id?: string
    rated_id?: string
    rating?: number
    comment?: string
  } | null

  if (!payload || !payload.donation_id || !payload.rated_id || typeof payload.rating !== 'number') {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const rating = Math.round(payload.rating)
  if (rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 })
  }

  if (payload.rated_id === user.id) {
    return NextResponse.json({ error: 'You cannot rate yourself' }, { status: 400 })
  }

  // Insert rating; RLS ensures correctness (completed reservation, proper counterpart, etc.)
  const { data, error } = await supabase
    .from('ratings')
    .insert({
      donation_id: payload.donation_id,
      rater_id: user.id,
      rated_id: payload.rated_id,
      rating,
      comment: payload.comment?.toString().slice(0, 2000) ?? null,
    })
    .select('*')
    .single()

  if (error) {
    // Unique violation -> already reviewed
    if (error.code === '23505') {
      return NextResponse.json({ error: 'You already left a review for this user on this donation.' }, { status: 409 })
    }

    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ data }, { status: 201 })
}
