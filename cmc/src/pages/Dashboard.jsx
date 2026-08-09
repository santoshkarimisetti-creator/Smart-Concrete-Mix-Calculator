import { useContext, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { AuthContext } from '../context/AuthContext.jsx'

export default function Dashboard() {
  const navigate = useNavigate()
  const { user, signOut } = useContext(AuthContext)
  const [loading, setLoading] = useState(false)

  const fullName = user?.user_metadata?.full_name || 'User'

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
    <main className="page-shell">
      <section className="dashboard-card card">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h1>Smart Concrete Mix Calculator</h1>
          <p className="dashboard-card__name">Welcome, {fullName}</p>
          <p>Email: {user?.email || ''}</p>
        </div>

        <div className="dashboard-actions">
          <Link to="/calculator">New Mix Design</Link>
          <Link to="/history">Calculation History</Link>
          <button type="button" onClick={handleLogout} disabled={loading}>
            {loading ? 'Logging out...' : 'Logout'}
          </button>
        </div>
      </section>
    </main>
  )
}
