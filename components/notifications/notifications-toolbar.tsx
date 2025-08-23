'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface NotificationsToolbarProps {
  userId: string;
}

export default function NotificationsToolbar({ userId }: NotificationsToolbarProps) {
  const supabase = createClient();
  const [marking, setMarking] = useState(false);
  const [unread, setUnread] = useState<number>(0);

  // Fetch unread count for display alongside the toolbar
  const fetchUnread = useCallback(async () => {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) return;
    setUnread(count ?? 0);
  }, [supabase, userId]);

  useEffect(() => {
    fetchUnread();

    // Realtime subscription to keep the count in sync
    const channel = supabase
      .channel('notifications-toolbar')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        () => fetchUnread()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchUnread, supabase, userId]);

  const markAllAsRead = useCallback(async () => {
    try {
      setMarking(true);
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success('All notifications marked as read');
      fetchUnread();
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to mark as read');
    } finally {
      setMarking(false);
    }
  }, [supabase, userId, fetchUnread]);

  return (
    <div className="flex items-center gap-2">
      <div className="text-sm text-gray-600">Unread: {unread}</div>
      <Button onClick={markAllAsRead} disabled={marking} variant="outline" size="sm">
        {marking ? 'Marking…' : 'Mark all as read'}
      </Button>
    </div>
  );
}
