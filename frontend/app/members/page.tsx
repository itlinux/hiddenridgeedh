'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { membersApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Users, Search, Loader2 } from 'lucide-react';

interface Member {
  id: string;
  username?: string;
  full_name?: string;
  bio?: string;
  avatar_url?: string;
  role?: string;
}

export default function MembersPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user]);

  useEffect(() => {
    if (user) loadMembers();
  }, [user, search]);

  const loadMembers = async () => {
    setLoading(true);
    try {
      const res = await membersApi.list({ search: search || undefined, limit: 100 });
      setMembers(res.data.members || []);
      setTotal(res.data.total || 0);
    } catch {
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return <div className="min-h-screen bg-cream-50 flex items-center justify-center"><Loader2 className="animate-spin text-forest-400" size={32} /></div>;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-cream-50">
      <div className="bg-forest-800 py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="section-label text-gold-400 mb-3">Our Community</p>
          <h1 className="font-serif text-4xl text-cream-100">Neighbors</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Search */}
        <div className="relative mb-8">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-forest-400" />
          <input
            type="text"
            placeholder="Search neighbors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10 w-full"
          />
        </div>

        <p className="text-forest-400 font-sans text-sm mb-6">{total} neighbors</p>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-forest-400" size={32} />
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-20">
            <Users className="text-forest-300 mx-auto mb-4" size={48} />
            <p className="font-body text-forest-400 text-lg">No neighbors found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {members.map((member) => (
              <Link key={member.id} href={`/members/${member.id}`} className="card p-5 flex items-center gap-4 group hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-forest-100 border border-forest-200 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {member.avatar_url ? (
                    <img src={member.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-forest-600 font-serif font-bold text-lg">
                      {(member.full_name || '?').charAt(0)}
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="font-sans font-medium text-forest-800 group-hover:text-forest-600 transition-colors">
                    {member.full_name}
                  </h3>
                  {member.bio && (
                    <p className="text-forest-400 text-xs font-body line-clamp-1 mt-1">{member.bio}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
