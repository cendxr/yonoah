import type { CSSProperties } from 'react'

type ExperienceStripProps = {
  name: string
  role: string
  description: string
  href: string
  logoSrc: string
  index?: number
}

export function ExperienceStrip({ name, role, description, href, logoSrc, index = 0 }: ExperienceStripProps) {
  return (
    <a className="position" href={href} target="_blank" rel="noreferrer" style={{ '--i': index } as CSSProperties}>
      <span className="logo-tile">
        <img className="logo" src={logoSrc} alt="" width={28} height={28} loading="lazy" />
      </span>
      <div className="title">
        <b>{name}</b>
        <span>{role}</span>
      </div>
      <svg className="position-arrow" viewBox="0 0 20 20" aria-hidden="true"><path d="M6 14 14 6M7.5 6H14v6.5" /></svg>
      <p>{description}</p>
    </a>
  )
}
