import React from 'react';
import { ArrowUp } from 'lucide-react';
import { getNavigation } from '../lib/config';

export default function Footer({ config }) {
  const { business, footer, site } = config;
  return (
    <footer className="site-footer container">
      <div className="footer-top"><a className="footer-wordmark" href="#beranda">{business.name}</a><p>{business.tagline}</p></div>
      <div className="footer-bottom"><p>{'\u00A9'} {footer.year} {business.name}</p><nav aria-label={footer.navLabel}>{getNavigation(config).map(link => <a key={link.href} href={link.href}>{link.label}</a>)}</nav><a className="back-to-top" href="#beranda">{footer.backToTop}<ArrowUp size={15} aria-hidden="true" /></a></div>
      {site.demo && <p className="demo-notice">{site.demoNotice}</p>}
    </footer>
  );
}
