'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { galleryApi } from '@/lib/api';
import { ArrowLeft, Image as ImageIcon, Upload, Trash2, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface GalleryItem {
  id: string;
  title: string;
  description?: string;
  image_url: string;
  thumbnail_url: string;
  uploader_name: string;
  created_at: string;
  tags: string[];
}

export default function ManageGalleryPage() {
  const { isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadForm, setUploadForm] = useState({ title: '', description: '', tags: '' });

  useEffect(() => {
    if (!isLoading && !isAdmin) router.push('/');
  }, [isLoading, isAdmin]);

  useEffect(() => {
    if (isAdmin) loadGallery();
  }, [isAdmin]);

  const loadGallery = async () => {
    try {
      const res = await galleryApi.list({ limit: 100 });
      setItems(res.data.items || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file || !uploadForm.title.trim()) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', uploadForm.title);
      formData.append('description', uploadForm.description);
      formData.append('tags', uploadForm.tags);
      await galleryApi.upload(formData);
      setUploadForm({ title: '', description: '', tags: '' });
      if (fileRef.current) fileRef.current.value = '';
      setShowUpload(false);
      loadGallery();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await galleryApi.delete(id);
      setItems(prev => prev.filter(i => i.id !== id));
    } catch {
      alert('Failed to delete');
    }
  };

  if (isLoading || !isAdmin) return null;

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8003';

  return (
    <div className="min-h-screen bg-cream-50">
      <div className="bg-forest-800 border-b border-forest-700">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Link href="/edh" className="flex items-center gap-2 text-forest-300 hover:text-gold-400 text-sm mb-3 transition-colors">
            <ArrowLeft size={14} /> Back to Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ImageIcon className="text-gold-400" size={24} />
              <h1 className="font-serif text-2xl text-cream-100">Manage Gallery</h1>
            </div>
            <button onClick={() => setShowUpload(!showUpload)} className="btn-gold text-sm px-5 py-2 flex items-center gap-2">
              <Upload size={14} /> Upload Photo
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Upload form */}
        {showUpload && (
          <form onSubmit={handleUpload} className="card p-6 mb-8 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-sans text-sm text-forest-700 mb-1">Title</label>
                <input type="text" value={uploadForm.title} onChange={e => setUploadForm({ ...uploadForm, title: e.target.value })} className="input-field w-full" placeholder="Photo title" required />
              </div>
              <div>
                <label className="block font-sans text-sm text-forest-700 mb-1">Tags (comma separated)</label>
                <input type="text" value={uploadForm.tags} onChange={e => setUploadForm({ ...uploadForm, tags: e.target.value })} className="input-field w-full" placeholder="sunset, neighborhood" />
              </div>
            </div>
            <div>
              <label className="block font-sans text-sm text-forest-700 mb-1">Description</label>
              <input type="text" value={uploadForm.description} onChange={e => setUploadForm({ ...uploadForm, description: e.target.value })} className="input-field w-full" placeholder="Optional description" />
            </div>
            <div>
              <label className="block font-sans text-sm text-forest-700 mb-1">Photo</label>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="input-field w-full" required />
              <p className="text-forest-400 text-xs mt-1 font-sans">JPEG, PNG, WebP, or GIF. Max 10MB.</p>
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setShowUpload(false)} className="btn-secondary text-sm px-5 py-2">Cancel</button>
              <button type="submit" disabled={uploading} className="btn-gold text-sm px-5 py-2">
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-forest-400" size={32} /></div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <ImageIcon className="text-forest-300 mx-auto mb-4" size={48} />
            <p className="font-body text-forest-400 text-lg mb-4">No photos yet</p>
            <button onClick={() => setShowUpload(true)} className="btn-primary text-sm">Upload Your First Photo</button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map((item) => (
              <div key={item.id} className="card overflow-hidden group">
                <div className="aspect-square relative">
                  <img
                    src={`${apiUrl}${item.thumbnail_url}`}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => handleDelete(item.id, item.title)}
                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-sm opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
                <div className="p-3">
                  <div className="font-sans text-sm text-forest-800 truncate">{item.title}</div>
                  <div className="text-forest-400 text-xs font-sans">{item.uploader_name}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
