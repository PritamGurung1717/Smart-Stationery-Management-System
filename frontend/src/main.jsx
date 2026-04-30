import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import axios from 'axios'
import 'bootstrap/dist/css/bootstrap.min.css'
import './index.css'
import './App.css'
import App from './App'

// ── Sanitize stored token on every page load ──────────────────
const rawToken = localStorage.getItem('token') || ''
if (rawToken && /^Bearer\s+/i.test(rawToken)) {
  localStorage.setItem('token', rawToken.replace(/^Bearer\s+/i, '').trim())
}

// Also check if token is "null" or "undefined" string and clear it
if (rawToken === 'null' || rawToken === 'undefined' || rawToken === '') {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}

// ── Global axios request interceptor ─────────────────────────
// Always attach the clean token; strip any accidental "Bearer " prefix
axios.interceptors.request.use(config => {
  let token = localStorage.getItem('token') || ''
  
  // Validate token before using
  if (token && token !== 'null' && token !== 'undefined') {
    token = token.replace(/^Bearer\s+/i, '').trim()
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
  }
  
  return config
})

// ── Global axios response interceptor ────────────────────────
// On 401 with jwt malformed → clear storage and redirect to login
// BUT: Be more careful to avoid clearing valid sessions
axios.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      const msg = err.response?.data?.message || ''
      const token = localStorage.getItem('token')
      
      // Only clear if we have a token AND it's actually malformed
      // Don't clear on simple "no token" or "access denied" errors
      if (token && token !== 'null' && token !== 'undefined') {
        if (msg.toLowerCase().includes('malformed') || 
            msg.toLowerCase().includes('invalid token format') ||
            msg.toLowerCase().includes('jsonwebtokenerror')) {
          console.warn('🔴 Token is malformed, clearing auth data')
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          window.location.href = '/'
        }
      }
    }
    return Promise.reject(err)
  }
)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)