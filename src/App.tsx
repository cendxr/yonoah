import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { ExperienceStrip } from './components/ExperienceCard'
import { Player, type PlayerHandle } from './components/Player'
import { DiscordStatus } from './components/DiscordStatus'
import { DISCORD_USER_ID } from './config'
import { tracks } from './tracks'

const BIO = 'Software developer with a passion for technology, the outdoors, and spending quality time with friends and family.'
const WORDS = BIO.split(' ')
const INTRO_CHARS = Array.from("hi, i'm noah")
const GITHUB = 'https://github.com/cendxr'
const FOOTAGE = 'https://pixabay.com/videos/fog-mountains-road-foggy-dramatic-53358/'
// The "noah" at the end of the greeting flies into the wordmark when you enter.
const NOAH_AT = INTRO_CHARS.length - 4
// One curve and one clock for the whole enter transition (mirrors --flow in styles.css).
const FLOW = 'cubic-bezier(.55, 0, .1, 1)'
const FLIGHT_MS = 1400

type Flight = { fontSize: number; baseline: number; rects: DOMRect[]; o: HTMLElement }

// Where the text baseline of a single-line heading sits on screen.
function baselineOf(el: HTMLElement) {
  const probe = document.createElement('span')
  probe.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline'
  el.appendChild(probe)
  const y = probe.getBoundingClientRect().top
  probe.remove()
  return y
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

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
  const introTitleRef = useRef<HTMLHeadingElement>(null)
  const markRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const ambientRef = useRef<HTMLDivElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<PlayerHandle>(null)
  const flightRef = useRef<Flight | null>(null)
  const wakeRef = useRef<(() => void) | null>(null)
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

  // The enter transition, as one shared-element move: the "noah" of the greeting becomes the
  // wordmark (n, a, h glide into place, the "o" turns into the photo) while the gate dissolves
  // and the backdrop rises behind it. Runs before paint so the first frame already matches the gate.
  useLayoutEffect(() => {
    const from = flightRef.current
    flightRef.current = null
    const title = titleRef.current
    const photo = photoRef.current
    const img = imgRef.current
    if (!entered || !from || !title || !photo || !img) return

    const root = document.documentElement
    root.classList.add('flight')
    const timing: KeyframeAnimationOptions = { duration: FLIGHT_MS, easing: FLOW, fill: 'backwards' }
    const s = from.fontSize / parseFloat(getComputedStyle(title).fontSize)
    const bw = baselineOf(title)
    const moves: Animation[] = []
    const fly = (el: Element, dx: number, dy: number, scale: number) =>
      el.animate(
        [{ transform: `translate3d(${dx}px, ${dy}px, 0) scale(${scale})` }, { transform: 'translate3d(0, 0, 0) scale(1)' }],
        timing,
      )

    // Letters: line up each wordmark glyph's centre and baseline with its twin in the greeting.
    const letters = Array.from(title.querySelectorAll<HTMLElement>('.ch'))
    const twins = [0, 2, 3]
    letters.forEach((el, i) => {
      const src = from.rects[twins[i]]
      if (!src) return
      const r = el.getBoundingClientRect()
      const cs = getComputedStyle(el)
      const ox = r.left + r.width / 2
      const oy = r.top + r.height / 2
      const glyphX = (r.left + parseFloat(cs.paddingLeft) + r.right - parseFloat(cs.paddingRight)) / 2
      const dx = src.left + src.width / 2 - ox - (glyphX - ox) * s
      const dy = from.baseline - oy - (bw - oy) * s
      moves.push(fly(el, dx, dy, s))
    })

    // Photo: starts as the greeting's "o" and grows into place as the letter melts away.
    const pr = photo.getBoundingClientRect()
    const pcx = pr.left + pr.width / 2
    const pcy = pr.top + pr.height / 2
    const o = from.rects[1]
    const startX = o.left + o.width / 2
    const startY = from.baseline + (pcy - bw) * s
    moves.push(fly(photo, startX - pcx, startY - pcy, s))
    photo.animate([{ opacity: 0 }, { opacity: 1 }], { duration: FLIGHT_MS * 0.5, easing: FLOW, fill: 'backwards' })
    img.animate([{ scale: '1.5' }, { scale: '1.12' }], timing)

    const k = 1 / s
    const ocx = o.left + o.width / 2
    const ocy = o.top + o.height / 2
    from.o.animate(
      [
        { transform: 'translate3d(0, 0, 0) scale(1)' },
        { transform: `translate3d(${pcx - ocx - (startX - ocx) * k}px, ${pcy - ocy - (startY - ocy) * k}px, 0) scale(${k})` },
      ],
      { duration: FLIGHT_MS, easing: FLOW, fill: 'forwards' },
    )
    from.o.animate([{ opacity: 1 }, { opacity: 0 }], { duration: FLIGHT_MS * 0.45, easing: FLOW, fill: 'forwards' })

    const land = () => root.classList.remove('flight')
    Promise.all(moves.map((move) => move.finished)).then(land, land)
  }, [entered])

  // Wait for the font so the greeting never reflows mid-animation.
  useEffect(() => {
    let cancelled = false
    Promise.race([
      document.fonts.ready,
      new Promise((resolve) => window.setTimeout(resolve, 1200)),
    ]).then(() => {
      if (!cancelled && !enteredRef.current) setReady(true)
    })
    return () => {
      cancelled = true
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

  // One rAF loop for every ambient motion, writing transforms straight to the few elements that
  // move (no layout reads, no global CSS variables). It sleeps as soon as everything settles.
  //  - pointer: photo tilt + gentle counter-parallax of the wordmark and footage
  //  - cursor glow: a faint neutral light that trails the pointer (fine pointers only)
  //  - scroll: the backdrop drifts up and eases in as the drawer opens, with a small nudge per wheel tick
  useEffect(() => {
    if (!entered || prefersReducedMotion()) return
    const fine = window.matchMedia('(pointer: fine)').matches
    const img = imgRef.current
    const mark = markRef.current
    const video = videoRef.current
    const ambient = ambientRef.current
    const glow = fine ? glowRef.current : null
    let tx = 0
    let ty = 0
    let x = 0
    let y = 0
    let gtx = 0
    let gty = 0
    let gx = 0
    let gy = 0
    let glowOn = false
    let progress = 0
    let kickTarget = 0
    let kick = 0
    let frame = 0

    function progressTarget() {
      // Phones scroll the page for real; larger screens open the drawer instead.
      const scrolled = window.innerWidth <= 640 ? clamp(window.scrollY / Math.max(1, window.innerHeight * 0.8), 0, 1) : 0
      return Math.max(openRef.current ? 1 : 0, scrolled)
    }

    function step() {
      frame = 0
      const target = progressTarget()
      x += (tx - x) * 0.08
      y += (ty - y) * 0.08
      gx += (gtx - gx) * 0.12
      gy += (gty - gy) * 0.12
      progress += (target - progress) * 0.055
      kickTarget *= 0.9
      kick += (kickTarget - kick) * 0.1

      if (fine && img) {
        img.style.setProperty('--ry', `${(22 * x).toFixed(2)}deg`)
        img.style.setProperty('--rx', `${(-22 * y).toFixed(2)}deg`)
      }
      if (fine && mark) mark.style.transform = `translate3d(${(x * -10).toFixed(2)}px, ${(y * -8).toFixed(2)}px, 0)`
      if (video) {
        video.style.transform = `translate3d(${(x * 18).toFixed(2)}px, ${(y * 12 - progress * 22 - kick).toFixed(2)}px, 0) scale(${(1.02 + progress * 0.035).toFixed(4)})`
      }
      if (ambient) ambient.style.transform = `translate3d(${(x * -12).toFixed(2)}px, ${(-progress * 44 - kick * 1.8).toFixed(2)}px, 0)`
      if (glow && glowOn) glow.style.transform = `translate3d(${gx.toFixed(1)}px, ${gy.toFixed(1)}px, 0)`

      const busy =
        Math.abs(tx - x) + Math.abs(ty - y) > 0.0005 ||
        (glowOn && Math.abs(gtx - gx) + Math.abs(gty - gy) > 0.3) ||
        Math.abs(target - progress) > 0.0005 ||
        Math.abs(kickTarget) + Math.abs(kick) > 0.02
      if (busy) frame = requestAnimationFrame(step)
    }

    function wake() {
      if (!frame) frame = requestAnimationFrame(step)
    }

    function onMove(event: PointerEvent) {
      if (event.pointerType !== 'mouse' && event.pointerType !== 'pen') return
      tx = event.clientX / window.innerWidth - 0.5
      ty = event.clientY / window.innerHeight - 0.5
      gtx = event.clientX
      gty = event.clientY
      if (glow && !glowOn) {
        glowOn = true
        gx = gtx
        gy = gty
        glow.style.transform = `translate3d(${gx}px, ${gy}px, 0)`
        glow.dataset.on = ''
      }
      wake()
    }

    function onLeave(event: PointerEvent) {
      if (event.relatedTarget || !glow) return
      glowOn = false
      delete glow.dataset.on
    }

    function onWheel(event: WheelEvent) {
      if ((event.target as Element | null)?.closest?.('.player')) return
      kickTarget = clamp(kickTarget + clamp(event.deltaY, -60, 60) * 0.12, -14, 14)
      wake()
    }

    wakeRef.current = wake
    if (fine) {
      window.addEventListener('pointermove', onMove, { passive: true })
      document.addEventListener('pointerout', onLeave)
    }
    window.addEventListener('wheel', onWheel, { passive: true })
    window.addEventListener('scroll', wake, { passive: true })
    window.addEventListener('resize', wake)
    wake()
    return () => {
      wakeRef.current = null
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerout', onLeave)
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('scroll', wake)
      window.removeEventListener('resize', wake)
      cancelAnimationFrame(frame)
    }
  }, [entered])

  // Opening or closing the drawer eases the backdrop along with it.
  useEffect(() => {
    wakeRef.current?.()
  }, [open])

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

  // Snapshot where the greeting's "noah" sits so the wordmark can take off from exactly there.
  function measureIntro(): Flight | null {
    const intro = introTitleRef.current
    if (!intro) return null
    const chars = Array.from(intro.querySelectorAll<HTMLElement>('.intro-char')).slice(NOAH_AT)
    if (chars.length !== 4) return null
    chars.forEach((char) => char.getAnimations().forEach((animation) => animation.finish()))
    return {
      fontSize: parseFloat(getComputedStyle(intro).fontSize),
      baseline: baselineOf(intro),
      rects: chars.map((char) => char.getBoundingClientRect()),
      o: chars[1],
    }
  }

  function enter(withMusic: boolean) {
    if (enteredRef.current) return
    enteredRef.current = true
    if (withMusic) playerRef.current?.play()
    if (!prefersReducedMotion()) flightRef.current = measureIntro()
    setEntered(true)
  }

  return (
    <main className="site-shell">
      <section className="intro-gate" aria-label="Welcome" aria-hidden={entered} inert={entered || undefined}>
        <div className="intro-inner">
          <p className="intro-kicker">yonoah</p>
          <h1 className="intro-title" aria-label="hi, i'm noah" ref={introTitleRef}>
            {INTRO_CHARS.map((char, index) => (
              <span
                key={index}
                className="intro-char"
                style={{ '--c': index, '--o': NOAH_AT - index } as CSSProperties}
                data-part={index < NOAH_AT ? 'greet' : index === NOAH_AT + 1 ? 'o' : 'name'}
                aria-hidden="true"
              >
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
        <video ref={videoRef} className="background-video" autoPlay loop muted playsInline preload="auto" poster="/media/fog-road.jpg" src="/media/fog-road.mp4" />
        <div className="backdrop-shade" />
      </div>
      <div className="ambient" ref={ambientRef} aria-hidden="true" />
      <div className="cursor-glow" ref={glowRef} aria-hidden="true" />

      <nav className="nav" inert={!entered || undefined}>
        <Player ref={playerRef} tracks={tracks} visible={entered} />
        <a className="nav-link" href={GITHUB} target="_blank" rel="noreferrer">
          <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8Z" /></svg>
          <span>GitHub</span>
        </a>
      </nav>

      <section className="hero" aria-labelledby="page-title" inert={!entered || undefined}>
        <div className="mark" ref={markRef}>
          <h1 id="page-title" className="wordmark" aria-label="Noah" ref={titleRef} tabIndex={-1}>
            <span className="ch">n</span>
            <span className="photo" ref={photoRef}>
              <img ref={imgRef} src="/noah-avatar.webp" alt="Noah" width={384} height={384} decoding="async" />
            </span>
            <span className="ch">a</span>
            <span className="ch">h</span>
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

      <DiscordStatus userId={DISCORD_USER_ID} visible={entered} />

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
