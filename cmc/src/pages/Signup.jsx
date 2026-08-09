import { useContext, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { AuthContext } from '../context/AuthContext.jsx'

export default function Signup() {
  const navigate = useNavigate()
  const { signUp } = useContext(AuthContext)

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const validateForm = () => {
    if (!fullName.trim()) {
      return 'Full name is required.'
    }

    if (!email.trim()) {
      return 'Email is required.'
    }

    if (!password) {
      return 'Password is required.'
    }

    if (!confirmPassword) {
      return 'Confirm password is required.'
    }

    if (password !== confirmPassword) {
      return 'Passwords must match.'
    }

    return ''
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (loading) {
      return
    }

    setError('')
    setMessage('')

    const validationError = validateForm()

    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)

    try {
      const { data, error: signUpError } = await signUp(
        email.trim(),
        password,
        fullName.trim()
      )

      if (signUpError) {
        console.error('Signup failed:', signUpError)
        setError('Unable to create your account.')
        return
      }

      if (data?.session) {
        navigate('/dashboard', { replace: true })
        return
      }

      setMessage('Signup successful. Please check your email to confirm your account.')
    } catch (error) {
      console.error('Signup failed:', error)
      setError('Unable to create your account.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main>
      <h1>Create Account</h1>

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="fullName">Full Name</label>
          <input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
          />
        </div>

        <div>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>

        <div>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>

        <div>
          <label htmlFor="confirmPassword">Confirm Password</label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
        </div>

        {error ? <p role="alert">{error}</p> : null}
        {message ? <p role="status">{message}</p> : null}

        <button type="submit" disabled={loading}>
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>

      <p>
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </main>
  )
}
