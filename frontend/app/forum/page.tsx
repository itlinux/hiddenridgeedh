'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { forumApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { MessageSquare, Pin, Lock, Loader2, Plus, X, Send } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import PageHeader from '@/components/layout/PageHeader';
import dynamic from 'next/dynamic';

const RichTextEditor = dynamic(() => import('@/components/RichTextEditor'), { ssr: false });

interface ForumCategory {
  id: string;
  value: string;
  label: string;
  color: string;
}

interface Thread {
  id: string;
  title: string;
  content?: string;
  category?: string;
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
  const [activeCategory, setActiveCategory] = useState('');
  const [categories, setCategories] = useState<ForumCategory[]>([]);

  // New thread form
  const [showNewThread, setShowNewThread] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('general');
  const [submitting, setSubmitting] = useState(false);

  const loadThreads = (category?: string) => {
    setLoading(true);
    const params: any = {};
    if (category) params.category = category;
    forumApi.listThreads(params)
      .then(res => setThreads(res.data.threads || []))
      .catch(() => setThreads([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    // Load categories from API
    forumApi.listCategories()
      .then(res => setCategories(res.data.categories || []))
      .catch(() => setCategories([]));
    loadThreads(activeCategory);
  }, [user]);

  useEffect(() => {
    if (user) loadThreads(activeCategory);
  }, [activeCategory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const plainText = newContent.replace(/<[^>]*>/g, '').trim();
    if (!newTitle.trim() || !plainText) return;
    setSubmitting(true);
    try {
      await forumApi.createThread({
        title: newTitle.trim(),
        content: newContent.trim(),
        category: newCategory,
      });
      toast.success('Discussion posted!');
      setNewTitle('');
      setNewContent('');
      setNewCategory('general');
      setShowNewThread(false);
      loadThreads(activeCategory);
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to post. Please try again.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const getCategoryLabel = (value?: string) => {
    if (!value) return 'General';
    const cat = categories.find(c => c.value === value);
    return cat ? cat.label : value;
  };

  const getCategoryColor = (value?: string) => {
    if (!value) return 'bg-forest-200 text-forest-700';
    const cat = categories.find(c => c.value === value);
    return cat ? cat.color : 'bg-forest-200 text-forest-700';
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-cream-50">
      <PageHeader label="Discuss & Connect" title="Forum" />

      <div className="max-w-4xl mx-auto px-4 py-12">

        {/* Category Tabs + New Thread Button */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveCategory('')}
              className={`px-4 py-2 rounded-sm text-xs font-sans uppercase tracking-wider transition-colors ${
                activeCategory === ''
                  ? 'bg-forest-800 text-cream-100'
                  : 'bg-cream-100 text-forest-600 hover:bg-cream-200 border border-cream-200'
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setActiveCategory(cat.value)}
                className={`px-4 py-2 rounded-sm text-xs font-sans uppercase tracking-wider transition-colors ${
                  activeCategory === cat.value
                    ? 'bg-forest-800 text-cream-100'
                    : 'bg-cream-100 text-forest-600 hover:bg-cream-200 border border-cream-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowNewThread(!showNewThread)}
            className="btn-gold text-xs px-4 py-2 flex items-center gap-1 flex-shrink-0"
          >
            {showNewThread ? <><X size={14} /> Cancel</> : <><Plus size={14} /> New Discussion</>}
          </button>
        </div>

        {/* New Thread Form */}
        {showNewThread && (
          <form onSubmit={handleSubmit} className="card p-6 mb-8 space-y-4">
            <h3 className="font-serif text-xl text-forest-800">Start a Discussion</h3>
            <div>
              <label className="section-label block mb-1 text-xs">Category</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="input-field text-sm"
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="section-label block mb-1 text-xs">Title</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="input-field text-sm"
                placeholder="What do you want to discuss?"
                maxLength={200}
                required
              />
            </div>
            <div>
              <label className="section-label block mb-1 text-xs">Content</label>
              <RichTextEditor
                value={newContent}
                onChange={setNewContent}
                placeholder="Share your thoughts with the neighborhood..."
              />
            </div>
            <button type="submit" disabled={submitting} className="btn-primary text-sm flex items-center gap-2">
              {submitting ? <><Loader2 size={14} className="animate-spin" /> Posting...</> : <><Send size={14} /> Post Discussion</>}
            </button>
          </form>
        )}

        {/* Thread List */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-forest-400" size={32} />
          </div>
        ) : threads.length === 0 ? (
          <div className="text-center py-20">
            <MessageSquare className="text-forest-300 mx-auto mb-4" size={48} />
            <p className="font-body text-forest-400 text-lg">
              {activeCategory ? `No discussions in ${getCategoryLabel(activeCategory)} yet.` : 'No discussions yet.'}
            </p>
            <p className="font-body text-forest-400 text-sm mt-2">Start the first one!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {threads.map((thread) => (
              <Link key={thread.id} href={`/forum/${thread.id}`} className="card p-5 flex items-start gap-4 group hover:shadow-md transition-shadow">
                <MessageSquare size={20} className="text-forest-400 flex-shrink-0 mt-1" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {thread.is_pinned && <Pin size={12} className="text-gold-500" />}
                    {thread.is_locked && <Lock size={12} className="text-forest-400" />}
                    <h3 className="font-serif text-lg text-forest-800 group-hover:text-forest-600 transition-colors">
                      {thread.title}
                    </h3>
                  </div>
                  {thread.content && (
                    <p className="font-body text-forest-500 text-sm mt-1 line-clamp-2">
                      {thread.content.replace(/<[^>]*>/g, '').slice(0, 200)}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    {thread.category && (
                      <span className={`px-2 py-0.5 rounded-sm text-[10px] font-sans uppercase tracking-wider ${getCategoryColor(thread.category)}`}>
                        {getCategoryLabel(thread.category)}
                      </span>
                    )}
                    <span className="text-forest-400 text-xs font-sans">{thread.author_name}</span>
                    <span className="text-forest-400 text-xs font-sans">{thread.reply_count || 0} replies</span>
                    <span className="text-forest-400 text-xs font-sans">{format(new Date(thread.last_activity || thread.created_at), 'MMM d, yyyy')}</span>
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
