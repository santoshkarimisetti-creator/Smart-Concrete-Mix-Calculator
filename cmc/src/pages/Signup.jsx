import { useContext, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { AuthContext } from '../context/AuthContext.jsx'

export default function Signup() {
  const navigate = useNavigate()
  const { signUp } = useContext(AuthContext)

  const [fullName,        setFullName]        = useState('')
  const [email,           setEmail]           = useState('')
  const [password,        setPassword]        = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
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
      if (signUpError) { console.error('Signup failed:', signUpError); setError('Unable to create your account.'); return }
      if (data?.session) { navigate('/home', { replace: true }); return }
      setMessage('Account created! Check your email to confirm before signing in.')
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
          <label className="auth-field">
            <span className="auth-field__label">Full Name</span>
            <input
              id="fullName"
              type="text"
              className="auth-field__input"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Santosh Kumar"
              autoComplete="name"
              required
            />
          </label>

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
              autoComplete="new-password"
              required
            />
          </label>

          <label className="auth-field">
            <span className="auth-field__label">Confirm Password</span>
            <input
              id="confirmPassword"
              type="password"
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
          <Link to="/login" className="auth-switch__link">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
