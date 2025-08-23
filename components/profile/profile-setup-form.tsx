'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

const profileSchema = z.object({
  display_name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.enum(['donor', 'recipient', 'ngo']),
  bio: z.string().optional(),
  neighborhood: z.string().min(2, 'Please enter your neighborhood'),
  phone: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export function ProfileSetupForm() {
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      role: 'recipient',
    },
  });

  useEffect(() => {
    // Get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.log('Geolocation error:', error);
        }
      );
    }

    // Load existing profile if any
    loadExistingProfile();
  }, []);

  const loadExistingProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profile) {
      form.reset({
        display_name: profile.display_name,
        role: profile.role as 'donor' | 'recipient' | 'ngo',
        bio: profile.bio || '',
        neighborhood: profile.neighborhood || '',
        phone: profile.phone || '',
      });
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in');
        return;
      }

      const profileData = {
        ...data,
        location_lat: userLocation?.lat || null,
        location_lng: userLocation?.lng || null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', user.id);

      if (error) {
        toast.error('Failed to update profile: ' + error.message);
      } else {
        toast.success('Profile updated successfully!');
        router.push('/');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <Label htmlFor="display_name">Full Name *</Label>
            <Input
              id="display_name"
              {...form.register('display_name')}
              placeholder="Enter your full name"
            />
            {form.formState.errors.display_name && (
              <p className="text-sm text-red-600 mt-1">
                {form.formState.errors.display_name.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="role">Primary Role *</Label>
            <Select onValueChange={(value: 'donor' | 'recipient' | 'ngo') => form.setValue('role', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select your role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recipient">Recipient - I want to find food</SelectItem>
                <SelectItem value="donor">Donor - I want to share food</SelectItem>
                <SelectItem value="ngo">NGO - I represent an organization</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.role && (
              <p className="text-sm text-red-600 mt-1">
                {form.formState.errors.role.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="neighborhood">Neighborhood/Area *</Label>
            <Input
              id="neighborhood"
              {...form.register('neighborhood')}
              placeholder="e.g., Downtown, Brooklyn Heights, etc."
            />
            {form.formState.errors.neighborhood && (
              <p className="text-sm text-red-600 mt-1">
                {form.formState.errors.neighborhood.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="phone">Phone Number (optional)</Label>
            <Input
              id="phone"
              {...form.register('phone')}
              placeholder="Your phone number"
              type="tel"
            />
          </div>

          <div>
            <Label htmlFor="bio">Bio (optional)</Label>
            <Textarea
              id="bio"
              {...form.register('bio')}
              placeholder="Tell others about yourself, your food sharing goals, or organization..."
              rows={3}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full bg-green-600 hover:bg-green-700" 
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Complete Profile'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}