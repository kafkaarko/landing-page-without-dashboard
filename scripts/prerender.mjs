import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { deploymentMetadata, robotsText, sitemapXml } from './deployment.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const distDir = path.resolve(root, 'dist');
const templatePath = path.resolve(distDir, 'index.html');

console.log('🚀 Starting static prerender process...');

if (!fs.existsSync(templatePath)) {
  console.error('❌ dist/index.html not found! Run "vite build" first.');
  process.exit(1);
}

async function prerender() {
  const vite = await createServer({
    root,
    server: { middlewareMode: true },
    appType: 'custom',
  });

  try {
    const { render } = await vite.ssrLoadModule('/src/entry-server.jsx');
    const config = JSON.parse(fs.readFileSync(path.join(root, 'src/config/site.json'), 'utf8'));
    const metadata = deploymentMetadata(config, process.env);
    const { html: appHtml, head: appHead } = render(metadata);

    const template = fs.readFileSync(templatePath, 'utf-8');

    // Replace <!--app-html--> and <!--app-head-->
    let finalHtml = template
      .replace(/<title>.*?<\/title>/gi, '')
      .replace(/<link\b[^>]*\brel=["']icon["'][^>]*>/gi, '');
    if (template.includes('<!--app-html-->')) {
      finalHtml = finalHtml.replace('<!--app-html-->', appHtml);
    } else {
      finalHtml = finalHtml.replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`);
    }

    if (template.includes('<!--app-head-->')) {
      finalHtml = finalHtml.replace('<!--app-head-->', appHead);
    } else {
      finalHtml = finalHtml.replace('</head>', `${appHead}\n</head>`);
    }

    finalHtml = finalHtml.replace(/<html\s+lang="[^"]*"/, `<html lang="${config.site.language.replace(/[^a-zA-Z0-9-]/g, '')}"`);
    fs.writeFileSync(templatePath, finalHtml, 'utf-8');
    fs.writeFileSync(path.join(distDir, 'robots.txt'), robotsText(metadata));
    const sitemap = sitemapXml(metadata);
    const sitemapPath = path.join(distDir, 'sitemap.xml');
    if (sitemap) fs.writeFileSync(sitemapPath, sitemap);
    else if (fs.existsSync(sitemapPath)) fs.unlinkSync(sitemapPath);
    console.log(`Indexing: ${metadata.noIndex ? 'noindex (demo, preview or local build)' : 'enabled; sitemap generated'}`);
    console.log('✅ Static HTML successfully prerendered into dist/index.html!');
    console.log(`📄 Output file size: ${(fs.statSync(templatePath).size / 1024).toFixed(2)} KB`);
  } catch (err) {
    console.error('❌ Prerender execution failed:', err);
    process.exit(1);
  } finally {
    await vite.close();
  }
}

prerender();
