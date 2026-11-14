import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { Player, type PlayerHandle } from './components/Player'
import { WorkRow, type Work } from './components/WorkRow'
import { tracks } from './tracks'

const BIO = 'Software developer with a passion for technology, the outdoors, and spending quality time with friends and family.'
const GITHUB = 'https://github.com/cendxr'

const work: Work[] = [
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

type Stage = 'closed' | 'opening' | 'open'

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function ArrowUpRight() {
  return (
    <svg className="icon" viewBox="0 0 20 20" aria-hidden="true">
      <path d="M6 14 14 6M7.5 6H14v6.5" />
    </svg>
  )
}

export default function App() {
  const [ready, setReady] = useState(false)
  const [stage, setStage] = useState<Stage>('closed')
  const playerRef = useRef<PlayerHandle>(null)
  const nameRef = useRef<HTMLHeadingElement>(null)
  const firstTrack = tracks[0]

  useEffect(() => {
    let cancelled = false
    Promise.race([document.fonts.ready, new Promise((resolve) => window.setTimeout(resolve, 1200))]).then(() => {
      if (!cancelled) setReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('is-locked', stage !== 'open')
    if (stage === 'open') nameRef.current?.focus({ preventScroll: true })
  }, [stage])

  // Gentle rise-in for rows as they scroll into view.
  useEffect(() => {
    if (stage === 'closed') return
    const items = document.querySelectorAll<HTMLElement>('[data-reveal]')
    if (!('IntersectionObserver' in window)) {
      items.forEach((item) => item.setAttribute('data-shown', ''))
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          entry.target.setAttribute('data-shown', '')
          observer.unobserve(entry.target)
        }
      },
      { rootMargin: '0px 0px -8% 0px' },
    )
    items.forEach((item) => observer.observe(item))
    return () => observer.disconnect()
  }, [stage])

  function enter(withSound: boolean) {
    if (stage !== 'closed') return
    if (withSound) playerRef.current?.play()
    setStage('opening')
    window.setTimeout(() => setStage('open'), prefersReducedMotion() ? 450 : 1700)
  }

  const current = work[work.length - 1]

  return (
    <div className="site" data-stage={stage} data-ready={ready || undefined}>
      <div className="backdrop" aria-hidden="true">
        <video className="backdrop-video" autoPlay loop muted playsInline preload="auto" poster="/media/aurora-lake.jpg" src="/media/aurora-lake.mp4" />
        <div className="backdrop-grade" />
        <div className="backdrop-light" />
        <div className="backdrop-grain" />
      </div>

      <div className="page" inert={stage === 'closed' || undefined}>
        <header className="topbar">
          <a className="brand" href="#top">yonoah</a>
          <nav className="topnav" aria-label="Primary">
            <a href="#work">Work</a>
            <a href={GITHUB} target="_blank" rel="noreferrer">GitHub<ArrowUpRight /></a>
          </nav>
        </header>

        <main>
          <section className="hero" id="top" aria-labelledby="name">
            <div className="hero-now rise" style={{ '--delay': '0.75s' } as CSSProperties}>
              <img className="avatar" src="/noah-basketball.png" alt="Noah" width={40} height={40} />
              <span className="hero-now-text">
                <span className="label">Currently</span>
                <span>{current.role}, {current.name}</span>
              </span>
            </div>

            <h1 id="name" className="hero-name" ref={nameRef} tabIndex={-1}>
              <span className="hero-name-line">Noah</span>
            </h1>

            <div className="hero-foot">
              <p className="hero-bio rise" style={{ '--delay': '1.05s' } as CSSProperties}>{BIO}</p>
              <div className="hero-actions rise" style={{ '--delay': '1.2s' } as CSSProperties}>
                <a className="pill" href="#work">
                  Selected work
                  <svg className="icon" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 4v12m-5-5 5 5 5-5" /></svg>
                </a>
                <a className="textlink" href={GITHUB} target="_blank" rel="noreferrer">GitHub<ArrowUpRight /></a>
              </div>
            </div>
          </section>

          <section className="work" id="work" aria-labelledby="work-title">
            <header className="work-head" data-reveal>
              <h2 id="work-title">Selected work</h2>
              <span className="label">{String(work.length).padStart(2, '0')} communities</span>
            </header>
            <ol className="work-list">
              {work.map((item, index) => <WorkRow key={item.name} work={item} index={index} />)}
            </ol>
          </section>
        </main>

        <footer className="foot">
          <span>© {new Date().getFullYear()} Noah</span>
          <a href={GITHUB} target="_blank" rel="noreferrer">github.com/cendxr</a>
          <a className="foot-credit" href="https://pixabay.com/videos/lake-aurora-borealis-northern-lights-176989/" target="_blank" rel="noreferrer">Footage · Pixabay</a>
        </footer>
      </div>

      <Player ref={playerRef} tracks={tracks} visible={stage !== 'closed'} />

      <section className="curtain" aria-label="Welcome" aria-hidden={stage !== 'closed'} inert={stage !== 'closed' || undefined}>
        <div className="curtain-half curtain-top">
          <div className="curtain-title">
            <span className="label">yonoah</span>
            <span className="curtain-name">Noah</span>
          </div>
        </div>
        <div className="curtain-half curtain-bottom">
          <div className="curtain-actions">
            <div className="curtain-buttons">
              <button className="pill pill-solid" type="button" onClick={() => enter(true)} disabled={!ready}>
                <svg className="icon" viewBox="0 0 20 20" aria-hidden="true"><path className="fill" d="M3.5 8v4h3l4 3.5v-11l-4 3.5h-3Z" /><path d="M13.5 7.5a3.5 3.5 0 0 1 0 5M15.5 5.5a6.4 6.4 0 0 1 0 9" /></svg>
                Enter with sound
              </button>
              <button className="pill" type="button" onClick={() => enter(false)} disabled={!ready}>
                Enter muted
              </button>
            </div>
            {firstTrack && (
              <p className="label curtain-note">
                Soundtrack — {firstTrack.title}, {firstTrack.artist}
              </p>
            )}
          </div>
        </div>
        <div className="curtain-horizon" aria-hidden="true" />
      </section>
    </div>
  )
}
