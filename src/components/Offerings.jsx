import React, { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { buildWhatsAppUrl } from '../lib/whatsapp';
import ResponsiveImage from './ResponsiveImage';

export default function Offerings({ config }) {
  const { offerings, business, menu, ui } = config;
  const [active, setActive] = useState('all');
  const groups = [...new Set(offerings.map(item => item.group).filter(Boolean))];
  const items = active === 'all' ? offerings : offerings.filter(item => item.group === active);
  return (
    <section className="menu-section section-space" id="menu" aria-labelledby="menu-heading">
      <div className="container">
        <div className="section-heading">
          <div><p className="eyebrow">{menu.eyebrow}</p><h2 id="menu-heading">{menu.heading}<em>{menu.headingAccent}</em></h2></div>
          <p className="section-description">{menu.description}</p>
        </div>
        {groups.length > 1 && <div className="menu-filters" role="group" aria-label={menu.filterLabel}>
          <button type="button" aria-pressed={active === 'all'} onClick={() => setActive('all')}>{menu.allLabel}</button>
          {groups.map(group => <button key={group} type="button" aria-pressed={active === group} onClick={() => setActive(group)}>{group}</button>)}
        </div>}
        <ul className="menu-grid" aria-live="polite" aria-atomic="true">
          {items.map((item, index) => (
            <li className="menu-item" key={item.id}>
              {item.image && <div className="menu-image"><ResponsiveImage src={item.image} alt={item.imageAlt || item.name} variant="menu" loading="lazy" decoding="async" />{item.badge && <span>{item.badge}</span>}</div>}
              <div className="menu-item-meta"><span>{item.category}</span><span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span></div>
              <div className="menu-item-title"><h3>{item.name}</h3>{(item.priceLabel || item.price) && <span>{item.priceLabel || item.price}</span>}</div>
              <p className="menu-item-description">{item.description}</p>
              <a className="menu-inquiry" href={buildWhatsAppUrl(business.phoneWhatsApp, `${menu.inquiryPrefix} ${item.name}.`)} target="_blank" rel="noopener noreferrer" aria-label={`${menu.inquiryLabel} ${item.name}`}>
                {menu.inquiryLabel}<ArrowUpRight size={16} aria-hidden="true" />
              </a>
            </li>
          ))}
        </ul>
        <div className="menu-footnote"><span>{menu.note}</span><a className="text-link" href={buildWhatsAppUrl(business.phoneWhatsApp, business.whatsappMessage)} target="_blank" rel="noopener noreferrer">{ui.contactLabel}<ArrowUpRight size={17} aria-hidden="true" /></a></div>
      </div>
    </section>
  );
}
