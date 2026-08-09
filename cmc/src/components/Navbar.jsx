import { useContext, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { AuthContext } from '../context/AuthContext.jsx'

export default function Navbar() {
  const navigate = useNavigate()
  const { user, signOut } = useContext(AuthContext)
  const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
    setLoading(true)

    try {
      await signOut()
    } finally {
      setLoading(false)
      navigate('/login', { replace: true })
    }
  }

  return (
    <nav className="topbar card">
      <div className="topbar__brand">Smart Concrete Mix Calculator</div>

      <div className="topbar__actions">
        {!user ? (
          <>
            <Link className="topbar__link" to="/login">
              Login
            </Link>
            <Link className="topbar__link" to="/signup">
              Sign Up
            </Link>
          </>
        ) : (
          <>
            <Link className="topbar__link" to="/dashboard">
              Dashboard
            </Link>
            <Link className="topbar__link" to="/calculator">
              New Mix Design
            </Link>
            <Link className="topbar__link" to="/history">
              History
            </Link>
            <button className="topbar__button" type="button" onClick={handleLogout} disabled={loading}>
              {loading ? 'Logging out...' : 'Logout'}
            </button>
          </>
        )}
      </div>
    </nav>
  )
}
