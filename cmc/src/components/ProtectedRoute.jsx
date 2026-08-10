import { useContext } from 'react'
import { Navigate } from 'react-router-dom'

import { AuthContext } from '../context/AuthContext.jsx'
import PageLoader from './PageLoader.jsx'
import Navbar from './Navbar.jsx'
import Footer from './Footer.jsx'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useContext(AuthContext)

  if (loading) {
    return <PageLoader />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  )
}