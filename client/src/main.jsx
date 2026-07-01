import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { SpeechProvider } from './context/SpeechContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SpeechProvider>
      <App />
    </SpeechProvider>
  </StrictMode>,
)
