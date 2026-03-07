'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { MailX, AlertCircle } from 'lucide-react';
import { Suspense } from 'react';

function UnsubscribedContent() {
  const params = useSearchParams();
  const status = params.get('status');

  const isSuccess = status === 'success';

  return (
    <div className="min-h-screen bg-cream-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="card p-10">
          {isSuccess ? (
            <>
              <MailX className="text-forest-500 mx-auto mb-5" size={56} />
              <h1 className="font-serif text-3xl text-forest-800 mb-4">Unsubscribed</h1>
              <p className="font-body text-forest-500 leading-relaxed mb-4">
                You've been removed from the Hidden Ridge EDH newsletter.
              </p>
              <p className="font-body text-forest-400 text-sm leading-relaxed mb-8">
                You will no longer receive neighborhood newsletter emails. If this was a mistake, you can re-subscribe anytime on our website.
              </p>
            </>
          ) : (
            <>
              <AlertCircle className="text-red-500 mx-auto mb-5" size={56} />
              <h1 className="font-serif text-3xl text-forest-800 mb-4">Invalid Link</h1>
              <p className="font-body text-forest-500 leading-relaxed mb-8">
                This unsubscribe link is invalid or has expired.
              </p>
            </>
          )}
          <Link href="/" className="btn-gold text-sm px-8 py-3 inline-block">
            Back to Hidden Ridge
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function UnsubscribedPage() {
  return (
    <Suspense>
      <UnsubscribedContent />
    </Suspense>
  );
}
