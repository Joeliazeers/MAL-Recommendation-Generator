// Loading Spinner
export const LoadingSpinner = ({ size = 40 }) => (
  <div 
    className="spinner" 
    style={{ width: size, height: size }}
  />
)

// Full page loading overlay
export const LoadingOverlay = ({ text = 'Loading...' }) => (
  <div style={{
    position: 'fixed',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1.5rem',
    background: 'var(--color-bg-primary)',
    zIndex: 1000
  }}>
    <LoadingSpinner size={48} />
    <p style={{ 
      color: 'var(--color-text-secondary)',
      fontSize: '1rem'
    }}>
      {text}
    </p>
  </div>
)

// Skeleton for cards
export const CardSkeleton = () => (
  <div className="card">
    <div className="skeleton" style={{ height: 200, marginBottom: '1rem' }}></div>
    <div className="skeleton" style={{ height: '1.25rem', width: '80%', marginBottom: '0.75rem' }}></div>
    <div className="skeleton" style={{ height: '1rem', width: '50%' }}></div>
  </div>
)

export default LoadingSpinner
