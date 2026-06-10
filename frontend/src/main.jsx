import { StrictMode, useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { DropdownProvider } from './context/DropdownContext'
import Preloader from './components/Preloader'
import App from './App.jsx'
import branding from './config/branding'
import './index.css'

// Set dynamic document metadata from branding configuration
document.title = branding.metadata.title

function MainApp() {
  const [isLoading, setIsLoading] = useState(true)

  const handlePreloaderComplete = () => {
    setIsLoading(false)
  }

  return (
    <>
      <Preloader onComplete={handlePreloaderComplete} />
      {!isLoading && <App />}
    </>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <DropdownProvider>
          <MainApp />
        </DropdownProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
