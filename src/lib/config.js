import siteConfig from '../config/site.json';

export function safeExternalUrl(value) {
  if (typeof value !== 'string') return undefined;
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password
      ? url.href : undefined;
  } catch { return undefined; }
}

export function getVisibleSections(config) {
  return {
    about: config.sections?.about !== false && Boolean(config.about?.heading && config.about?.description),
    offerings: config.sections?.offerings !== false && Array.isArray(config.offerings) && config.offerings.length > 0,
    location: config.sections?.location !== false && Boolean(config.business?.address),
  };
}

export function getNavigation(config) {
  const visible = getVisibleSections(config);
  return [
    visible.offerings && { href: '#menu', label: config.ui.nav.menu },
    visible.about && { href: '#tentang', label: config.ui.nav.about },
    visible.location && { href: '#lokasi', label: config.ui.nav.location },
  ].filter(Boolean);
}

export function getThemeStyle(theme = {}) {
  return Object.fromEntries(
    Object.entries(theme)
      .filter(([, value]) => typeof value === 'string' && /^#[a-f\d]{6}$/i.test(value))
      .map(([key, value]) => [`--site-${key.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)}`, value])
  );
}

export function getSiteConfig() { return siteConfig; }
export default siteConfig;
