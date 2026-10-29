export function safeMapsEmbedUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return undefined;
  try {
    const url = new URL(value);
    const googleHost = ['www.google.com', 'google.com', 'maps.google.com'].includes(url.hostname);
    const embedPath = url.pathname === '/maps/embed' || url.pathname.startsWith('/maps/embed/');
    const embedQuery = url.pathname === '/maps' && url.searchParams.get('output') === 'embed';
    return url.protocol === 'https:' && googleHost && !url.username && !url.password && !url.port && (embedPath || embedQuery)
      ? url.href : undefined;
  } catch { return undefined; }
}
