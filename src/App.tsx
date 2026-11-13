import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { ExperienceStrip } from './components/ExperienceCard'

const BIO = 'Software developer with a passion for technology, the outdoors, and spending quality time with friends and family.'
const WORDS = BIO.split(' ')
const INTRO_CHARS = Array.from("hi, i'm noah")
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

  /** Silent entry reveals the portfolio immediately without starting playback. */
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
            <button className="intro-action intro-action-primary" type="button" onClick={() => enterMuted()} disabled={!ready || entered}>
              Enter
              <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h12m-5-5 5 5-5 5" /></svg>
            </button>
            <button className="intro-action" type="button" onClick={enterWithSound} disabled={!ready || entered}>
              <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M8 15V4.5l8-1.5V13.5" /><circle cx="6" cy="15" r="2" /><circle cx="14" cy="13.5" r="2" /></svg>
              Enter with music
            </button>
          </div>
        </div>
        <span className="intro-hint" aria-hidden="true">Music is optional</span>
      </section>

      <audio ref={audioRef} src="/audio/take-it-easy-2013-remaster.mp3" preload="metadata" />
      {entered && <video className="background-video" autoPlay loop muted playsInline src="/media/desert-road.mp4" aria-hidden="true" />}
      <div className="ambient" aria-hidden="true" />

      <nav className="nav" inert={!entered || undefined}>
        <div className="who">
          <button className="music-toggle" type="button" aria-label={playing ? 'mute music' : 'play music'} onClick={playing ? stopMusic : () => startMusic()}>
            {playing ? '▮▮▮' : '♪'}
          </button>
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
          </section>
        </div>
      </div>
    </main>
  )
}

export default App
