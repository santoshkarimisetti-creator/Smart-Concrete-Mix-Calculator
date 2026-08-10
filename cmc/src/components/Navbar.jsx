import { useContext, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'

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
      <Link className="topbar__brand" to={user ? '/home' : '/login'}>
        <span className="topbar__brand-icon" aria-hidden="true">🏗️</span>
        Smart Concrete Mix
      </Link>

      <div className="topbar__actions">
        {!user ? (
          <>
            <Link className="topbar__link" to="/login">Login</Link>
            <Link className="topbar__link topbar__link--primary" to="/signup">Sign Up</Link>
          </>
        ) : (
          <>
            <NavLink
              className={({ isActive }) =>
                isActive ? 'topbar__link topbar__link--active' : 'topbar__link'
              }
              to="/home"
            >
              Home
            </NavLink>
            <NavLink
              className={({ isActive }) =>
                isActive ? 'topbar__link topbar__link--active' : 'topbar__link'
              }
              to="/calculator"
            >
              New Mix Design
            </NavLink>
            <button
              className="topbar__button"
              type="button"
              onClick={handleLogout}
              disabled={loading}
            >
              {loading ? 'Logging out…' : 'Logout'}
            </button>
          </>
        )}
      </div>
    </nav>
  )
}
