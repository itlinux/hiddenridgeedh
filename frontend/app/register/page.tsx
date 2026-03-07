'use client';

import Link from 'next/link';
import { Clock } from 'lucide-react';

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-cream-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="card p-10 text-center">
          <div className="w-16 h-16 bg-gold-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock size={32} className="text-gold-500" />
          </div>
          <h1 className="font-serif text-3xl text-forest-800 mb-3">Registration Opening Soon</h1>
          <div className="divider-gold" />
          <p className="font-body text-forest-500 mt-6 leading-relaxed">
            We are currently preparing the Hidden Ridge neighborhood portal for launch.
            Registration for residents will open shortly.
          </p>
          <p className="font-body text-forest-500 mt-4 leading-relaxed">
            In the meantime, feel free to explore the site. We look forward to welcoming you to the neighborhood portal.
          </p>
          <div className="mt-8 space-y-3">
            <Link href="/" className="btn-gold w-full inline-flex items-center justify-center py-3">
              Back to Home
            </Link>
            <p className="text-forest-400 text-sm font-sans">
              Already a member?{' '}
              <Link href="/login" className="text-gold-500 hover:underline">Sign in here</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
