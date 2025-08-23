import { createServerClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { DonationDetails } from '@/components/donations/donation-details';

interface DonationPageProps {
  params: {
    id: string;
  };
}

export default async function DonationPage({ params }: DonationPageProps) {
  const supabase = createServerClient();

  const { data: donation, error } = await supabase
    .from('donations')
    .select(`
      *,
      profiles!donations_donor_id_fkey (
        id,
        display_name,
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
    .eq('id', params.id)
    .eq('is_hidden', false)
    .single();

  if (error || !donation) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <DonationDetails donation={donation} />
      </div>
    </div>
  );
}