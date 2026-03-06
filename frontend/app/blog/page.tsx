'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { postsApi } from '@/lib/api';
import { Calendar, ArrowRight, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  category?: string;
  author_name?: string;
  created_at: string;
  cover_image?: string;
}

export default function BlogPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const perPage = 12;

  useEffect(() => {
    loadPosts();
  }, [page]);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const res = await postsApi.list({ skip: page * perPage, limit: perPage });
      setPosts(res.data.posts || []);
      setTotal(res.data.total || 0);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-50">
      <div className="bg-forest-800 py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="section-label text-gold-400 mb-3">Stay Informed</p>
          <h1 className="font-serif text-4xl text-cream-100">News & Blog</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-forest-400" size={32} />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <p className="font-body text-forest-400 text-lg">No posts yet. Check back soon!</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <Link key={post.id} href={`/blog/${post.slug}`} className="card group hover:shadow-md transition-shadow">
                  {post.cover_image && (
                    <div className="h-48 overflow-hidden">
                      <img src={post.cover_image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                  )}
                  <div className="p-6">
                    {post.category && (
                      <span className="section-label text-gold-500">{post.category}</span>
                    )}
                    <h2 className="font-serif text-xl text-forest-800 mt-2 mb-3 group-hover:text-forest-600 transition-colors">
                      {post.title}
                    </h2>
                    {post.excerpt && (
                      <p className="font-body text-forest-500 text-sm leading-relaxed mb-4 line-clamp-3">{post.excerpt}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-forest-400 text-xs font-sans">
                        <Calendar size={12} />
                        {format(new Date(post.created_at), 'MMM d, yyyy')}
                      </div>
                      <ArrowRight size={14} className="text-gold-500 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {total > perPage && (
              <div className="flex justify-center gap-3 mt-10">
                <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="btn-secondary text-sm disabled:opacity-50">Previous</button>
                <button onClick={() => setPage(p => p + 1)} disabled={(page + 1) * perPage >= total} className="btn-secondary text-sm disabled:opacity-50">Next</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
