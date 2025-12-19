import { useState, useCallback, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import RecommendationList from '../components/recommendation/RecommendationList'
import GenreFilter from '../components/recommendation/GenreFilter'
import { ANIME_GENRES, MANGA_GENRES } from '../services/malApi'
import { createSharedRecommendation } from '../services/supabase'
import { useAuth } from '../context/AuthContext'
import useRecommendations from '../hooks/useRecommendations'

const Recommendations = () => {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  
  const type = searchParams.get('type') || 'anime'
  const mode = searchParams.get('mode') || 'new'
  const [genreFilter, setGenreFilter] = useState([])
  const [hasGenerated, setHasGenerated] = useState(false)
  const [countdown, setCountdown] = useState(null)
  const [shareStatus, setShareStatus] = useState(null) // null, 'loading', 'copied'

  const {
    recommendations,
    loading,
    error,
    noRatings,
    cooldownRemaining,
    hasGeneratedToday,
    getTimeUntilMidnight,
    formatCountdown,
    getNewRecommendations,
    getRewatchRecommendations,
    clearRecommendations,
    loadCachedRecommendations
  } = useRecommendations()

  // Load cached recommendations on initial mount and when URL params change
  useEffect(() => {
    const { hasCached } = loadCachedRecommendations(type, mode)
    setHasGenerated(hasCached)
  }, [type, mode, loadCachedRecommendations])

  // Live countdown timer
  useEffect(() => {
    if (!hasGenerated && !hasGeneratedToday) return

    const updateCountdown = () => {
      const ms = getTimeUntilMidnight()
      const formatted = formatCountdown(ms)
      setCountdown(formatted)
      
      // If past midnight, reset
      if (!formatted) {
        setHasGenerated(false)
        clearRecommendations()
      }
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)

    return () => clearInterval(interval)
  }, [hasGenerated, hasGeneratedToday, getTimeUntilMidnight, formatCountdown, clearRecommendations])

  // Tab handlers - just update URL params, useEffect will handle cache loading
  const setType = (newType) => {
    setSearchParams({ type: newType, mode })
  }

  const setMode = (newMode) => {
    setSearchParams({ type, mode: newMode })
  }

  const handleGenreChange = (genres) => {
    setGenreFilter(genres)
  }

  const handleGenerate = useCallback((overrideGenre = undefined) => {
    const filterToUse = overrideGenre !== undefined ? overrideGenre : genreFilter
    setHasGenerated(true)
    if (mode === 'new') {
      getNewRecommendations(type, filterToUse)
    } else {
      getRewatchRecommendations(type, filterToUse)
    }
  }, [mode, type, genreFilter, getNewRecommendations, getRewatchRecommendations])

  const handleShare = async () => {
    if (!user || recommendations.length === 0 || shareStatus === 'loading') return
    
    setShareStatus('loading')
    try {
      // Prepare simplified recommendation data
      const recsToShare = recommendations.map(item => {
        const node = item.node || item
        return {
          id: node.id,
          title: node.title,
          main_picture: node.main_picture,
          mean: node.mean || node.score,
          status: node.status,
          genres: node.genres
        }
      })
      
      const shared = await createSharedRecommendation(user.id, type, mode, recsToShare)
      const shareUrl = `${window.location.origin}/share/${shared.share_code}`
      
      await navigator.clipboard.writeText(shareUrl)
      setShareStatus('copied')
      
      setTimeout(() => setShareStatus(null), 3000)
    } catch (err) {
      console.error('Failed to share:', err)
      setShareStatus('error')
      alert('Failed to share: ' + (err.message || 'Unknown error. Make sure the shared_recommendations table exists in Supabase.'))
      setTimeout(() => setShareStatus(null), 2000)
    }
  }

  const genres = type === 'anime' ? ANIME_GENRES : MANGA_GENRES

  // Check if button should be hidden (after generating)
  const showButton = !hasGenerated && !hasGeneratedToday && !cooldownRemaining
  const showCountdown = hasGenerated || hasGeneratedToday || cooldownRemaining

  return (
    <div className="container">
      <section className="section" style={{ paddingTop: '2rem' }}>
        {/* Page Header */}
        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <h1 style={{ marginBottom: '0.5rem' }}>
            {mode === 'new' ? 'Discover New Titles' : 'Your Favorites to Revisit'}
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', maxWidth: '500px', margin: '0 auto' }}>
            {mode === 'new' 
              ? 'Personalized picks based on your taste and ratings'
              : 'Highly-rated titles from your list worth experiencing again'
            }
          </p>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
          {/* Mode Tabs */}
          <div className="tabs" style={{ maxWidth: '400px', margin: '0 auto', width: '100%' }}>
            <button 
              className={`tab ${mode === 'new' ? 'active' : ''}`}
              onClick={() => setMode('new')}
            >
              Discover New
            </button>
            <button 
              className={`tab ${mode === 'rewatch' ? 'active' : ''}`}
              onClick={() => setMode('rewatch')}
            >
              {type === 'anime' ? 'Rewatch' : 'Reread'}
            </button>
          </div>

          {/* Genre Filter - only show before generating */}
          {mode === 'new' && showButton && (
            <div style={{ maxWidth: '300px', margin: '0 auto', width: '100%' }}>
              <GenreFilter 
                genres={genres}
                selectedGenres={genreFilter}
                onSelect={handleGenreChange}
              />
            </div>
          )}

          {/* Generate Button - only show if not on cooldown */}
          {showButton && (
            <div style={{ textAlign: 'center' }}>
              <button 
                onClick={() => handleGenerate()}
                disabled={loading}
                className="btn btn-primary"
                style={{ minWidth: '220px' }}
              >
                {loading ? (
                  <>
                    <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></span>
                    Generating...
                  </>
                ) : (
                  <>
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                    Generate Recommendations
                  </>
                )}
              </button>
            </div>
          )}

          {/* Countdown Timer - show after generating */}
          {showCountdown && countdown && (
            <div style={{ textAlign: 'center' }}>
              <div className="card" style={{ 
                display: 'inline-block', 
                padding: '1rem 2rem',
                background: 'var(--color-bg-tertiary)'
              }}>
                <p style={{ color: 'var(--color-text-secondary)', margin: 0, fontSize: '0.9rem' }}>
                  Next recommendations available in
                </p>
                <p style={{ 
                  color: 'var(--color-text-primary)', 
                  margin: '0.5rem 0 0', 
                  fontSize: '1.75rem',
                  fontWeight: '700',
                  fontFamily: 'monospace',
                  letterSpacing: '0.05em'
                }}>
                  🕐 {countdown}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        {hasGenerated || hasGeneratedToday || recommendations.length > 0 ? (
          <>
            <RecommendationList 
              recommendations={recommendations}
              loading={loading}
              error={error}
              noRatings={noRatings}
              type={type}
              mode={mode}
            />
            
            {/* Share Button - below cards */}
            {recommendations.length > 0 && !loading && (
              <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                <button 
                  onClick={handleShare}
                  disabled={shareStatus === 'loading'}
                  className="btn btn-secondary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  {shareStatus === 'loading' ? (
                    <>
                      <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }}></span>
                      Creating link...
                    </>
                  ) : shareStatus === 'copied' ? (
                    <>
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Link Copied!
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                      Share Recommendations
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="empty-state fade-in">
            <div className="empty-icon">
              <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <h2 className="empty-title">Ready to Discover?</h2>
            <p className="empty-desc">
              Select your preferences above and click "Generate Recommendations" to get personalized {type} suggestions.
            </p>
          </div>
        )}
      </section>
    </div>
  )
}

export default Recommendations
