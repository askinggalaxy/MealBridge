'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Bell, User, Menu, X, Heart } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { User as SupabaseUser } from '@supabase/supabase-js';

export function Header() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const supabase = createClient();
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  // Keep the bell badge in sync with user's unread notifications
  useEffect(() => {
    if (!user?.id) return;
    let isMounted = true;

    const fetchUnread = async () => {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
      if (isMounted) setUnreadCount(count ?? 0);
    };

    fetchUnread();

    const channel = supabase
      .channel('notifications-bell')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        () => fetchUnread()
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [supabase, user?.id]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Heart className="w-8 h-8 text-green-600" />
            <span className="text-xl font-bold text-gray-900">MealBridge</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/" className="text-gray-600 hover:text-gray-900 transition-colors">
              Discover
            </Link>
            <Link href="/guidelines" className="text-gray-600 hover:text-gray-900 transition-colors">
              Guidelines
            </Link>
            {user && (
              <>
                <Link href="/donations/my" className="text-gray-600 hover:text-gray-900 transition-colors">
                  My Donations
                </Link>
                <Link href="/reservations" className="text-gray-600 hover:text-gray-900 transition-colors">
                  Reservations
                </Link>
              </>
            )}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                <Link href="/notifications">
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Button>
                </Link>
                <Link href="/profile">
                  <Button variant="ghost" size="icon">
                    <User className="w-5 h-5" />
                  </Button>
                </Link>
                <Button onClick={handleSignOut} variant="outline" size="sm">
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="outline" size="sm">Sign In</Button>
                </Link>
                <Link href="/auth/signup">
                  <Button size="sm" className="bg-green-600 hover:bg-green-700">
                    Join MealBridge
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <nav className="flex flex-col space-y-4">
              <Link href="/" className="text-gray-600 hover:text-gray-900">
                Discover
              </Link>
              <Link href="/guidelines" className="text-gray-600 hover:text-gray-900">
                Guidelines
              </Link>
              {user ? (
                <>
                  <Link href="/donations/my" className="text-gray-600 hover:text-gray-900">
                    My Donations
                  </Link>
                  <Link href="/reservations" className="text-gray-600 hover:text-gray-900">
                    Reservations
                  </Link>
                  <Link href="/profile" className="text-gray-600 hover:text-gray-900">
                    Profile
                  </Link>
                  <Link href="/notifications" className="text-gray-600 hover:text-gray-900">
                    Notifications
                  </Link>
                  <Button onClick={handleSignOut} variant="outline" className="self-start">
                    Sign Out
                  </Button>
                </>
              ) : (
                <div className="flex flex-col space-y-2">
                  <Link href="/auth/login">
                    <Button variant="outline" size="sm" className="w-full">Sign In</Button>
                  </Link>
                  <Link href="/auth/signup">
                    <Button size="sm" className="w-full bg-green-600 hover:bg-green-700">
                      Join MealBridge
                    </Button>
                  </Link>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}