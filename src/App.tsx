import { useState } from 'react'
import { ExperienceStrip } from './components/ExperienceCard'

function App() {
  const [isEntering, setIsEntering] = useState(false)
  const [hasEntered, setHasEntered] = useState(false)
  const [experienceOpen, setExperienceOpen] = useState(false)

  function enterSite() {
    setIsEntering(true)
    window.setTimeout(() => setHasEntered(true), 1800)
  }

  return (
    <main className={`site-shell${hasEntered ? ' has-entered' : ''}${isEntering ? ' is-entering' : ''}${experienceOpen ? ' experience-open' : ''}`}>
      <header className="site-header">
        <span>Noah</span>
      </header>

      {!hasEntered && (
        <section className="intro-screen" aria-label="Site introduction">
          <h2 className="intro-heading">welcome in</h2>
          <div className="turntable" aria-hidden="true">
            <div className="record">
              <img src="/noah-profile.png" alt="" />
            </div>
            <span className="tonearm" />
          </div>
          <div className="intro-controls">
            <button className="enter-button" type="button" onClick={enterSite}>Enter</button>
          </div>
        </section>
      )}

      <section className="hero" aria-labelledby="page-title">
        <h1 id="page-title" className="sr-only">Noah</h1>
        <div className="hero-content">
          <div className="wordmark" aria-hidden="true">
            <span>n</span>
            <span className="wordmark-photo"><img src="/noah-profile.png" alt="" /></span>
            <span>ah</span>
          </div>
          <p className="bio">👋 I’m a 16-year-old American college student who loves spending time with friends and family, and building projects.</p>
        </div>
        <button
          className="experience-toggle"
          type="button"
          aria-expanded={experienceOpen}
          aria-controls="experience-panel"
          onClick={() => setExperienceOpen((open) => !open)}
        >
          <svg className="chevron" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
            <path d="M3.5 6 8 10.5 12.5 6" />
          </svg>
          <span className="sr-only">{experienceOpen ? 'Hide' : 'Show'} experience</span>
        </button>
      </section>

      <section id="experience-panel" className={`experience${experienceOpen ? ' is-open' : ''}`} aria-label="Experience">
        <ExperienceStrip
            name="Boomerang"
            role="Senior Support · Retired"
            description="A versatile and customizable app designed to streamline community and staff management."
            href="https://bmrg.app/"
        />
      </section>
    </main>
  )
}

export default App
