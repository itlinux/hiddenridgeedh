'use client';

import { useEffect, useState } from 'react';
import { galleryApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Camera, X, Loader2, Upload } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface GalleryItem {
  id: string;
  title?: string;
  description?: string;
  image_url: string;
  thumbnail_url?: string;
  tags?: string[];
  uploaded_by_name?: string;
  created_at: string;
}

export default function GalleryPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<GalleryItem | null>(null);

  useEffect(() => {
    galleryApi.list()
      .then(res => setItems(res.data.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-cream-50">
      <div className="bg-forest-800 py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="section-label text-gold-400 mb-3">Our Neighborhood</p>
          <h1 className="font-serif text-4xl text-cream-100">Photo Gallery</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
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
              <button
                key={item.id}
                onClick={() => setSelectedImage(item)}
                className="aspect-square overflow-hidden rounded-sm group relative"
              >
                <img
                  src={item.thumbnail_url || item.image_url}
                  alt={item.title || ''}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-forest-800/0 group-hover:bg-forest-800/30 transition-colors" />
              </button>
            ))}
          </div>
        )}
      </div>

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
                {selectedImage.uploaded_by_name && (
                  <p className="text-forest-300 font-sans text-sm mt-1">
                    By {selectedImage.uploaded_by_name} · {format(new Date(selectedImage.created_at), 'MMM d, yyyy')}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
