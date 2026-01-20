'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { onAuthFailed } from '@/lib/auth/auth-events';
import { logoutClient } from '@/lib/auth/client-logout';

export default function AuthSessionWatcher() {
  const pathname = usePathname();

  useEffect(() => {
    // If any API call reports auth failure, log out cleanly and redirect once.
    return onAuthFailed((detail) => {
      // Avoid redirect loops if we're already on an auth page.
      if (pathname === '/login' || pathname === '/sign-up') return;
      logoutClient({
        redirectTo: '/login',
        reason: detail.reason,
      });
    });
  }, [pathname]);

  return null;
}

