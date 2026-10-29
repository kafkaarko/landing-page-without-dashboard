import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { safeExternalUrl } from '../lib/config';
import { buildWhatsAppUrl } from '../lib/whatsapp';
import { safeMapsEmbedUrl } from '../lib/maps';
import ClickToLoadMap from './ClickToLoadMap';

function InstagramIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r=".8" fill="currentColor" stroke="none" /></svg>;
}

export default function LocationContact({ config }) {
  const { business, contact, ui } = config;
  const mapsUrl = safeExternalUrl(business.mapsUrl);
  const instagramUrl = safeExternalUrl(business.instagramUrl);
  const mapsEmbedUrl = safeMapsEmbedUrl(business.mapsEmbedUrl);
  return (
    <section className="contact-section section-space" id="lokasi" aria-labelledby="contact-heading">
      <div className="container contact-grid">
        <div className="contact-intro">
          <p className="eyebrow">{contact.eyebrow}</p>
          <h2 id="contact-heading">{contact.heading}<em>{contact.headingAccent}</em></h2>
          <p>{contact.description}</p>
          <a className="button button-light" href={buildWhatsAppUrl(business.phoneWhatsApp, business.whatsappMessage)} target="_blank" rel="noopener noreferrer">{contact.ctaLabel}<ArrowUpRight size={19} aria-hidden="true" /></a>
        </div>
        <div className="contact-details">
          <div className="address-block"><h3 className="eyebrow">{contact.addressLabel}</h3><address>{business.address}</address>{business.addressNote && <p>{business.addressNote}</p>}{mapsUrl && <a className="text-link" href={mapsUrl} target="_blank" rel="noopener noreferrer">{contact.mapsLabel}<ArrowUpRight size={17} aria-hidden="true" /></a>}</div>
          {business.hours?.length > 0 && <div className="hours-block"><h3 className="eyebrow">{contact.hoursLabel}</h3><dl>{business.hours.map((hour, index) => <div key={index}><dt>{typeof hour === 'string' ? hour : hour.days}</dt>{hour.time && <dd>{hour.time}</dd>}</div>)}</dl></div>}
          {instagramUrl && <a className="social-link" href={instagramUrl} target="_blank" rel="noopener noreferrer"><InstagramIcon />{business.instagramLabel || ui.instagramLabel}<ArrowUpRight size={17} aria-hidden="true" /></a>}
        </div>
      </div>
      {mapsEmbedUrl && <ClickToLoadMap key={mapsEmbedUrl} embedUrl={mapsEmbedUrl} contact={contact} />}
    </section>
  );
}
