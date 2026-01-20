import { AuthenticationError } from './error-handler';
import { emitAuthFailed } from '@/lib/auth/auth-events';

type AuthFailureSource = string;

function shouldTreatAsAuthFailure(response: Response): boolean {
  return response.status === 401 || response.status === 403;
}

export async function fetchWithAuthHandling(
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  source?: AuthFailureSource
): Promise<Response> {
  const response = await fetch(input, init);

  if (shouldTreatAsAuthFailure(response)) {
    // Client-side: broadcast a single "auth failed" event so the app can sign out + redirect.
    if (typeof window !== 'undefined') {
      emitAuthFailed({
        reason: response.status === 401 ? 'unauthorized' : 'forbidden',
        status: response.status,
        source,
      });
    }

    // Always throw so callers don't keep trying to parse / render with bad auth.
    throw new AuthenticationError(`Authentication failed (HTTP ${response.status})`);
  }

  return response;
}

