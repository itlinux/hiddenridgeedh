'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { newsletterApi } from '@/lib/api';
import { ArrowLeft, Users, Loader2, Trash2, Mail } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function SubscribersPage() {
  const { user, isSuperAdmin, isLoading } = useAuth();
  const router = useRouter();
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(true);

  useEffect(() => {
    if (!isLoading && !isSuperAdmin) router.push('/');
  }, [isLoading, isSuperAdmin]);

  useEffect(() => {
    if (isSuperAdmin) loadSubscribers();
  }, [isSuperAdmin]);

  const loadSubscribers = async () => {
    try {
      const res = await newsletterApi.listSubscribers();
      setSubscribers(res.data.subscribers || res.data || []);
    } catch {
      setSubscribers([]);
    } finally {
      setLoadingSubs(false);
    }
  };

  const handleDelete = async (sub: any) => {
    if (!confirm(`Remove subscriber ${sub.email}?`)) return;
    try {
      await newsletterApi.deleteSubscriber(sub.id);
      setSubscribers(prev => prev.filter((s: any) => s.id !== sub.id));
      toast.success(`Removed ${sub.email}`);
    } catch {
      toast.error('Failed to remove subscriber');
    }
  };

  if (isLoading || !isSuperAdmin) return null;

  const active = subscribers.filter((s: any) => s.is_active && s.confirmed);

  return (
    <div className="min-h-screen bg-cream-50">
      <div className="bg-forest-800 border-b border-forest-700">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link href="/edh" className="flex items-center gap-2 text-forest-300 hover:text-gold-400 text-sm mb-3 transition-colors">
            <ArrowLeft size={14} /> Back to Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <Users className="text-gold-400" size={24} />
            <h1 className="font-serif text-2xl text-cream-100">Newsletter Subscribers</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {loadingSubs ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-forest-400" size={32} />
          </div>
        ) : active.length === 0 ? (
          <div className="text-center py-20">
            <Users className="text-forest-300 mx-auto mb-4" size={48} />
            <p className="font-body text-forest-400 text-lg">No active subscribers yet.</p>
          </div>
        ) : (
          <>
            <p className="font-sans text-sm text-forest-500 mb-4">{active.length} active subscriber{active.length !== 1 ? 's' : ''}</p>
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-cream-100 text-forest-600 font-sans text-xs uppercase tracking-wider">
                      <th className="px-5 py-3 text-left">Email</th>
                      <th className="px-5 py-3 text-left">Subscribed</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cream-200">
                    {active.map((sub: any) => (
                      <tr key={sub.id} className="hover:bg-cream-50">
                        <td className="px-5 py-3 font-body text-forest-700">{sub.email}</td>
                        <td className="px-5 py-3 text-forest-400 font-sans text-xs">
                          {sub.subscribed_at ? new Date(sub.subscribed_at).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <a
                              href={`mailto:${sub.email}`}
                              className="text-forest-400 hover:text-gold-500 transition-colors"
                              title="Send email"
                            >
                              <Mail size={14} />
                            </a>
                            <button
                              onClick={() => handleDelete(sub)}
                              className="text-red-400 hover:text-red-600 transition-colors"
                              title="Remove subscriber"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
