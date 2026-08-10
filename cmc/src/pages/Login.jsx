import { useContext, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { AuthContext } from '../context/AuthContext.jsx'

function getFriendlyLoginError(error) {
  const message = (error?.message || '').toLowerCase()
  if (message.includes('email not confirmed')) return 'Please confirm your email before logging in.'
  if (message.includes('invalid login credentials')) return 'Invalid email or password.'
  return 'Invalid email or password.'
}

export default function Login() {
  const navigate = useNavigate()
  const { signIn } = useContext(AuthContext)

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  const validateForm = () => {
    if (!email.trim()) return 'Please enter your email.'
    if (!password)     return 'Please enter your password.'
    return ''
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (loading) return
    setError('')
    const validationError = validateForm()
    if (validationError) { setError(validationError); return }
    setLoading(true)
    try {
      const { error: signInError } = await signIn(email.trim(), password)
      if (signInError) { console.error('Login failed:', signInError); setError(getFriendlyLoginError(signInError)); return }
      navigate('/home', { replace: true })
    } catch (err) {
      console.error('Login failed:', err)
      setError('Invalid email or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card card">
        <div className="auth-card__brand">
          <span className="auth-brand-icon" aria-hidden="true">🏗️</span>
          <p className="eyebrow">Smart Concrete Mix Calculator</p>
        </div>

        <div className="auth-card__header">
          <h1 className="auth-card__title">Welcome back</h1>
          <p className="auth-card__sub">Sign in to access your mix designs</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <label className="auth-field">
            <span className="auth-field__label">Email address</span>
            <input
              id="email"
              type="email"
              className="auth-field__input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </label>

          <label className="auth-field">
            <span className="auth-field__label">Password</span>
            <input
              id="password"
              type="password"
              className="auth-field__input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </label>

          {error ? (
            <p className="auth-error" role="alert">{error}</p>
          ) : null}

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="auth-switch">
          New here?{' '}
          <Link to="/signup" className="auth-switch__link">Create an account</Link>
        </p>
      </div>
    </div>
  )
}
