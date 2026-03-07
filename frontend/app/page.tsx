'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Trees, Users, Calendar, MessageSquare, ShieldAlert, Wrench, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { newsletterApi } from '@/lib/api';
import Turnstile from '@/components/Turnstile';

export default function HomePage() {
  const [nlEmail, setNlEmail] = useState('');
  const [nlLoading, setNlLoading] = useState(false);
  const [nlTurnstileToken, setNlTurnstileToken] = useState('');

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nlEmail) return;
    setNlLoading(true);
    try {
      await newsletterApi.subscribe({ email: nlEmail, turnstile_token: nlTurnstileToken || undefined });
      toast.success('Check your email to confirm your subscription.');
      setNlEmail('');
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to subscribe. Please try again.';
      toast.error(msg);
    } finally {
      setNlLoading(false);
    }
  };

  return (
    <div className="bg-cream-50">

      {/* Hero */}
      <section className="relative overflow-hidden min-h-[80vh] flex items-start justify-center">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: 'url(/images/hero-bg.webp)' }} />
        <div className="absolute inset-0 bg-forest-800/50" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-32 text-center">
          <Image
            src="/images/logo.png"
            alt="Hidden Ridge EDH"
            width={240}
            height={240}
            className="mx-auto mb-6 drop-shadow-2xl"
            priority
          />
          <h1 className="font-serif text-3xl sm:text-5xl text-cream-100 leading-tight mb-4">
            Hidden Ridge
            <span className="block text-gold-400 italic text-2xl sm:text-4xl">El Dorado Hills</span>
          </h1>
          <div className="divider-gold" />
          <p className="font-body text-forest-300 text-base max-w-2xl mx-auto mt-4 leading-relaxed">
            Connecting neighbors, sharing news, and celebrating our neighborhood.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <Link href="/register" className="btn-gold text-base px-8 py-4">
              Request Access
            </Link>
            <Link href="/blog" className="btn-secondary text-cream-200 border-cream-400 text-base px-8 py-4">
              Neighborhood News
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="section-label text-bark-400">Everything you need</p>
          <h2 className="font-serif text-4xl text-forest-800 mt-3">Your Neighborhood, Connected</h2>
          <div className="divider-gold" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: Trees,
              title: 'Neighborhood Blog',
              desc: 'Stay informed with neighborhood news, HOA updates, and local announcements from your neighborhood administrators.',
              href: '/blog',
              color: 'text-forest-600',
            },
            {
              icon: Calendar,
              title: 'Events Calendar',
              desc: 'Never miss a neighborhood event. RSVP to block parties, HOA meetings, holiday gatherings, and more.',
              href: '/events',
              color: 'text-gold-500',
            },
            {
              icon: MessageSquare,
              title: 'Neighbor Forum',
              desc: 'Discuss local topics, share recommendations, coordinate for lost pets, or find a trusted contractor.',
              href: '/forum',
              color: 'text-forest-600',
            },
            {
              icon: Users,
              title: 'Member Directory',
              desc: 'Get to know your neighbors. Browse profiles of approved Hidden Ridge residents.',
              href: '/members',
              color: 'text-forest-600',
            },
            {
              icon: ShieldAlert,
              title: 'Safety & Alerts',
              desc: 'Stay safe with neighborhood alerts, emergency contacts, crime watch updates, and important safety notices.',
              href: '/safety',
              color: 'text-gold-500',
            },
            {
              icon: Wrench,
              title: 'Local Resources',
              desc: 'Find trusted contractors, landscapers, handymen, and local service providers recommended by your neighbors.',
              href: '/resources',
              color: 'text-forest-600',
            },
          ].map((feature) => (
            <Link
              key={feature.title}
              href={feature.href}
              className="card p-8 group hover:shadow-md transition-shadow duration-300"
            >
              <feature.icon className={`${feature.color} mb-4`} size={28} />
              <h3 className="font-serif text-xl text-forest-800 mb-3 group-hover:text-forest-600 transition-colors">
                {feature.title}
              </h3>
              <p className="font-body text-forest-500 text-sm leading-relaxed mb-4">{feature.desc}</p>
              <span className="flex items-center gap-1 text-gold-500 text-xs font-sans uppercase tracking-wider">
                Explore <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Divider */}
      <div className="bg-forest-700 h-px mx-auto max-w-7xl" />

      {/* Newsletter + Join CTA */}
      <section className="py-24">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <p className="section-label text-bark-400">Stay in the loop</p>
          <h2 className="font-serif text-4xl text-forest-800 mt-3 mb-4">
            Ready to Join Your Neighbors?
          </h2>
          <div className="divider-gold" />
          <p className="font-body text-forest-500 text-lg mt-6 mb-8 leading-relaxed">
            Subscribe to receive neighborhood updates, event reminders, and important announcements directly in your inbox.
          </p>
          <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto" onSubmit={handleSubscribe}>
            <input
              type="email"
              placeholder="your@email.com"
              className="input-field flex-1"
              value={nlEmail}
              onChange={(e) => setNlEmail(e.target.value)}
              required
            />
            <button type="submit" disabled={nlLoading} className="btn-primary whitespace-nowrap flex items-center justify-center gap-2">
              {nlLoading ? <><Loader2 size={16} className="animate-spin" /> Subscribing...</> : 'Subscribe'}
            </button>
          </form>
          <div className="flex justify-center mt-3">
            <Turnstile onVerify={setNlTurnstileToken} />
          </div>
          <p className="text-forest-400 text-xs mt-4 font-sans">No spam. Unsubscribe anytime.</p>
          <div className="mt-10 pt-8 border-t border-forest-200">
            <p className="text-forest-500 text-sm font-body mb-4">
              Want full access to the forum, gallery, and events?
            </p>
            <Link href="/register" className="btn-gold text-base px-10 py-4">
              Request Access
            </Link>
            <p className="text-forest-400 text-sm mt-4 font-sans">
              Already a member? <Link href="/login" className="text-gold-400 hover:underline">Sign in here</Link>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
