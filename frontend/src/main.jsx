import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import App from './App.jsx'
import { Toaster } from 'react-hot-toast'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3500,
        style: {
          background: '#020817',
          color: '#e5e7eb',
          border: '1px solid rgba(0,255,255,0.25)',
        },
      }}
    />
  </StrictMode>,
)
