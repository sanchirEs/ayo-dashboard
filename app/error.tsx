'use client'

import { useEffect } from 'react';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

/**
 * Global Error Boundary for Dashboard
 * Catches and handles errors gracefully, especially authentication errors
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter();

  useEffect(() => {
    // Log error for monitoring
    console.error('[Dashboard Error Boundary]', {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });
  }, [error]);

  // Check if this is an authentication error
  const isAuthError = 
    error.message.toLowerCase().includes('authentication') || 
    error.message.toLowerCase().includes('token') ||
    error.message.toLowerCase().includes('unauthorized') ||
    error.message.toLowerCase().includes('session');

  if (isAuthError) {
    return <AuthErrorFallback onSignOut={() => signOut({ callbackUrl: '/login' })} />;
  }

  return <GenericErrorFallback error={error} reset={reset} />;
}

/**
 * Authentication Error Fallback Component
 * Shows when session expires or token is invalid
 */
function AuthErrorFallback({ onSignOut }: { onSignOut: () => void }) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
        <div className="text-center">
          {/* Icon */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
            <svg
              className="h-8 w-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Нэвтрэх эрх дууссан
          </h2>

          {/* Message */}
          <p className="text-gray-600 mb-6">
            Таны нэвтрэх хугацаа дууссан байна. Та дахин нэвтрэх шаардлагатай.
          </p>

          {/* Action Button */}
          <button
            onClick={onSignOut}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
          >
            Дахин нэвтрэх
          </button>

          {/* Additional Info */}
          <p className="mt-4 text-sm text-gray-500">
            Таны мэдээлэл аюулгүй хадгалагдсан
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Generic Error Fallback Component
 * Shows for non-authentication errors
 */
function GenericErrorFallback({ 
  error, 
  reset 
}: { 
  error: Error; 
  reset: () => void 
}) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
        <div className="text-center">
          {/* Icon */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-4">
            <svg
              className="h-8 w-8 text-yellow-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Алдаа гарлаа
          </h2>

          {/* Message */}
          <p className="text-gray-600 mb-2">
            Уучлаарай, системд алдаа гарлаа.
          </p>

          {/* Error Details (for development) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mb-6 p-3 bg-gray-100 rounded text-left">
              <p className="text-xs text-gray-700 font-mono break-all">
                {error.message}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={reset}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
            >
              Дахин оролдох
            </button>
            
            <button
              onClick={() => window.location.href = '/'}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-4 rounded-lg transition-colors duration-200"
            >
              Нүүр хуудас руу буцах
            </button>
          </div>

          {/* Support Info */}
          <p className="mt-6 text-sm text-gray-500">
            Асуудал үргэлжлэн гарч байвал техникийн тусламж руу хандана уу
          </p>
        </div>
      </div>
    </div>
  );
}
