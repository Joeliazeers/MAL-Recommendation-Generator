import { useState, useRef, useEffect } from 'react'

const GenreFilter = ({ genres, selectedGenres = [], onSelect }) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleToggleGenre = (genreId) => {
    const newSelection = selectedGenres.includes(genreId)
      ? selectedGenres.filter(id => id !== genreId)
      : [...selectedGenres, genreId]
    onSelect(newSelection)
  }

  const handleRemoveGenre = (genreId, e) => {
    e.stopPropagation()
    onSelect(selectedGenres.filter(id => id !== genreId))
  }

  const getGenreName = (genreId) => {
    const genre = genres.find(g => g.id === genreId || g.id === parseInt(genreId))
    return genre?.name || genreId
  }

  return (
    <div className="genre-filter" ref={dropdownRef}>
      {/* Selected genres display */}
      {selectedGenres.length > 0 && (
        <div className="selected-genres">
          {selectedGenres.map(genreId => (
            <span key={genreId} className="genre-tag">
              {getGenreName(genreId)}
              <button 
                className="genre-tag-remove"
                onClick={(e) => handleRemoveGenre(genreId, e)}
                aria-label={`Remove ${getGenreName(genreId)}`}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Dropdown trigger */}
      <div 
        className="genre-dropdown-trigger input"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span style={{ color: selectedGenres.length === 0 ? 'var(--color-text-muted)' : 'var(--color-text-primary)' }}>
          {selectedGenres.length === 0 
            ? 'Select Genres...' 
            : `${selectedGenres.length} genre${selectedGenres.length > 1 ? 's' : ''} selected`
          }
        </span>
        <svg 
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
          style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="genre-dropdown-menu">
          {genres.map(genre => (
            <label 
              key={genre.id} 
              className={`genre-option ${selectedGenres.includes(genre.id) ? 'selected' : ''}`}
            >
              <input
                type="checkbox"
                checked={selectedGenres.includes(genre.id)}
                onChange={() => handleToggleGenre(genre.id)}
              />
              <span className="genre-checkbox">
                {selectedGenres.includes(genre.id) && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M5 12l5 5L20 7" />
                  </svg>
                )}
              </span>
              {genre.name}
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

export default GenreFilter
