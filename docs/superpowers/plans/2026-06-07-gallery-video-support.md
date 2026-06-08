# Gallery YouTube Video Support — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add YouTube URL support to the neighborhood photo gallery so users can paste YouTube links alongside photos.

**Architecture:** Backend receives `media_type` field to distinguish photo vs YouTube items. YouTube items skip file processing and store `youtube_url` + `embed_url`. Frontend upload page gets a tab switcher (Photo / YouTube Video). Gallery grid renders YouTube embed thumbnails with play icons, opening an embed lightbox on click.

**Tech Stack:** FastAPI (Python), Next.js (React/TypeScript), MongoDB, Tailwind CSS

---

### Task 1: Backend — YouTube URL validation + upload endpoint

**Files:**
- Modify: `backend/routes/gallery.py`

- [ ] **Step 1: Add `re` import and YouTube validation function at top of file**

Update `backend/routes/gallery.py`:

```python
import os
import re
import uuid
from fastapi import APIRouter, HTTPException, Depends, Query, Request, UploadFile, File, Form
from datetime import datetime
from bson import ObjectId
from PIL import Image

from database import get_db, get_settings
from middleware.auth import require_member, require_content_admin, get_current_user
from utils.limiter import limiter

router = APIRouter(prefix="/api/gallery", tags=["gallery"])

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

YOUTUBE_PATTERNS = [
    re.compile(r'^(?:https?://)?(?:www\.)?youtube\.com/watch\?.*v=([\w-]+)'),
    re.compile(r'^(?:https?://)?(?:www\.)?youtu\.be/([\w-]+)'),
    re.compile(r'^(?:https?://)?(?:www\.)?youtube\.com/embed/([\w-]+)'),
    re.compile(r'^(?:https?://)?(?:www\.)?youtube\.com/shorts/([\w-]+)'),
]


def normalize_youtube_url(url: str) -> str:
    for pat in YOUTUBE_PATTERNS:
        m = pat.match(url.strip())
        if m:
            return f"https://www.youtube.com/watch?v={m.group(1)}"
    raise ValueError("Invalid YouTube URL")
```

- [ ] **Step 2: Modify upload endpoint to accept `media_type` and `youtube_url`**

Replace the `upload_photo` function signature and body:

```python
@router.post("/upload", status_code=201)
@limiter.limit("20/hour")
async def upload_photo(
    request: Request,
    file: UploadFile | None = File(None),
    media_type: str = Form("photo"),
    youtube_url: str = Form(""),
    title: str = Form(""),
    description: str = Form(""),
    is_public: str = Form("false"),
    tags: str = Form(""),
    current_user: dict = Depends(require_member),
):
    if media_type == "youtube":
        if not youtube_url.strip():
            raise HTTPException(400, "YouTube URL is required")
        try:
            canonical_url = normalize_youtube_url(youtube_url)
        except ValueError:
            raise HTTPException(400, "Invalid YouTube URL. Please provide a valid YouTube link.")
        video_id = canonical_url.split("v=")[-1]
        embed_url = f"https://www.youtube.com/embed/{video_id}"
        tag_list = [t.strip() for t in tags.split(",") if t.strip()] if tags else []
        db = get_db()
        item_doc = {
            "media_type": "youtube",
            "title": title,
            "description": description,
            "tags": tag_list,
            "youtube_url": canonical_url,
            "embed_url": embed_url,
            "is_public": is_public.lower() == "true",
            "uploaded_by": str(current_user["_id"]),
            "uploader_name": current_user.get("full_name", current_user.get("username")),
            "created_at": datetime.utcnow(),
        }
        result = await db.gallery.insert_one(item_doc)
        item_doc["id"] = str(result.inserted_id)
        return serialize_item(item_doc)

    # Existing photo logic
    if not file:
        raise HTTPException(400, "File is required for photo upload")
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(400, "File type not allowed. Use JPEG, PNG, WebP, or GIF.")
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(400, "File too large. Maximum 10MB.")
    settings = get_settings()
    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else "jpg"
    filename = f"{uuid.uuid4()}.{ext}"
    file_path = os.path.join(settings.upload_dir, filename)
    thumb_path = os.path.join(settings.upload_dir, "thumbnails", filename)
    with open(file_path, "wb") as f:
        f.write(contents)
    img = Image.open(file_path)
    img.thumbnail((300, 300))
    img.save(thumb_path, quality=85)
    tag_list = [t.strip() for t in tags.split(",") if t.strip()] if tags else []
    db = get_db()
    item_doc = {
        "media_type": "photo",
        "title": title,
        "description": description,
        "tags": tag_list,
        "image_url": f"/uploads/{filename}",
        "thumbnail_url": f"/uploads/thumbnails/{filename}",
        "is_public": is_public.lower() == "true",
        "uploaded_by": str(current_user["_id"]),
        "uploader_name": current_user.get("full_name", current_user.get("username")),
        "created_at": datetime.utcnow(),
    }
    result = await db.gallery.insert_one(item_doc)
    item_doc["id"] = str(result.inserted_id)
    return serialize_item(item_doc)
```

- [ ] **Step 3: Update delete endpoint to handle YouTube items (no file cleanup)**

The current `delete_photo` tries to remove `image_url` and `thumbnail_url`. For YouTube items these are `None`. The code already guards with `if url:` check, so it's safe. No changes needed.

---

### Task 2: Frontend — Add `uploadYoutube` API method

**Files:**
- Modify: `frontend/lib/api.ts`

- [ ] **Step 1: Add `uploadYoutube` method**

In the `galleryApi` object (around line 93-99), add:

```typescript
// ─── Gallery ─────────────────────────────────────────────────────────────────
export const galleryApi = {
  list: (params?: any) => api.get('/api/gallery', { params }),
  upload: (formData: FormData) => api.post('/api/gallery/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  uploadYoutube: (data: { media_type: string; youtube_url: string; title?: string; description?: string; is_public?: string }) =>
    api.post('/api/gallery/upload', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  delete: (id: string) => api.delete(`/api/gallery/${id}`),
};
```

---

### Task 3: Frontend — Add tab UI + YouTube upload form

**Files:**
- Modify: `frontend/app/gallery/upload/page.tsx`

- [ ] **Step 1: Add a `mediaType` state variable and tab UI**

Key changes to the upload page:

Add new state:
```typescript
const [mediaType, setMediaType] = useState<'photo' | 'youtube'>('photo');
const [youtubeUrl, setYoutubeUrl] = useState('');
```

Replace the section after the header with tab navigation and conditional form sections:

```typescript
return (
    <div className="min-h-screen bg-cream-50">
      {/* Header */}
      <div className="bg-forest-800 px-4 py-4 flex items-center gap-3">
        <Link href="/gallery" className="text-cream-300 hover:text-gold-400 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="font-serif text-lg text-cream-100">Share to Gallery</h1>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">

        {/* Tab Switcher */}
        <div className="flex bg-cream-200 rounded-sm p-1">
          <button
            onClick={() => setMediaType('photo')}
            className={`flex-1 py-2 text-sm font-sans font-medium rounded-sm transition-colors ${
              mediaType === 'photo'
                ? 'bg-gold-400 text-forest-800 shadow-sm'
                : 'text-forest-500 hover:text-forest-700'
            }`}
          >
            Photo
          </button>
          <button
            onClick={() => setMediaType('youtube')}
            className={`flex-1 py-2 text-sm font-sans font-medium rounded-sm transition-colors ${
              mediaType === 'youtube'
                ? 'bg-gold-400 text-forest-800 shadow-sm'
                : 'text-forest-500 hover:text-forest-700'
            }`}
          >
            YouTube Video
          </button>
        </div>

        {/* Photo Upload Form */}
        {mediaType === 'photo' && (
          {/* — existing photo upload content, unchanged */}
        )}

        {/* YouTube URL Form */}
        {mediaType === 'youtube' && (
          <div className="space-y-6">
            {/* YouTube URL */}
            <div>
              <label className="section-label block mb-2 text-xs">YouTube URL <span className="text-red-500">*</span></label>
              <input
                value={youtubeUrl}
                onChange={e => setYoutubeUrl(e.target.value)}
                className="input-field w-full"
                placeholder="https://youtube.com/watch?v=..."
              />
            </div>
            {/* Title */}
            <div>
              <label className="section-label block mb-2 text-xs">Title <span className="text-forest-400 font-normal">(optional)</span></label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="input-field w-full"
                placeholder="e.g. Neighborhood block party"
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
                placeholder="Tell neighbors about this video..."
                maxLength={500}
              />
            </div>
            {/* Public toggle */}
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
            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={!youtubeUrl.trim() || uploading}
              className="btn-gold w-full py-4 text-base flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? <><Loader2 size={18} className="animate-spin" /> Uploading…</> : <><Camera size={18} /> Share to Gallery</>}
            </button>
          </div>
        )}

        <p className="text-center font-sans text-xs text-forest-400">
          Uploading as <strong>{user.full_name}</strong>
        </p>
      </div>
    </div>
  );
```

- [ ] **Step 2: Update `handleSubmit` to handle YouTube URL payload**

```typescript
const handleSubmit = async () => {
  setUploading(true);
  try {
    if (mediaType === 'youtube') {
      if (!youtubeUrl.trim()) { toast.error('Please enter a YouTube URL'); setUploading(false); return; }
      await galleryApi.uploadYoutube({
        media_type: 'youtube',
        youtube_url: youtubeUrl.trim(),
        title: title.trim() || 'Untitled',
        description: description.trim(),
        is_public: String(isPublic),
      });
    } else {
      if (!file) { toast.error('Please select a photo first'); setUploading(false); return; }
      const fd = new FormData();
      fd.append('file', file);
      fd.append('media_type', 'photo');
      if (title.trim()) fd.append('title', title.trim());
      if (description.trim()) fd.append('description', description.trim());
      fd.append('is_public', String(isPublic));
      await galleryApi.upload(fd);
    }
    setDone(true);
  } catch (err: any) {
    toast.error(err.response?.data?.detail || 'Upload failed');
  } finally {
    setUploading(false);
  }
};
```

---

### Task 4: Frontend — YouTube rendering in gallery grid + lightbox

**Files:**
- Modify: `frontend/app/gallery/page.tsx`

- [ ] **Step 1: Update `GalleryItem` interface to include `media_type`, `youtube_url`, `embed_url`**

```typescript
interface GalleryItem {
  id: string;
  title?: string;
  description?: string;
  media_type?: 'photo' | 'youtube';
  image_url?: string;
  thumbnail_url?: string;
  youtube_url?: string;
  embed_url?: string;
  tags?: string[];
  uploaded_by_name?: string;
  uploaded_by?: string;
  is_public?: boolean;
  created_at: string;
}
```

- [ ] **Step 2: Add YouTube thumbnail rendering in grid**

Replace the grid `<div>` with conditional rendering:

```typescript
{items.map((item) => (
  <div key={item.id} className="relative group aspect-square overflow-hidden rounded-sm">
    <button
      onClick={() => setSelectedImage(item)}
      className="w-full h-full"
    >
      {item.media_type === 'youtube' ? (
        <div className="relative w-full h-full bg-forest-800">
          <img
            src={`https://img.youtube.com/vi/${extractVideoId(item.youtube_url || '')}/mqdefault.jpg`}
            alt={item.title || 'YouTube video'}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <svg viewBox="0 0 24 24" className="w-6 h-6 text-white ml-0.5" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        </div>
      ) : (
        <>
          <img
            src={item.thumbnail_url || item.image_url}
            alt={item.title || ''}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-forest-800/0 group-hover:bg-forest-800/30 transition-colors" />
        </>
      )}
    </button>
    {/* Visibility badge — unchanged */}
    {/* Delete button — unchanged */}
  </div>
))}
```

Add the `extractVideoId` helper at the bottom of the file:

```typescript
function extractVideoId(url: string): string {
  const patterns = [
    /(?:youtube\.com\/watch\?.*v=)([\w-]+)/,
    /(?:youtu\.be\/)([\w-]+)/,
    /(?:youtube\.com\/embed\/)([\w-]+)/,
    /(?:youtube\.com\/shorts\/)([\w-]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return '';
}
```

- [ ] **Step 3: Add YouTube embed lightbox**

In the lightbox section, add conditional rendering:

```typescript
{selectedImage && (
  <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setSelectedImage(null)}>
    <button className="absolute top-4 right-4 text-white hover:text-gold-400 transition-colors z-10" onClick={() => setSelectedImage(null)}>
      <X size={32} />
    </button>
    <div className="max-w-5xl w-full" onClick={e => e.stopPropagation()}>
      {selectedImage.media_type === 'youtube' && selectedImage.embed_url ? (
        <div className="relative" style={{ paddingBottom: '56.25%' }}>
          <iframe
            src={selectedImage.embed_url}
            className="absolute inset-0 w-full h-full rounded-sm"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : (
        <img
          src={selectedImage.image_url}
          alt={selectedImage.title || ''}
          className="max-w-full max-h-[80vh] object-contain mx-auto"
        />
      )}
      {/* Title and meta info below — same as before */}
    </div>
  </div>
)}
```
