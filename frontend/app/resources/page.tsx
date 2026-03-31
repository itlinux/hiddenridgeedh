'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Wrench, Star, ExternalLink, Loader2, GraduationCap, Landmark, Trash2 as TrashIcon } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';

const RESOURCE_CATEGORIES = [
  {
    category: 'Schools',
    icon: 'school',
    items: [
      { name: 'Rescue Union School District', url: 'https://www.rescueusd.org', desc: 'K-8 district serving El Dorado Hills' },
      { name: 'Jackson Elementary School', url: 'https://jackson.rescueusd.org', desc: 'Grades K-5' },
      { name: 'Lakeview Elementary School', url: 'https://lakeview.rescueusd.org', desc: 'Grades K-5' },
      { name: 'Lake Forest Elementary School', url: 'https://lakeforest.rescueusd.org', desc: 'Grades K-5' },
      { name: 'Rescue Elementary School', url: 'https://rescue.rescueusd.org', desc: 'Grades K-5' },
      { name: 'Marina Village Middle School', url: 'https://marinavillage.rescueusd.org', desc: 'Grades 6-8' },
      { name: 'Pleasant Grove Middle School', url: 'https://pleasantgrove.rescueusd.org', desc: 'Grades 6-8' },
      { name: 'Oak Ridge High School', url: 'https://www.eduhsd.net/OakRidge', desc: 'Grades 9-12' },
      { name: 'Rolling Hills Middle School', url: 'https://www.eduhsd.net/RollingHills', desc: 'Grades 6-8 (EDUHSD)' },
      { name: 'El Dorado Union High School District', url: 'https://www.eduhsd.net', desc: 'High school district' },
    ],
  },
  {
    category: 'Home & Repair',
    icon: 'wrench',
    items: [
      { name: 'Post your recommendation in the Forum', type: 'tip' },
    ],
  },
  {
    category: 'Landscaping & Yard',
    icon: 'wrench',
    items: [
      { name: 'Post your recommendation in the Forum', type: 'tip' },
    ],
  },
  {
    category: 'Utilities & Services',
    icon: 'wrench',
    items: [
      { name: 'El Dorado Irrigation District (EID)', url: 'https://www.eid.org', desc: 'Water service — pay bills, report leaks, conservation info' },
      { name: 'PG&E', url: 'https://www.pge.com/outages', desc: 'Electric & gas — outage map, billing, start/stop service' },
      { name: 'El Dorado Disposal', url: 'https://www.eldoradodisposal.com', desc: 'Trash, recycling & green waste pickup schedules' },
      { name: 'Consolidated Communications', url: 'https://www.consolidated.com/residential/internet', desc: 'Internet & phone service' },
      { name: 'SMUD', url: 'https://www.smud.org/en/Customer-Support/Outage-Status', desc: 'Electric service — outage map and billing' },
    ],
  },
  {
    category: 'Community & Recreation',
    icon: 'landmark',
    items: [
      { name: 'El Dorado Hills CSD', url: 'https://www.edhcsd.org', desc: 'Parks, pools, sports leagues, and community programs' },
      { name: 'El Dorado Hills Town Center', url: 'https://www.eldoradohillstowncenter.com', desc: 'Shopping, dining, and events calendar' },
      { name: 'El Dorado County Library — EDH Branch', url: 'https://www.eldoradolibrary.org', desc: 'Library hours, events, and digital resources' },
      { name: 'El Dorado Hills Chamber of Commerce', url: 'https://www.edhchamber.org', desc: 'Local business directory and community events' },
    ],
  },
];

function getCategoryIcon(icon: string) {
  switch (icon) {
    case 'school': return <GraduationCap className="text-gold-500" size={20} />;
    case 'landmark': return <Landmark className="text-gold-500" size={20} />;
    default: return <Wrench className="text-gold-500" size={20} />;
  }
}

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
                {getCategoryIcon(cat.icon)}
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
