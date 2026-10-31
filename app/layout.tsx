import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
import './ml11-header.css';
import './ml111-site.css';
import './ml112-shell.css';
import { ThemeToggle } from '@/components/ThemeToggle';
import { CustomerNav } from '@/components/CustomerNav';
import { ML111Search } from '@/components/ML111Search';
import { ML112MobileNav } from '@/components/ML112MobileNav';
import { ShoppingBag, Mail, Phone, Facebook } from 'lucide-react';

export const metadata: Metadata = {
  title: 'ML Sportswear Philippines | Custom team apparel',
  description: 'Browse sportswear sample designs, customize Sando, T-Shirts, Shorts, and Jersey Sets, and track your ML Sportswear order.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" suppressHydrationWarning><head>
    <meta name="referrer" content="no-referrer" />
    <script dangerouslySetInnerHTML={{ __html: `(function(){try{var saved=localStorage.getItem('ml-sportswear-theme');var theme=(saved==='light'||saved==='dark')?saved:(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.dataset.theme=theme;document.documentElement.style.colorScheme=theme;}catch(e){document.documentElement.dataset.theme='light';}})();` }} />
  </head><body>
    <div className="site-shell">
      <header className="site-header ml111-header">
        <Link href="/" className="brand" aria-label="ML Sportswear Philippines home"><img src="/ml11/logo.png" width="45" height="45" className="ml11-brand-logo" alt="ML Sportswear crown emblem"/><span className="brand-word">ML SPORTSWEAR <small>PHILIPPINES</small></span></Link>
        <nav className="site-nav" aria-label="Main navigation">
          <Link href="/">Home</Link><Link href="/collection">Shop</Link><Link href="/customize">Customize</Link><Link href="/collection#featured-designs">Collections</Link><Link href="/track">Track Order</Link><Link href="/#how-it-works">About</Link><Link href="/#contact">Contact</Link>
        </nav>
        <div className="header-actions"><ML111Search/><Link href="/account" className="ml112-orders" title="My orders" aria-label="My orders"><ShoppingBag size={20}/></Link><CustomerNav/><ThemeToggle/><ML112MobileNav/></div>
      </header>
      <main>{children}</main>
      <footer className="site-footer ml112-footer" id="contact"><div className="ml112-footer-main">
        <div className="ml112-footer-brand"><Link href="/" className="ml112-footer-logo"><img src="/ml11/logo.png" alt="ML Sportswear white crown emblem" width="48" height="48"/><span><strong>ML SPORTSWEAR</strong><small>PHILIPPINES</small></span></Link><p>Custom sportswear for teams, schools, and organizations.<br/>Quality full sublimation, Philippine made.</p></div>
        <div className="ml112-footer-links"><strong>QUICK LINKS</strong><div><Link href="/">Home</Link><Link href="/collection">Shop</Link><Link href="/customize">Customize</Link><Link href="/collection#featured-designs">Collections</Link><Link href="/track">Track Order</Link><Link href="/account">My Account</Link></div></div>
        <div className="ml112-footer-contact"><strong>CONTACT US</strong><a href="tel:+639625224401"><Phone size={14}/>0962-5224401</a><a href="tel:+639361292505"><Phone size={14}/>0936-1292505</a><a href="mailto:mlgenapp@gmail.com"><Mail size={14}/>mlgenapp@gmail.com</a><span><Facebook size={14}/>ML Sportswear Philippines</span></div>
        <div className="ml112-footer-help"><strong>NEED A CUSTOM DESIGN?</strong><p>Ask us about sizes, samples, team orders, and styles not yet in the online customizer.</p><a href="mailto:mlgenapp@gmail.com?subject=ML%20Sportswear%20Inquiry">CONTACT THE SHOP →</a></div>
      </div><div className="ml112-footer-bottom"><span>© {new Date().getFullYear()} ML Sportswear Philippines. All rights reserved.</span><div><Link href="/privacy">Privacy Policy</Link><Link href="/terms">Terms &amp; Conditions</Link><Link href="/account">My Orders</Link></div></div></footer>
    </div>
  </body></html>;
}
