'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Wrench, Star, ExternalLink, Loader2 } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';

const RESOURCE_CATEGORIES = [
  {
    category: 'Home & Repair',
    items: [
      { name: 'Post your recommendation in the Forum', type: 'tip' },
    ],
  },
  {
    category: 'Landscaping & Yard',
    items: [
      { name: 'Post your recommendation in the Forum', type: 'tip' },
    ],
  },
  {
    category: 'Utilities & Services',
    items: [
      { name: 'El Dorado Irrigation District (EID)', url: 'https://www.eid.org', desc: 'Water service' },
      { name: 'PG&E', url: 'https://www.pge.com', desc: 'Electric & gas service' },
      { name: 'Republic Services', url: 'https://www.republicservices.com', desc: 'Trash & recycling' },
      { name: 'Consolidated Communications', url: 'https://www.consolidated.com', desc: 'Internet & phone' },
    ],
  },
  {
    category: 'Community & Recreation',
    items: [
      { name: 'El Dorado Hills CSD', url: 'https://www.edhcsd.org', desc: 'Parks, pools, and community programs' },
      { name: 'El Dorado Hills Town Center', url: 'https://www.eldoradohillstowncenter.com', desc: 'Shopping & dining' },
      { name: 'El Dorado Hills Library', url: 'https://www.eldoradolibrary.org', desc: 'El Dorado County Library' },
    ],
  },
];

export default function ResourcesPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) router.push('/login');
  }, [isLoading, user]);

  if (isLoading) return <div className="min-h-screen bg-cream-50 flex items-center justify-center"><Loader2 className="animate-spin text-forest-400" size={32} /></div>;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-cream-50">
      <PageHeader label="Helpful Info" title="Local Resources" />

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-cream-100 border border-cream-200 rounded-sm p-5 mb-8">
          <p className="font-sans text-sm text-forest-600 leading-relaxed">
            <Star size={14} className="inline text-gold-500 mr-1" />
            <strong>Know a great local service provider?</strong> Share your recommendation in the{' '}
            <a href="/forum" className="text-gold-500 hover:underline">Neighborhood Forum</a> so
            your neighbors can benefit too.
          </p>
        </div>

        <div className="space-y-8">
          {RESOURCE_CATEGORIES.map((cat) => (
            <div key={cat.category} className="card p-8">
              <div className="flex items-center gap-3 mb-5">
                <Wrench className="text-gold-500" size={20} />
                <h2 className="font-serif text-xl text-forest-800">{cat.category}</h2>
              </div>
              <div className="space-y-3">
                {cat.items.map((item) => (
                  'url' in item && item.url ? (
                    <a
                      key={item.name}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between bg-cream-50 hover:bg-cream-100 rounded-sm p-4 transition-colors group"
                    >
                      <div>
                        <p className="font-sans text-sm font-medium text-forest-800 group-hover:text-gold-600 transition-colors">{item.name}</p>
                        {'desc' in item && item.desc && <p className="text-forest-400 text-xs font-sans mt-0.5">{item.desc}</p>}
                      </div>
                      <ExternalLink size={14} className="text-forest-300 group-hover:text-gold-500 shrink-0" />
                    </a>
                  ) : (
                    <div key={item.name} className="bg-cream-50 rounded-sm p-4">
                      <p className="text-forest-400 font-sans text-sm italic">{item.name}</p>
                    </div>
                  )
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
