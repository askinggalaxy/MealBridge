'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Database } from '@/lib/supabase/database.types';

const reservationSchema = z.object({
  message: z.string().optional(),
  pickup_time: z.string().optional(),
});

type ReservationFormData = z.infer<typeof reservationSchema>;

type Donation = Database['public']['Tables']['donations']['Row'] & {
  profiles: Database['public']['Tables']['profiles']['Row'];
  categories: Database['public']['Tables']['categories']['Row'];
};

interface ReservationDialogProps {
  donation: Donation;
  onClose: () => void;
  onSuccess: () => void;
}

export function ReservationDialog({ donation, onClose, onSuccess }: ReservationDialogProps) {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const form = useForm<ReservationFormData>({
    resolver: zodResolver(reservationSchema),
    defaultValues: {
      message: '',
      pickup_time: '',
    },
  });

  const onSubmit = async (data: ReservationFormData) => {
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to make a reservation');
        return;
      }

      const reservationData = {
        donation_id: donation.id,
        recipient_id: user.id,
        message: data.message || null,
        pickup_time: data.pickup_time ? new Date(data.pickup_time).toISOString() : null,
        status: 'pending' as const,
      };

      const { error } = await supabase
        .from('reservations')
        .insert([reservationData]);

      if (error) {
        toast.error('Failed to create reservation: ' + error.message);
      } else {
        toast.success('Reservation request sent!');
        onSuccess();
      }
    } catch (error) {
      console.error('Error creating reservation:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reserve: {donation.title}</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="pickup_time">Preferred Pickup Time (optional)</Label>
            <Input
              id="pickup_time"
              type="datetime-local"
              {...form.register('pickup_time')}
              min={donation.pickup_window_start.slice(0, 16)}
              max={donation.pickup_window_end.slice(0, 16)}
            />
            <p className="text-xs text-gray-500 mt-1">
              Available: {new Date(donation.pickup_window_start).toLocaleString()} - {new Date(donation.pickup_window_end).toLocaleString()}
            </p>
          </div>

          <div>
            <Label htmlFor="message">Message to Donor (optional)</Label>
            <Textarea
              id="message"
              {...form.register('message')}
              placeholder="Introduce yourself or ask any questions..."
              rows={3}
            />
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-green-600 hover:bg-green-700"
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Request'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}