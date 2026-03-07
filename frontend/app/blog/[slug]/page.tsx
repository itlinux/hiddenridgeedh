'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { postsApi } from '@/lib/api';
import { Calendar, ArrowLeft, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  category?: string;
  author_name?: string;
  created_at: string;
  cover_image?: string;
}

export default function PostDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (slug) {
      postsApi.get(slug)
        .then(res => setPost(res.data))
        .catch(() => setError(true))
        .finally(() => setLoading(false));
    }
  }, [slug]);

  if (loading) return <div className="min-h-screen bg-cream-50 flex items-center justify-center"><Loader2 className="animate-spin text-forest-400" size={32} /></div>;
  if (error || !post) return (
    <div className="min-h-screen bg-cream-50 flex items-center justify-center">
      <div className="text-center">
        <h2 className="font-serif text-2xl text-forest-800 mb-4">Post not found</h2>
        <Link href="/blog" className="text-gold-500 hover:underline font-sans text-sm">Back to blog</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-cream-50">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link href="/blog" className="flex items-center gap-2 text-forest-400 hover:text-gold-500 font-sans text-sm mb-8 transition-colors">
          <ArrowLeft size={14} /> Back to blog
        </Link>

        {post.category && <span className="section-label text-gold-500">{post.category}</span>}
        <h1 className="font-serif text-4xl text-forest-800 mt-2 mb-4">{post.title}</h1>
        <div className="flex items-center gap-4 text-forest-400 text-sm font-sans mb-8">
          {post.author_name && <span>By {post.author_name}</span>}
          <div className="flex items-center gap-1">
            <Calendar size={12} />
            {format(new Date(post.created_at), 'MMMM d, yyyy')}
          </div>
        </div>

        {post.cover_image && (
          <img src={post.cover_image} alt="" className="w-full rounded-sm mb-8" />
        )}

        <div className="prose-ridge font-body text-forest-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: post.content }} />
      </div>
    </div>
  );
}
