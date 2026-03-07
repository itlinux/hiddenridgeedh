'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, MapPin, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { newsletterApi } from '@/lib/api';

export default function Footer() {
  const [footerEmail, setFooterEmail] = useState('');
  const [footerLoading, setFooterLoading] = useState(false);

  const handleFooterSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!footerEmail) return;
    setFooterLoading(true);
    try {
      await newsletterApi.subscribe({ email: footerEmail });
      toast.success('Subscribed! Check your inbox for a confirmation.');
      setFooterEmail('');
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to subscribe. Please try again.';
      toast.error(msg);
    } finally {
      setFooterLoading(false);
    }
  };

  return (
    <footer className="bg-forest-800 text-cream-200 border-t border-forest-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gold-400 flex items-center justify-center rounded-sm">
                <span className="text-forest-800 font-serif font-bold">HR</span>
              </div>
              <div>
                <div className="font-serif text-xl text-cream-100">Hidden Ridge EDH</div>
                <div className="text-gold-400 text-xs tracking-[0.2em] uppercase">El Dorado Hills</div>
              </div>
            </div>
            <p className="text-forest-300 font-body text-sm leading-relaxed">
              Connecting neighbors, sharing news, and celebrating life in Hidden Ridge, El Dorado Hills.
            </p>
            <div className="flex items-center gap-2 mt-4 text-forest-300 text-sm">
              <MapPin size={14} className="text-gold-400" />
              El Dorado Hills, CA 95762
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-sans text-xs tracking-[0.25em] uppercase text-gold-400 mb-5">Neighborhood</h4>
            <ul className="space-y-3">
              {[
                { href: '/blog', label: 'News & Blog' },
                { href: '/events', label: 'Events Calendar' },
                { href: '/gallery', label: 'Photo Gallery' },
                { href: '/forum', label: 'Neighborhood Forum' },
                { href: '/members', label: 'Meet the Neighbors' },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-forest-300 hover:text-gold-400 font-sans text-sm transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-sans text-xs tracking-[0.25em] uppercase text-gold-400 mb-5">Stay Informed</h4>
            <p className="text-forest-300 text-sm font-body mb-4">
              Subscribe to the Hidden Ridge newsletter for neighborhood updates and announcements.
            </p>
            <form className="flex gap-2" onSubmit={handleFooterSubscribe}>
              <input
                type="email"
                placeholder="your@email.com"
                value={footerEmail}
                onChange={(e) => setFooterEmail(e.target.value)}
                required
                className="flex-1 bg-forest-700 border border-forest-600 text-cream-100 px-3 py-2 text-sm font-sans
                           placeholder:text-forest-400 focus:outline-none focus:border-gold-400 rounded-sm"
              />
              <button type="submit" disabled={footerLoading} className="bg-gold-400 text-forest-800 px-4 py-2 hover:bg-gold-500 transition-colors rounded-sm">
                {footerLoading ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
              </button>
            </form>
            <p className="text-forest-400 text-xs mt-3">Resident members only. Unsubscribe anytime.</p>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-forest-700 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-forest-400 text-xs font-sans">
            © {new Date().getFullYear()} Hidden Ridge EDH. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link href="/register" className="text-forest-400 hover:text-gold-400 text-xs font-sans transition-colors">Join the Neighborhood</Link>
            <Link href="/login" className="text-forest-400 hover:text-gold-400 text-xs font-sans transition-colors">Sign In</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
