import type { Metadata } from 'next';
import { Karla } from 'next/font/google';
import './globals.css';
import './styles/drawer.css';
import MainLayout from './components/layout/MainLayout';
import localFont from 'next/font/local';
import Script from 'next/script';
import { SessionProvider } from '../components/SessionProvider';
import PageInitializer from './components/layout/PageInitializer';
import { StagewiseWrapper } from './components/stagewise/StagewiseWrapper';

// PP Monument Extended font (local)
const monumentExtended = localFont({
  src: [
    {
      path: '../public/fonts/MonumentExtended-Regular.otf',
      weight: '400',
      style: 'normal',
    },
  ],
  variable: '--font-monument',
  display: 'swap',
});

// Karla font (Google)
const karla = Karla({
  subsets: ['latin'],
  variable: '--font-karla',
  weight: ['300', '400', '500', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'HIKARI - Women\'s Fashion Store',
  description: 'Discover the latest trends in women\'s fashion at HIKARI. Shop dresses, tops, bottoms, and accessories.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#000000" />
        {/* Completely hide any content until fully loaded */}
        <style dangerouslySetInnerHTML={{ __html: `
          /* Critical styles to prevent flash */
          .page-preloader {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: #000;
            z-index: 99999;
            transition: opacity 0.5s ease;
          }
          
          /* Hide header during load */
          header.site-header {
            visibility: hidden !important;
            opacity: 0 !important;
            background-color: transparent !important;
          }
          
          /* Hide body content initially */
          body > div {
            opacity: 0;
            transition: opacity 0.5s ease;
          }
          
          /* Loaded state */
          body.page-loaded > div {
            opacity: 1;
          }
          
          body.page-loaded .page-preloader {
            opacity: 0;
            pointer-events: none;
          }
        `}} />
      </head>
      <body className={`${monumentExtended.variable} ${karla.variable} overflow-x-hidden`}>
        <SessionProvider>
          {/* Black preloader overlay */}
          <div className="page-preloader"></div>
          
          {/* Client-side Page Initializer Component */}
          <PageInitializer />
          
          {/* Stagewise Toolbar (development only) */}
          <StagewiseWrapper />
          
          {/* The MainLayout is always rendered, but the login/register pages
              now use their own AuthLayout which doesn't include a header */}
          <MainLayout>
            {children}
          </MainLayout>
        </SessionProvider>
      </body>
    </html>
  );
} 