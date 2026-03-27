'use client';

import { useEffect, useRef } from 'react';

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '';

interface TurnstileProps {
  onVerify: (token: string) => void;
  resetKey?: number;
}

export default function Turnstile({ onVerify, resetKey }: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<string | null>(null);
  const onVerifyRef = useRef(onVerify);
  onVerifyRef.current = onVerify;

  // Reset the widget when resetKey changes (e.g. after a failed submission)
  useEffect(() => {
    if (widgetRef.current && (window as any).turnstile) {
      try {
        (window as any).turnstile.reset(widgetRef.current);
      } catch {}
    }
  }, [resetKey]);

  useEffect(() => {
    const renderWidget = () => {
      if (!containerRef.current || widgetRef.current) return;
      if (typeof window === 'undefined' || !(window as any).turnstile) return;

      widgetRef.current = (window as any).turnstile.render(containerRef.current, {
        sitekey: SITE_KEY,
        callback: (token: string) => onVerifyRef.current(token),
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
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=onTurnstileLoad';
      script.async = true;
      (window as any).onTurnstileLoad = () => renderWidget();
      document.head.appendChild(script);
    } else {
      // Script exists but may not be loaded yet
      const checkReady = setInterval(() => {
        if ((window as any).turnstile) {
          clearInterval(checkReady);
          renderWidget();
        }
      }, 100);
      // Stop checking after 10s
      setTimeout(() => clearInterval(checkReady), 10000);
    }

    return () => {
      if (widgetRef.current && (window as any).turnstile) {
        try {
          (window as any).turnstile.remove(widgetRef.current);
        } catch {}
        widgetRef.current = null;
      }
    };
  }, []);

  if (!SITE_KEY) return null;

  return <div ref={containerRef} className="mt-2" />;
}
