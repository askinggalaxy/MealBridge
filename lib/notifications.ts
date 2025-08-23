import { createServerClient } from '@/lib/supabase/server';

interface NotificationData {
  user_id: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
}

export async function createNotification(notificationData: NotificationData) {
  const supabase = createServerClient();
  
  const { error } = await supabase
    .from('notifications')
    .insert([notificationData]);

  if (error) {
    console.error('Error creating notification:', error);
    return false;
  }

  return true;
}

export async function sendReservationNotification(donationId: string, recipientId: string) {
  const supabase = createServerClient();
  
  // Get donation and donor info
  const { data: donation } = await supabase
    .from('donations')
    .select(`
      *,
      profiles!donations_donor_id_fkey (display_name)
    `)
    .eq('id', donationId)
    .single();

  if (!donation) return false;

  // Notify donor
  await createNotification({
    user_id: donation.donor_id,
    type: 'reservation_request',
    title: 'New Reservation Request',
    message: `Someone wants to reserve your "${donation.title}"`,
    data: { donation_id: donationId, recipient_id: recipientId },
  });

  return true;
}

export async function sendReservationDecisionNotification(
  reservationId: string, 
  status: 'accepted' | 'declined'
) {
  const supabase = createServerClient();
  
  // Get reservation info
  const { data: reservation } = await supabase
    .from('reservations')
    .select(`
      *,
      donations (title, profiles!donations_donor_id_fkey (display_name))
    `)
    .eq('id', reservationId)
    .single();

  if (!reservation) return false;

  const donation = reservation.donations as any;

  // Notify recipient
  await createNotification({
    user_id: reservation.recipient_id,
    type: 'reservation_decision',
    title: `Reservation ${status}`,
    message: `Your request for "${donation.title}" has been ${status}`,
    data: { reservation_id: reservationId, status },
  });

  return true;
}