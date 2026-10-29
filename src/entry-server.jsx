import React from 'react';
import { renderToString } from 'react-dom/server';
import App from './App';
import siteConfig from './config/site.json';

export function render({ url, noIndex = true } = {}) {
  const html = renderToString(<App config={siteConfig} />);

  const { site, business } = siteConfig;
  const title = site.title || business.name;
  const description = site.description || business.description;
  const ogImage = url ? new URL(site.ogImage || '/images/og-kopi-senja.webp', url).href : undefined;

  const head = `
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <meta name="robots" content="${noIndex ? 'noindex, nofollow' : 'index, follow'}" />
    ${url ? `<link rel="canonical" href="${escapeHtml(url)}" />` : ''}
    <link rel="icon" href="${escapeHtml(site.favicon || '/favicon.svg')}" />
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website" />
    ${url ? `<meta property="og:url" content="${escapeHtml(url)}" />` : ''}
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    ${ogImage ? `<meta property="og:image" content="${escapeHtml(ogImage)}" />` : ''}
    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image" />
    ${url ? `<meta property="twitter:url" content="${escapeHtml(url)}" />` : ''}
    <meta property="twitter:title" content="${escapeHtml(title)}" />
    <meta property="twitter:description" content="${escapeHtml(description)}" />
    ${ogImage ? `<meta property="twitter:image" content="${escapeHtml(ogImage)}" />` : ''}
  `.trim();

  return { html, head };
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
