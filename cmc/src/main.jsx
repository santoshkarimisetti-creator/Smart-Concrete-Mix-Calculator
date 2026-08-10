import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'

// ── Global: prevent mouse-wheel from accidentally changing number-input values.
// The input is blurred the moment a wheel event fires on it while it is focused.
// page scrolling is unaffected because the listener is passive (no preventDefault).
document.addEventListener(
  'wheel',
  () => {
    const el = document.activeElement
    if (el && el.type === 'number') {
      el.blur()
    }
  },
  { passive: true }
)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)
