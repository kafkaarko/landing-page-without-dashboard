import React, { useRef, useState } from 'react';
import { MapPin } from 'lucide-react';

export default function ClickToLoadMap({ embedUrl, contact }) {
  const [active, setActive] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const iframeRef = useRef(null);

  return (
    <div className="container contact-map">
      <div className="map-frame">
        {active ? (
          <>
            {!loaded && <p className="map-loading">{contact.mapLoadingLabel}</p>}
            <iframe
              ref={iframeRef}
              src={embedUrl}
              title={contact.mapFrameTitle}
              width="1280"
              height="360"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              onLoad={() => {
                setLoaded(true);
              }}
            />
          </>
        ) : (
          <div className="map-placeholder">
            <MapPin size={30} strokeWidth={1.5} aria-hidden="true" />
            <h3>{contact.mapTitle}</h3>
            <p>{contact.mapDescription}</p>
            <button className="button button-primary" type="button" onClick={() => {
              setActive(true);
              // Move keyboard focus from the replaced button to the map frame.
              requestAnimationFrame(() => iframeRef.current?.focus());
            }}>
              {contact.mapLoadLabel}<MapPin size={18} aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
      <p className="sr-only" role="status">{active ? (loaded ? contact.mapLoadedLabel : contact.mapLoadingLabel) : ''}</p>
    </div>
  );
}
