'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { ShieldAlert, Phone, AlertTriangle, Loader2 } from 'lucide-react';

export default function SafetyPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) router.push('/login');
  }, [isLoading, user]);

  if (isLoading) return <div className="min-h-screen bg-cream-50 flex items-center justify-center"><Loader2 className="animate-spin text-forest-400" size={32} /></div>;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-cream-50">
      <div className="bg-forest-800 py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="section-label text-gold-400 mb-3">Stay Safe</p>
          <h1 className="font-serif text-4xl text-cream-100">Safety & Alerts</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Emergency Contacts */}
        <div className="card p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Phone className="text-gold-500" size={24} />
            <h2 className="font-serif text-2xl text-forest-800">Emergency Contacts</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: 'Emergency (Fire, Police, Medical)', number: '911' },
              { label: 'El Dorado County Sheriff (Non-Emergency)', number: '(530) 621-5655' },
              { label: 'El Dorado Hills Fire Department', number: '(916) 933-6623' },
              { label: 'PG&E Power Outage', number: '1-800-743-5000' },
              { label: 'EID Water Emergency', number: '(530) 642-4000' },
              { label: 'Animal Control', number: '(916) 368-7387' },
            ].map((contact) => (
              <div key={contact.label} className="bg-cream-100 rounded-sm p-4">
                <p className="text-forest-400 text-xs font-sans mb-1">{contact.label}</p>
                <p className="text-forest-800 font-sans font-semibold text-lg">{contact.number}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Safety Tips */}
        <div className="card p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <ShieldAlert className="text-gold-500" size={24} />
            <h2 className="font-serif text-2xl text-forest-800">Neighborhood Safety Tips</h2>
          </div>
          <ul className="space-y-4 font-body text-forest-600 text-sm leading-relaxed">
            <li className="flex items-start gap-3">
              <AlertTriangle size={16} className="text-gold-500 mt-0.5 shrink-0" />
              <span><strong>Lock your vehicles</strong> — always lock car doors, even in your own driveway. Never leave valuables visible.</span>
            </li>
            <li className="flex items-start gap-3">
              <AlertTriangle size={16} className="text-gold-500 mt-0.5 shrink-0" />
              <span><strong>Report suspicious activity</strong> — if you see something unusual, call the El Dorado County Sheriff non-emergency line or 911 if there is an immediate threat.</span>
            </li>
            <li className="flex items-start gap-3">
              <AlertTriangle size={16} className="text-gold-500 mt-0.5 shrink-0" />
              <span><strong>Wildlife awareness</strong> — coyotes, deer, and rattlesnakes are common in El Dorado Hills. Keep pets supervised and trash secured.</span>
            </li>
            <li className="flex items-start gap-3">
              <AlertTriangle size={16} className="text-gold-500 mt-0.5 shrink-0" />
              <span><strong>Fire safety</strong> — maintain defensible space around your home. Clear dry brush and dead vegetation, especially during fire season.</span>
            </li>
            <li className="flex items-start gap-3">
              <AlertTriangle size={16} className="text-gold-500 mt-0.5 shrink-0" />
              <span><strong>Know your neighbors</strong> — introduce yourself, exchange phone numbers, and watch out for each other. A connected neighborhood is a safer neighborhood.</span>
            </li>
          </ul>
        </div>

        {/* Useful Links */}
        <div className="card p-8">
          <h2 className="font-serif text-2xl text-forest-800 mb-6">Useful Links</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: 'El Dorado County Sheriff', url: 'https://www.edcgov.us/Government/Sheriff' },
              { label: 'El Dorado Hills Fire', url: 'https://www.edhfire.com' },
              { label: 'Ready for Wildfire', url: 'https://www.readyforwildfire.org' },
              { label: 'PG&E Outage Map', url: 'https://pgealerts.alerts.pge.com/outagecenter/' },
              { label: 'Nextdoor (EDH)', url: 'https://nextdoor.com' },
              { label: 'El Dorado Hills CSD', url: 'https://www.edhcsd.org' },
            ].map((link) => (
              <a
                key={link.label}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-cream-100 rounded-sm p-3 text-forest-600 font-sans text-sm hover:text-gold-500 hover:bg-cream-200 transition-colors"
              >
                {link.label} &rarr;
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
