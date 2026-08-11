import { useContext, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { AuthContext } from '../context/AuthContext.jsx'
import Footer from '../components/Footer.jsx'

// ─── Eye icons (inline SVG, no dependency) ───────────────────────────────────

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

export default function Signup() {
  const navigate = useNavigate()
  const { signUp } = useContext(AuthContext)

  const [fullName,        setFullName]        = useState('')
  const [email,           setEmail]           = useState('')
  const [password,        setPassword]        = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword,    setShowPassword]    = useState(false)
  const [error,           setError]           = useState('')
  const [message,         setMessage]         = useState('')
  const [loading,         setLoading]         = useState(false)

  const validateForm = () => {
    if (!fullName.trim())  return 'Full name is required.'
    if (!email.trim())     return 'Email is required.'
    if (!password)         return 'Password is required.'
    if (!confirmPassword)  return 'Confirm password is required.'
    if (password !== confirmPassword) return 'Passwords must match.'
    return ''
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (loading) return
    setError(''); setMessage('')
    const validationError = validateForm()
    if (validationError) { setError(validationError); return }
    setLoading(true)
    try {
      const { data, error: signUpError } = await signUp(email.trim(), password, fullName.trim())
      if (signUpError) {
        console.error('Signup failed:', signUpError)
        setError('Unable to create your account.')
        return
      }
      if (data?.session) { navigate('/home', { replace: true }); return }
      setMessage('Account created successfully. Please check your email to verify your account.')
    } catch (err) {
      console.error('Signup failed:', err)
      setError('Unable to create your account.')
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
          <h1 className="auth-card__title">Create account</h1>
          <p className="auth-card__sub">Start calculating IS 10262 mix designs</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {/* Full Name */}
          <label className="auth-field">
            <span className="auth-field__label">Full Name</span>
            <input
              id="fullName"
              type="text"
              className="auth-field__input"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              autoComplete="name"
              required
            />
          </label>

          {/* Email */}
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
                autoComplete="new-password"
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
            {/* Password recovery warning */}
            <p className="auth-pw-warning">
              ⚠ Important: Password recovery is not available yet. Make sure you remember
              your password before creating your account.
            </p>
          </div>

          {/* Confirm Password */}
          <label className="auth-field">
            <span className="auth-field__label">Confirm Password</span>
            <input
              id="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              className="auth-field__input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              required
            />
          </label>

          {error   ? <p className="auth-error"   role="alert"  >{error}</p>   : null}
          {message ? <p className="auth-success" role="status" >{message}</p> : null}

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? 'Creating Account…' : 'Create Account'}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account?{' '}
          <Link to="/login" className="auth-switch__link">Log in</Link>
        </p>
      </div>
      <Footer />
    </div>
  )
}
