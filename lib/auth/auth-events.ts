export type AuthFailureReason = 'unauthorized' | 'forbidden' | 'token_expired' | 'invalid_token';

export type AuthFailureDetail = {
  reason: AuthFailureReason;
  status?: number;
  source?: string;
};

const AUTH_FAILED_EVENT = 'ayo:auth-failed';

export function emitAuthFailed(detail: AuthFailureDetail): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<AuthFailureDetail>(AUTH_FAILED_EVENT, { detail }));
}

export function onAuthFailed(handler: (detail: AuthFailureDetail) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const listener = (evt: Event) => {
    const custom = evt as CustomEvent<AuthFailureDetail>;
    handler(custom.detail);
  };
  window.addEventListener(AUTH_FAILED_EVENT, listener);
  return () => window.removeEventListener(AUTH_FAILED_EVENT, listener);
}

