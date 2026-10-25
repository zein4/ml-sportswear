import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
import { ThemeToggle } from '@/components/ThemeToggle';

export const metadata: Metadata = {
  title: 'ML Sportswear | Made for your team',
  description: 'Customize sando, jerseys, shirts and shorts. Preview your design and request a quotation.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" suppressHydrationWarning><head>
    <script dangerouslySetInnerHTML={{ __html: `(function(){try{var saved=localStorage.getItem('ml-sportswear-theme');var theme=(saved==='light'||saved==='dark')?saved:(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.dataset.theme=theme;document.documentElement.style.colorScheme=theme;}catch(e){document.documentElement.dataset.theme='light';}})();` }} />
  </head><body>
    <div className="site-shell">
      <header className="site-header">
        <Link href="/" className="brand" aria-label="ML Sportswear home">
          <span className="brand-mark">ML<span className="brand-dot">.</span></span>
          <span className="brand-word">SPORTSWEAR <small>PHILIPPINES</small></span>
        </Link>
        <nav className="site-nav" aria-label="Main navigation">
          <Link href="/">Home</Link><Link href="/customize">Customize</Link><a href="/#how-it-works">How it works</a>
        </nav>
        <div className="header-actions"><ThemeToggle/><Link href="/customize" className="header-cta" aria-label="Start designing">Start designing <span aria-hidden="true">↗</span></Link></div>
      </header>
      <main>{children}</main>
      <footer className="site-footer"><span>© {new Date().getFullYear()} ML SPORTSWEAR PHILIPPINES</span><span>Custom sportswear, made with your team in mind.</span><Link href="/admin">Staff login</Link></footer>
    </div>
  </body></html>;
}
