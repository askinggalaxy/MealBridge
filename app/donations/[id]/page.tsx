import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import { DonationDetails } from '@/components/donations/donation-details';
import { Header } from '@/components/layout/header';

export default async function DonationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: donation, error } = await supabase
    .from('donations')
    .select(`
      *,
      profiles!donations_donor_id_fkey (
        id,
        display_name,
        avatar_url,
        reputation_score,
        reputation_count,
        neighborhood,
        phone
      ),
      categories (
        name,
        icon
      )
    `)
    .eq('id', id)
    .eq('is_hidden', false)
    .single();

  if (error || !donation) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <DonationDetails donation={donation} />
      </div>
    </div>
  );
}