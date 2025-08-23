'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Database } from '@/lib/supabase/database.types';
import { DonationCard } from './donation-card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

type Donation = Database['public']['Tables']['donations']['Row'] & {
  profiles: Database['public']['Tables']['profiles']['Row'];
  categories: Database['public']['Tables']['categories']['Row'];
};

export function DonationList() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const searchParams = useSearchParams();

  useEffect(() => {
    // When URL filters change, reload list
    loadDonations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams?.toString()]);

  const loadDonations = async () => {
    setLoading(true);
    
    // Read category filter from URL; 'all' means no filter
    const category = searchParams.get('category') ?? 'all';

    let query = supabase
      .from('donations')
      .select(`
        *,
        profiles!donations_donor_id_fkey (
          id,
          display_name,
          reputation_score,
          reputation_count,
          neighborhood
        ),
        categories (
          name,
          icon
        )
      `)
      .eq('is_hidden', false)
      .gte('expiry_date', new Date().toISOString().split('T')[0])
      .order('created_at', { ascending: false });

    if (category && category !== 'all') {
      query = query.eq('category_id', category);
    }
    const { data, error } = await query;

    if (error) {
      console.error('Error loading donations:', error);
    } else {
      setDonations(data as Donation[]);
    }
    
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-lg shadow-sm animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!donations.length) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-sm text-center">
        <p className="text-gray-500">No food donations available nearby.</p>
        <p className="text-sm text-gray-400 mt-1">Check back later or expand your search area.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold mb-4">Nearby Food ({donations.length})</h2>
      {donations.some((d) => d.status !== 'available') && (
        <Alert className="bg-blue-50 border-blue-200 text-blue-900">
          <Info className="h-4 w-4" />
          <AlertDescription>
            Some items are already reserved (Delivery) or donated. They are shown grayed out and cannot be reserved.
          </AlertDescription>
        </Alert>
      )}
      {donations.map((donation) => (
        <div
          key={donation.id}
          className={
            donation.status === 'available'
              ? ''
              : 'opacity-70'
          }
        >
          <DonationCard donation={donation} />
        </div>
      ))}
    </div>
  );
}