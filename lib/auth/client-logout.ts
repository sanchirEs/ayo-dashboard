import { signOut } from 'next-auth/react';

type LogoutOptions = {
  redirectTo?: string;
  reason?: string;
};

declare global {
  // Prevent double logout + request loops across modules
  // eslint-disable-next-line no-var
  var __ayoLogoutInProgress: boolean | undefined;
}

function isAuthRoute(pathname: string): boolean {
  return pathname === '/login' || pathname === '/sign-up';
}

export async function logoutClient(options: LogoutOptions = {}): Promise<void> {
  if (typeof window === 'undefined') return;

  if (globalThis.__ayoLogoutInProgress) return;
  globalThis.__ayoLogoutInProgress = true;

  const redirectTo = options.redirectTo || '/login';
  const reason = options.reason;

  try {
    // Clear any app-level storage that could keep "logged in" UI state around.
    // NextAuth token is cookie-based, but this ensures we don't keep stale local state.
    try {
      sessionStorage.clear();
    } catch {}
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('auth');
    } catch {}

    const currentPath = window.location.pathname;
    if (!isAuthRoute(currentPath)) {
      // Sign out without letting NextAuth auto-redirect; we control navigation to avoid loops.
      await signOut({ redirect: false });
    }

    const url = new URL(redirectTo, window.location.origin);
    if (reason) url.searchParams.set('reason', reason);
    window.location.assign(url.toString());
  } finally {
    // Keep it true; the page will navigate away immediately in normal cases.
    // If navigation is blocked, allow retry after a short delay.
    setTimeout(() => {
      globalThis.__ayoLogoutInProgress = false;
    }, 1500);
  }
}

