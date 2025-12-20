import { useState, useEffect } from 'react'
import RecommendationCard from './RecommendationCard'
import AnimeDetailModal from './AnimeDetailModal'
import { useAuth } from '../../context/AuthContext'
import { getUserAnimeListCache, getUserMangaListCache } from '../../services/supabase'

const RecommendationList = ({ 
  recommendations, 
  loading, 
  error, 
  noRatings, 
  type, 
  mode 
}) => {
  const { user } = useAuth()
  const [selectedAnime, setSelectedAnime] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [userListIds, setUserListIds] = useState(new Set())

  useEffect(() => {
    const fetchUserList = async () => {
      if (!user?.id) return
      try {
        const list = type === 'manga' 
          ? await getUserMangaListCache(user.id)
          : await getUserAnimeListCache(user.id)
        
        const ids = new Set(list.map(item => 
          type === 'manga' ? item.mal_manga_id : item.mal_anime_id
        ))
        setUserListIds(ids)
      } catch (err) {
        console.error('Failed to fetch user list:', err)
      }
    }
    fetchUserList()
  }, [user?.id, type])

  const handleCardClick = (anime) => {
    setSelectedAnime(anime)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedAnime(null)
  }

  // Loading State
  if (loading) {
    return (
      <div className="rec-grid">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="rec-card">
            <div className="skeleton" style={{ aspectRatio: '2/3' }}></div>
            <div style={{ padding: '1.25rem' }}>
              <div className="skeleton" style={{ height: '1.25rem', marginBottom: '0.75rem' }}></div>
              <div className="skeleton" style={{ height: '1rem', width: '60%' }}></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Error State
  if (error) {
    return (
      <div className="empty-state">
        <div className="empty-icon" style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
          <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="#ef4444">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="empty-title">Something Went Wrong</h2>
        <p className="empty-desc">{error}</p>
      </div>
    )
  }

  // No Ratings State
  if (noRatings) {
    return (
      <div className="empty-state">
        <div className="empty-icon">
          <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        </div>
        <h2 className="empty-title">No Ratings Yet</h2>
        <p className="empty-desc">
          Start rating your {type} on MyAnimeList to get personalized {mode === 'rewatch' ? 'rewatch' : 'recommendations'}.
        </p>
      </div>
    )
  }

  // Empty State
  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">
          <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <h2 className="empty-title">No Recommendations Found</h2>
        <p className="empty-desc">
          Try adjusting your filters or adding more {type} to your list.
        </p>
      </div>
    )
  }

  // Results
  return (
    <>
      <div className="rec-grid fade-in">
        {recommendations.map((item, index) => (
          <RecommendationCard 
            key={item.id || index} 
            item={{ node: item }}
            type={type}
            onClick={handleCardClick}
            isInUserList={userListIds.has(item.id)}
          />
        ))}
      </div>

      <AnimeDetailModal
        anime={selectedAnime}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        type={type}
      />
    </>
  )
}

export default RecommendationList

