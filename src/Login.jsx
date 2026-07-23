import { useState } from 'react'
import { KeyRound, LoaderCircle, Server, ShieldCheck } from 'lucide-react'
import { api, endpoint, getApiBase, setAccessToken } from './api'

export default function Login({ onAuthenticated }) {
  const [token, setToken] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    if (!token.trim() || loading) return
    setLoading(true)
    setError('')
    setAccessToken(token)
    try {
      await api(endpoint.routes)
      onAuthenticated()
    } catch (requestError) {
      setAccessToken('')
      setError(requestError.status === 401 ? 'The access token is not valid.' : requestError.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-brand"><span><Server size={22} /></span>AI Gateway</div>
        <div className="login-icon"><ShieldCheck size={28} /></div>
        <h1>Secure operations console</h1>
        <p>Enter your gateway access token to manage providers, credentials, models, and routes.</p>
        <form onSubmit={submit}>
          <label htmlFor="access-token">Gateway access token</label>
          <div className="token-input">
            <KeyRound size={17} aria-hidden="true" />
            <input
              id="access-token"
              type="password"
              value={token}
              onChange={(event) => setToken(event.target.value)}
              autoComplete="current-password"
              autoFocus
              required
            />
          </div>
          {error ? <div className="login-error" role="alert">{error}</div> : null}
          <button className="primary login-submit" disabled={loading || !token.trim()}>
            {loading ? <LoaderCircle size={17} className="spin" /> : null}
            {loading ? 'Connecting…' : 'Open console'}
          </button>
        </form>
        <small>Connected to <code>{getApiBase()}</code></small>
      </section>
    </main>
  )
}
