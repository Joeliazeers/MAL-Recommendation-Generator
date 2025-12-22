import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { 
  getUserPreferences, 
  saveUserPreferences,
  invalidateRecommendationCache
} from '../services/supabase'
import { ANIME_GENRES } from '../services/malApi'

const Preferences = () => {
  const { user } = useAuth()
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)
  
  // Preference state
  const [favoriteGenres, setFavoriteGenres] = useState([])
  const [excludedGenres, setExcludedGenres] = useState([])
  const [minScore, setMinScore] = useState(7.0)
  
  // Load user preferences (non-blocking)
  useEffect(() => {
    const loadPreferences = async () => {
      if (!user) return
      
      try {
        const prefs = await getUserPreferences(user.id)
        if (prefs) {
          setFavoriteGenres(prefs.favorite_genres || [])
          setExcludedGenres(prefs.excluded_genres || [])
          setMinScore(prefs.min_score || 7.0)
        }
      } catch (error) {
        console.error('Failed to load preferences:', error)
      }
    }
    
    loadPreferences()
  }, [user])
  
  // Save preferences
  const handleSave = async () => {
    if (!user) return
    
    setSaving(true)
    setMessage(null)
    
    try {
      await saveUserPreferences(user.id, {
        favorite_genres: favoriteGenres,
        excluded_genres: excludedGenres,
        min_score: minScore
      })
      
      // Invalidate recommendation cache so fresh recs are generated
      await invalidateRecommendationCache(user.id)
      
      setMessage({ type: 'success', text: 'Preferences saved! Your next recommendations will reflect these changes.' })
      setTimeout(() => setMessage(null), 5000)
    } catch (error) {
      console.error('Failed to save preferences:', error)
      setMessage({ type: 'error', text: 'Failed to save preferences. Please try again.' })
      setTimeout(() => setMessage(null), 3000)
    } finally {
      setSaving(false)
    }
  }
  
  // Reset to defaults
  const handleReset = () => {
    setFavoriteGenres([])
    setExcludedGenres([])
    setMinScore(7.0)
    setMessage({ type: 'info', text: 'Reset to default values. Click Save to apply.' })
  }
  
  // Toggle genre selection
  const toggleFavorite = (genreId) => {
    setFavoriteGenres(prev => 
      prev.includes(genreId) 
        ? prev.filter(id => id !== genreId)
        : [...prev, genreId]
    )
  }
  
  const toggleExcluded = (genreId) => {
    setExcludedGenres(prev => 
      prev.includes(genreId) 
        ? prev.filter(id => id !== genreId)
        : [...prev, genreId]
    )
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
        <p className="empty-desc">Please log in to manage your preferences</p>
      </div>
    )
  }
  
  return (
    <div className="container">
      <section className="section">
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ marginBottom: '0.5rem' }}>Recommendation Preferences</h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Customize your anime and manga recommendations
          </p>
        </div>
        
        {/* Success/Error Message */}
        {message && (
          <div style={{ 
            padding: '1rem', 
            borderRadius: 'var(--radius-md)', 
            marginBottom: '2rem',
            background: message.type === 'success' ? 'var(--color-success-soft)' : 
                       message.type === 'error' ? 'var(--color-error-soft)' : 
                       'var(--color-bg-secondary)',
            color: message.type === 'success' ? 'var(--color-success)' : 
                   message.type === 'error' ? 'var(--color-error)' : 
                   'var(--color-text-primary)',
            textAlign: 'center'
          }}>
            {message.text}
          </div>
        )}
        
        {/* Favorite Genres */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h2 style={{ marginBottom: '1rem' }}>Favorite Genres</h2>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
            Select genres you enjoy. Recommendations will prioritize these.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            {ANIME_GENRES.map(genre => (
              <button
                key={genre.id}
                onClick={() => toggleFavorite(genre.id)}
                className={`genre-button ${favoriteGenres.includes(genre.id) ? 'selected' : ''}`}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                {genre.name}
                {favoriteGenres.includes(genre.id) && (
                  <span style={{ fontSize: '1rem', lineHeight: 1 }}>×</span>
                )}
              </button>
            ))}
          </div>
        </div>
        
        {/* Excluded Genres */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h2 style={{ marginBottom: '1rem' }}>Excluded Genres</h2>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
            Select genres you want to avoid in recommendations.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            {ANIME_GENRES.map(genre => (
              <button
                key={genre.id}
                onClick={() => toggleExcluded(genre.id)}
                className={`genre-button ${excludedGenres.includes(genre.id) ? 'excluded' : ''}`}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                {genre.name}
                {excludedGenres.includes(genre.id) && (
                  <span style={{ fontSize: '1rem', lineHeight: 1 }}>×</span>
                )}
              </button>
            ))}
          </div>
        </div>
        
        {/* Minimum Score */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h2 style={{ marginBottom: '1rem' }}>Minimum Score</h2>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
            Only recommend anime/manga with a score of at least:
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <input
              type="range"
              min="5"
              max="10"
              step="0.5"
              value={minScore}
              onChange={(e) => setMinScore(parseFloat(e.target.value))}
              style={{ flex: 1, height: '6px', cursor: 'pointer' }}
            />
            <div style={{ 
              fontSize: '1.5rem', 
              fontWeight: 600, 
              color: 'var(--color-accent)',
              minWidth: '60px',
              textAlign: 'center'
            }}>
              {minScore.toFixed(1)}
            </div>
          </div>
        </div>
        
        {/* Actions */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button
            onClick={handleReset}
            className="btn btn-secondary"
            disabled={saving}
          >
            Reset to Defaults
          </button>
          <button
            onClick={handleSave}
            className="btn btn-primary"
            disabled={saving}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            {saving && <span className="spinner" style={{ width: 16, height: 16 }}></span>}
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </section>
    </div>
  )
}

export default Preferences
