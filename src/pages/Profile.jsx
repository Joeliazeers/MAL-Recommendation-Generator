import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

const Profile = () => {
  const { user, refreshUserData, loading } = useAuth()
  const [syncing, setSyncing] = useState(false)

  const handleSync = async () => {
    setSyncing(true)
    try {
      await refreshUserData()
    } finally {
      setSyncing(false)
    }
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
        <div className="card profile-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
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
          <button 
            onClick={handleSync} 
            className="btn btn-primary"
            disabled={syncing || loading}
            style={{ display: 'flex', alignItems: 'center' }}
          >
            {syncing ? (
              <>
                <span className="spinner" style={{ width: 16, height: 16, marginRight: '0.5rem' }}></span>
                Syncing...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '0.5rem' }}>
                  <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
                </svg>
                Sync with MAL
              </>
            )}
          </button>
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
      </section>
    </div>
  )
}

export default Profile
