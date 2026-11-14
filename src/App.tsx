import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { ExperienceStrip } from './components/ExperienceCard'
import { Player, type PlayerHandle } from './components/Player'
import { tracks } from './tracks'

const BIO = 'Software developer with a passion for technology, the outdoors, and spending quality time with friends and family.'
const WORDS = BIO.split(' ')
const INTRO_CHARS = Array.from("hi, i'm noah")
const GITHUB = 'https://github.com/cendxr'
const FOOTAGE = 'https://pixabay.com/videos/lake-aurora-borealis-northern-lights-176989/'

const positions = [
  {
    name: 'Fluid Compact', role: 'Team Leader',
    description: 'Fluid Compact is a design community focused on high-quality graphics, liveries, and general design work. It offers ready-made releases and custom orders, with upcoming bundles bringing together coordinated designs and packages.',
    href: 'https://discord.gg/Ze95NPg57m', logoSrc: '/fluid-compact.png',
  },
  {
    name: 'Collective', role: 'Team',
    description: 'Collective is a Discord security platform focused on helping communities guard against abuse and maintain safer, well-managed servers.',
    href: 'https://discord.gg/GT9WPxm689', logoSrc: '/collective.png',
  },
  {
    name: 'Alaska Roleplay', role: 'Owner',
    description: 'Alaska Roleplay is a community focused on delivering a high-quality roleplay experience, bringing players together to create engaging stories and meaningful interactions.',
    href: 'https://discord.gg/alaskarp', logoSrc: '/alaska-roleplay.png',
  },
]

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function App() {
  const photoRef = useRef<HTMLSpanElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const playerRef = useRef<PlayerHandle>(null)
  const openRef = useRef(false)
  const enteredRef = useRef(false)
  const [ready, setReady] = useState(false)
  const [entered, setEntered] = useState(false)
  const [open, setOpen] = useState(false)
  const firstTrack = tracks[0]

  useLayoutEffect(() => {
    const root = document.documentElement
    root.classList.toggle('gate', !entered)
    root.classList.toggle('set', ready)
    root.classList.toggle('play', entered && !prefersReducedMotion())
    root.classList.toggle('open', open)
    openRef.current = open
    enteredRef.current = entered
  }, [entered, ready, open])

  // While the gate is up, park the photo at screen centre so it can "land" in the wordmark.
  useEffect(() => {
    let cancelled = false

    function placePhoto() {
      const photo = photoRef.current
      if (!photo || enteredRef.current) return
      const previousTransform = photo.style.transform
      photo.style.transform = 'none'
      const rect = photo.getBoundingClientRect()
      photo.style.transform = previousTransform
      const fx = document.documentElement.clientWidth / 2 - (rect.left + rect.width / 2)
      const fy = document.documentElement.clientHeight / 2 - (rect.top + rect.height / 2)
      photo.style.setProperty('--fx', `${fx}px`)
      photo.style.setProperty('--fy', `${fy}px`)
      photo.style.setProperty('--fs', '.78')
    }

    function revealIntro() {
      if (cancelled || enteredRef.current) return
      placePhoto()
      setReady(true)
    }

    Promise.race([
      document.fonts.ready,
      new Promise((resolve) => window.setTimeout(resolve, 1200)),
    ]).then(revealIntro)
    document.fonts.ready.then(() => {
      if (!cancelled && !enteredRef.current) placePhoto()
    })

    function onResize() {
      if (!cancelled) placePhoto()
    }

    window.addEventListener('resize', onResize)
    return () => {
      cancelled = true
      window.removeEventListener('resize', onResize)
    }
  }, [])

  useEffect(() => {
    if (!entered) return
    const reveal = window.setTimeout(() => document.documentElement.classList.add('revealed'), 4000)
    // Move focus off the closing gate into the page without drawing a focus ring.
    window.requestAnimationFrame(() => {
      titleRef.current?.focus({ preventScroll: true })
    })
    return () => window.clearTimeout(reveal)
  }, [entered])

  // Pointer tilt on the photo, eased so it follows rather than snaps.
  useEffect(() => {
    if (!entered) return
    const fine = window.matchMedia('(pointer: fine) and (prefers-reduced-motion: no-preference)')
    const img = imgRef.current
    if (!fine.matches || !img) return
    let tx = 0
    let ty = 0
    let x = 0
    let y = 0
    let frame = 0

    function step() {
      x += (tx - x) * 0.08
      y += (ty - y) * 0.08
      img!.style.setProperty('--ry', `${(22 * x).toFixed(2)}deg`)
      img!.style.setProperty('--rx', `${(-22 * y).toFixed(2)}deg`)
      document.documentElement.style.setProperty('--px', x.toFixed(3))
      document.documentElement.style.setProperty('--py', y.toFixed(3))
      frame = Math.abs(tx - x) + Math.abs(ty - y) > 0.001 ? requestAnimationFrame(step) : 0
    }

    function onMove(event: PointerEvent) {
      tx = event.clientX / window.innerWidth - 0.5
      ty = event.clientY / window.innerHeight - 0.5
      if (!frame) frame = requestAnimationFrame(step)
    }

    window.addEventListener('pointermove', onMove)
    return () => {
      window.removeEventListener('pointermove', onMove)
      cancelAnimationFrame(frame)
    }
  }, [entered])

  // Wheel, swipe, and keyboard open or close the experience drawer.
  useEffect(() => {
    if (!entered) return
    let lockedUntil = 0

    function toggle(next: boolean) {
      if (next === openRef.current || Date.now() < lockedUntil) return
      openRef.current = next
      lockedUntil = Date.now() + 800
      setOpen(next)
    }

    function onWheel(event: WheelEvent) {
      if (event.defaultPrevented || Math.abs(event.deltaY) <= 4) return
      if ((event.target as Element | null)?.closest?.('.player')) return
      toggle(event.deltaY > 0)
    }

    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') toggle(false)
    }

    let startY = 0
    let startScroll = 0
    function onTouchStart(event: TouchEvent) {
      startY = event.touches[0].clientY
      startScroll = window.scrollY
    }
    function onTouchEnd(event: TouchEvent) {
      if ((event.target as Element | null)?.closest?.('.player')) return
      const delta = startY - event.changedTouches[0].clientY
      if (Math.abs(delta) > 40 && (delta > 0 || startScroll <= 0)) toggle(delta > 0)
    }

    window.addEventListener('wheel', onWheel, { passive: true })
    window.addEventListener('keydown', onKey)
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchend', onTouchEnd)
    return () => {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [entered])

  function enter(withMusic: boolean) {
    if (enteredRef.current) return
    enteredRef.current = true
    if (withMusic) playerRef.current?.play()
    const img = imgRef.current
    if (img) {
      const { a, b } = new DOMMatrix(getComputedStyle(img).transform)
      const angle = (Math.atan2(b, a) * 180) / Math.PI
      img.style.setProperty('--a', `${(angle + 360) % 360}deg`)
    }
    setEntered(true)
  }

  return (
    <main className="site-shell">
      <section className="intro-gate" aria-label="Welcome" aria-hidden={entered} inert={entered || undefined}>
        <div className="intro-inner">
          <p className="intro-kicker">yonoah</p>
          <h1 className="intro-title" aria-label="hi, i'm noah">
            {INTRO_CHARS.map((char, index) => (
              <span key={index} className="intro-char" style={{ '--c': index } as CSSProperties} aria-hidden="true">
                {char === ' ' ? '\u00a0' : char}
              </span>
            ))}
          </h1>
          <p className="intro-sub">A little about me and the communities I'm part of.</p>
          <div className="intro-actions">
            <button className="intro-action intro-action-primary" type="button" onClick={() => enter(false)} disabled={!ready || entered}>
              Enter
              <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h12m-5-5 5 5-5 5" /></svg>
            </button>
            <button className="intro-action" type="button" onClick={() => enter(true)} disabled={!ready || entered}>
              <span className="intro-eq" aria-hidden="true"><i /><i /><i /></span>
              Enter with music
            </button>
          </div>
        </div>
        <p className="intro-hint" aria-hidden="true">
          {firstTrack ? <>Soundtrack · {firstTrack.title} — {firstTrack.artist}</> : 'Music is optional'}
        </p>
      </section>

      <div className="backdrop" aria-hidden="true">
        <video className="background-video" autoPlay loop muted playsInline preload="auto" poster="/media/aurora-lake.jpg" src="/media/aurora-lake.mp4" />
        <div className="backdrop-shade" />
      </div>
      <div className="ambient" aria-hidden="true" />

      <nav className="nav" inert={!entered || undefined}>
        <Player ref={playerRef} tracks={tracks} visible={entered} />
        <a className="nav-link" href={GITHUB} target="_blank" rel="noreferrer">
          <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8Z" /></svg>
          <span>GitHub</span>
        </a>
      </nav>

      <section className="hero" aria-labelledby="page-title" inert={!entered || undefined}>
        <div className="mark">
          <h1 id="page-title" className="wordmark" aria-label="Noah" ref={titleRef} tabIndex={-1}>
            <span className="ch" style={{ '--d': '0s', '--sx': '0.5em' } as CSSProperties}>n</span>
            <span className="photo" ref={photoRef}>
              <img ref={imgRef} src="/noah-avatar.webp" alt="Noah" width={384} height={384} decoding="async" />
            </span>
            <span className="ch" style={{ '--d': '0.05s', '--sx': '-0.5em' } as CSSProperties}>a</span>
            <span className="ch" style={{ '--d': '0.1s', '--sx': '-0.95em' } as CSSProperties}>h</span>
          </h1>
          <p className="bio">
            <span className="w hand" style={{ '--i': 0 } as CSSProperties}>👋</span>
            {WORDS.map((word, index) => (
              <span key={`${word}-${index}`}>
                {' '}
                <span className="w" style={{ '--i': index + 1 } as CSSProperties}>{word}</span>
              </span>
            ))}
          </p>
        </div>
      </section>

      <button
        ref={toggleRef}
        className="toggle experience-toggle"
        type="button"
        aria-expanded={open}
        aria-controls="experience-panel"
        aria-label={`${open ? 'hide' : 'show'} experience`}
        onClick={() => setOpen((value) => !value)}
        tabIndex={entered ? 0 : -1}
      >
        <span className="toggle-label" aria-hidden="true">{open ? 'Close' : 'Experience'}</span>
        <svg className="chevron" viewBox="0 0 16 16" width="18" height="18" aria-hidden="true" focusable="false">
          <path d="M3.5 6 8 10.5 12.5 6" />
        </svg>
      </button>

      <div className="more" inert={!open || undefined}>
        <div>
          <section id="experience-panel" className="strip" aria-label="Experience">
            <div className="positions">
              {positions.map((position, index) => <ExperienceStrip key={position.name} index={index} {...position} />)}
            </div>
            <footer className="strip-foot">
              <span>© {new Date().getFullYear()} Noah</span>
              <a href={FOOTAGE} target="_blank" rel="noreferrer">Background footage · Pixabay</a>
            </footer>
          </section>
        </div>
      </div>
    </main>
  )
}

export default App
