import { Link } from 'react-router-dom'
import './homepage.css'

const Homepage = () => {
  return (
    <div className='homepage'>
      <div className="hero">
        <div className="hero-badge">Open Source AI Assistant</div>
        <h1>
          <svg className="lighthouse-logo" width="64" height="64" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="10.1" r="1.0" fill="#7C3AED" opacity="0.10"/>
            <path d="M19.6 5.1 C19.98 6.34 20.36 6.72 21.6 7.1 C20.36 7.48 19.98 7.86 19.6 9.1 C19.22 7.86 18.84 7.48 17.6 7.1 C18.84 6.72 19.22 6.34 19.6 5.1Z" stroke="#7C3AED" strokeWidth="0.55" strokeLinejoin="round" strokeLinecap="round" opacity="0.97" fill="none"/>
            <path d="M11.0 7.0 C11.26 7.82 11.54 8.1 12.36 8.36 C11.54 8.62 11.26 8.9 11.0 9.72 C10.74 8.9 10.46 8.62 9.64 8.36 C10.46 8.1 10.74 7.82 11.0 7.0Z" stroke="#7C3AED" strokeWidth="0.5" strokeLinejoin="round" strokeLinecap="round" opacity="0.76" fill="none"/>
            <path d="M21.8 9.0 C22.0 9.64 22.22 9.86 22.86 10.06 C22.22 10.26 22.0 10.48 21.8 11.12 C21.6 10.48 21.38 10.26 20.74 10.06 C21.38 9.86 21.6 9.64 21.8 9.0Z" stroke="#7C3AED" strokeWidth="0.46" strokeLinejoin="round" strokeLinecap="round" opacity="0.54" fill="none"/>
            <path d="M16 4.7V5.4" stroke="#7C3AED" strokeWidth="1.1" strokeLinecap="round" opacity="0.9"/>
            <path d="M14.4 6.1H17.6L18.25 7.9H13.75L14.4 6.1Z" stroke="#7C3AED" strokeWidth="1.0" strokeLinejoin="round" opacity="0.88"/>
            <rect x="13.9" y="7.9" width="4.2" height="1.9" rx="0.45" stroke="#7C3AED" strokeWidth="1.0" opacity="0.88"/>
            <path d="M14.15 10.2L12.9 24.0H19.1L17.85 10.2" stroke="#7C3AED" strokeWidth="1.0" strokeLinejoin="round" opacity="0.82"/>
            <path d="M12.5 24.4H19.5" stroke="#7C3AED" strokeWidth="1.2" strokeLinecap="round" opacity="0.85"/>
            <path d="M8 26.2C9.2 25.45 10.4 25.45 11.6 26.2C12.8 26.95 14 26.95 15.2 26.2C16.4 25.45 17.6 25.45 18.8 26.2C20 26.95 21.2 26.95 22.4 26.2C23.6 25.45 24.8 25.45 26 26.2" stroke="#7C3AED" strokeWidth="1.1" strokeLinecap="round" opacity="0.40"/>
          </svg>
          {import.meta.env.VITE_APP_NAME || 'Lighthouse'}
        </h1>
        <p className="hero-subtitle">
          Explore your datalake with natural language. Query tables, browse documentation, 
          and get AI-powered insights — all from one interface.
        </p>
        <div className="hero-actions">
          <Link to='/dashboard' className="hero-btn-primary">Start Chatting</Link>
          <a href="https://github.com/qzyu999/Lighthouse" target="_blank" rel="noopener noreferrer" className="hero-btn-secondary">
            View on GitHub
          </a>
        </div>
      </div>

      <div className="features">
        <div className="feature-card">
          <span className="feature-icon">💬</span>
          <h3>Chat with Your Data</h3>
          <p>Ask questions in plain English. The AI understands your schema and writes queries for you.</p>
        </div>
        <div className="feature-card">
          <span className="feature-icon">📖</span>
          <h3>Built-in Wiki</h3>
          <p>Browse documentation, data catalogs, and lineage diagrams alongside your conversations.</p>
        </div>
        <div className="feature-card">
          <span className="feature-icon">🔌</span>
          <h3>Pluggable Architecture</h3>
          <p>Bring your own LLM provider, wiki source, and query engine. Config-driven, no code changes.</p>
        </div>
      </div>

      <div className="homepage-footer">
        <span>Apache 2.0 License</span>
        <span>·</span>
        <a href="https://github.com/qzyu999/Lighthouse" target="_blank" rel="noopener noreferrer">GitHub</a>
      </div>
    </div>
  )
}

export default Homepage
