'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { membersApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { ArrowLeft, Loader2, Dog, GraduationCap, Users, MapPin, Phone, Mail, MessageSquare, ExternalLink } from 'lucide-react';

interface FamilyMember {
  name: string;
  bio?: string;
  photo_url?: string;
}

interface Member {
  id: string;
  username?: string;
  full_name?: string;
  bio?: string;
  avatar_url?: string;
  address?: string;
  email?: string;
  phone?: string;
  alt_phone?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  sms_opt_in?: boolean;
  role?: string;
  school?: string;
  has_dog?: boolean;
  dog_friendly?: boolean;
  dog_bio?: string;
  dog_photo_url?: string;
  house_photo_url?: string;
  family_members?: FamilyMember[];
  latitude?: number;
  longitude?: number;
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

  const familyMembers = member.family_members || [];

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || '';
  const mapQuery = member.latitude && member.longitude
    ? `${member.latitude},${member.longitude}`
    : member.address ? encodeURIComponent(member.address) : null;

  const mapEmbedUrl = mapQuery && apiKey
    ? `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${mapQuery}&zoom=17&maptype=satellite`
    : null;

  const mapsLink = member.latitude && member.longitude
    ? `https://www.google.com/maps?q=${member.latitude},${member.longitude}`
    : member.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(member.address)}`
    : null;

  return (
    <div className="min-h-screen bg-cream-50">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Link href="/members" className="flex items-center gap-2 text-forest-400 hover:text-gold-500 font-sans text-sm mb-8 transition-colors">
          <ArrowLeft size={14} /> Back to neighbors
        </Link>

        {/* House Photo */}
        {member.house_photo_url && (
          <div className="mb-6 rounded-sm overflow-hidden border border-cream-200">
            <img
              src={member.house_photo_url}
              alt={`${member.full_name}'s house`}
              className="w-full h-48 object-cover"
            />
          </div>
        )}

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

          {/* Info badges */}
          <div className="flex flex-wrap justify-center gap-3 mt-6">
            {member.school && (
              <span className="inline-flex items-center gap-1.5 bg-cream-100 text-forest-600 text-xs font-sans px-3 py-1.5 rounded-sm">
                <GraduationCap size={14} className="text-gold-500" />
                {member.school}
              </span>
            )}
            {member.has_dog && (
              <span className="inline-flex items-center gap-1.5 bg-cream-100 text-forest-600 text-xs font-sans px-3 py-1.5 rounded-sm">
                <Dog size={14} className="text-gold-500" />
                {member.dog_friendly ? 'Has a friendly dog' : 'Has a dog'}
              </span>
            )}
          </div>

          {/* Dog Photo + Bio */}
          {member.has_dog && (member.dog_photo_url || member.dog_bio) && (
            <div className="mt-6 space-y-3">
              {member.dog_photo_url && (
                <img
                  src={member.dog_photo_url}
                  alt={`${member.full_name}'s dog`}
                  className="w-32 h-32 object-cover rounded-sm border border-cream-200 mx-auto"
                />
              )}
              {member.dog_bio && (
                <p className="text-forest-600 font-sans text-sm text-center italic max-w-xs mx-auto">{member.dog_bio}</p>
              )}
            </div>
          )}

          {/* Contact info */}
          {(member.address || member.email || member.phone || member.alt_phone || member.emergency_contact_phone) && (
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
              {member.alt_phone && (
                <div className="flex items-center gap-3 text-forest-600 font-body text-sm">
                  <Phone size={16} className="text-forest-400 flex-shrink-0" />
                  <a href={`tel:${member.alt_phone}`} className="hover:text-gold-500 transition-colors">{member.alt_phone}</a>
                  <span className="text-forest-400 text-xs font-sans">alt</span>
                </div>
              )}
              {(member.emergency_contact_name || member.emergency_contact_phone) && (
                <div className="mt-3 pt-3 border-t border-forest-100">
                  <p className="text-forest-400 text-xs font-sans uppercase tracking-wider mb-1">Emergency Contact</p>
                  {member.emergency_contact_name && (
                    <p className="text-forest-600 font-body text-sm">{member.emergency_contact_name}</p>
                  )}
                  {member.emergency_contact_phone && (
                    <a href={`tel:${member.emergency_contact_phone}`} className="text-forest-600 font-body text-sm hover:text-gold-500 transition-colors">
                      {member.emergency_contact_phone}
                    </a>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Family Members */}
        {familyMembers.length > 0 && (
          <div className="card p-8 mt-6">
            <div className="flex items-center gap-3 mb-6">
              <Users size={20} className="text-gold-500" />
              <h2 className="font-serif text-xl text-forest-800">Family Members</h2>
            </div>
            <div className="space-y-4">
              {familyMembers.map((fm, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-forest-100 border border-forest-200 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                    {fm.photo_url ? (
                      <img src={fm.photo_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-forest-500 font-serif font-bold text-sm">
                        {fm.name.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="font-sans text-forest-800 font-medium text-sm">{fm.name}</p>
                    {fm.bio && <p className="font-body text-forest-500 text-xs mt-1">{fm.bio}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mini map */}
        {mapEmbedUrl && (
          <div className="card overflow-hidden mt-4">
            <iframe
              src={mapEmbedUrl}
              width="100%"
              height="280"
              style={{ border: 0, display: 'block' }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
            {mapsLink && (
              <div className="px-4 py-2 bg-white border-t border-cream-100 flex justify-end">
                <a
                  href={mapsLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-forest-400 hover:text-gold-500 font-sans flex items-center gap-1 transition-colors"
                >
                  Open in Google Maps <ExternalLink size={11} />
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
