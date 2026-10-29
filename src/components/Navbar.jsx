import React, { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import { buildWhatsAppUrl } from '../lib/whatsapp';
import { getNavigation } from '../lib/config';

export default function Navbar({ config }) {
  const [open, setOpen] = useState(false);
  const toggle = useRef(null);
  const { business, ui } = config;
  const links = getNavigation(config);
  const waUrl = buildWhatsAppUrl(business.phoneWhatsApp, business.whatsappMessage);

  useEffect(() => {
    const closeOnEscape = event => {
      if (event.key === 'Escape' && open) {
        setOpen(false);
        toggle.current?.focus();
      }
    };
    const desktop = window.matchMedia('(min-width: 960px)');
    const closeOnDesktop = event => { if (event.matches) setOpen(false); };
    document.addEventListener('keydown', closeOnEscape);
    desktop.addEventListener('change', closeOnDesktop);
    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      desktop.removeEventListener('change', closeOnDesktop);
    };
  }, [open]);

  return (
    <header className="site-header">
      <div className="container header-inner">
        <a href="#beranda" className="brand" onClick={() => setOpen(false)}>
          {business.logo && <img src={business.logo} width="40" height="40" alt="" />}
          <span>{business.name}</span>
        </a>
        <nav className="desktop-nav" aria-label={ui.navLabel}>
          {links.map(link => <a key={link.href} href={link.href}>{link.label}</a>)}
        </nav>
        <a href={waUrl} target="_blank" rel="noopener noreferrer" className="header-contact">
          {ui.contactLabel}<ArrowUpRight size={17} aria-hidden="true" />
        </a>
        <button ref={toggle} className="menu-toggle" type="button" aria-controls="mobile-navigation"
          aria-expanded={open} aria-label={open ? ui.closeMenu : ui.openMenu} onClick={() => setOpen(value => !value)}>
          {open ? <X size={23} aria-hidden="true" /> : <Menu size={23} aria-hidden="true" />}
        </button>
      </div>
      <nav className="mobile-nav container" id="mobile-navigation" hidden={!open} aria-label={ui.mobileNavLabel}>
        {links.map(link => <a key={link.href} href={link.href} onClick={() => setOpen(false)}>{link.label}<ArrowUpRight size={18} aria-hidden="true" /></a>)}
        <a href={waUrl} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}>{ui.contactLabel}<ArrowUpRight size={18} aria-hidden="true" /></a>
      </nav>
    </header>
  );
}
