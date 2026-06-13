'use client';

import dynamic from 'next/dynamic';
import { useMemo, useRef, useCallback } from 'react';

const ReactQuill = dynamic(() => import('react-quill-new'), {
  ssr: false,
  loading: () => <div className="input-field min-h-[120px] animate-pulse bg-cream-100" />,
});

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  compact?: boolean;
  uploadImage?: (file: File) => Promise<string>; // returns URL
}

export default function RichTextEditor({ value, onChange, placeholder, compact, uploadImage }: RichTextEditorProps) {
  const quillRef = useRef<any>(null);

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const handleChange = useCallback((val: string) => {
    onChangeRef.current(val);
  }, []);

  const imageHandler = useCallback(() => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/jpeg,image/png,image/webp,image/gif');
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      if (file.size > 10 * 1024 * 1024) {
        alert('Image must be under 10MB');
        return;
      }

      try {
        let imageUrl: string;
        if (uploadImage) {
          imageUrl = await uploadImage(file);
        } else {
          const apiModule = await import('@/lib/api');
          const apiClient = apiModule.default;
          const fd = new FormData();
          fd.append('file', file);
          const res = await apiClient.post('/api/media/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
          imageUrl = res.data.url;
        }
        const editor = quillRef.current?.getEditor?.() ?? quillRef.current?.editor;
        if (editor) {
          const range = editor.getSelection(true);
          editor.insertEmbed(range.index, 'image', imageUrl);
          editor.setSelection(range.index + 1);
        }
      } catch {
        alert('Failed to upload image. Please try again.');
      }
    };
  }, []);

  const modules = useMemo(() => ({
    toolbar: {
      container: compact
        ? [
            ['bold', 'italic', 'underline'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            ['link'],
            ['clean'],
          ]
        : [
            ['bold', 'italic', 'underline', 'strike'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            ['blockquote', 'link', 'image'],
            ['clean'],
          ],
      handlers: {
        image: imageHandler,
      },
    },
  }), [compact, imageHandler]);

  return (
    <div className="rich-text-editor">
      <ReactQuill
        // @ts-ignore – react-quill ref works at runtime with dynamic import
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={handleChange}
        modules={modules}
        placeholder={placeholder || 'Write something...'}
      />
    </div>
  );
}
