'use client';

import Link from 'next/link';
import { MapPin, Mail, User } from 'lucide-react';

export default function Footer() {
  const handleContact = () => {
    window.location.href = ['ma', 'ilto:', 'remo', '@', 'remomattei', '.com'].join('');
  };

  return (
    <footer className="bg-forest-800 text-cream-200 border-t border-forest-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">

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

          {/* Contact */}
          <div>
            <h4 className="font-sans text-xs tracking-[0.25em] uppercase text-gold-400 mb-5">Contact</h4>
            <div className="flex items-center gap-2 text-forest-300 text-sm mb-3">
              <User size={14} className="text-gold-400" />
              Remo Mattei
            </div>
            <button
              onClick={handleContact}
              className="flex items-center gap-2 text-forest-300 hover:text-gold-400 text-sm transition-colors"
            >
              <Mail size={14} className="text-gold-400" />
              remo@remomattei.com
            </button>
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
