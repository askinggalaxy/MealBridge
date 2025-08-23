import { requireAuth } from '@/lib/auth';
import { Header } from '@/components/layout/header';
import { createClient } from '@/utils/supabase/server';
import { Database } from '@/lib/supabase/database.types';
import NotificationsToolbar from '@/components/notifications/notifications-toolbar';

// Strong typing from generated Supabase types for safer rendering
type NotificationRow = Database['public']['Tables']['notifications']['Row'];

export default async function NotificationsPage() {
  // Ensure the user is authenticated (redirects to /auth/login if not)
  const user = await requireAuth();

  // Use server Supabase client to query the user's notifications under RLS
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to load notifications:', error.message);
  }

  const notifications = (data ?? []) as NotificationRow[];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold">Notifications</h1>
          {/* Toolbar contains client-side actions like Mark all as read */}
          <NotificationsToolbar userId={user.id} />
        </div>

        {notifications.length === 0 ? (
          <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-sm p-8 text-center text-gray-700">
            No notifications yet.
          </div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-3">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`border rounded-lg bg-white p-4 shadow-sm ${n.is_read ? 'opacity-80' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">{n.type}</div>
                    <h3 className="font-medium text-gray-900">{n.title}</h3>
                    <p className="text-gray-700 mt-1">{n.message}</p>
                    {n.created_at && (
                      <div className="text-xs text-gray-500 mt-2">
                        {new Date(n.created_at).toLocaleString()}
                      </div>
                    )}
                  </div>
                  {!n.is_read && (
                    <span className="ml-3 inline-block w-2 h-2 rounded-full bg-green-600" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
