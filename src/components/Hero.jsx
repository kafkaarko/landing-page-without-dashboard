import React from 'react';
import { ArrowDown, ArrowUpRight } from 'lucide-react';
import { buildWhatsAppUrl } from '../lib/whatsapp';
import { getVisibleSections } from '../lib/config';
import ResponsiveImage from './ResponsiveImage';

export default function Hero({ config }) {
  const { hero, business } = config;
  const visible = getVisibleSections(config);
  const waUrl = buildWhatsAppUrl(business.phoneWhatsApp, business.whatsappMessage);
  return (
    <section className="hero container" id="beranda" aria-labelledby="hero-heading">
      <div className="hero-copy">
        {hero.badge && <p className="eyebrow"><span className="little-sun" aria-hidden="true" />{hero.badge}</p>}
        <h1 id="hero-heading">{hero.heading}{hero.headingAccent && <em>{hero.headingAccent}</em>}</h1>
        <p className="hero-description">{hero.subheading}</p>
        <div className="hero-actions">
          <a className="button button-primary" href={waUrl} target="_blank" rel="noopener noreferrer">
            {hero.ctaPrimary}<ArrowUpRight size={19} aria-hidden="true" />
          </a>
          {visible.offerings && hero.ctaSecondary && <a className="text-link" href="#menu">{hero.ctaSecondary}<ArrowDown size={16} aria-hidden="true" /></a>}
        </div>
        {hero.note && <p className="hero-note">{hero.note}</p>}
      </div>
      <figure className="hero-visual">
        <div className="hero-image-wrap">
          <ResponsiveImage src={hero.image} alt={hero.imageAlt} variant="hero" fetchPriority="high" />
          {hero.imageLabel && <span className="photo-label">{hero.imageLabel}</span>}
        </div>
        {hero.caption && <figcaption><span>{hero.caption}</span><ArrowUpRight size={16} aria-hidden="true" /></figcaption>}
      </figure>
      {hero.features?.length > 0 && <div className="hero-details">{hero.features.map((feature, index) => <p key={feature}><span className="detail-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>{feature}</p>)}</div>}
    </section>
  );
}
