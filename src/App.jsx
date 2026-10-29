import React from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './components/About';
import Offerings from './components/Offerings';
import LocationContact from './components/LocationContact';
import Footer from './components/Footer';
import siteConfig from './config/site.json';
import { getVisibleSections, getThemeStyle } from './lib/config';

export default function App({ config = siteConfig }) {
  const visible = getVisibleSections(config);
  return (
    <div className="site-shell" style={getThemeStyle(config.theme)}>
      <a className="skip-link" href="#konten">{config.ui.skipLink}</a>
      <Navbar config={config} />
      <main id="konten" tabIndex={-1}>
        <Hero config={config} />
        {visible.offerings && <Offerings config={config} />}
        {visible.about && <About config={config} />}
        {visible.location && <LocationContact config={config} />}
      </main>
      <Footer config={config} />
    </div>
  );
}
