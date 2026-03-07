'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { forumApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { ArrowLeft, Loader2, Lock, Send, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';

const RichTextEditor = dynamic(() => import('@/components/RichTextEditor'), { ssr: false });

interface Reply {
  id: string;
  content: string;
  author_name?: string;
  created_at: string;
}

interface Thread {
  id: string;
  title: string;
  content: string;
  author_name?: string;
  is_locked?: boolean;
  is_pinned?: boolean;
  created_at: string;
}

export default function ThreadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, isSuperAdmin } = useAuth();
  const router = useRouter();
  const [thread, setThread] = useState<Thread | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    if (id) loadThread();
  }, [id, user]);

  const loadThread = async () => {
    try {
      const res = await forumApi.getThread(id);
      setThread(res.data);
      setReplies(res.data.replies || []);
    } catch {
      setThread(null);
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    const plainText = replyText.replace(/<[^>]*>/g, '').trim();
    if (!plainText) return;
    setSubmitting(true);
    try {
      await forumApi.createReply(id, { content: replyText });
      setReplyText('');
      const res = await forumApi.getThread(id);
      setReplies(res.data.replies || []);
      toast.success('Reply posted');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to post reply');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteThread = async () => {
    if (!confirm('Delete this entire thread and all its replies?')) return;
    try {
      await forumApi.deleteThread(id);
      toast.success('Thread deleted');
      router.push('/forum');
    } catch {
      toast.error('Failed to delete thread');
    }
  };

  const handleDeleteReply = async (replyId: string) => {
    if (!confirm('Delete this reply?')) return;
    try {
      await forumApi.deleteReply(replyId);
      setReplies(prev => prev.filter(r => r.id !== replyId));
      toast.success('Reply deleted');
    } catch {
      toast.error('Failed to delete reply');
    }
  };

  if (!user) return null;
  if (loading) return <div className="min-h-screen bg-cream-50 flex items-center justify-center"><Loader2 className="animate-spin text-forest-400" size={32} /></div>;
  if (!thread) return (
    <div className="min-h-screen bg-cream-50 flex items-center justify-center">
      <div className="text-center">
        <h2 className="font-serif text-2xl text-forest-800 mb-4">Thread not found</h2>
        <Link href="/forum" className="text-gold-500 hover:underline font-sans text-sm">Back to forum</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-cream-50">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link href="/forum" className="flex items-center gap-2 text-forest-400 hover:text-gold-500 font-sans text-sm mb-8 transition-colors">
          <ArrowLeft size={14} /> Back to forum
        </Link>

        {/* Thread */}
        <div className="card p-6 mb-6">
          <div className="flex items-start justify-between gap-4">
            <h1 className="font-serif text-3xl text-forest-800 mb-2">{thread.title}</h1>
            {isSuperAdmin && (
              <button
                onClick={handleDeleteThread}
                className="text-red-400 hover:text-red-600 transition-colors flex-shrink-0 mt-1"
                title="Delete thread"
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>
          <div className="text-forest-400 text-sm font-sans mb-4">
            {thread.author_name} · {format(new Date(thread.created_at), 'MMM d, yyyy h:mm a')}
          </div>
          <div className="prose-ridge" dangerouslySetInnerHTML={{ __html: thread.content }} />
        </div>

        {/* Replies */}
        <h3 className="font-serif text-xl text-forest-800 mb-4">{replies.length} {replies.length === 1 ? 'Reply' : 'Replies'}</h3>
        <div className="space-y-4 mb-8">
          {replies.map((reply) => (
            <div key={reply.id} className="card p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="text-forest-400 text-xs font-sans">
                  {reply.author_name} · {format(new Date(reply.created_at), 'MMM d, yyyy h:mm a')}
                </div>
                {isSuperAdmin && (
                  <button
                    onClick={() => handleDeleteReply(reply.id)}
                    className="text-red-400 hover:text-red-600 transition-colors"
                    title="Delete reply"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              <div className="prose-ridge text-sm" dangerouslySetInnerHTML={{ __html: reply.content }} />
            </div>
          ))}
        </div>

        {/* Reply form */}
        {thread.is_locked ? (
          <div className="flex items-center gap-2 text-forest-400 font-sans text-sm">
            <Lock size={14} /> This thread is locked.
          </div>
        ) : (
          <form onSubmit={handleReply} className="card p-5">
            <RichTextEditor
              value={replyText}
              onChange={setReplyText}
              placeholder="Write a reply..."
              compact
            />
            <div className="flex justify-end mt-3">
              <button type="submit" disabled={submitting} className="btn-primary flex items-center gap-2 text-sm">
                {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                Reply
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
