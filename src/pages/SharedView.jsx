import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getSharedRecommendation } from '../services/supabase'
import RecommendationCard from '../components/recommendation/RecommendationCard'
import AnimeDetailModal from '../components/recommendation/AnimeDetailModal'

const SharedView = () => {
  const { code } = useParams()
  const [shared, setShared] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedItem, setSelectedItem] = useState(null)

  useEffect(() => {
    const loadShared = async () => {
      try {
        const data = await getSharedRecommendation(code)
        setShared(data)
      } catch {
        setError('This shared link is invalid or has expired.')
      } finally {
        setLoading(false)
      }
    }
    
    loadShared()
  }, [code])

  const handleCardClick = (item) => {
    setSelectedItem(item)
  }

  if (loading) {
    return (
      <div className="container">
        <div className="empty-state">
          <div className="spinner" style={{ width: 40, height: 40 }}></div>
          <p>Loading shared recommendations...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container">
        <div className="empty-state">
          <div className="empty-icon">
            <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.07 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="empty-title">Link Not Found</h2>
          <p className="empty-desc">{error}</p>
          <Link to="/" className="btn btn-primary" style={{ marginTop: '1rem' }}>
            Go Home
          </Link>
        </div>
      </div>
    )
  }

  const recommendations = shared?.recommendations || []
  const type = shared?.type || 'anime'
  const mode = shared?.mode || 'new'

  return (
    <div className="container">
      <section className="section" style={{ paddingTop: '2rem' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ 
            display: 'inline-block', 
            padding: '0.5rem 1rem', 
            background: 'var(--color-accent-soft)', 
            borderRadius: 'var(--radius-full)',
            marginBottom: '1rem'
          }}>
            <span style={{ color: 'var(--color-accent)', fontSize: '0.875rem', fontWeight: '600' }}>
              📤 Shared Recommendations
            </span>
          </div>
          <h1 style={{ marginBottom: '0.5rem' }}>
            {mode === 'new' ? 'Discover New' : 'Rewatch'} {type === 'anime' ? 'Anime' : 'Manga'}
          </h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Someone shared their {type} recommendations with you!
          </p>
        </div>

        {/* Recommendations Grid */}
        <div className="rec-grid">
          {recommendations.map((item) => (
            <RecommendationCard 
              key={item.id} 
              item={{ node: item }} 
              type={type}
              onClick={() => handleCardClick(item)}
            />
          ))}
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center', marginTop: '3rem' }}>
          <Link to="/" className="btn btn-primary">
            Get Your Own Recommendations
          </Link>
        </div>
      </section>

      {/* Detail Modal */}
      {selectedItem && (
        <AnimeDetailModal 
          anime={selectedItem}
          isOpen={!!selectedItem}
          onClose={() => setSelectedItem(null)}
          type={type}
        />
      )}
    </div>
  )
}

export default SharedView
