'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { postsApi } from '@/lib/api';
import { ArrowLeft, Save, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

export default function NewPostPage() {
  const { isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    content: '',
    category: 'general',
    tags: '',
    cover_image: '',
    published: true,
  });

  if (!isLoading && !isAdmin) {
    router.push('/');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      };
      await postsApi.create(payload);
      router.push('/edh/posts');
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create post');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return null;

  return (
    <div className="min-h-screen bg-cream-50">
      <div className="bg-forest-800 border-b border-forest-700">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link href="/edh/posts" className="flex items-center gap-2 text-forest-300 hover:text-gold-400 text-sm mb-3 transition-colors">
            <ArrowLeft size={14} /> Back to Posts
          </Link>
          <h1 className="font-serif text-2xl text-cream-100">New Blog Post</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="card p-8 space-y-6">
          <div>
            <label className="block font-sans text-sm text-forest-700 mb-1">Title</label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              className="input-field w-full"
              placeholder="Post title"
              required
            />
          </div>

          <div>
            <label className="block font-sans text-sm text-forest-700 mb-1">Content</label>
            <textarea
              value={form.content}
              onChange={e => setForm({ ...form, content: e.target.value })}
              className="input-field w-full min-h-[300px] font-body"
              placeholder="Write your post content here... (HTML supported)"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-sans text-sm text-forest-700 mb-1">Category</label>
              <select
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}
                className="input-field w-full"
              >
                <option value="general">General</option>
                <option value="hoa">HOA Updates</option>
                <option value="safety">Safety & Security</option>
                <option value="events">Events</option>
                <option value="maintenance">Maintenance</option>
                <option value="wildlife">Wildlife & Nature</option>
              </select>
            </div>

            <div>
              <label className="block font-sans text-sm text-forest-700 mb-1">Tags (comma separated)</label>
              <input
                type="text"
                value={form.tags}
                onChange={e => setForm({ ...form, tags: e.target.value })}
                className="input-field w-full"
                placeholder="neighborhood, update, safety"
              />
            </div>
          </div>

          <div>
            <label className="block font-sans text-sm text-forest-700 mb-1">Cover Image URL</label>
            <input
              type="text"
              value={form.cover_image}
              onChange={e => setForm({ ...form, cover_image: e.target.value })}
              className="input-field w-full"
              placeholder="https://..."
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setForm({ ...form, published: !form.published })}
              className={`flex items-center gap-2 px-4 py-2 rounded-sm text-sm font-sans transition-colors ${
                form.published ? 'bg-forest-100 text-forest-700' : 'bg-amber-50 text-amber-700'
              }`}
            >
              {form.published ? <Eye size={14} /> : <EyeOff size={14} />}
              {form.published ? 'Published' : 'Draft'}
            </button>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-cream-200">
            <Link href="/edh/posts" className="btn-secondary text-sm px-6 py-2">Cancel</Link>
            <button type="submit" disabled={saving} className="btn-gold text-sm px-6 py-2 flex items-center gap-2">
              <Save size={14} /> {saving ? 'Saving...' : 'Create Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
