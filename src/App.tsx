import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { ExperienceStrip } from './components/ExperienceCard'

const BIO = 'i am an american college student. i love the outdoors, spending time with friends and family, and developing software'
const WORDS = BIO.split(' ')
const SONG_END_SECONDS = 90
const SONG_FADE_START_SECONDS = 87
const SONG_FADE_IN_SECONDS = 1.5

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
]

const projects = [
  { name: 'CaptureMac', description: 'The best game clipping for Mac.', href: 'https://capturemac.dev/', logoSrc: 'https://www.whoisjonah.xyz/media/projects/capturemac.png' },
  { name: 'Oceanpoint Utilities', description: 'The bot that powers Oceanpoint Roleplay, an ERLC server with over 10,000 members.', href: 'https://discord.gg/oceanpoint', logoSrc: 'https://www.whoisjonah.xyz/media/projects/oceanpoint.png' },
  { name: 'Image Editor', description: 'Easy & automatic editing for Roblox screenshots.', href: 'https://editor.whoisjonah.xyz/', logoSrc: 'https://www.whoisjonah.xyz/media/projects/image-editor.png' },
  { name: 'Question of the Day', description: 'A simple user app to gain a unique QoTD in any server.', href: 'https://discord.com/oauth2/authorize?client_id=1542174618893426718', logoSrc: 'https://www.whoisjonah.xyz/media/projects/qotd.webp' },
]

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function App() {
  const photoRef = useRef<HTMLSpanElement>(null)
  const recordRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)
  const openRef = useRef(false)
  const enteredRef = useRef(false)
  const [ready, setReady] = useState(false)
  const [entered, setEntered] = useState(false)
  const [open, setOpen] = useState(false)
  const [playing, setPlaying] = useState(false)

  useLayoutEffect(() => {
    const root = document.documentElement
    root.classList.toggle('gate', !entered)
    root.classList.toggle('set', ready)
    root.classList.toggle('play', entered && !prefersReducedMotion())
    root.classList.toggle('open', open)
    openRef.current = open
    enteredRef.current = entered
  }, [entered, ready, open])

  useEffect(() => {
    let cancelled = false

    function placeLabel() {
      const photo = photoRef.current
      const record = recordRef.current
      if (!photo || !record || enteredRef.current) return
      photo.style.animation = 'none'
      photo.style.transform = 'none'
      const rect = photo.getBoundingClientRect()
      photo.style.animation = ''
      photo.style.transform = ''
      const fx = document.documentElement.clientWidth / 2 - (rect.left + rect.width / 2)
      const fy = document.documentElement.clientHeight / 2 - (rect.top + rect.height / 2)
      const fs = rect.width > 0 ? (0.64 * record.offsetWidth) / rect.width : 1
      photo.style.setProperty('--fx', `${fx}px`)
      photo.style.setProperty('--fy', `${fy}px`)
      photo.style.setProperty('--fs', fs.toFixed(3))
    }

    function revealIntro() {
      if (cancelled || enteredRef.current) return
      placeLabel()
      setReady(true)
    }

    Promise.race([
      document.fonts.ready,
      new Promise((resolve) => window.setTimeout(resolve, 1200)),
    ]).then(revealIntro)
    document.fonts.ready.then(() => {
      if (!cancelled && !enteredRef.current) placeLabel()
    })

    function onResize() {
      if (!cancelled) placeLabel()
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
    // After gate lifts, move focus into the live page (toggle is always present).
    window.requestAnimationFrame(() => {
      toggleRef.current?.focus({ preventScroll: true })
    })
    return () => window.clearTimeout(reveal)
  }, [entered])

  useEffect(() => {
    if (!playing) return
    const media = audioRef.current
    if (!media) return
    let animationFrame = 0

    function updatePlayback() {
      const audio = media!
      if (audio.paused) return
      if (audio.currentTime >= SONG_END_SECONDS) {
        audio.currentTime = 0
        audio.volume = 0
      }

      if (audio.currentTime < SONG_FADE_IN_SECONDS) {
        audio.volume = audio.currentTime / SONG_FADE_IN_SECONDS
      } else if (audio.currentTime >= SONG_FADE_START_SECONDS) {
        audio.volume = Math.max(0, (SONG_END_SECONDS - audio.currentTime) / (SONG_END_SECONDS - SONG_FADE_START_SECONDS))
      } else {
        audio.volume = 1
      }
      animationFrame = window.requestAnimationFrame(updatePlayback)
    }

    animationFrame = window.requestAnimationFrame(updatePlayback)
    return () => window.cancelAnimationFrame(animationFrame)
  }, [playing])

  useEffect(() => {
    if (!entered) return
    const fine = window.matchMedia('(pointer: fine) and (prefers-reduced-motion: no-preference)')
    const img = imgRef.current
    if (!fine.matches || !img) return

    function onMove(event: PointerEvent) {
      const x = event.clientX / window.innerWidth - 0.5
      const y = event.clientY / window.innerHeight - 0.5
      img!.style.setProperty('--ry', `${(26 * x).toFixed(2)}deg`)
      img!.style.setProperty('--rx', `${(-26 * y).toFixed(2)}deg`)
    }

    window.addEventListener('pointermove', onMove)
    return () => window.removeEventListener('pointermove', onMove)
  }, [entered])

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
      toggle(event.deltaY > 0)
    }

    let startY = 0
    let startScroll = 0
    function onTouchStart(event: TouchEvent) {
      startY = event.touches[0].clientY
      startScroll = window.scrollY
    }
    function onTouchEnd(event: TouchEvent) {
      const delta = startY - event.changedTouches[0].clientY
      if (Math.abs(delta) > 40 && (delta > 0 || startScroll <= 0)) toggle(delta > 0)
    }

    window.addEventListener('wheel', onWheel, { passive: true })
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchend', onTouchEnd)
    return () => {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [entered])

  function startMusic(restart = false) {
    const audio = audioRef.current
    if (!audio) return
    if (restart || audio.currentTime >= SONG_END_SECONDS) {
      audio.currentTime = 0
      audio.volume = 1
    }
    audio.muted = false
    setPlaying(true)
    void audio.play().catch(() => setPlaying(false))
  }

  function stopMusic() {
    audioRef.current?.pause()
    setPlaying(false)
  }

  /** Measured muted path: enter immediately — no drop phase or delay. */
  function enterMuted(silent = true) {
    if (enteredRef.current) return
    enteredRef.current = true
    if (silent) stopMusic()
    const img = imgRef.current
    if (img) {
      const { a, b } = new DOMMatrix(getComputedStyle(img).transform)
      const angle = (Math.atan2(b, a) * 180) / Math.PI
      img.style.setProperty('--a', `${(angle + 360) % 360}deg`)
    }
    setEntered(true)
  }

  function enterWithSound() {
    startMusic(true)
    enterMuted(false)
  }

  return (
    <main className="site-shell">
      <div className="deck" aria-hidden={entered} inert={entered || undefined}>
        <h2 className="welcome">welcome in</h2>
        <div className="record" ref={recordRef} />
        {/* Decorative tonearm — reference marks aria-hidden; deck is pointer-events:none. */}
        <svg className="arm" viewBox="0 0 100 150" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="80" cy="15" r="8" fill="#0b0b0c" strokeWidth="1.4" />
          <circle cx="80" cy="15" r="3" fill="currentColor" stroke="none" />
          <path d="M80 15v97l-8 14" strokeWidth="1.4" />
          <rect x="64" y="124" width="12" height="16" rx="2" transform="rotate(28 70 132)" fill="currentColor" stroke="none" />
        </svg>
        <div className="choose">
          <button className="play-intro" type="button" onClick={enterWithSound} disabled={entered}>
            <svg viewBox="0 0 14 14" width="14" height="14" aria-hidden="true"><path d="m4 2.7 7 4.3-7 4.3V2.7z" fill="currentColor" /></svg>
            play
          </button>
          <button
            className="quiet"
            type="button"
            onClick={() => enterMuted()}
            disabled={entered}
          >
            <svg className="muted-icon" viewBox="0 0 14 14" width="14" height="14" aria-hidden="true">
              <path d="M1.5 5.2h2.1L7.2 2.4v9.2L3.6 8.8H1.5V5.2z" fill="currentColor" />
              <path d="M9.2 5.1 12 8M12 5.1 9.2 8" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            enter muted
          </button>
        </div>
      </div>

      <audio ref={audioRef} src="/audio/take-it-easy-2013-remaster.mp3" preload="metadata" />
      {entered && <video className="background-video" autoPlay loop muted playsInline src="/media/pexels-background-1080p.mp4" aria-hidden="true" />}

      <nav className="nav" inert={!entered || undefined}>
        <div className="who">
          <button className="music-toggle" type="button" aria-label={playing ? 'mute music' : 'play music'} onClick={playing ? stopMusic : () => startMusic()}>
            {playing ? '▮▮▮' : '♪'}
          </button>
        </div>
        <div className="elsewhere">
          <span>elsewhere</span>
          <div>
            <span className="social-link social-link-disabled" aria-label="Discord (not available yet)">
              <svg className="social-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M19.7 5.2a18.7 18.7 0 0 0-4.6-1.4l-.6 1.2a17.2 17.2 0 0 0-5 0l-.6-1.2a18.7 18.7 0 0 0-4.6 1.4C1.4 9.5.6 13.7 1 17.8a18.8 18.8 0 0 0 5.7 2.9l1.2-1.9-1.9-.9.5-.4c3.7 1.7 7.7 1.7 11.4 0l.5.4-1.9.9 1.2 1.9a18.8 18.8 0 0 0 5.7-2.9c.5-4.8-.8-8.9-3.7-12.6ZM8.7 15.1c-1.1 0-1.9-1-1.9-2.2s.8-2.2 1.9-2.2 1.9 1 1.9 2.2-.8 2.2-1.9 2.2Zm6.6 0c-1.1 0-1.9-1-1.9-2.2s.8-2.2 1.9-2.2 1.9 1 1.9 2.2-.8 2.2-1.9 2.2Z" />
              </svg>
              discord
            </span>
            <a href="https://mail.google.com/mail/?view=cm&fs=1&to=hello%40yonoah.xyz" target="_blank" rel="noreferrer">
              <svg className="social-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M3 6.75A1.75 1.75 0 0 1 4.75 5h14.5A1.75 1.75 0 0 1 21 6.75v10.5A1.75 1.75 0 0 1 19.25 19H4.75A1.75 1.75 0 0 1 3 17.25V6.75Z" stroke="currentColor" strokeWidth="1.7" />
                <path d="m4 6 8 6.5L20 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              email
            </a>
            <a href="https://github.com/cendxr" target="_blank" rel="noreferrer">
              <svg className="social-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 .9a11.1 11.1 0 0 0-3.51 21.63c.56.1.76-.24.76-.54v-2.08c-3.1.68-3.76-1.32-3.76-1.32-.5-1.3-1.24-1.65-1.24-1.65-1.01-.7.08-.69.08-.69 1.12.08 1.71 1.15 1.71 1.15.99 1.7 2.6 1.21 3.23.93.1-.72.39-1.21.7-1.49-2.48-.28-5.09-1.24-5.09-5.52 0-1.22.44-2.22 1.15-3-.12-.28-.5-1.42.11-2.96 0 0 .94-.3 3.05 1.15a10.6 10.6 0 0 1 5.55 0c2.11-1.45 3.05-1.15 3.05-1.15.61 1.54.23 2.68.11 2.96.72.78 1.15 1.78 1.15 3 0 4.29-2.61 5.24-5.1 5.51.4.35.75 1.03.75 2.08v3.08c0 .3.2.65.77.54A11.1 11.1 0 0 0 12 .9Z" />
              </svg>
              github
            </a>
          </div>
        </div>
      </nav>

      <section className="hero" aria-labelledby="page-title" inert={!entered || undefined}>
        <div className="mark">
          <h1 id="page-title" className="wordmark" aria-label="Noah">
            <span className="ch" style={{ '--d': '0s', '--sx': '0.5em' } as CSSProperties}>n</span>
            <span className="photo" ref={photoRef}>
              <img ref={imgRef} src="/noah-basketball.png" alt="Noah" width={128} height={128} />
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
        <svg className="chevron" viewBox="0 0 16 16" width="20" height="20" aria-hidden="true" focusable="false">
          <path d="M3.5 6 8 10.5 12.5 6" />
        </svg>
      </button>

      <div className="more" inert={!open || undefined}>
        <div>
          <section id="experience-panel" className="strip" aria-label="Experience">
            <div className="positions">{positions.map((position) => <ExperienceStrip key={position.name} {...position} />)}</div>
            <div className="projects">{projects.map((project) => <ExperienceStrip key={project.name} {...project} compact />)}</div>
          </section>
        </div>
      </div>
    </main>
  )
}

export default App
