import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { addAnimeToList, addMangaToList } from '../../services/malApi'

const RecommendationCard = ({ item, type, onClick, isInUserList = false }) => {
  const { user } = useAuth()
  const node = item.node || item
  const listStatus = item.list_status
  
  const [addStatus, setAddStatus] = useState(null) // null, 'loading', 'success', 'error'
  
  const imageUrl = node.main_picture?.medium || node.main_picture?.large || node.image_url || '/placeholder.png'

  const handleClick = (e) => {
    e.preventDefault()
    if (onClick) {
      onClick(node)
    }
  }

  const handleAddToList = async (e) => {
    e.stopPropagation() // Prevent card click
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

  // Don't show add button if already in user's list
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
          <div className="rec-meta">
            {(node.mean || node.score) && (
              <span className="rec-score">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                {(node.mean || node.score)?.toFixed ? (node.mean || node.score).toFixed(1) : (node.mean || node.score)}
              </span>
            )}
          </div>

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

