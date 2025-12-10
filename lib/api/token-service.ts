/**
 * Token Service for Dashboard API
 * Provides token retry logic and graceful degradation
 * Prevents multiple simultaneous refresh attempts
 */

import getToken from '../GetTokenServer';

interface TokenState {
  token: string | null;
  isRefreshing: boolean;
  lastRefresh: number;
  retryCount: number;
}

const RETRY_DELAY_MS = 1000; // 1 second base delay
const MAX_RETRIES = 3;
const REFRESH_COOLDOWN_MS = 5000; // 5 seconds between refresh attempts

class TokenService {
  private state: TokenState = {
    token: null,
    isRefreshing: false,
    lastRefresh: 0,
    retryCount: 0,
  };

  private refreshPromise: Promise<string | null> | null = null;

  /**
   * Get token with automatic retry logic
   * If token is not available, attempts to refresh the session
   * Debounces multiple simultaneous calls to prevent thundering herd
   */
  async getTokenWithRetry(): Promise<string | null> {
    try {
      // 1. Try to get token normally
      const token = await getToken();
      
      if (token) {
        // Success - reset retry count and cache token
        this.state.retryCount = 0;
        this.state.token = token;
        return token;
      }

      // 2. Token is null - check if we should retry
      const now = Date.now();
      const timeSinceLastRefresh = now - this.state.lastRefresh;

      // If we recently tried to refresh, don't retry immediately
      if (timeSinceLastRefresh < REFRESH_COOLDOWN_MS) {
        console.warn('[TokenService] Refresh cooldown active, returning null');
        return null;
      }

      // If we've exceeded max retries, give up
      if (this.state.retryCount >= MAX_RETRIES) {
        console.error('[TokenService] Max retries exceeded, returning null');
        return null;
      }

      // 3. If not already refreshing, trigger refresh
      if (!this.state.isRefreshing) {
        return this.refreshToken();
      }

      // 4. Wait for ongoing refresh
      console.log('[TokenService] Waiting for ongoing refresh');
      return this.refreshPromise;
    } catch (error) {
      console.error('[TokenService] Error in getTokenWithRetry:', error);
      return null;
    }
  }

  /**
   * Attempt to refresh the token
   * Uses exponential backoff for retries
   */
  private async refreshToken(): Promise<string | null> {
    // Prevent multiple simultaneous refresh attempts
    if (this.state.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.state.isRefreshing = true;
    this.state.lastRefresh = Date.now();
    this.state.retryCount++;

    // Create promise that other callers can wait on
    this.refreshPromise = this._attemptRefresh();

    try {
      const token = await this.refreshPromise;
      this.state.token = token;
      
      if (token) {
        // Success - reset retry count
        this.state.retryCount = 0;
        console.log('[TokenService] Token refresh successful');
      } else {
        console.warn('[TokenService] Token refresh returned null');
      }
      
      return token;
    } finally {
      this.state.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  /**
   * Internal method to attempt refresh with exponential backoff
   */
  private async _attemptRefresh(): Promise<string | null> {
    try {
      // Calculate exponential backoff delay
      const delay = RETRY_DELAY_MS * Math.pow(2, this.state.retryCount - 1);
      
      if (this.state.retryCount > 1) {
        console.log(`[TokenService] Retry ${this.state.retryCount}/${MAX_RETRIES}, waiting ${delay}ms`);
        await this._sleep(delay);
      }

      // Attempt to get token again
      const token = await getToken();
      
      if (!token) {
        console.warn('[TokenService] Refresh attempt returned null token');
      }
      
      return token;
    } catch (error) {
      console.error('[TokenService] Error during token refresh:', error);
      return null;
    }
  }

  /**
   * Sleep utility for exponential backoff
   */
  private _sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Reset the token service state
   * Useful for testing or after explicit logout
   */
  reset(): void {
    this.state = {
      token: null,
      isRefreshing: false,
      lastRefresh: 0,
      retryCount: 0,
    };
    this.refreshPromise = null;
    console.log('[TokenService] State reset');
  }

  /**
   * Get current state for debugging
   */
  getState(): Readonly<TokenState> {
    return { ...this.state };
  }
}

// Export singleton instance
export const tokenService = new TokenService();

// Also export class for testing
export { TokenService };
