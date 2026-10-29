import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import siteConfig from './config/site.json';

document.title = siteConfig.site.title;
document.documentElement.lang = siteConfig.site.language || 'id';

const container = document.getElementById('root');

const app = (
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Reuse prerendered HTML in production; the Vite dev template starts empty.
if (container.hasChildNodes() && container.querySelector('.site-shell')) {
  ReactDOM.hydrateRoot(container, app);
} else {
  ReactDOM.createRoot(container).render(app);
}
