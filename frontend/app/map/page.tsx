'use client';

import { Suspense, useEffect, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { membersApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Loader2, MapPin } from 'lucide-react';
import dynamic from 'next/dynamic';
import PageHeader from '@/components/layout/PageHeader';

interface MemberPin {
  id: string;
  full_name?: string;
  address?: string;
  latitude: number;
  longitude: number;
}

// Dynamically import the map component to avoid SSR issues with Leaflet
const NeighborhoodMap = dynamic(() => import('./NeighborhoodMap'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[600px] bg-cream-100 rounded-sm">
      <Loader2 className="animate-spin text-forest-400" size={32} />
    </div>
  ),
});

export default function MapPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-cream-50 flex items-center justify-center"><Loader2 className="animate-spin text-forest-400" size={32} /></div>}>
      <MapPageContent />
    </Suspense>
  );
}

function MapPageContent() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  const [members, setMembers] = useState<MemberPin[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user]);

  useEffect(() => {
    if (user) {
      membersApi
        .list({ limit: 500 })
        .then((res) => {
          const pins = (res.data.members || []).filter(
            (m: any) => m.latitude && m.longitude
          );
          setMembers(pins);
        })
        .catch(() => setMembers([]))
        .finally(() => setLoading(false));
    }
  }, [user]);

  if (authLoading)
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-forest-400" size={32} />
      </div>
    );
  if (!user) return null;

  return (
    <div className="min-h-screen bg-cream-50">
      <PageHeader label="Our Neighborhood" title="Neighborhood Map" />

      <div className="max-w-6xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-forest-400" size={32} />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-3">
              <p className="text-forest-400 font-sans text-sm">
                <MapPin size={14} className="inline mr-1" />
                {members.length} neighbor{members.length !== 1 ? 's' : ''} on the map
              </p>
              <p className="text-forest-400 font-sans text-xs">
                Member locations are private — do not share or distribute.
              </p>
            </div>
            <div className="card overflow-hidden" style={{ height: 'calc(100vh - 220px)', minHeight: '400px' }}>
              <NeighborhoodMap members={members} initialSearch={initialSearch} />
            </div>
            {members.length === 0 && (
              <p className="text-forest-400 font-body text-sm mt-4 text-center">
                No neighbors have set their map coordinates yet. Update your profile to appear on the map.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
