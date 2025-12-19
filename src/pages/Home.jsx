import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'
import LoginButton from '../components/auth/LoginButton'

const Home = () => {
  const { user, isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="hero">
        <div className="spinner"></div>
      </div>
    )
  }

  // Logged in - Show Dashboard
  if (isAuthenticated && user) {
    return (
      <div className="container">
        <section className="section">
          {/* Welcome Header */}
          <div className="profile-header card">
            <img 
              src={user.picture || '/default-avatar.png'} 
              alt={user.name}
              className="profile-avatar"
            />
            <div className="profile-info">
              <h1>Welcome back, {user.name}</h1>
              <p>Ready to discover your next favorite?</p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="profile-stats">
            <div className="card stat-card">
              <div className="stat-value">
                {user.anime_statistics?.num_items_watching || 0}
              </div>
              <div className="stat-label">Watching</div>
            </div>
            <div className="card stat-card">
              <div className="stat-value">
                {user.anime_statistics?.num_items_completed || 0}
              </div>
              <div className="stat-label">Completed</div>
            </div>
            <div className="card stat-card">
              <div className="stat-value">
                {user.anime_statistics?.mean_score?.toFixed(1) || '—'}
              </div>
              <div className="stat-label">Mean Score</div>
            </div>
            <div className="card stat-card">
              <div className="stat-value">
                {user.anime_statistics?.num_items || 0}
              </div>
              <div className="stat-label">Total Entries</div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="divider"></div>
          
          <div className="features-grid">
            <Link to="/recommendations?type=anime&mode=new" className="card card-interactive feature-card">
              <div className="feature-icon">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                </svg>
              </div>
              <h3 className="feature-title">Discover Anime</h3>
              <p className="feature-desc">Get personalized anime recommendations based on your taste and ratings.</p>
            </Link>

            <Link to="/recommendations?type=manga&mode=new" className="card card-interactive feature-card">
              <div className="feature-icon">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="feature-title">Discover Manga</h3>
              <p className="feature-desc">Find your next great read with smart manga recommendations.</p>
            </Link>

            <Link to="/recommendations?type=anime&mode=rewatch" className="card card-interactive feature-card">
              <div className="feature-icon">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <h3 className="feature-title">Rewatch</h3>
              <p className="feature-desc">Revisit your favorites with suggestions from your highly-rated anime.</p>
            </Link>

            <Link to="/profile" className="card card-interactive feature-card">
              <div className="feature-icon">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="feature-title">Profile</h3>
              <p className="feature-desc">View your complete stats and manage your account settings.</p>
            </Link>
          </div>
        </section>
      </div>
    )
  }

  // Not logged in - Show Landing
  return (
    <>
      <div className="hero">
        <div className="hero-content fade-in">
          <div className="hero-badge">
            <span>✨</span>
            <span>Powered by MyAnimeList</span>
          </div>
          
          <h1 className="hero-title">
            Discover Your Next<br />Favorite Anime
          </h1>
          
          <p className="hero-subtitle">
            Get personalized recommendations based on your MyAnimeList profile. 
            Find new titles or rediscover old favorites.
          </p>
          
          <div className="hero-actions">
            <LoginButton />
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section className="section" style={{ borderTop: '1px solid var(--color-border)' }}>
        <div className="container">
          <h2 style={{ textAlign: 'center', marginBottom: '1rem' }}>How It Works</h2>
          <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)', marginBottom: '4rem' }}>
            Simple, smart recommendations in three steps
          </p>
          
          <div className="features-grid">
            <div className="card feature-card">
              <div className="feature-icon">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
              </div>
              <h3 className="feature-title">Connect MAL</h3>
              <p className="feature-desc">
                Sign in with your MyAnimeList account to sync your anime and manga lists securely.
              </p>
            </div>

            <div className="card feature-card">
              <div className="feature-icon">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="feature-title">Smart Analysis</h3>
              <p className="feature-desc">
                We analyze your ratings and preferences to understand your unique taste profile.
              </p>
            </div>

            <div className="card feature-card">
              <div className="feature-icon">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <h3 className="feature-title">Get Matches</h3>
              <p className="feature-desc">
                Receive curated recommendations for new discoveries or rewatching favorites.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

export default Home
