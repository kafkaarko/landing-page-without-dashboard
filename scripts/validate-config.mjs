import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { safeMapsEmbedUrl } from '../src/lib/maps.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let config;
try {
  config = JSON.parse(fs.readFileSync(path.join(root, 'src/config/site.json'), 'utf8'));
} catch (error) {
  console.error('Cannot read src/config/site.json:', error.message);
  process.exit(1);
}
const errors = [];
const field = key => key.split('.').reduce((value, part) => value?.[part], config);
function requireText(keys) {
  for (const key of keys) {
    if (typeof field(key) !== 'string' || !field(key).trim()) errors.push(key + ': required non-empty text.');
  }
}
function externalUrl(key, required = false) {
  const value = field(key);
  if (!value && !required) return;
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error();
  } catch { errors.push(key + ': use a full http:// or https:// URL without credentials.'); }
}
function asset(value, key) {
  if (!value) return;
  if (typeof value !== 'string') { errors.push(key + ': expected an asset path or HTTPS URL.'); return; }
  if (value.startsWith('/') && !value.startsWith('//')) {
    const target = path.resolve(root, 'public', value.slice(1));
    const relative = path.relative(path.join(root, 'public'), target);
    if (relative.startsWith('..') || path.isAbsolute(relative) || !fs.existsSync(target)) errors.push(key + ': local asset is missing or outside public/: ' + value);
  } else {
    try {
      const url = new URL(value);
      if (url.protocol !== 'https:' || url.username || url.password) throw new Error();
    } catch { errors.push(key + ': use a /public-relative path or an HTTPS asset URL.'); }
  }
}

requireText(['site.title', 'site.description', 'site.language', 'business.name', 'business.whatsappMessage',
  'hero.heading', 'hero.subheading', 'hero.image', 'hero.imageAlt', 'hero.ctaPrimary',
  'ui.skipLink', 'ui.navLabel', 'ui.mobileNavLabel', 'ui.contactLabel', 'ui.openMenu', 'ui.closeMenu',
  'ui.nav.menu', 'ui.nav.about', 'ui.nav.location', 'footer.navLabel', 'footer.backToTop']);
if (!/^[1-9]\d{8,14}$/.test(String(config.business?.phoneWhatsApp || ''))) errors.push('business.phoneWhatsApp: enter 9?15 international digits without +, e.g. 6281234567890.');
externalUrl('site.url', true);
externalUrl('business.mapsUrl');
externalUrl('business.instagramUrl');
asset(config.site?.ogImage, 'site.ogImage');
asset(config.site?.favicon, 'site.favicon');
asset(config.business?.logo, 'business.logo');
asset(config.hero?.image, 'hero.image');
if (config.site?.demo) requireText(['site.demoNotice']);
if (!Number.isInteger(config.footer?.year)) errors.push('footer.year: expected a copyright year.');

if (config.sections?.about !== false && config.about?.heading && config.about?.description) {
  asset(config.about.image, 'about.image');
  if (config.about.image) requireText(['about.imageAlt']);
  if (config.about.pillars != null && !Array.isArray(config.about.pillars)) errors.push('about.pillars: expected an array.');
}

if (config.offerings != null && !Array.isArray(config.offerings)) errors.push('offerings: expected an array; use [] to hide the menu.');
if (config.sections?.offerings !== false && Array.isArray(config.offerings) && config.offerings.length) {
  requireText(['menu.eyebrow', 'menu.heading', 'menu.description', 'menu.filterLabel', 'menu.allLabel', 'menu.inquiryPrefix', 'menu.inquiryLabel']);
  const ids = new Set();
  config.offerings.forEach((item, index) => {
    if (!item.id || ids.has(item.id)) errors.push('offerings[' + index + '].id: required unique id.');
    ids.add(item.id);
    if (typeof item.name !== 'string' || !item.name.trim()) errors.push('offerings[' + index + '].name: required text.');
    asset(item.image, 'offerings[' + index + '].image');
  });
}
if (config.sections?.location !== false && config.business?.address) {
  requireText(['contact.eyebrow', 'contact.heading', 'contact.description', 'contact.ctaLabel', 'contact.addressLabel', 'contact.mapsLabel', 'contact.hoursLabel']);
  if (config.business.mapsEmbedUrl) {
    if (!safeMapsEmbedUrl(config.business.mapsEmbedUrl)) errors.push('business.mapsEmbedUrl: use an HTTPS Google Maps embed URL.');
    requireText(['contact.mapTitle', 'contact.mapDescription', 'contact.mapLoadLabel', 'contact.mapLoadingLabel', 'contact.mapLoadedLabel', 'contact.mapFrameTitle']);
  }
  if (config.business.hours != null && !Array.isArray(config.business.hours)) errors.push('business.hours: expected an array.');
}
for (const [key, value] of Object.entries(config.theme || {})) {
  if (typeof value !== 'string' || !/^#[a-f\d]{6}$/i.test(value)) errors.push('theme.' + key + ': use a six-digit hex color, e.g. #263C31.');
}
if (errors.length) {
  console.error('Configuration validation failed:\n' + errors.map(error => '  - ' + error).join('\n'));
  process.exit(1);
}
console.log('Configuration valid: content, contacts, theme, URLs and local assets.');
