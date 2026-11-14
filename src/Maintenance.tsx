import { useEffect, useState } from 'react'
import { MAINTENANCE_UNTIL } from './config'

const DEADLINE = Date.parse(MAINTENANCE_UNTIL)
const pad = (n: number) => String(n).padStart(2, '0')

function format(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return `${pad(h)}:${pad(m)}:${pad(s)}`
}

export default function Maintenance() {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = window.setInterval(() => {
      const t = Date.now()
      setNow(t)
      if (t >= DEADLINE) {
        window.clearInterval(id)
        window.location.reload()
      }
    }, 1000)
    return () => window.clearInterval(id)
  }, [])

  const remaining = DEADLINE - now

  return (
    <main className="maintenance">
      <div className="maintenance-inner">
        <h1>Updating in progress</h1>
        <p className="maintenance-old">
          <s>
            I'm currently making improvements to the website. Thank you for your patience and
            understanding while these updates are underway. There is currently no estimated
            completion time.
          </s>
        </p>
        <div className="maintenance-update">
          <span className="maintenance-label">Update</span>
          <p>
            Thanks for the patience. I'm super sorry for the wait, and it'll be finished in 24
            hours.
          </p>
          <div className="maintenance-countdown" role="timer" aria-live="off" aria-label="Time remaining">
            {format(remaining)}
          </div>
        </div>
      </div>
    </main>
  )
}
