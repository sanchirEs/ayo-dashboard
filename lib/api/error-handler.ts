/**
 * Error Handling Utilities for Dashboard API
 * Provides typed error classification and safe response patterns
 */

export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export type ErrorType = 'auth' | 'network' | 'server' | 'validation';

export interface ApiError {
  type: ErrorType;
  message: string;
  statusCode?: number;
  retryable: boolean;
  originalError?: unknown;
}

/**
 * Classify an error into a typed ApiError
 * Helps determine appropriate user-facing messaging and retry strategy
 */
export function handleApiError(error: unknown): ApiError {
  // Handle our custom authentication error
  if (error instanceof AuthenticationError) {
    return {
      type: 'auth',
      message: error.message,
      retryable: true,
      originalError: error,
    };
  }

  // Handle standard errors
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Detect auth errors
    if (
      message.includes('authentication') ||
      message.includes('token') ||
      message.includes('unauthorized') ||
      message.includes('403') ||
      message.includes('401')
    ) {
      return {
        type: 'auth',
        message: 'Authentication failed. Please log in again.',
        retryable: true,
        originalError: error,
      };
    }

    // Detect network errors
    if (
      message.includes('fetch') ||
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('connection')
    ) {
      return {
        type: 'network',
        message: 'Network error. Please check your connection.',
        retryable: true,
        originalError: error,
      };
    }

    // Detect validation errors
    if (
      message.includes('validation') ||
      message.includes('invalid') ||
      message.includes('400')
    ) {
      return {
        type: 'validation',
        message: error.message,
        retryable: false,
        originalError: error,
      };
    }

    // Server errors
    if (
      message.includes('500') ||
      message.includes('502') ||
      message.includes('503') ||
      message.includes('504')
    ) {
      return {
        type: 'server',
        message: 'Server error. Please try again later.',
        retryable: true,
        originalError: error,
      };
    }

    // Generic server error
    return {
      type: 'server',
      message: error.message || 'An error occurred. Please try again.',
      retryable: true,
      originalError: error,
    };
  }

  // Unknown error type
  return {
    type: 'server',
    message: 'An unexpected error occurred.',
    retryable: false,
    originalError: error,
  };
}

/**
 * Create a safe API response when an error occurs
 * Returns a response object with default data and error details
 * Prevents crashes by always returning a valid response structure
 */
export function createSafeApiResponse<T>(
  defaultValue: T,
  error?: ApiError
): { success: false; data: T; error?: ApiError } {
  return {
    success: false,
    data: defaultValue,
    error,
  };
}

/**
 * Log API errors with context for debugging
 */
export function logApiError(
  context: string,
  error: ApiError,
  additionalData?: Record<string, any>
): void {
  const logData = {
    timestamp: new Date().toISOString(),
    context,
    errorType: error.type,
    message: error.message,
    statusCode: error.statusCode,
    retryable: error.retryable,
    ...additionalData,
  };

  if (error.type === 'auth') {
    console.error('[Auth Error]', logData);
  } else if (error.type === 'network') {
    console.warn('[Network Error]', logData);
  } else {
    console.error('[API Error]', logData);
  }
}
