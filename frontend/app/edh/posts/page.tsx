'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { postsApi } from '@/lib/api';
import { FileText, Plus, Edit, Trash2, Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';

interface Post {
  id: string;
  title: string;
  slug: string;
  category: string;
  published: boolean;
  author_name: string;
  created_at: string;
}

export default function ManagePostsPage() {
  const { isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAdmin) router.push('/');
  }, [isLoading, isAdmin]);

  useEffect(() => {
    if (isAdmin) loadPosts();
  }, [isAdmin]);

  const loadPosts = async () => {
    try {
      const res = await postsApi.listAdmin({ limit: 100 });
      setPosts(res.data.posts || []);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await postsApi.delete(id);
      setPosts(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      alert('Failed to delete post');
    }
  };

  if (isLoading || !isAdmin) return null;

  return (
    <div className="min-h-screen bg-cream-50">
      <div className="bg-forest-800 border-b border-forest-700">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Link href="/edh" className="flex items-center gap-2 text-forest-300 hover:text-gold-400 text-sm mb-3 transition-colors">
            <ArrowLeft size={14} /> Back to Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="text-gold-400" size={24} />
              <h1 className="font-serif text-2xl text-cream-100">Manage Posts</h1>
            </div>
            <Link href="/edh/posts/new" className="btn-gold text-sm px-5 py-2 flex items-center gap-2">
              <Plus size={14} /> New Post
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-forest-400" size={32} /></div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <FileText className="text-forest-300 mx-auto mb-4" size={48} />
            <p className="font-body text-forest-400 text-lg mb-4">No posts yet</p>
            <Link href="/edh/posts/new" className="btn-primary text-sm">Create Your First Post</Link>
          </div>
        ) : (
          <div className="card divide-y divide-cream-100">
            {posts.map((post) => (
              <div key={post.id} className="p-5 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {post.published ? (
                      <Eye size={14} className="text-forest-500" />
                    ) : (
                      <EyeOff size={14} className="text-amber-500" />
                    )}
                    <Link href={`/blog/${post.slug}`} className="font-sans font-medium text-forest-800 text-sm hover:text-forest-600 truncate">
                      {post.title}
                    </Link>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-forest-400 font-sans">
                    <span>{post.category}</span>
                    <span>{post.author_name}</span>
                    <span>{format(new Date(post.created_at), 'MMM d, yyyy')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/edh/posts/${post.id}`} className="p-2 hover:bg-cream-100 rounded-sm transition-colors">
                    <Edit size={14} className="text-forest-500" />
                  </Link>
                  <button onClick={() => handleDelete(post.id, post.title)} className="p-2 hover:bg-red-50 rounded-sm transition-colors">
                    <Trash2 size={14} className="text-red-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
