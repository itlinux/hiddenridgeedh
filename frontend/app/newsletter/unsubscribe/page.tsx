'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, MailCheck, Loader2 } from 'lucide-react';
import { newsletterApi } from '@/lib/api';
import Turnstile from '@/components/Turnstile';

export default function NewsletterUnsubscribePage() {
  const [email, setEmail] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [resetKey, setResetKey] = useState(0);
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');
  const [errMsg, setErrMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus('loading');
    setErrMsg('');
    try {
      await newsletterApi.requestUnsubscribe({ email: email.trim(), turnstile_token: turnstileToken || undefined });
      setStatus('sent');
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      setErrMsg(typeof detail === 'string' ? detail : 'Something went wrong. Please try again shortly.');
      setStatus('error');
      setResetKey((k) => k + 1);
    }
  };

  return (
    <div className="min-h-screen bg-cream-50 flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-sans uppercase tracking-wider text-bark-400 hover:text-forest-700 transition-colors mb-8"
        >
          <ArrowLeft size={14} /> Back to Hidden Ridge
        </Link>
        <p className="section-label text-bark-400">Newsletter</p>
        <h1 className="font-serif text-3xl text-forest-800 mt-3 mb-4">Unsubscribe</h1>
        <div className="divider-gold" />
        <p className="font-body text-forest-500 leading-relaxed mt-6 mb-8">
          Enter the email address you subscribed with. We&apos;ll email it a link to unsubscribe from the Hidden Ridge EDH newsletter.
        </p>

        {status === 'sent' ? (
          <div className="card p-10">
            <MailCheck className="text-forest-500 mx-auto mb-5" size={56} />
            <h2 className="font-serif text-2xl text-forest-800 mb-4">Check your email</h2>
            <p className="font-body text-forest-500 text-sm leading-relaxed">
              If this address is subscribed, we&apos;ve sent it an unsubscribe link. Click the link in that email to finish.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="card p-8 text-left">
            <label htmlFor="unsub-email" className="flex items-center gap-2 text-xs font-sans uppercase tracking-wider text-bark-400 mb-3">
              <Mail size={14} /> Email
            </label>
            <input
              id="unsub-email"
              type="email"
              autoComplete="email"
              placeholder="your@email.com"
              className="input-field w-full mb-4"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={status === 'loading'}
              required
            />
            <div className="flex justify-center mb-4">
              <Turnstile onVerify={setTurnstileToken} resetKey={resetKey} />
            </div>
            <button
              type="submit"
              disabled={status === 'loading'}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {status === 'loading' ? <><Loader2 size={16} className="animate-spin" /> Sending...</> : 'Email me an unsubscribe link'}
            </button>
            {status === 'error' && (
              <p className="mt-3 text-sm text-red-600 text-center font-sans" role="alert">{errMsg}</p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
