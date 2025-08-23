'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Database } from '@/lib/supabase/database.types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// Strongly typed profile row based on generated Supabase types
type Profile = Database['public']['Tables']['profiles']['Row'];

interface ProfileFormProps {
  profile: Profile;
  email: string; // surface auth email for clarity
}

export default function ProfileForm({ profile, email }: ProfileFormProps) {
  // Local form state. Keep it minimal and explicit to avoid accidental SSR hydration issues.
  const [displayName, setDisplayName] = useState(profile.display_name ?? '');
  const [neighborhood, setNeighborhood] = useState(profile.neighborhood ?? '');
  const [phone, setPhone] = useState(profile.phone ?? '');
  const [saving, setSaving] = useState(false);

  const supabase = createClient();

  // Save updates to public.profiles with RLS enforced by the logged-in user.
  const onSave = async () => {
    try {
      setSaving(true);

      // Perform a minimal UPDATE. We only send columns that can change here.
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: displayName,
          neighborhood,
          phone,
          // updated_at is managed by DB default/trigger in schema; no need to send here
        })
        .eq('id', profile.id);

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success('Profile updated successfully');
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Read-only section for auth email so the user understands which account is active */}
      <div>
        <Label className="text-sm">Email</Label>
        <div className="mt-1 text-sm text-gray-700">{email}</div>
      </div>

      {/* Editable display name */}
      <div>
        <Label htmlFor="display_name">Display name</Label>
        <Input
          id="display_name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          autoComplete="name"
          placeholder="Your public name"
        />
      </div>

      {/* Neighborhood (simple text for now; could be a select later) */}
      <div>
        <Label htmlFor="neighborhood">Neighborhood</Label>
        <Input
          id="neighborhood"
          value={neighborhood}
          onChange={(e) => setNeighborhood(e.target.value)}
          placeholder="e.g., Downtown, Midtown"
        />
      </div>

      {/* Phone (optional) */}
      <div>
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          autoComplete="tel"
          placeholder="Optional contact number"
        />
      </div>

      <Button onClick={onSave} disabled={saving} className="bg-green-600 hover:bg-green-700">
        {saving ? 'Saving...' : 'Save changes'}
      </Button>
    </div>
  );
}
