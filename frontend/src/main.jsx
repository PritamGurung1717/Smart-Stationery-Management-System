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

// ── Global axios request interceptor ─────────────────────────
// Always attach the clean token; strip any accidental "Bearer " prefix
axios.interceptors.request.use(config => {
  let token = localStorage.getItem('token') || ''
  token = token.replace(/^Bearer\s+/i, '').trim()
  if (token) config.headers['Authorization'] = `Bearer ${token}`
  return config
})

// ── Global axios response interceptor ────────────────────────
// On 401 with jwt malformed → clear storage and redirect to login
axios.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      const msg = err.response?.data?.message || ''
      if (msg.toLowerCase().includes('malformed') || msg.toLowerCase().includes('invalid token')) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.href = '/login'
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