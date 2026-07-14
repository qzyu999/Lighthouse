import { Link } from 'react-router-dom'
import './homepage.css'

const Homepage = () => {
  return (
    <div className='homepage'>
      <div className="hero">
        <div className="hero-badge">Open Source AI Assistant</div>
        <h1>{import.meta.env.VITE_APP_NAME || 'Lighthouse'}</h1>
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
