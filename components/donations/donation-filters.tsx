'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Database } from '@/lib/supabase/database.types';

export function DonationFilters() {
  // Read current URL params so filters stay in sync across components and reloads
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();

  type Category = Database['public']['Tables']['categories']['Row'];
  const [categories, setCategories] = useState<Category[]>([]);

  // Initialize UI state from URL to keep a single source of truth for filters
  const [distance, setDistance] = useState([Number(searchParams.get('distance') ?? 5)]);
  const [category, setCategory] = useState(searchParams.get('category') ?? 'all');
  const [sealedOnly, setSealedOnly] = useState((searchParams.get('sealed') ?? 'false') === 'true');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') ?? 'newest');

  // Load categories to populate the dropdown and ensure we use IDs
  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      if (!error && data) setCategories(data);
    };
    load();
  }, [supabase]);

  // Helper to write current local state to the URL
  const applyToUrl = (next: Partial<{ distance: number; category: string; sealed: boolean; sort: string }>) => {
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    if (next.distance !== undefined) params.set('distance', String(next.distance));
    if (next.category !== undefined) params.set('category', next.category);
    if (next.sealed !== undefined) params.set('sealed', String(next.sealed));
    if (next.sort !== undefined) params.set('sort', String(next.sort));
    router.replace(`/?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      {/* Distance Filter */}
      <div>
        <Label className="text-sm font-medium mb-3 block">
          Distance: {distance[0]}km
        </Label>
        <Slider
          value={distance}
          onValueChange={setDistance}
          max={25}
          min={1}
          step={1}
          className="w-full"
        />
      </div>

      {/* Category Filter */}
      <div>
        <Label className="text-sm font-medium mb-3 block">Category</Label>
        <Select
          value={category}
          onValueChange={(val) => {
            // Update local state
            setCategory(val);
            // Immediately sync to URL so list/map refresh without clicking Apply
            applyToUrl({ category: val });
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.icon} {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Sort Filter */}
      <div>
        <Label className="text-sm font-medium mb-3 block">Sort By</Label>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="expiry">Expiring Soon</SelectItem>
            <SelectItem value="distance">Closest First</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Sealed Only Filter */}
      <div className="flex items-center space-x-2">
        <Switch
          id="sealed-only"
          checked={sealedOnly}
          onCheckedChange={setSealedOnly}
        />
        <Label htmlFor="sealed-only" className="text-sm">
          Sealed items only
        </Label>
      </div>

      <Button className="w-full" onClick={() => {
        // Apply all filters manually (useful for distance/other controls)
        applyToUrl({ distance: distance[0], category, sealed: sealedOnly, sort: sortBy });
      }}>
        Apply Filters
      </Button>
    </div>
  );
}