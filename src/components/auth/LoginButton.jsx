import { useAuth } from '../../context/AuthContext'

const LoginButton = () => {
  const { login, loading } = useAuth()

  return (
    <button 
      onClick={login} 
      disabled={loading}
      className="btn btn-primary"
    >
      {loading ? (
        <>
          <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }}></span>
          Connecting...
        </>
      ) : (
        <>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
            <polyline points="10 17 15 12 10 7" />
            <line x1="15" y1="12" x2="3" y2="12" />
          </svg>
          Login with MyAnimeList
        </>
      )}
    </button>
  )
}

export default LoginButton
