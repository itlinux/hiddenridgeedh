'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Menu, X, ChevronDown, LogOut, User, Shield } from 'lucide-react';
import clsx from 'clsx';

const BASE_LINKS = [
  { href: '/blog',    label: 'News & Blog' },
  { href: '/events',  label: 'Events' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/forum',   label: 'Forum' },
  { href: '/members', label: 'Neighbors' },
];

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout, isAdmin, isSuperAdmin } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const NAV_LINKS = [
    ...BASE_LINKS,
    ...(user
      ? [
          { href: '/resources', label: 'Resources' },
          { href: '/safety', label: 'Safety' },
          { href: '/map', label: 'Map' },
        ]
      : [{ href: '/safety', label: 'Safety & Alerts' }]),
  ];

  return (
    <header className="bg-forest-800 border-b border-forest-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <Image
              src="/images/logo.png"
              alt="Hidden Ridge EDH"
              width={44}
              height={44}
              className="rounded-sm"
              priority
            />
            <div className="hidden sm:block">
              <span className="text-cream-100 font-serif text-lg tracking-wide">Hidden Ridge</span>
              <span className="text-gold-400 font-sans text-xs tracking-[0.2em] uppercase block leading-none">El Dorado Hills</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  'nav-link text-cream-200 hover:text-gold-400',
                  pathname.startsWith(link.href) && 'text-gold-400'
                )}
              >
                {link.label}
              </Link>
            ))}
            {isAdmin && (
              <Link
                href="/edh"
                className={clsx(
                  'nav-link text-gold-400 hover:text-gold-300 flex items-center gap-1',
                  pathname.startsWith('/edh') && 'text-gold-300'
                )}
              >
                <Shield size={14} /> Dashboard
              </Link>
            )}
          </nav>

          {/* Auth */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 text-cream-200 hover:text-gold-400 transition-colors"
                >
                  <div className="w-8 h-8 bg-forest-700 border border-forest-600 rounded-full flex items-center justify-center">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} className="w-full h-full rounded-full object-cover" alt="" />
                    ) : (
                      <span className="text-gold-400 font-serif font-bold text-sm">
                        {user.full_name.charAt(0)}
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-sans">{user.full_name.split(' ')[0]}</span>
                  <ChevronDown size={14} />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white shadow-xl border border-cream-200 rounded-sm py-1 z-50">
                    <Link href="/profile" className="flex items-center gap-2 px-4 py-2 text-sm text-forest-700 hover:bg-cream-50 font-sans" onClick={() => setProfileOpen(false)}>
                      <User size={14} /> My Profile
                    </Link>
                    {isAdmin && (
                      <Link href="/edh" className="flex items-center gap-2 px-4 py-2 text-sm text-forest-700 hover:bg-cream-50 font-sans" onClick={() => setProfileOpen(false)}>
                        <Shield size={14} /> Dashboard
                      </Link>
                    )}
                    <hr className="my-1 border-cream-200" />
                    <button
                      onClick={() => { logout(); setProfileOpen(false); }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-sans text-left"
                    >
                      <LogOut size={14} /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/login" className="text-cream-200 hover:text-gold-400 text-sm font-sans tracking-wider uppercase transition-colors">
                  Sign In
                </Link>
                <Link href="/register" className="btn-gold text-xs py-2 px-4">
                  Join
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden text-cream-200 hover:text-gold-400"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-forest-800 border-t border-forest-700 px-4 py-4 space-y-3">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block text-cream-200 hover:text-gold-400 font-sans text-sm tracking-wider uppercase py-2"
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          {isAdmin && (
            <Link
              href="/edh"
              className="flex items-center gap-2 text-gold-400 hover:text-gold-300 font-sans text-sm tracking-wider uppercase py-2"
              onClick={() => setMenuOpen(false)}
            >
              <Shield size={14} /> Dashboard
            </Link>
          )}
          <div className="pt-3 border-t border-forest-700 flex gap-3">
            {user ? (
              <button onClick={logout} className="btn-secondary text-cream-200 border-cream-400 text-xs">
                Sign Out
              </button>
            ) : (
              <>
                <Link href="/login" className="btn-secondary text-cream-200 border-cream-400 text-xs" onClick={() => setMenuOpen(false)}>Sign In</Link>
                <Link href="/register" className="btn-gold text-xs" onClick={() => setMenuOpen(false)}>Join</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
