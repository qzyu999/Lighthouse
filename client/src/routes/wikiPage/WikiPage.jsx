import { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import './wikiPage.css';

const API_URL = import.meta.env.VITE_API_URL || "";

const WikiPage = forwardRef(({ initialPage }, ref) => {
  const [hasHtml, setHasHtml] = useState(false);
  const [loading, setLoading] = useState(true);
  const iframeRef = useRef(null);

  // Allow parent to navigate the wiki iframe to a specific page
  useImperativeHandle(ref, () => ({
    navigateTo(page) {
      if (iframeRef.current) {
        iframeRef.current.src = `${API_URL}/wiki-static/${page}`;
      }
    }
  }));

  useEffect(() => {
    fetch(`${API_URL}/api/wiki/html`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        setHasHtml((data.pages || []).length > 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="wiki-loading">Loading wiki...</div>;

  if (!hasHtml) {
    return (
      <div className="wiki-placeholder">
        <h2>📖 Documentation</h2>
        <p>No wiki pages configured. Set <code>html_path</code> in your config to enable.</p>
      </div>
    );
  }

  return (
    <div className="wikiPage">
      <iframe
        ref={iframeRef}
        className="wiki-iframe"
        src={`${API_URL}/wiki-static/${initialPage || 'index.html'}`}
        title="Wiki"
      />
    </div>
  );
});

export default WikiPage;
