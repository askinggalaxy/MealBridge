'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Database } from '@/lib/supabase/database.types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile.avatar_url ?? null);
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
          // Persist avatar_url if it changed
          avatar_url: avatarUrl ?? null,
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

  // Handle avatar file selection and upload to Supabase Storage "user-avatars" bucket
  const onAvatarSelected = async (file: File | null) => {
    if (!file) return;
    try {
      setSaving(true);
      // Generate a deterministic path under the user's folder; including timestamp avoids name collisions.
      const path = `${profile.id}/${Date.now()}_${file.name}`;

      // Upload the raw file to storage; RLS on storage should allow the authenticated user to upload.
      const { error: uploadError } = await supabase.storage
        .from('user-avatars')
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false,
        });
      if (uploadError) {
        toast.error(uploadError.message);
        return;
      }

      // Get a public URL for the uploaded file. The bucket should be public as per your note.
      const { data: publicData } = supabase.storage
        .from('user-avatars')
        .getPublicUrl(path);

      const publicUrl = publicData.publicUrl;

      // Save URL into profile immediately for better UX
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', profile.id);
      if (updateError) {
        toast.error(updateError.message);
        return;
      }

      setAvatarUrl(publicUrl);
      toast.success('Avatar updated');
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to upload avatar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Avatar section: displays current avatar (if any) and allows uploading a new one */}
      <div>
        <Label className="text-sm">Avatar</Label>
        <div className="mt-2 flex items-center gap-4">
          <Avatar className="h-16 w-16">
            {/* If avatar_url exists, render it; otherwise fallback to initials */}
            {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
            <AvatarFallback>
              {(displayName || 'U')
                .split(' ')
                .map((p) => p[0])
                .slice(0, 2)
                .join('')
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => onAvatarSelected(e.target.files?.[0] ?? null)}
              disabled={saving}
            />
            <p className="text-xs text-gray-500 mt-1">JPG/PNG, recommended square image. Uploading replaces the current avatar.</p>
          </div>
        </div>
      </div>

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
