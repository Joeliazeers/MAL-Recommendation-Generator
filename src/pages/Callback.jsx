import { useEffect, useState, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LoadingOverlay } from '../components/common/Loading'

const Callback = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { handleCallback } = useAuth()
  const [error, setError] = useState(null)
  const processedRef = useRef(false) // Guard against React Strict Mode double-execution

  useEffect(() => {
    // Prevent processing multiple times (React Strict Mode in dev runs effects twice)
    if (processedRef.current) return
    processedRef.current = true
    const processCallback = async () => {
      console.log('Callback page loaded')
      console.log('URL params:', Object.fromEntries(searchParams.entries()))
      
      const code = searchParams.get('code')
      const errorParam = searchParams.get('error')

      if (errorParam) {
        console.error('OAuth error:', errorParam)
        setError(searchParams.get('error_description') || 'Authentication failed')
        return
      }

      if (!code) {
        console.error('No authorization code in URL')
        setError('No authorization code received')
        return
      }

      console.log('Got authorization code, exchanging for token...')
      
      try {
        const success = await handleCallback(code)
        console.log('handleCallback result:', success)
        if (success) {
          navigate('/', { replace: true })
        } else {
          setError('Failed to complete authentication')
        }
      } catch (e) {
        console.error('Callback error:', e)
        setError(e.message)
      }
    }

    processCallback()
  }, [searchParams, handleCallback, navigate])

  if (error) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/10 flex items-center justify-center">
            <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">
            Authentication Failed
          </h1>
          <p className="text-[var(--color-text-secondary)] mb-6">
            {error}
          </p>
          <button
            onClick={() => navigate('/')}
            className="btn-primary"
          >
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  return <LoadingOverlay text="Completing login..." />
}

export default Callback
