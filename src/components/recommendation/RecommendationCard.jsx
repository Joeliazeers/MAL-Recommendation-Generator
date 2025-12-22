import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { addAnimeToList, addMangaToList } from '../../services/malApi'
import { saveFeedback } from '../../services/supabase'

const RecommendationCard = ({ item, type, onClick, isInUserList = false }) => {
  const { user } = useAuth()
  const node = item.node || item
  const _listStatus = item.list_status
  
  const [addStatus, setAddStatus] = useState(null)
  const [feedback, setFeedback] = useState(null) // 'like' or 'dislike'
  
  const imageUrl = node.main_picture?.medium || node.main_picture?.large || node.image_url || '/placeholder.png'

  const handleClick = (e) => {
    e.preventDefault()
    if (onClick) {
      onClick(node)
    }
  }

  const handleAddToList = async (e) => {
    e.stopPropagation() 
    if (!user || addStatus === 'loading' || addStatus === 'success') return
    
    setAddStatus('loading')
    try {
      if (type === 'manga') {
        await addMangaToList(user.access_token, node.id, 'plan_to_read')
      } else {
        await addAnimeToList(user.access_token, node.id, 'plan_to_watch')
      }
      setAddStatus('success')
    } catch (err) {
      console.error('Failed to add to list:', err)
      setAddStatus('error')
      setTimeout(() => setAddStatus(null), 2000)
    }
  }

  const handleFeedback = async (e, feedbackType) => {
    e.stopPropagation()
    if (!user) return
    
    try {
      const newFeedback = feedback === feedbackType ? null : feedbackType
      setFeedback(newFeedback)
      
      if (newFeedback) {
        await saveFeedback(user.id, node.id, type, newFeedback)
      }
    } catch (err) {
      console.error('Failed to save feedback:', err)
    }
  }

  const showAddButton = user && !isInUserList && addStatus !== 'success'

  return (
    <div 
      className="rec-card card-interactive"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick(e)}
    >
      <img 
        src={imageUrl} 
        alt={node.title}
        className="rec-image"
        loading="lazy"
      />
      
      <div className="rec-info">
        <h3 className="rec-title">{node.title}</h3>
        
        <div className="rec-bottom">
          <div className="rec-meta" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {(node.mean || node.score) && (
              <span className="rec-score">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                {(node.mean || node.score)?.toFixed ? (node.mean || node.score).toFixed(1) : (node.mean || node.score)}
              </span>
            )}
            
            {/* Popularity Rank */}
            {(node.popularity || node.rank) && (
              <span style={{ 
                fontSize: '0.75rem', 
                color: 'var(--color-text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" opacity="0.3"/>
                  <path d="M12 6L10.5 10H6L9.5 12.5L8 17L12 14L16 17L14.5 12.5L18 10H13.5L12 6Z"/>
                </svg>
                #{node.popularity || node.rank}
              </span>
            )}
          </div>

          {/* Feedback Buttons */}
          {user && (
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              {/* Like Button */}
              <button
                onClick={(e) => handleFeedback(e, 'like')}
                style={{
                  background: feedback === 'like' ? '#000000' : 'transparent',
                  border: '2px solid',
                  borderColor: feedback === 'like' ? '#000000' : 'var(--color-border)',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  padding: 0
                }}
                title="Like this recommendation"
              >
                <svg 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill={feedback === 'like' ? '#ffffff' : 'none'}
                  stroke={feedback === 'like' ? '#ffffff' : 'currentColor'}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                </svg>
              </button>
              
              {/* Dislike Button */}
              <button
                onClick={(e) => handleFeedback(e, 'dislike')}
                style={{
                  background: feedback === 'dislike' ? '#000000' : 'transparent',
                  border: '2px solid',
                  borderColor: feedback === 'dislike' ? '#000000' : 'var(--color-border)',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  padding: 0
                }}
                title="Dislike this recommendation"
              >
                <svg 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill={feedback === 'dislike' ? '#ffffff' : 'none'}
                  stroke={feedback === 'dislike' ? '#ffffff' : 'currentColor'}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
                </svg>
              </button>
            </div>
          )}

          {(node.status || showAddButton) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
              {node.status && (
                <span 
                  className="badge"
                  style={{ 
                    backgroundColor: node.status === 'currently_airing' 
                      ? 'rgba(34, 197, 94, 0.15)' 
                      : 'rgba(59, 130, 246, 0.15)',
                    color: node.status === 'currently_airing' 
                      ? '#22c55e' 
                      : '#3b82f6',
                    border: `1px solid ${node.status === 'currently_airing' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`
                  }}
                >
                  {node.status === 'currently_airing' ? 'Ongoing' : 'Completed'}
                </span>
              )}
              
              {showAddButton && (
                <button 
                  className={`add-to-list-btn-inline ${addStatus || ''}`}
                  onClick={handleAddToList}
                  title={type === 'manga' ? 'Add to Plan to Read' : 'Add to Plan to Watch'}
                  disabled={addStatus === 'loading' || addStatus === 'success'}
                >
                  {addStatus === 'loading' ? (
                    <span className="spinner" style={{ width: 12, height: 12, borderWidth: 2 }}></span>
                  ) : addStatus === 'success' ? (
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : addStatus === 'error' ? (
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default RecommendationCard
