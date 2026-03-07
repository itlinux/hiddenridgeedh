'use client';

import { useEffect, useRef } from 'react';

const SITE_KEY = '0x4AAAAAACX5zPRry72pjXTd';

interface TurnstileProps {
  onVerify: (token: string) => void;
}

export default function Turnstile({ onVerify }: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<string | null>(null);

  useEffect(() => {
    const renderWidget = () => {
      if (!containerRef.current || widgetRef.current) return;
      if (typeof window === 'undefined' || !(window as any).turnstile) return;

      widgetRef.current = (window as any).turnstile.render(containerRef.current, {
        sitekey: SITE_KEY,
        callback: (token: string) => onVerify(token),
        theme: 'light',
      });
    };

    // If turnstile script is already loaded
    if ((window as any).turnstile) {
      renderWidget();
      return;
    }

    // Load the turnstile script
    const existing = document.querySelector('script[src*="turnstile"]');
    if (!existing) {
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.onload = () => renderWidget();
      document.head.appendChild(script);
    } else {
      existing.addEventListener('load', renderWidget);
    }

    return () => {
      if (widgetRef.current && (window as any).turnstile) {
        (window as any).turnstile.remove(widgetRef.current);
        widgetRef.current = null;
      }
    };
  }, [onVerify]);

  return <div ref={containerRef} className="mt-2" />;
}
