import { Header } from '@/components/layout/header';
import { createClient } from '@/utils/supabase/server';
import { Database } from '@/lib/supabase/database.types';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';
import Link from 'next/link';

// Explicit types for clarity and safety (per user rules)
type Profile = Database['public']['Tables']['profiles']['Row'];
type Donation = Database['public']['Tables']['donations']['Row'] & {
  categories: Database['public']['Tables']['categories']['Row'];
};

type ReceivedReservation = Database['public']['Tables']['reservations']['Row'] & {
  donations: Donation;
};

type Rating = Database['public']['Tables']['ratings']['Row'];

export default async function PublicProfilePage({
  // Keep the param shape consistent with other dynamic routes in this app
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // 1) Load the public profile by ID
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single<Profile>();

  if (profileError || !profile) {
    notFound();
  }

  // 2) Load donations created by this user (their donated items)
  const { data: donatedItems } = await supabase
    .from('donations')
    .select(
      `*,
       categories (
         id,
         name,
         icon
       )`
    )
    .eq('donor_id', id)
    .order('created_at', { ascending: false })
    .limit(20);

  // 3) Load items this user has received (reservations completed)
  const { data: receivedItems } = await supabase
    .from('reservations')
    .select(
      `*,
       donations (
         *,
         categories (
           id,
           name,
           icon
         )
       )`
    )
    .eq('recipient_id', id)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(20);

  // 4) Load ratings for this user (as the rated party)
  const { data: ratings } = await supabase
    .from('ratings')
    .select('*')
    .eq('rated_id', id)
    .order('created_at', { ascending: false })
    .limit(20);

  // Compute rating stats client-side
  const ratingCount = ratings?.length ?? 0;
  const ratingAvg = ratingCount
    ? (ratings!.reduce((sum, r) => sum + r.rating, 0) / ratingCount).toFixed(1)
    : null;

  // Helper: initial letters for avatar fallback
  const initials = (profile.display_name || 'U')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  // Helper: map donation status to colored badge classes
  const donationStatusClass = (status: Database['public']['Tables']['donations']['Row']['status']) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'reserved':
        return 'bg-yellow-100 text-yellow-800';
      case 'picked_up':
        return 'bg-gray-800 text-white';
      case 'canceled':
        return 'bg-red-100 text-red-800';
      case 'expired':
        return 'bg-gray-100 text-gray-800';
      default:
        return '';
    }
  };

  // Helper: map reservation status to colored badge classes
  const reservationStatusClass = (status: Database['public']['Tables']['reservations']['Row']['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'declined':
        return 'bg-red-100 text-red-800';
      case 'canceled':
        return 'bg-gray-100 text-gray-800';
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top navigation menu/header */}
      <Header />

      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Public profile header */}
        <Card className="overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              {/* Avatar: show image if available, else initials */}
              <Avatar className="h-16 w-16">
                {profile.avatar_url && (
                  <AvatarImage src={profile.avatar_url} alt={profile.display_name} />
                )}
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {profile.display_name}
                  </h1>
                  {profile.is_verified && (
                    <Badge variant="secondary">Verified</Badge>
                  )}
                </div>
                <div className="mt-1 text-gray-600 flex items-center gap-3 text-sm">
                  <span className="capitalize">{profile.role}</span>
                  {profile.neighborhood && (
                    <span>• {profile.neighborhood}</span>
                  )}
                </div>
                <div className="mt-2 flex items-center gap-2 text-sm">
                  {/* Reputation from profile + Ratings from ratings table */}
                  {profile.reputation_count > 0 && (
                    <span className="inline-flex items-center gap-1 text-yellow-700">
                      <Star className="w-4 h-4 fill-current" />
                      {profile.reputation_score.toFixed(1)} ({profile.reputation_count})
                    </span>
                  )}
                  {ratingAvg && (
                    <span className="text-gray-500">
                      • User reviews avg {ratingAvg} ({ratingCount})
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Donated items */}
        <section>
          <Card>
            <CardHeader>
              <CardTitle>Donated Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!donatedItems?.length && (
                <p className="text-sm text-gray-500">No donations yet.</p>
              )}
              {donatedItems?.map((d) => (
                <div key={d.id} className="border rounded-md p-0 overflow-hidden">
                  <div className="flex items-center justify-between p-3">
                    <Link href={`/donations/${d.id}`} className="flex items-center gap-3 flex-1 hover:underline">
                      <span className="text-lg">{d.categories?.icon}</span>
                      <div>
                        <p className="font-medium">{d.title}</p>
                        <p className="text-xs text-gray-500">{d.categories?.name}</p>
                      </div>
                    </Link>
                    <div className="text-xs">
                      <Badge className={donationStatusClass(d.status)}>{d.status}</Badge>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        {/* Received items (completed reservations) */}
        <section>
          <Card>
            <CardHeader>
              <CardTitle>Received Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!receivedItems?.length && (
                <p className="text-sm text-gray-500">No received items yet.</p>
              )}
              {receivedItems?.map((r) => (
                <div key={r.id} className="border rounded-md p-0 overflow-hidden">
                  <div className="flex items-center justify-between p-3">
                    <Link href={`/donations/${r.donations.id}`} className="flex items-center gap-3 flex-1 hover:underline">
                      <span className="text-lg">{r.donations.categories?.icon}</span>
                      <div>
                        <p className="font-medium">{r.donations.title}</p>
                        <p className="text-xs text-gray-500">{r.donations.categories?.name}</p>
                      </div>
                    </Link>
                    <div className="text-xs">
                      <Badge className={reservationStatusClass(r.status)}>{r.status}</Badge>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        {/* Reviews of this user */}
        <section>
          <Card>
            <CardHeader>
              <CardTitle>Reviews</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!ratings?.length && (
                <p className="text-sm text-gray-500">No reviews yet.</p>
              )}
              {ratings?.map((rev) => (
                <div key={rev.id} className="border rounded-md p-3">
                  <div className="flex items-center gap-2 text-yellow-700 mb-1">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${i < rev.rating ? 'fill-current' : ''}`}
                      />
                    ))}
                  </div>
                  {rev.comment && (
                    <p className="text-sm text-gray-700">{rev.comment}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(rev.created_at).toLocaleString()}
                  </p>
                </div>)
              )}
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
