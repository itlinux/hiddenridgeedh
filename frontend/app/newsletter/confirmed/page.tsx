'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, AlertCircle, Info } from 'lucide-react';
import { Suspense } from 'react';

function ConfirmedContent() {
  const params = useSearchParams();
  const status = params.get('status');

  const config = {
    success: {
      icon: CheckCircle,
      iconColor: 'text-green-500',
      title: 'Subscription Confirmed!',
      message: "You're all set! You'll now receive neighborhood updates, event reminders, and important announcements from Hidden Ridge EDH.",
    },
    already: {
      icon: Info,
      iconColor: 'text-gold-500',
      title: 'Already Confirmed',
      message: 'Your subscription was already confirmed. No further action needed.',
    },
    invalid: {
      icon: AlertCircle,
      iconColor: 'text-red-500',
      title: 'Invalid Link',
      message: 'This confirmation link is invalid or has expired. Please try subscribing again.',
    },
  }[status || 'invalid'] || {
    icon: AlertCircle,
    iconColor: 'text-red-500',
    title: 'Something Went Wrong',
    message: 'Please try subscribing again.',
  };

  const Icon = config.icon;

  return (
    <div className="min-h-screen bg-cream-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="card p-10">
          <Icon className={`${config.iconColor} mx-auto mb-5`} size={56} />
          <h1 className="font-serif text-3xl text-forest-800 mb-4">{config.title}</h1>
          <p className="font-body text-forest-500 leading-relaxed mb-8">{config.message}</p>
          <Link href="/" className="btn-gold text-sm px-8 py-3 inline-block">
            Back to Hidden Ridge
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ConfirmedPage() {
  return (
    <Suspense>
      <ConfirmedContent />
    </Suspense>
  );
}
