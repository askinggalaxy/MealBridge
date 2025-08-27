import { requireAuth } from '@/lib/auth';
import { Header } from '@/components/layout/header';
import { createClient } from '@/utils/supabase/server';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Database } from '@/lib/supabase/database.types';
import ReservationActions from '@/components/reservations/reservation-actions';
import { ReviewButton } from '@/components/reviews/review-button';

// Types from generated Database
type Profile = Database['public']['Tables']['profiles']['Row'];
type Donation = Database['public']['Tables']['donations']['Row'] & {
  categories: Database['public']['Tables']['categories']['Row'];
  profiles: Profile; // donor profile via donor_id
};

type Reservation = Database['public']['Tables']['reservations']['Row'] & {
  donation?: Donation;
  recipient?: Profile;
};

export default async function ReservationsPage() {
  const user = await requireAuth();
  const supabase = await createClient();

  // 1) Reservations I made (as recipient)
  const { data: myReservationsData, error: myReservationsError } = await supabase
    .from('reservations')
    .select(`
      *,
      donation:donation_id(
        *,
        categories:category_id(*),
        profiles:donor_id(*)
      ),
      recipient:recipient_id(*)
    `)
    .eq('recipient_id', user.id)
    .order('created_at', { ascending: false });

  if (myReservationsError) {
    console.error('Failed to load my reservations:', myReservationsError.message);
  }

  const myReservations = (myReservationsData ?? []) as Reservation[];

  // 2) Reservations on my donations (incoming)
  // Fetch my donation IDs first, then load reservations for those IDs
  const { data: myDonations, error: myDonationsError } = await supabase
    .from('donations')
    .select('id')
    .eq('donor_id', user.id);

  if (myDonationsError) {
    console.error('Failed to load my donations for reservation lookup:', myDonationsError.message);
  }

  const donationIds = (myDonations ?? []).map((d) => d.id);

  let incomingReservations: Reservation[] = [];
  if (donationIds.length > 0) {
    const { data: incomingData, error: incomingError } = await supabase
      .from('reservations')
      .select(`
        *,
        donation:donation_id(
          *,
          categories:category_id(*),
          profiles:donor_id(*)
        ),
        recipient:recipient_id(*)
      `)
      .in('donation_id', donationIds)
      .order('created_at', { ascending: false });

    if (incomingError) {
      console.error('Failed to load incoming reservations:', incomingError.message);
    }

    incomingReservations = (incomingData ?? []) as Reservation[];
  }

  const ReservationCard = ({ r }: { r: Reservation }) => {
    const d = r.donation!;
    const donor = d?.profiles;
    const recip = r.recipient;

    return (
      <div className="border rounded-lg bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{d?.categories?.icon}</span>
              <span className="text-sm text-gray-600">{d?.categories?.name}</span>
              <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-700 capitalize">{r.status}</span>
            </div>
            <h3 className="font-semibold">{d?.title}</h3>
            <p className="text-sm text-gray-700 line-clamp-2">{d?.description}</p>

            <div className="mt-3 text-sm text-gray-700 space-y-1">
              <p>
                <strong>Pickup window:</strong>{' '}
                {new Date(d.pickup_window_start).toLocaleString()} - {new Date(d.pickup_window_end).toLocaleString()}
              </p>
              {r.pickup_time && (
                <p>
                  <strong>Requested pickup time:</strong>{' '}
                  {new Date(r.pickup_time).toLocaleString()}
                </p>
              )}
              {r.message && (
                <p>
                  <strong>Message:</strong> {r.message}
                </p>
              )}
              <p>
                <strong>Donor:</strong>{' '}
                {/* Link to donor profile when we have a valid id; fall back to plain text otherwise */}
                {donor?.id ? (
                  <Link
                    href={`/users/${donor.id}`}
                    className="text-green-700 hover:text-green-800 hover:underline"
                    aria-label={`View donor profile of ${donor.display_name ?? 'user'}`}
                  >
                    {donor.display_name ?? 'View profile'}
                  </Link>
                ) : (
                  donor?.display_name ?? 'Unknown donor'
                )}
              </p>
              {recip && (
                <p>
                  <strong>Recipient:</strong>{' '}
                  {/* Link to recipient profile when we have a valid id */}
                  {recip.id ? (
                    <Link
                      href={`/users/${recip.id}`}
                      className="text-green-700 hover:text-green-800 hover:underline"
                      aria-label={`View recipient profile of ${recip.display_name ?? 'user'}`}
                    >
                      {recip.display_name ?? 'View profile'}
                    </Link>
                  ) : (
                    recip.display_name ?? 'Unknown recipient'
                  )}
                </p>
              )}
            </div>

            {/* Donor-side actions: approve/decline + send message */}
            {donor?.id === user.id && (
              <ReservationActions
                reservationId={r.id}
                donationId={d.id}
                donorId={donor.id}
                recipientId={recip?.id ?? ''}
                currentStatus={r.status as any}
              />)
            }

            {/* Review button: real eligibility checks are performed inside the client component.
               It verifies there is a completed reservation, identifies the counterpart
               (donor vs recipient), ensures there is no existing rating, and only then shows. */}
            <div className="mt-3">
              <ReviewButton
                donationId={d.id}
                currentUserId={user.id}
                donorId={donor?.id ?? ''}
                recipientId={recip?.id ?? null}
                reservationStatus={r.status as any}
                size="sm"
                className="bg-amber-500 hover:bg-amber-600"
                label="Leave review"
              />
            </div>
          </div>
          <div className="ml-4 flex-shrink-0">
            <Link href={`/donations/${d?.id}`}>
              <Button size="sm" className="bg-green-600 hover:bg-green-700">View donation</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-4 py-6">
        <h1 className="text-xl font-semibold mb-6">Reservations</h1>

        {/* My reservation requests (as recipient) */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">My reservation requests</h2>
          </div>

          {myReservations.length === 0 ? (
            <div className="bg-white p-6 rounded-lg shadow-sm text-gray-700">
              You have not requested any reservations yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myReservations.map((r) => (
                <ReservationCard key={r.id} r={r} />
              ))}
            </div>
          )}
        </section>

        {/* Incoming reservations on my donations (as donor) */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Requests for my donations</h2>
            <Link href="/donations/my">
              <Button variant="outline">Go to My Donations</Button>
            </Link>
          </div>

          {incomingReservations.length === 0 ? (
            <div className="bg-white p-6 rounded-lg shadow-sm text-gray-700">
              No one has requested your donations yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {incomingReservations.map((r) => (
                <ReservationCard key={r.id} r={r} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
