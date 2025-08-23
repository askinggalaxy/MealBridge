'use client';

import { useState, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface ReservationActionsProps {
  reservationId: string; // reservations.id
  donationId: string; // donations.id (for messages link)
  donorId: string; // current user id (donor)
  recipientId: string; // recipient user id
  currentStatus: 'pending' | 'accepted' | 'declined' | 'completed' | 'canceled';
}

// Simple action bar that lets the donor approve/decline a reservation and optionally provide pickup details message
export default function ReservationActions({
  reservationId,
  donationId,
  donorId,
  recipientId,
  currentStatus,
}: ReservationActionsProps) {
  const supabase = createClient();
  const router = useRouter();

  // Local UI state for composing a short message and optional pickup time
  const [message, setMessage] = useState<string>('Pickup details: please come at ...');
  const [pickupTime, setPickupTime] = useState<string>(''); // ISO string e.g. 2025-08-24T10:30
  const [loading, setLoading] = useState<'approve' | 'decline' | null>(null);
  const [confirmOpen, setConfirmOpen] = useState<boolean>(false);

  const approve = useCallback(async () => {
    try {
      setLoading('approve');

      // 1) Update reservation status to accepted and set pickup_time if provided
      const { error: updErr } = await supabase
        .from('reservations')
        .update({ status: 'accepted', pickup_time: pickupTime ? new Date(pickupTime).toISOString() : null })
        .eq('id', reservationId);
      if (updErr) throw updErr;

      // 1b) Update donation status to reserved so UI reflects "Reserved"
      const { error: donErr } = await supabase
        .from('donations')
        .update({ status: 'reserved' })
        .eq('id', donationId);
      if (donErr) throw donErr;

      // 2) Send a message from donor -> recipient with provided details (enforced by RLS)
      const { error: msgErr } = await supabase
        .from('messages')
        .insert({
          donation_id: donationId,
          sender_id: donorId,
          recipient_id: recipientId,
          content: message || 'Your reservation has been accepted.',
        });
      if (msgErr) throw msgErr;

      // 3) Create a notification for the recipient
      const { error: notifErr } = await supabase
        .from('notifications')
        .insert({
          user_id: recipientId,
          type: 'reservation_accepted',
          title: 'Reservation accepted',
          message: 'Your reservation was accepted. Check messages for pickup details.',
          is_read: false,
        });
      if (notifErr) throw notifErr;

      // 4) Auto-decline all OTHER pending reservations for this donation
      //    a) Read recipients to notify
      const { data: others, error: readErr } = await supabase
        .from('reservations')
        .select('id, recipient_id')
        .eq('donation_id', donationId)
        .eq('status', 'pending')
        .neq('id', reservationId);
      if (readErr) throw readErr;

      if (others && others.length > 0) {
        //    b) Decline them in one shot
        const { error: bulkUpdErr } = await supabase
          .from('reservations')
          .update({ status: 'declined' })
          .eq('donation_id', donationId)
          .eq('status', 'pending')
          .neq('id', reservationId);
        if (bulkUpdErr) throw bulkUpdErr;

        //    c) Notify affected recipients
        const notifications = others.map((o) => ({
          user_id: o.recipient_id as string,
          type: 'reservation_declined',
          title: 'Reservation unavailable',
          message: 'Another request was accepted for this donation.',
          is_read: false,
        }));
        if (notifications.length > 0) {
          const { error: nErr } = await supabase.from('notifications').insert(notifications);
          if (nErr) throw nErr;
        }
      }

      toast.success('Reservation approved and message sent');
      router.refresh();
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to approve reservation');
    } finally {
      setLoading(null);
    }
  }, [supabase, reservationId, pickupTime, donationId, donorId, recipientId, message, router]);

  const decline = useCallback(async () => {
    try {
      setLoading('decline');

      // 1) Update reservation status to declined
      const { error: updErr } = await supabase
        .from('reservations')
        .update({ status: 'declined' })
        .eq('id', reservationId);
      if (updErr) throw updErr;

      // 2) Optional courtesy message to recipient
      if (message) {
        const { error: msgErr } = await supabase
          .from('messages')
          .insert({
            donation_id: donationId,
            sender_id: donorId,
            recipient_id: recipientId,
            content: message,
          });
        if (msgErr) throw msgErr;
      }

      // 3) Notify the recipient
      const { error: notifErr } = await supabase
        .from('notifications')
        .insert({
          user_id: recipientId,
          type: 'reservation_declined',
          title: 'Reservation declined',
          message: 'Your reservation request was declined.',
          is_read: false,
        });
      if (notifErr) throw notifErr;

      toast.success('Reservation declined');
      router.refresh();
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to decline reservation');
    } finally {
      setLoading(null);
    }
  }, [supabase, reservationId, donationId, donorId, recipientId, message, router]);

  // When already accepted/declined, hide actions
  // Extra action when accepted: mark as donated (complete flow)
  const performMarkDonated = useCallback(async () => {
    try {
      setLoading('approve');
      // Set reservation to completed
      const { error: rErr } = await supabase
        .from('reservations')
        .update({ status: 'completed' })
        .eq('id', reservationId);
      if (rErr) throw rErr;

      // Set donation to picked_up (donated)
      const { error: dErr } = await supabase
        .from('donations')
        .update({ status: 'picked_up' })
        .eq('id', donationId);
      if (dErr) throw dErr;

      // Notify recipient
      const { error: nErr } = await supabase
        .from('notifications')
        .insert({
          user_id: recipientId,
          type: 'reservation_completed',
          title: 'Donation received',
          message: 'The donation was marked as received. Thank you!',
          is_read: false,
        });
      if (nErr) throw nErr;

      toast.success('Marked as donated');
      setConfirmOpen(false);
      router.refresh();
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to mark as donated');
    } finally {
      setLoading(null);
    }
  }, [supabase, reservationId, donationId, recipientId, router]);

  if (currentStatus !== 'pending' && currentStatus !== 'accepted') return null;

  return (
    <div className="mt-4 border-t pt-4">
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Message to recipient</label>
          <textarea
            className="w-full border rounded-md p-2 text-sm"
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Add pickup details, address specifics, contact number, etc."
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="pickupTime" className="text-sm font-medium text-gray-700">Pickup time (optional)</label>
          <input
            id="pickupTime"
            type="datetime-local"
            className="w-full border rounded-md p-2 text-sm"
            value={pickupTime}
            onChange={(e) => setPickupTime(e.target.value)}
          />
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        {currentStatus === 'pending' && (
          <>
            <Button onClick={approve} disabled={loading !== null} className="bg-green-600 hover:bg-green-700">
              {loading === 'approve' ? 'Approving…' : 'Approve & Send details'}
            </Button>
            <Button onClick={decline} disabled={loading !== null} variant="outline">
              {loading === 'decline' ? 'Declining…' : 'Decline'}
            </Button>
          </>
        )}
        {currentStatus === 'accepted' && (
          <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <AlertDialogTrigger asChild>
              <Button disabled={loading !== null} className="bg-green-600 hover:bg-green-700">
                {loading === 'approve' ? 'Saving…' : 'Mark as Donated'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Mark donation as Donated?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will complete the reservation and set the donation status to Donated. This action can help others see that the item is no longer available.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={loading !== null}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={performMarkDonated} disabled={loading !== null}>
                  Confirm
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  );
}
