// Loads Leaflet from CDN once (web only). Used by web map components so they
// can render live, updatable markers (an <iframe> embed can't move a marker).
let leafletPromise: Promise<any> | null = null;

export function loadLeaflet(): Promise<any> {
  const w = window as any;
  if (w.L) return Promise.resolve(w.L);
  if (leafletPromise) return leafletPromise;
  leafletPromise = new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.async = true;
    script.onload = () => resolve((window as any).L);
    script.onerror = () => {
      leafletPromise = null; // allow retry on next call
      reject(new Error('Failed to load Leaflet'));
    };
    document.body.appendChild(script);
  });
  return leafletPromise;
}
