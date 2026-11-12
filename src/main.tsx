import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import Maintenance from './Maintenance'
import './styles.css'

// Set to false to bring the full site back.
const MAINTENANCE_MODE = true

if (!MAINTENANCE_MODE) document.documentElement.classList.add('gate')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {MAINTENANCE_MODE ? <Maintenance /> : <App />}
  </StrictMode>,
)
