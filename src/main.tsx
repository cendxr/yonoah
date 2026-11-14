import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import Maintenance from './Maintenance'
import { MAINTENANCE_UNTIL } from './config'
import './styles.css'

// Set to false to bring the full site back for everyone.
const MAINTENANCE_MODE = true

// Maintenance only applies until the countdown deadline (src/config.ts).
const maintenanceActive = () => MAINTENANCE_MODE && Date.now() < Date.parse(MAINTENANCE_UNTIL)

// SHA-256 of the private preview key (the key itself is not stored in the code).
const PREVIEW_HASH = 'bb86831f939e001a4e6532e23e21682f904e9d8507e6c9471648a9c265529745'
const PREVIEW_STORAGE = 'yonoah-preview'

async function sha256(text: string) {
  const data = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(data), (b) => b.toString(16).padStart(2, '0')).join('')
}

async function hasPreviewAccess() {
  const url = new URL(window.location.href)
  const param = url.searchParams.get('preview')
  if (param !== null) {
    url.searchParams.delete('preview')
    window.history.replaceState(null, '', url.pathname + url.search + url.hash)
    if (param === 'off') localStorage.removeItem(PREVIEW_STORAGE)
    else localStorage.setItem(PREVIEW_STORAGE, param)
  }
  const saved = localStorage.getItem(PREVIEW_STORAGE)
  if (!saved || !crypto.subtle) return false
  return (await sha256(saved)) === PREVIEW_HASH
}

async function start() {
  const showSite = !maintenanceActive() || (await hasPreviewAccess().catch(() => false))
  if (showSite) document.documentElement.classList.add('gate')
  createRoot(document.getElementById('root')!).render(
    <StrictMode>{showSite ? <App /> : <Maintenance />}</StrictMode>,
  )
}

void start()
