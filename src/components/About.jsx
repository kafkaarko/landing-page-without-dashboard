import React from 'react';
import ResponsiveImage from './ResponsiveImage';

export default function About({ config }) {
  const { about } = config;
  return (
    <section className={`about-section section-space container${about.image ? '' : ' about-text-only'}`} id="tentang" aria-labelledby="about-heading">
      {about.image && <figure className="about-visual"><ResponsiveImage src={about.image} alt={about.imageAlt} variant="about" loading="lazy" decoding="async" />{about.caption && <figcaption>{about.caption}</figcaption>}</figure>}
      <div className="about-copy">
        <p className="eyebrow">{about.tagline}</p>
        <h2 id="about-heading">{about.heading}<em>{about.headingAccent}</em></h2>
        <p className="about-description">{about.description}</p>
        {about.pillars?.length > 0 && <dl className="about-details">{about.pillars.map((pillar, index) => <div key={pillar.title}><span className="detail-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span><div><dt>{pillar.title}</dt><dd>{pillar.desc}</dd></div></div>)}</dl>}
      </div>
    </section>
  );
}
