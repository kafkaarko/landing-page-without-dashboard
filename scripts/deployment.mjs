// Build-time metadata only. No environment values are included in the client bundle.
export function publicSiteUrl(value) {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    if (url.protocol !== 'https:' || url.username || url.password || url.port ||
        url.pathname !== '/' || url.search || url.hash || !host.includes('.') ||
        host === 'example.com' || host.endsWith('.example.com') ||
        /(?:^|\.)(?:localhost|local|test|invalid|example)$/.test(host) ||
        /^[\d.]+$/.test(host)) return undefined;
    return url.origin + '/';
  } catch { return undefined; }
}

export function deploymentMetadata(config, env = {}) {
  const explicit = env.SITE_URL?.trim();
  if (explicit && !publicSiteUrl(explicit)) {
    throw new Error('SITE_URL must be a public HTTPS origin without a path, query or credentials.');
  }
  const configured = publicSiteUrl(config.site.url);
  const deployed = publicSiteUrl(`https://${env.VERCEL_URL || ''}`);
  const production = env.VERCEL_ENV === 'production'
    ? publicSiteUrl(`https://${env.VERCEL_PROJECT_PRODUCTION_URL || ''}`) : undefined;
  const url = publicSiteUrl(explicit) || configured || production || deployed;
  const noIndex = config.site.demo === true || !url ||
    Boolean(env.VERCEL_ENV && env.VERCEL_ENV !== 'production');
  if (env.VERCEL_ENV === 'production' && config.site.demo !== true && !url) {
    throw new Error('A live business site needs SITE_URL or a public site.url before production deployment.');
  }
  return { url, noIndex };
}

export function robotsText({ url, noIndex }) {
  return noIndex ? 'User-agent: *\nAllow: /\n'
    : `User-agent: *\nAllow: /\n\nSitemap: ${url}sitemap.xml\n`;
}

export function sitemapXml({ url, noIndex }) {
  if (noIndex) return undefined;
  const escaped = url.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${escaped}</loc></url></urlset>\n`;
}
