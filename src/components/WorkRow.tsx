export type Work = {
  name: string
  role: string
  description: string
  href: string
  logoSrc: string
}

export function WorkRow({ work, index }: { work: Work; index: number }) {
  return (
    <li className="work-row" data-reveal>
      <a className="work-link" href={work.href} target="_blank" rel="noreferrer">
        <span className="work-index">{String(index + 1).padStart(2, '0')}</span>
        <img className="work-logo" src={work.logoSrc} alt="" width={44} height={44} loading="lazy" />
        <span className="work-heading">
          <span className="work-name">{work.name}</span>
          <span className="work-role">{work.role}</span>
        </span>
        <svg className="work-arrow" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M6 14 14 6M7.5 6H14v6.5" />
        </svg>
        <span className="work-detail">
          <span className="work-detail-inner">{work.description}</span>
        </span>
      </a>
    </li>
  )
}
