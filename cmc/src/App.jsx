import { useContext } from 'react'
import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom'

import './App.css'

import Login from './pages/Login'
import Signup from './pages/Signup'
import Home from './pages/Home'
import Calculator from './pages/Calculator'
import History from './pages/History'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthContext } from './context/AuthContext.jsx'
import PageLoader from './components/PageLoader.jsx'

// Root redirect: authenticated → /home, unauthenticated → /login
function RootRedirect() {
  const { user, loading } = useContext(AuthContext)
  if (loading) return <PageLoader />
  return <Navigate to={user ? '/home' : '/login'} replace />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Root → smart redirect */}
        <Route path="/" element={<RootRedirect />} />

        {/* Auth pages */}
        <Route path="/login"  element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Legacy /dashboard alias → /home */}
        <Route path="/dashboard" element={<Navigate to="/home" replace />} />

        {/* Protected pages */}
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/calculator"
          element={
            <ProtectedRoute>
              <Calculator />
            </ProtectedRoute>
          }
        />
        {/* Keep /history route alive for Transfer navigation */}
        <Route
          path="/history"
          element={
            <ProtectedRoute>
              <History />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App