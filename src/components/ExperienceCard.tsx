type ExperienceStripProps = {
  name: string
  role: string
  description: string
  href: string
}

export function ExperienceStrip({ name, role, description, href }: ExperienceStripProps) {
  return (
    <a className="experience-link" href={href} target="_blank" rel="noreferrer" aria-label={`${name}, ${role}. ${description}`}>
      <span className="experience-name">{name}</span>
      <span className="experience-role">{role}</span>
      <span className="experience-description">{description}</span>
      <span className="external-mark" aria-hidden="true">↗</span>
    </a>
  )
}
