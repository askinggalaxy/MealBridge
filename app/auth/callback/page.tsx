'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

// Client-only callback to handle Supabase code exchange without SSR/SSG.
export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const run = async () => {
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get('code');
        const next = url.searchParams.get('next') ?? '/';

        if (!code) {
          router.replace('/auth/auth-code-error');
          return;
        }

        const supabase = createClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          router.replace('/auth/auth-code-error');
          return;
        }

        router.replace(next);
      } catch {
        router.replace('/auth/auth-code-error');
      }
    };

    run();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center text-sm text-muted-foreground">
        Processing sign-in...
      </div>
    </div>
  );
}
