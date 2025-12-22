import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import ThemeToggle from '../common/ThemeToggle'

const Header = () => {
  const { isAuthenticated, user, logout } = useAuth()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isActive = (path) => {
    if (path.includes('?')) {
      const basePath = path.split('?')[0]
      const param = new URLSearchParams(path.split('?')[1])
      const currentParams = new URLSearchParams(location.search)
      return location.pathname === basePath && currentParams.get('type') === param.get('type')
    }
    return location.pathname === path
  }

  const closeMenu = () => setMobileMenuOpen(false)

  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/" className="logo" onClick={closeMenu}>
          MAL Recommender
        </Link>

        {/* Desktop Nav */}
        <nav className="nav nav-desktop">
          {isAuthenticated && (
            <>
              <Link 
                to="/recommendations?type=anime&mode=new" 
                className={`nav-link ${isActive('/recommendations?type=anime') ? 'active' : ''}`}
              >
                Anime
              </Link>
              <Link 
                to="/recommendations?type=manga&mode=new" 
                className={`nav-link ${isActive('/recommendations?type=manga') ? 'active' : ''}`}
              >
                Manga
              </Link>
              <Link 
                to="/profile" 
                className={`nav-link ${isActive('/profile') ? 'active' : ''}`}
              >
                Profile
              </Link>
              <Link 
                to="/preferences" 
                className={`nav-link ${isActive('/preferences') ? 'active' : ''}`}
              >
                Preferences
              </Link>
            </>
          )}
          
          <ThemeToggle />
          
          {isAuthenticated && user ? (
            <button onClick={logout} className="btn-ghost">
              Sign Out
            </button>
          ) : (
            <Link to="/" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem' }}>
              Sign In
            </Link>
          )}
        </nav>

        {/* Mobile Controls */}
        <div className="mobile-controls">
          <ThemeToggle />
          {isAuthenticated ? (
            <button 
              className="hamburger-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          ) : (
            <Link to="/" className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
              Sign In
            </Link>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && isAuthenticated && (
        <nav className="mobile-menu">
          <Link 
            to="/recommendations?type=anime&mode=new" 
            className={`mobile-nav-link ${isActive('/recommendations?type=anime') ? 'active' : ''}`}
            onClick={closeMenu}
          >
            Anime
          </Link>
          <Link 
            to="/recommendations?type=manga&mode=new" 
            className={`mobile-nav-link ${isActive('/recommendations?type=manga') ? 'active' : ''}`}
            onClick={closeMenu}
          >
            Manga
          </Link>
          <Link 
            to="/profile" 
            className={`mobile-nav-link ${isActive('/profile') ? 'active' : ''}`}
            onClick={closeMenu}
          >
            Profile
          </Link>
          <Link 
            to="/preferences" 
            className={`mobile-nav-link ${isActive('/preferences') ? 'active' : ''}`}
            onClick={closeMenu}
          >
            Preferences
          </Link>
          <button 
            onClick={() => { logout(); closeMenu(); }} 
            className="mobile-nav-link"
            style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Sign Out
          </button>
        </nav>
      )}
    </header>
  )
}

export default Header
