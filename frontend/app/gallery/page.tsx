'use client';

import { useEffect, useState } from 'react';
import { galleryApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Camera, X, Loader2, Upload, QrCode, Globe, Lock, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';
import Link from 'next/link';
import PageHeader from '@/components/layout/PageHeader';

interface GalleryItem {
  id: string;
  title?: string;
  description?: string;
  image_url: string;
  thumbnail_url?: string;
  tags?: string[];
  uploaded_by_name?: string;
  uploaded_by?: string;
  is_public?: boolean;
  created_at: string;
}

export default function GalleryPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<GalleryItem | null>(null);
  const [showQR, setShowQR] = useState(false);

  // Upload form
  const [showUpload, setShowUpload] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDesc, setUploadDesc] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [uploading, setUploading] = useState(false);

  const uploadUrl = 'https://hiddenridgeedh.com/gallery/upload';

  const fetchItems = () => {
    galleryApi.list()
      .then(res => setItems(res.data.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchItems(); }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) { toast.error('Please select a file'); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', uploadFile);
      if (uploadTitle.trim()) fd.append('title', uploadTitle.trim());
      if (uploadDesc.trim()) fd.append('description', uploadDesc.trim());
      fd.append('is_public', String(isPublic));
      await galleryApi.upload(fd);
      toast.success('Photo uploaded!');
      setShowUpload(false);
      setUploadFile(null);
      setUploadTitle('');
      setUploadDesc('');
      setIsPublic(false);
      fetchItems();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this photo?')) return;
    try {
      await galleryApi.delete(id);
      setItems(prev => prev.filter(i => i.id !== id));
      if (selectedImage?.id === id) setSelectedImage(null);
      toast.success('Photo deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const canDelete = (item: GalleryItem) =>
    user && (item.uploaded_by === user.id || user.role === 'super_admin' || user.role === 'content_admin');

  return (
    <div className="min-h-screen bg-cream-50">
      <PageHeader label="Our Neighborhood" title="Photo Gallery" />

      <div className="max-w-7xl mx-auto px-4 py-12">

        {/* Toolbar */}
        {user && (
          <div className="flex flex-wrap items-center gap-3 mb-8 justify-end">
            {/* QR code — phone upload */}
            <button
              onClick={() => setShowQR(true)}
              className="btn-secondary flex items-center gap-2 text-sm px-4 py-2"
            >
              <QrCode size={16} /> Upload from Phone
            </button>
            {/* Desktop upload */}
            <button
              onClick={() => setShowUpload(!showUpload)}
              className="btn-gold flex items-center gap-2 text-sm px-4 py-2"
            >
              <Upload size={16} /> Upload Photo
            </button>
          </div>
        )}

        {/* Desktop upload form */}
        {showUpload && user && (
          <form onSubmit={handleUpload} className="card p-6 mb-8 space-y-4">
            <h3 className="font-serif text-xl text-forest-800">Share a Photo</h3>
            <div>
              <label className="section-label block mb-1 text-xs">Photo <span className="text-red-500">*</span></label>
              <input
                type="file"
                accept="image/*"
                onChange={e => setUploadFile(e.target.files?.[0] || null)}
                className="input-field w-full text-sm"
                required
              />
            </div>
            <div>
              <label className="section-label block mb-1 text-xs">Title <span className="text-forest-400 font-normal">(optional)</span></label>
              <input value={uploadTitle} onChange={e => setUploadTitle(e.target.value)} className="input-field w-full" maxLength={120} />
            </div>
            <div>
              <label className="section-label block mb-1 text-xs">Description <span className="text-forest-400 font-normal">(optional)</span></label>
              <textarea value={uploadDesc} onChange={e => setUploadDesc(e.target.value)} className="input-field w-full resize-none" rows={2} maxLength={500} />
            </div>
            {/* Public/Private toggle */}
            <div
              onClick={() => setIsPublic(!isPublic)}
              className={`flex items-center gap-3 p-4 rounded-sm border cursor-pointer transition-colors ${isPublic ? 'bg-blue-50 border-blue-200' : 'bg-cream-100 border-cream-200'}`}
            >
              {isPublic ? <Globe size={16} className="text-blue-500 flex-shrink-0" /> : <Lock size={16} className="text-forest-400 flex-shrink-0" />}
              <div>
                <p className="font-sans text-sm font-semibold text-forest-700">{isPublic ? 'Public — visible to everyone' : 'Members only — neighbors only'}</p>
                <p className="font-body text-xs text-forest-500">{isPublic ? 'Anyone visiting the site can see this photo' : 'Only approved Hidden Ridge members can see this photo'}</p>
              </div>
              <div className={`ml-auto w-10 h-6 rounded-full transition-colors flex-shrink-0 ${isPublic ? 'bg-blue-500' : 'bg-forest-300'}`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow m-0.5 transition-transform ${isPublic ? 'translate-x-4' : ''}`} />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={uploading} className="btn-gold flex items-center gap-2 disabled:opacity-50">
                {uploading ? <><Loader2 size={14} className="animate-spin" /> Uploading…</> : <><Upload size={14} /> Upload</>}
              </button>
              <button type="button" onClick={() => setShowUpload(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        )}

        {/* Gallery grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-forest-400" size={32} />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <Camera className="text-forest-300 mx-auto mb-4" size={48} />
            <p className="font-body text-forest-400 text-lg">No photos yet. Be the first to share!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map((item) => (
              <div key={item.id} className="relative group aspect-square overflow-hidden rounded-sm">
                <button
                  onClick={() => setSelectedImage(item)}
                  className="w-full h-full"
                >
                  <img
                    src={item.thumbnail_url || item.image_url}
                    alt={item.title || ''}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-forest-800/0 group-hover:bg-forest-800/30 transition-colors" />
                </button>
                {/* Visibility badge */}
                <div className="absolute top-2 left-2">
                  {item.is_public
                    ? <span title="Public"><Globe size={14} className="text-white drop-shadow" /></span>
                    : <span title="Members only"><Lock size={14} className="text-white drop-shadow" /></span>}
                </div>
                {/* Delete */}
                {canDelete(item) && (
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* QR Code modal */}
      {showQR && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setShowQR(false)}>
          <div className="bg-white rounded-sm p-8 max-w-xs w-full text-center space-y-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <button className="absolute top-4 right-4 text-forest-400 hover:text-forest-700" onClick={() => setShowQR(false)}>
              <X size={20} />
            </button>
            <h3 className="font-serif text-xl text-forest-800">Upload from your phone</h3>
            <p className="font-body text-sm text-forest-500">Scan this QR code with your phone camera to open the photo upload page.</p>
            <div className="flex justify-center p-4 bg-white rounded-sm border border-cream-200">
              <QRCodeSVG value={uploadUrl} size={180} bgColor="#FFFFFF" fgColor="#1B2E1F" level="M" />
            </div>
            <p className="font-sans text-xs text-forest-400 break-all">{uploadUrl}</p>
            <Link href="/gallery/upload" className="btn-gold w-full flex items-center justify-center gap-2 text-sm py-2" onClick={() => setShowQR(false)}>
              <Upload size={14} /> Open Upload Page
            </Link>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setSelectedImage(null)}>
          <button className="absolute top-4 right-4 text-white hover:text-gold-400 transition-colors" onClick={() => setSelectedImage(null)}>
            <X size={32} />
          </button>
          <div className="max-w-4xl max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <img src={selectedImage.image_url} alt={selectedImage.title || ''} className="max-w-full max-h-[80vh] object-contain" />
            {(selectedImage.title || selectedImage.uploaded_by_name) && (
              <div className="text-center mt-4">
                {selectedImage.title && <p className="text-cream-100 font-serif text-lg">{selectedImage.title}</p>}
                <div className="flex items-center justify-center gap-2 mt-1">
                  {selectedImage.uploaded_by_name && (
                    <p className="text-forest-300 font-sans text-sm">
                      By {selectedImage.uploaded_by_name} · {format(new Date(selectedImage.created_at), 'MMM d, yyyy')}
                    </p>
                  )}
                  {selectedImage.is_public
                    ? <span className="inline-flex items-center gap-1 text-xs text-blue-300"><Globe size={11} /> Public</span>
                    : <span className="inline-flex items-center gap-1 text-xs text-forest-300"><Lock size={11} /> Members only</span>}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
