'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Database } from '@/lib/supabase/database.types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface ReportDialogProps {
  donationId: string;
  onClose: () => void;
}

// This dialog lets an authenticated user submit a real flag into the `flags` table.
// It does no mocking; it inserts a row with proper types and constraints.
export function ReportDialog({ donationId, onClose }: ReportDialogProps) {
  const supabase = createClient();
  const [reason, setReason] = useState<Database['public']['Tables']['flags']['Insert']['reason']>('suspect');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id ?? null);
    })();
  }, []);

  const handleSubmit = async () => {
    if (!userId) {
      toast.error('Please sign in to report');
      return;
    }
    setSubmitting(true);
    const { error } = await supabase
      .from('flags')
      .insert({
        reporter_id: userId,
        target_type: 'donation',
        target_id: donationId,
        reason,
        description: description.trim() || null,
        status: 'pending',
      });
    setSubmitting(false);
    if (error) {
      toast.error('Failed to send report');
      return;
    }
    toast.success('Report submitted');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md">
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle>Report donation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Reason selector: uses allowed enum values */}
            <div className="space-y-1">
              <label className="text-sm text-gray-700">Reason</label>
              <select
                className="w-full border rounded px-3 py-2 text-sm"
                value={reason}
                onChange={(e) => setReason(e.target.value as any)}
              >
                <option value="safety">Safety issue</option>
                <option value="expired">Expired/near expiry</option>
                <option value="suspect">Suspicious content</option>
                <option value="spam">Spam/advertising</option>
                <option value="inappropriate">Inappropriate</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm text-gray-700">Additional details (optional)</label>
              <Textarea
                rows={4}
                placeholder="Describe the issue so moderators can act quickly"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Submitting…' : 'Submit report'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
