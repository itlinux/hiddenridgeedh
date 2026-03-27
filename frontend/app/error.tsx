'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-cream-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="card p-10">
          <h1 className="font-serif text-3xl text-forest-800 mb-4">Something went wrong</h1>
          <p className="font-body text-forest-500 leading-relaxed mb-8">
            An unexpected error occurred. Please try again or return to the home page.
          </p>
          <div className="flex gap-4 justify-center">
            <button onClick={reset} className="btn-primary text-sm px-6 py-3">
              Try Again
            </button>
            <Link href="/" className="btn-gold text-sm px-6 py-3 inline-block">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
