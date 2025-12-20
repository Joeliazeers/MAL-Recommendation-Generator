import { useState, useEffect } from 'react'
import { getAnimeDetails, getMangaDetails } from '../../services/malApi'
import { useAuth } from '../../context/AuthContext'

const AnimeDetailModal = ({ anime, isOpen, onClose, type = 'anime' }) => {
  const { user } = useAuth()
  const [details, setDetails] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!isOpen || !anime?.id) return

    const fetchDetails = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = type === 'manga' 
          ? await getMangaDetails(user?.access_token, anime.id)
          : await getAnimeDetails(user?.access_token, anime.id)
        setDetails(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchDetails()
  }, [isOpen, anime?.id, user?.access_token, type])

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEsc)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const node = details || anime
  const imageUrl = node?.main_picture?.large || node?.main_picture?.medium || '/placeholder.png'
  const malUrl = type === 'anime' 
    ? `https://myanimelist.net/anime/${node?.id}`
    : `https://myanimelist.net/manga/${node?.id}`

  // Extract year from start_date
  const year = node?.start_date?.split('-')[0] || node?.start_season?.year || '—'
  
  // Age rating
  const formatRating = (rating) => {
    if (!rating) return null
    const ratingMap = {
      'g': 'G',
      'pg': 'PG',
      'pg_13': 'PG-13',
      'r': 'R-17+',
      'r+': 'R+',
      'rx': 'Rx'
    }
    return ratingMap[rating] || rating.toUpperCase()
  }

  const getTrailerUrl = () => {
    if (!details?.videos || details.videos.length === 0) return null
    const trailer = details.videos.find(v => v.url?.includes('youtube') || v.url?.includes('youtu.be'))
    if (!trailer?.url) return null
    
    const match = trailer.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)
    return match ? match[1] : null
  }

  const trailerVideoId = getTrailerUrl()

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="anime-modal" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button className="modal-close" onClick={onClose} aria-label="Close">
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Hero Section - Trailer or Image */}
        <div className="modal-hero">
          {trailerVideoId ? (
            <iframe
              className="modal-trailer"
              src={`https://www.youtube.com/embed/${trailerVideoId}?autoplay=1&mute=1&controls=1&modestbranding=1`}
              title={`${node?.title} Trailer`}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <img src={imageUrl} alt={node?.title} className="modal-hero-image" />
          )}
          <div className="modal-hero-gradient" />
          <div className="modal-hero-content">
            <h1 className="modal-title">{node?.title}</h1>
          </div>
        </div>

        {/* Content Section */}
        <div className="modal-content">
          {loading ? (
            <div className="modal-loading">
              <div className="spinner" />
              <p>Loading details...</p>
            </div>
          ) : (
            <>
              {/* Meta Info Row */}
              <div className="modal-meta">
                <span className="modal-year">{year}</span>
                {node?.num_episodes && (
                  <span className="modal-episodes">{node.num_episodes} Episodes</span>
                )}
                {node?.num_chapters && (
                  <span className="modal-episodes">{node.num_chapters} Chapters</span>
                )}
                {node?.num_volumes && (
                  <span className="modal-episodes">{node.num_volumes} Volumes</span>
                )}
                {formatRating(node?.rating) && (
                  <span className="rating-badge">{formatRating(node.rating)}</span>
                )}
                {node?.mean && (
                  <span className="modal-score">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                    {node.mean.toFixed(1)}
                  </span>
                )}
              </div>

              {/* Synopsis */}
              {node?.synopsis && (
                <div className="modal-synopsis">
                  <p>{node.synopsis}</p>
                </div>
              )}

              {/* Details Grid */}
              <div className="modal-details-grid">
                {/* Genres */}
                {node?.genres && node.genres.length > 0 && (
                  <div className="modal-detail-row">
                    <span className="modal-detail-label">Genres:</span>
                    <span className="modal-detail-value">
                      {node.genres.map(g => g.name).join(', ')}
                    </span>
                  </div>
                )}

                {/* Studios */}
                {node?.studios && node.studios.length > 0 && (
                  <div className="modal-detail-row">
                    <span className="modal-detail-label">Studio:</span>
                    <span className="modal-detail-value">
                      {node.studios.map(s => s.name).join(', ')}
                    </span>
                  </div>
                )}

                {/* Source */}
                {node?.source && (
                  <div className="modal-detail-row">
                    <span className="modal-detail-label">Source:</span>
                    <span className="modal-detail-value">
                      {node.source.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    </span>
                  </div>
                )}

                {/* Status */}
                {node?.status && (
                  <div className="modal-detail-row">
                    <span className="modal-detail-label">Status:</span>
                    <span className="modal-detail-value">
                      {node.status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="modal-actions">
                <a 
                  href={malUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                >
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  View on MAL
                </a>
                {trailerVideoId && (
                  <a 
                    href={`https://www.youtube.com/watch?v=${trailerVideoId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary"
                  >
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Watch Trailer
                  </a>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default AnimeDetailModal
