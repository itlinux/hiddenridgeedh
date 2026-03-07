import type { Metadata } from 'next';
import '../styles/globals.css';
import { AuthProvider } from '@/lib/auth';
import { Toaster } from 'sonner';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export const metadata: Metadata = {
  metadataBase: new URL('https://hiddenridgeedh.com'),
  title: {
    default: 'Hidden Ridge EDH',
    template: '%s | Hidden Ridge EDH',
  },
  description: 'Hidden Ridge — El Dorado Hills, California',
  icons: {
    icon: '/images/logo.png',
    apple: '/images/logo.png',
  },
  openGraph: {
    title: 'Hidden Ridge EDH',
    description: 'Hidden Ridge — El Dorado Hills, California',
    url: 'https://hiddenridgeedh.com',
    siteName: 'Hidden Ridge EDH',
    images: [{ url: '/images/logo.png', width: 512, height: 512 }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AuthProvider>
          <Navbar />
          <main className="min-h-[calc(100vh-80px)]">
            {children}
          </main>
          <Footer />
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#1B2E1F',
                color: '#F5F0E8',
                border: '1px solid #C9A84C',
                fontFamily: 'Lora, Georgia, serif',
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
