# Design: Gallery YouTube / Video Support

**Date:** 2026-06-07
**Status:** Approved, ready for implementation

## Overview

Add YouTube video support to the neighborhood photo gallery. Currently the gallery only supports
image uploads (JPEG, PNG, WebP, GIF). Users want the ability to add YouTube videos alongside or
instead of photos.

## Approach

**Dedicated YouTube Upload Tab** — Split the `/gallery/upload` page into two tabs: Photo and
YouTube Video. Users select which media type, fill in the relevant fields, and submit.

## Frontend Schema

### Upload Page Tabs

```
[Photo] [YouTube Video]
```

- **Photo Tab:** Unchanged — file input (`image/*`), title, description, public toggle.
- **YouTube Tab:** URL input, title (optional — extract title from YouTube metadata or manual),
  description, public toggle.

### Gallery Grid

Each gallery item checks `media_type` to decide how to render:

- `media_type === "photo"` → existing `<img>` + thumbnail lightbox
- `media_type === "youtube"` → thumbnail image + play icon → click opens YouTube embed in
  lightbox overlay

### Lightbox Enhancement

When a YouTube item is clicked in the grid:

- Full-height overlay with X (close) button
- YouTube iframe 16:9 responsive embed with `allowFullScreen`
- Title, uploader, date shown below the embed

### Tab Component

- Pill/segmented control: gold background for active, cream for inactive
- Smooth transition between tabs

## Backend Schema

### MongoDB Gallery Document

Existing `image_url` / `thumbnail_url` fields unchanged. New optional fields:

```python
{
    "media_type": "photo" | "youtube",   # new, default "photo"
    "youtube_url": str | None,           # new, full URL
    "embed_url": str | None,             # new, iframe src (auto-derived)
}
```

### Upload Endpoint (`POST /api/gallery/upload`)

Accept new Form fields:
- `media_type` — `"photo"` or `"youtube"`
- `youtube_url` — required if `media_type == "youtube"`

Validation:
- If `media_type == "youtube"`: validate YouTube URL regex, derive embed URL
- If `media_type == "photo"`: existing file validation unchanged

No file processing or thumbnail generation for YouTube items.

### List Endpoint (`GET /api/gallery`)

Unchanged — returns all items regardless of `media_type`. Frontend filters by type for display.

### Delete Endpoint (`DELETE /api/gallery/{id}`)

Unchanged — deletes from DB. For photos, also removes file from disk. YouTube items have no
files to clean up.

### YouTube URL Validation

```python
import re

def validate_and_normalize_youtube_url(url: str) -> str:
    """Validate a YouTube URL and return the normalized canonical URL."""
    patterns = [
        r'(?:https?://)?(?:www\.)?youtube\.com/watch\?.*v=([\w-]+)',
        r'(?:https?://)?(?:www\.)?youtu\.be/([\w-]+)',
        r'(?:https?://)?(?:www\.)?youtube\.com/embed/([\w-]+)',
        r'(?:https?://)?(?:www\.)?youtube\.com/shorts/([\w-]+)',
    ]
    for pat in patterns:
        m = re.match(pat, url.strip())
        if m:
            vid = m.group(1)
            return f"https://www.youtube.com/watch?v={vid}"
    raise ValueError("Invalid YouTube URL")
```

## API Changes

### Frontend `galleryApi` (frontend/lib/api.ts)

Add a new method for YouTube URL submission:

```typescript
export const galleryApi = {
  list: ...,
  upload: ..., // unchanged for photo files
  uploadYoutube: (data: { media_type: string; youtube_url: string; title?: string; description?: string; is_public?: boolean }) =>
    api.post('/api/gallery/upload', data), // JSON, not FormData
  delete: ...,
};
```

Or alternatively, reuse the same endpoint with multipart form and let the backend differentiate.

## Files to Change

| File | Change |
|------|--------|
| `backend/routes/gallery.py` | Accept `media_type`, `youtube_url`. Add YouTube URL validation. Skip file processing for YouTube items. |
| `frontend/app/gallery/upload/page.tsx` | Add tab UI for Photo / YouTube. Add YouTube URL input form. Conditionally render submit based on mode. |
| `frontend/app/gallery/page.tsx` | Add YouTube thumbnail rendering in grid. Add YouTube embed lightbox. Update `GalleryItem` interface. |
| `frontend/lib/api.ts` | Add `uploadYoutube` method or extend `upload` to handle JSON payload. |

## Future Considerations

- Auto-fetch YouTube video title from oEmbed API (future enhancement)
- Video file upload support (future)
- Masonry layout optimization for mixed aspect ratios (future)
