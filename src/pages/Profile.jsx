import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

const Profile = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  if (!user) {
    return (
      <div className="empty-state">
        <div className="empty-icon">
          <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <h2 className="empty-title">Not Logged In</h2>
        <p className="empty-desc">Please log in to view your profile</p>
      </div>
    )
  }

  const animeStats = user.anime_statistics || {}
  const mangaStats = user.manga_statistics || {}

  // Format joined date
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  // Capitalize gender
  const formatGender = (gender) => {
    if (!gender) return 'Not specified'
    return gender.charAt(0).toUpperCase() + gender.slice(1)
  }

  return (
    <div className="container">
      <section className="section">
        {/* Profile Header */}
        <div className="card profile-header">
          <img 
            src={user.picture || '/default-avatar.png'} 
            alt={user.name}
            className="profile-avatar"
          />
          <div className="profile-info">
            <h2 style={{ marginBottom: '0.5rem', fontSize: '1.5rem' }}>{user.name}</h2>
            <p style={{ color: 'var(--color-text-secondary)', margin: '0.25rem 0' }}>
              Gender: {formatGender(user.gender)}
            </p>
            <p style={{ color: 'var(--color-text-secondary)', margin: '0.25rem 0' }}>
              Joined: {formatDate(user.joined_at)}
            </p>
          </div>
        </div>

        {/* Anime Stats */}
        <h2 style={{ marginBottom: '1.5rem' }}>Anime Statistics</h2>
        <div className="profile-stats" style={{ marginBottom: '3rem' }}>
          <div className="card stat-card">
            <div className="stat-value">{animeStats.num_items_watching || 0}</div>
            <div className="stat-label">Watching</div>
          </div>
          <div className="card stat-card">
            <div className="stat-value">{animeStats.num_items_completed || 0}</div>
            <div className="stat-label">Completed</div>
          </div>
          <div className="card stat-card">
            <div className="stat-value">{animeStats.num_items_on_hold || 0}</div>
            <div className="stat-label">On Hold</div>
          </div>
          <div className="card stat-card">
            <div className="stat-value">{animeStats.num_items_dropped || 0}</div>
            <div className="stat-label">Dropped</div>
          </div>
          <div className="card stat-card">
            <div className="stat-value">{animeStats.num_items_plan_to_watch || 0}</div>
            <div className="stat-label">Plan to Watch</div>
          </div>
          <div className="card stat-card">
            <div className="stat-value">{animeStats.mean_score?.toFixed(1) || '—'}</div>
            <div className="stat-label">Mean Score</div>
          </div>
        </div>

        {/* Manga Stats */}
        <h2 style={{ marginBottom: '1.5rem' }}>Manga Statistics</h2>
        <div className="profile-stats" style={{ marginBottom: '3rem' }}>
          <div className="card stat-card">
            <div className="stat-value">{mangaStats.num_items_reading || 0}</div>
            <div className="stat-label">Reading</div>
          </div>
          <div className="card stat-card">
            <div className="stat-value">{mangaStats.num_items_completed || 0}</div>
            <div className="stat-label">Completed</div>
          </div>
          <div className="card stat-card">
            <div className="stat-value">{mangaStats.num_items_on_hold || 0}</div>
            <div className="stat-label">On Hold</div>
          </div>
          <div className="card stat-card">
            <div className="stat-value">{mangaStats.num_items_dropped || 0}</div>
            <div className="stat-label">Dropped</div>
          </div>
          <div className="card stat-card">
            <div className="stat-value">{mangaStats.num_items_plan_to_read || 0}</div>
            <div className="stat-label">Plan to Read</div>
          </div>
          <div className="card stat-card">
            <div className="stat-value">{mangaStats.mean_score?.toFixed(1) || '—'}</div>
            <div className="stat-label">Mean Score</div>
          </div>
        </div>

        {/* Actions */}
        <div className="divider"></div>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <a 
            href={`https://myanimelist.net/profile/${user.name}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
          >
            View on MAL
          </a>
          <button onClick={handleLogout} className="btn btn-secondary">
            Sign Out
          </button>
        </div>
      </section>
    </div>
  )
}

export default Profile
