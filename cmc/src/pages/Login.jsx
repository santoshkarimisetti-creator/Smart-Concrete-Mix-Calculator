import { useContext, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { AuthContext } from '../context/AuthContext.jsx'
import Footer from '../components/Footer.jsx'

// ─── Eye icons ────────────────────────────────────────────────────────────────

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  )
}

function getFriendlyLoginError(error) {
  const message = (error?.message || '').toLowerCase()
  if (message.includes('email not confirmed')) return 'Please confirm your email before logging in.'
  if (message.includes('invalid login credentials')) return 'Invalid email or password.'
  return 'Invalid email or password.'
}

export default function Login() {
  const navigate = useNavigate()
  const { signIn } = useContext(AuthContext)

  const [email,        setEmail]        = useState('')
  const [password,     setPassword]     = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error,        setError]        = useState('')
  const [loading,      setLoading]      = useState(false)

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
      if (signInError) {
        console.error('Login failed:', signInError)
        setError(getFriendlyLoginError(signInError))
        return
      }
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

          {/* Password with show/hide toggle */}
          <div className="auth-field">
            <span className="auth-field__label">Password</span>
            <div className="auth-password-wrap">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="auth-field__input auth-field__input--pw"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="auth-pw-toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

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
      <Footer />
    </div>
  )
}
