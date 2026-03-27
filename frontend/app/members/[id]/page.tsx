'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { membersApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { ArrowLeft, Loader2, MapPin, Phone, Mail, MessageSquare } from 'lucide-react';

interface Member {
  id: string;
  username?: string;
  full_name?: string;
  bio?: string;
  avatar_url?: string;
  address?: string;
  email?: string;
  phone?: string;
  sms_opt_in?: boolean;
  role?: string;
}

export default function MemberProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) { router.push('/login'); return; }
    if (user && id) {
      membersApi.get(id)
        .then(res => setMember(res.data))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [id, user, authLoading]);

  if (authLoading || loading) return <div className="min-h-screen bg-cream-50 flex items-center justify-center"><Loader2 className="animate-spin text-forest-400" size={32} /></div>;
  if (!member) return (
    <div className="min-h-screen bg-cream-50 flex items-center justify-center">
      <div className="text-center">
        <h2 className="font-serif text-2xl text-forest-800 mb-4">Member not found</h2>
        <Link href="/members" className="text-gold-500 hover:underline font-sans text-sm">Back to neighbors</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-cream-50">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Link href="/members" className="flex items-center gap-2 text-forest-400 hover:text-gold-500 font-sans text-sm mb-8 transition-colors">
          <ArrowLeft size={14} /> Back to neighbors
        </Link>

        <div className="card p-8 text-center">
          <div className="w-24 h-24 bg-forest-100 border-2 border-forest-200 rounded-full flex items-center justify-center mx-auto mb-6 overflow-hidden">
            {member.avatar_url ? (
              <img src={member.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-forest-600 font-serif font-bold text-3xl">
                {(member.full_name || '?').charAt(0)}
              </span>
            )}
          </div>
          <h1 className="font-serif text-3xl text-forest-800 mb-2">{member.full_name}</h1>
          {member.role && member.role !== 'member' && (
            <span className="inline-block bg-gold-100 text-gold-700 text-xs font-sans px-3 py-1 rounded-sm uppercase tracking-wider">
              {member.role.replace('_', ' ')}
            </span>
          )}
          {member.bio && (
            <p className="font-body text-forest-500 mt-6 leading-relaxed">{member.bio}</p>
          )}

          {(member.address || member.email || member.phone) && (
            <div className="mt-8 pt-6 border-t border-forest-100 space-y-3 text-left">
              {member.address && (
                <div className="flex items-center gap-3 text-forest-600 font-body text-sm">
                  <MapPin size={16} className="text-forest-400 flex-shrink-0" />
                  <Link href={`/map?search=${encodeURIComponent(member.address)}`} className="hover:text-gold-500 transition-colors">
                    {member.address}
                  </Link>
                </div>
              )}
              {member.email && (
                <div className="flex items-center gap-3 text-forest-600 font-body text-sm">
                  <Mail size={16} className="text-forest-400 flex-shrink-0" />
                  <a href={`mailto:${member.email}`} className="hover:text-gold-500 transition-colors">{member.email}</a>
                </div>
              )}
              {member.phone && (
                <div className="flex items-center gap-3 text-forest-600 font-body text-sm">
                  <Phone size={16} className="text-forest-400 flex-shrink-0" />
                  <a href={`tel:${member.phone}`} className="hover:text-gold-500 transition-colors">{member.phone}</a>
                  {member.sms_opt_in && (
                    <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-xs font-sans px-2 py-0.5 rounded-sm">
                      <MessageSquare size={12} /> SMS OK
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
