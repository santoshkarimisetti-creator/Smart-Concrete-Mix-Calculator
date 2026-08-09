import { useContext, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { AuthContext } from '../context/AuthContext.jsx'

function getFriendlyLoginError(error) {
  const message = error?.message || ''
  const normalizedMessage = message.toLowerCase()

  if (normalizedMessage.includes('email not confirmed')) {
    return 'Please confirm your email before logging in.'
  }

  if (normalizedMessage.includes('invalid login credentials')) {
    return 'Invalid email or password.'
  }

  return 'Invalid email or password.'
}

export default function Login() {
  const navigate = useNavigate()
  const { signIn } = useContext(AuthContext)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const validateForm = () => {
    if (!email.trim()) {
      return 'Please enter your email.'
    }

    if (!password) {
      return 'Please enter your password.'
    }

    return ''
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (loading) {
      return
    }

    setError('')

    const validationError = validateForm()

    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)

    try {
      const { error: signInError } = await signIn(email.trim(), password)

      if (signInError) {
        console.error('Login failed:', signInError)
        setError(getFriendlyLoginError(signInError))
        return
      }

      navigate('/dashboard', { replace: true })
    } catch (error) {
      console.error('Login failed:', error)
      setError('Invalid email or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main>
      <h1>Login</h1>

      <form onSubmit={handleSubmit}>
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

        {error ? <p role="alert">{error}</p> : null}

        <button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <p>
        <Link to="/signup">Create an account</Link>
      </p>
    </main>
  )
}
