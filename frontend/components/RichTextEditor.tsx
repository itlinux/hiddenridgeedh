'use client';

import dynamic from 'next/dynamic';
import { useMemo, useRef, useCallback } from 'react';
import { galleryApi } from '@/lib/api';

const ReactQuill = dynamic(() => import('react-quill'), {
  ssr: false,
  loading: () => <div className="input-field min-h-[120px] animate-pulse bg-cream-100" />,
});

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  compact?: boolean;
}

export default function RichTextEditor({ value, onChange, placeholder, compact }: RichTextEditorProps) {
  const quillRef = useRef<any>(null);

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

      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', file.name);
      formData.append('description', 'Forum upload');
      formData.append('tags', 'forum');

      try {
        const res = await galleryApi.upload(formData);
        const imageUrl = res.data.image_url;
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

  const formats = compact
    ? ['bold', 'italic', 'underline', 'list', 'bullet', 'link']
    : ['bold', 'italic', 'underline', 'strike', 'list', 'bullet', 'blockquote', 'link', 'image'];

  return (
    <div className="rich-text-editor">
      <ReactQuill
        // @ts-ignore – react-quill ref works at runtime with dynamic import
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder || 'Write something...'}
      />
    </div>
  );
}
