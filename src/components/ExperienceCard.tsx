import type { CSSProperties } from 'react'

type ExperienceStripProps = {
  name: string
  role: string
  description: string
  href: string
  logoSrc: string
}

export function ExperienceStrip({ name, role, description, href, logoSrc }: ExperienceStripProps) {
  return (
    <a className="position" href={href} target="_blank" rel="noreferrer" style={{ '--i': 0 } as CSSProperties}>
      <img className="logo" src={logoSrc} alt="" />
      <div className="title">
        <b>{name}</b>
        <span>{role}</span>
      </div>
      <p>{description}</p>
    </a>
  )
}
