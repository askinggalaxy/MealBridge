import { requireAuth } from '@/lib/auth';
import { Header } from '@/components/layout/header';
import { DonationCard } from '@/components/donations/donation-card';
import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Database } from '@/lib/supabase/database.types';

// Server component for listing the authenticated user's own donations
export default async function MyDonationsPage() {
  // Ensure the user is authenticated; otherwise they will be redirected
  const user = await requireAuth();

  // Create a Supabase Server client to run a RLS-protected query
  const supabase = await createClient();

  // Explicit type for clarity
  type Donation = Database['public']['Tables']['donations']['Row'] & {
    profiles: Database['public']['Tables']['profiles']['Row'];
    categories: Database['public']['Tables']['categories']['Row'];
  };

  // Query the current user's donations, joining auxiliary info for the card UI
  const { data, error } = await supabase
    .from('donations')
    .select(`
      *,
      profiles:donor_id(*),
      categories:category_id(*)
    `)
    .eq('donor_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    // Soft-fail with empty state; detailed errors are visible in server logs
    console.error('Failed to load my donations:', error.message);
  }

  const donations = (data ?? []) as Donation[];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top navigation with auth-aware actions */}
      <Header />

      <main className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold">My Donations</h1>
          <Link href="/donations/create">
            <Button className="bg-green-600 hover:bg-green-700">Create Donation</Button>
          </Link>
        </div>

        {/* Empty state when user has no donations */}
        {donations.length === 0 ? (
          <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-sm p-8 text-center">
            <p className="text-gray-700 mb-4">You haven't created any donations yet.</p>
            <Link href="/donations/create">
              <Button className="bg-green-600 hover:bg-green-700">Create your first donation</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {donations.map((donation) => (
              <DonationCard key={donation.id} donation={donation} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
