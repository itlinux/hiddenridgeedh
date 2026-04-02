'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { galleryApi } from '@/lib/api';
import { Camera, ImagePlus, Loader2, CheckCircle2, ArrowLeft, X, Globe, Lock } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function GalleryUploadPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-forest-400" size={32} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-cream-50 flex flex-col items-center justify-center px-6 text-center gap-6">
        <Camera size={48} className="text-forest-300" />
        <h1 className="font-serif text-2xl text-forest-800">Sign in to upload photos</h1>
        <Link href="/login" className="btn-gold px-8 py-3">Sign In</Link>
      </div>
    );
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSubmit = async () => {
    if (!file) { toast.error('Please select a photo first'); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      if (title.trim()) fd.append('title', title.trim());
      if (description.trim()) fd.append('description', description.trim());
      fd.append('is_public', String(isPublic));
      await galleryApi.upload(fd);
      setDone(true);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-cream-50 flex flex-col items-center justify-center px-6 text-center gap-6">
        <CheckCircle2 size={56} className="text-green-500" />
        <h1 className="font-serif text-2xl text-forest-800">Photo uploaded!</h1>
        <p className="font-body text-forest-500 text-sm">Thanks for sharing with the neighborhood.</p>
        <div className="flex gap-3 flex-wrap justify-center">
          <button
            onClick={() => { setDone(false); setFile(null); setPreview(null); setTitle(''); setDescription(''); }}
            className="btn-secondary text-sm px-6 py-3"
          >
            Upload another
          </button>
          <Link href="/gallery" className="btn-gold text-sm px-6 py-3">
            View Gallery
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50">
      {/* Header */}
      <div className="bg-forest-800 px-4 py-4 flex items-center gap-3">
        <Link href="/gallery" className="text-cream-300 hover:text-gold-400 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="font-serif text-lg text-cream-100">Upload a Photo</h1>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">

        {/* Photo picker */}
        <div>
          {preview ? (
            <div className="relative">
              <img src={preview} alt="Preview" className="w-full rounded-sm object-cover max-h-72" />
              <button
                onClick={() => { setPreview(null); setFile(null); if (fileRef.current) fileRef.current.value = ''; }}
                className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full border-2 border-dashed border-cream-300 rounded-sm bg-cream-100 hover:bg-cream-200 hover:border-gold-400 transition-colors flex flex-col items-center justify-center gap-3 py-14"
            >
              <ImagePlus size={40} className="text-forest-300" />
              <span className="font-sans text-sm text-forest-500">Tap to choose or take a photo</span>
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {/* Title */}
        <div>
          <label className="section-label block mb-2 text-xs">Title <span className="text-forest-400 font-normal">(optional)</span></label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="input-field w-full"
            placeholder="e.g. Sunset over the ridge"
            maxLength={120}
          />
        </div>

        {/* Description */}
        <div>
          <label className="section-label block mb-2 text-xs">Description <span className="text-forest-400 font-normal">(optional)</span></label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="input-field w-full resize-none"
            rows={3}
            placeholder="Tell neighbors about this photo..."
            maxLength={500}
          />
        </div>

        {/* Public / Members only toggle */}
        <div
          onClick={() => setIsPublic(!isPublic)}
          className={`flex items-center gap-3 p-4 rounded-sm border cursor-pointer transition-colors ${
            isPublic
              ? 'bg-blue-50 border-blue-200'
              : 'bg-cream-100 border-cream-200'
          }`}
        >
          {isPublic
            ? <Globe size={18} className="text-blue-500 flex-shrink-0" />
            : <Lock size={18} className="text-forest-400 flex-shrink-0" />}
          <div>
            <p className="font-sans text-sm font-semibold text-forest-700">
              {isPublic ? 'Public — visible to everyone' : 'Members only — neighbors only'}
            </p>
            <p className="font-body text-xs text-forest-500">
              {isPublic
                ? 'Anyone visiting the site can see this photo'
                : 'Only approved Hidden Ridge members can see this photo'}
            </p>
          </div>
          <div className={`ml-auto w-10 h-6 rounded-full transition-colors flex-shrink-0 ${isPublic ? 'bg-blue-500' : 'bg-forest-300'}`}>
            <div className={`w-5 h-5 bg-white rounded-full shadow m-0.5 transition-transform ${isPublic ? 'translate-x-4' : ''}`} />
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!file || uploading}
          className="btn-gold w-full py-4 text-base flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? <><Loader2 size={18} className="animate-spin" /> Uploading…</> : <><Camera size={18} /> Share to Gallery</>}
        </button>

        <p className="text-center font-sans text-xs text-forest-400">
          Uploading as <strong>{user.full_name}</strong>
        </p>
      </div>
    </div>
  );
}
