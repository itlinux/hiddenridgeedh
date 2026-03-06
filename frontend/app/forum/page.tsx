'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { forumApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { MessageSquare, Pin, Lock, Loader2, Plus } from 'lucide-react';
import { format } from 'date-fns';

interface Thread {
  id: string;
  title: string;
  content?: string;
  author_name?: string;
  reply_count?: number;
  is_pinned?: boolean;
  is_locked?: boolean;
  last_activity?: string;
  created_at: string;
}

export default function ForumPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    forumApi.listThreads()
      .then(res => setThreads(res.data.threads || []))
      .catch(() => setThreads([]))
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-cream-50">
      <div className="bg-forest-800 py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="section-label text-gold-400 mb-3">Discuss & Connect</p>
          <h1 className="font-serif text-4xl text-cream-100">Forum</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-forest-400" size={32} />
          </div>
        ) : threads.length === 0 ? (
          <div className="text-center py-20">
            <MessageSquare className="text-forest-300 mx-auto mb-4" size={48} />
            <p className="font-body text-forest-400 text-lg">No discussions yet. Start the first one!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {threads.map((thread) => (
              <Link key={thread.id} href={`/forum/${thread.id}`} className="card p-5 flex items-center gap-4 group hover:shadow-md transition-shadow">
                <MessageSquare size={20} className="text-forest-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {thread.is_pinned && <Pin size={12} className="text-gold-500" />}
                    {thread.is_locked && <Lock size={12} className="text-forest-400" />}
                    <h3 className="font-serif text-lg text-forest-800 group-hover:text-forest-600 transition-colors truncate">
                      {thread.title}
                    </h3>
                  </div>
                  <div className="flex items-center gap-4 text-forest-400 text-xs font-sans mt-1">
                    <span>{thread.author_name}</span>
                    <span>{thread.reply_count || 0} replies</span>
                    <span>{format(new Date(thread.last_activity || thread.created_at), 'MMM d, yyyy')}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
