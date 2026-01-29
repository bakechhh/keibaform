import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { HorseMarksProvider } from './contexts/HorseMarksContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HorseMarksProvider>
      <App />
    </HorseMarksProvider>
  </StrictMode>,
)
