import './App.css';

function App() {
  const techStack = [
    'React',
    'TypeScript',
    'Vite',
    'Node.js',
    'Express',
    'PostgreSQL',
    'Prisma',
    'Supabase',
  ];

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <div className="logo-icon">📝</div>
            Talent Growth
          </div>
          <span className="header-badge">✓ Initialized</span>
        </div>
      </header>

      {/* Hero Section */}
      <main className="hero">
        <div className="hero-content">
          <div className="hero-eyebrow animate-in">🚀 Phase 1 — Project Initialized</div>
          <h1 className="hero-title animate-in">
            <span className="gradient-text">Talent Growth</span>
            <br />
            Blog Platform
          </h1>
          <p className="hero-description animate-in">
            A full-stack blog application built with React and Express, designed for
            sharing knowledge and growing together. Currently in the foundation stage —
            the frontend and backend are ready for integration.
          </p>

          {/* Status Cards */}
          <div className="status-grid">
            <div className="status-card animate-in">
              <div className="status-icon frontend">⚛️</div>
              <div className="status-info">
                <h3>Frontend Ready</h3>
                <p>React + TypeScript + Vite development server running successfully.</p>
              </div>
            </div>
            <div className="status-card animate-in">
              <div className="status-icon backend">🔌</div>
              <div className="status-info">
                <h3>Backend Ready</h3>
                <p>Express API with health endpoint available at /api/v1/health.</p>
              </div>
            </div>
            <div className="status-card animate-in">
              <div className="status-icon next">📋</div>
              <div className="status-info">
                <h3>Next Phase</h3>
                <p>Database setup, authentication, and blog CRUD features coming soon.</p>
              </div>
            </div>
          </div>

          {/* Tech Stack */}
          <div className="tech-stack animate-in">
            {techStack.map((tech) => (
              <span key={tech} className="tech-badge">
                {tech}
              </span>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="footer">
        <p>
          <span className="footer-highlight">Talent Growth Blog Platform</span> · Phase 1 ·
          Foundation Setup Complete
        </p>
      </footer>
    </div>
  );
}

export default App;
