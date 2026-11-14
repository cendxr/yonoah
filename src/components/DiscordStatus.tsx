import { useEffect, useState, type CSSProperties } from 'react'

type Status = 'online' | 'idle' | 'dnd' | 'offline'

type Activity = {
  type: number
  name: string
  details?: string
  state?: string
  application_id?: string
  timestamps?: { start?: number; end?: number }
  assets?: { large_image?: string; small_image?: string }
}

type Presence = {
  discord_user: { id: string; username: string; avatar: string | null; global_name?: string | null; display_name?: string | null }
  discord_status: Status
  activities: Activity[]
  listening_to_spotify: boolean
  spotify: { song: string; artist: string; album_art_url?: string; timestamps: { start: number; end: number } } | null
}

const STATUS_LABEL: Record<Status, string> = { online: 'Online', idle: 'Idle', dnd: 'Do not disturb', offline: 'Offline' }
const VERB: Record<number, string> = { 0: 'Playing', 1: 'Streaming', 2: 'Listening to', 3: 'Watching', 5: 'Competing in' }
const SOCKET = 'wss://api.lanyard.rest/socket'
const REST = 'https://api.lanyard.rest/v1/users/'

function isPresence(value: unknown): value is Presence {
  return !!value && typeof value === 'object' && 'discord_user' in value && 'discord_status' in value
}

// Live presence over Lanyard's socket (op 2 subscribe, op 3 heartbeat), seeded and backed up by REST.
// Resolves to null whenever Lanyard has nothing for the ID (e.g. the user isn't in its server).
function useLanyard(id: string) {
  const [presence, setPresence] = useState<Presence | null>(null)

  useEffect(() => {
    if (!id) return
    let closed = false
    let socket: WebSocket | null = null
    let heartbeat = 0
    let retry = 0
    let poll = 0
    let attempts = 0

    const fetchRest = () =>
      fetch(REST + id)
        .then((res) => res.json())
        .then((body) => { if (!closed) setPresence(body?.success && isPresence(body.data) ? body.data : null) })
        .catch(() => {})

    function connect() {
      if (closed || typeof WebSocket === 'undefined') return
      socket = new WebSocket(SOCKET)
      socket.onmessage = (event) => {
        let msg: { op: number; t?: string; d?: unknown }
        try { msg = JSON.parse(String(event.data)) } catch { return }
        if (msg.op === 1) {
          const interval = (msg.d as { heartbeat_interval?: number })?.heartbeat_interval ?? 30000
          socket?.send(JSON.stringify({ op: 2, d: { subscribe_to_id: id } }))
          window.clearInterval(heartbeat)
          heartbeat = window.setInterval(() => socket?.readyState === 1 && socket.send(JSON.stringify({ op: 3 })), interval)
        } else if (msg.op === 0 && (msg.t === 'INIT_STATE' || msg.t === 'PRESENCE_UPDATE')) {
          attempts = 0
          window.clearInterval(poll)
          poll = 0
          setPresence(isPresence(msg.d) ? msg.d : null)
        }
      }
      socket.onclose = () => {
        window.clearInterval(heartbeat)
        if (closed) return
        // Socket dropped: keep the card fresh over REST while reconnecting with backoff.
        if (!poll) poll = window.setInterval(fetchRest, 30000)
        retry = window.setTimeout(connect, Math.min(30000, 1000 * 2 ** attempts++))
      }
    }

    fetchRest()
    connect()
    return () => {
      closed = true
      window.clearInterval(heartbeat)
      window.clearInterval(poll)
      window.clearTimeout(retry)
      socket?.close()
    }
  }, [id])

  return presence
}

function useNow(active: boolean) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!active) return
    setNow(Date.now())
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [active])
  return now
}

function clock(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = String(total % 60).padStart(2, '0')
  return h ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`
}

function assetUrl(activity: Activity) {
  const image = activity.assets?.large_image ?? activity.assets?.small_image
  if (!image) return null
  if (image.startsWith('mp:external/')) return `https://media.discordapp.net/external/${image.slice('mp:external/'.length)}`
  if (image.startsWith('mp:')) return `https://media.discordapp.net/${image.slice(3)}`
  if (image.startsWith('spotify:')) return `https://i.scdn.co/image/${image.slice(8)}`
  if (/^\d+$/.test(image) && activity.application_id) return `https://cdn.discordapp.com/app-assets/${activity.application_id}/${image}.png?size=128`
  return null
}

function avatarUrl(user: Presence['discord_user']) {
  if (!user.avatar) return null
  const ext = user.avatar.startsWith('a_') ? 'gif' : 'webp'
  return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${ext}?size=128`
}

function Art({ src }: { src: string | null | undefined }) {
  const [failed, setFailed] = useState(false)
  useEffect(() => setFailed(false), [src])
  if (!src || failed) return null
  return <img className="dc-art" src={src} alt="" width={44} height={44} decoding="async" onError={() => setFailed(true)} />
}

export function DiscordStatus({ userId, visible }: { userId: string; visible: boolean }) {
  const presence = useLanyard(userId)
  const spotify = presence?.listening_to_spotify ? presence.spotify : null
  const activity = presence?.activities.find((a) => a.type !== 4 && a.name !== 'Spotify') ?? null
  const now = useNow(!!spotify || !!activity?.timestamps?.start)
  const [avatarFailed, setAvatarFailed] = useState(false)

  if (!userId || !presence) return null

  const user = presence.discord_user
  const status: Status = STATUS_LABEL[presence.discord_status] ? presence.discord_status : 'offline'
  const name = user.global_name || user.display_name || user.username
  const avatar = (!avatarFailed && avatarUrl(user)) || '/noah-avatar.webp'

  let line = null
  let meta = null
  let art: string | null | undefined = null

  if (spotify) {
    const { start, end } = spotify.timestamps
    const total = Math.max(1, end - start)
    const elapsed = Math.min(total, Math.max(0, now - start))
    line = (
      <div className="dc-now">
        <span className="dc-eq" aria-hidden="true"><i /><i /><i /><i /></span>
        <span>Listening to</span>
        <b>{spotify.song}</b>
      </div>
    )
    meta = (
      <div className="dc-bar">
        <span className="dc-artist">{spotify.artist.replace(/;/g, ',')}</span>
        <span className="dc-track" style={{ '--p': `${(elapsed / total) * 100}%` } as CSSProperties} />
        <span>{clock(elapsed)} / {clock(total)}</span>
      </div>
    )
    art = spotify.album_art_url
  } else if (activity) {
    const start = activity.timestamps?.start
    const sub = [activity.details, activity.state].filter(Boolean).join(' · ')
    line = (
      <div className="dc-now">
        <span className="dc-glyph" aria-hidden="true">
          <svg viewBox="0 0 16 16"><path d="M5 5.5v2M4 6.5h2M10.25 6h.01M11.75 7.5h.01M4.6 3.5h6.8a3 3 0 0 1 2.9 2.2l.9 3.4a2 2 0 0 1-3.4 1.9L10.5 9.5h-5l-1.3 1.5A2 2 0 0 1 .8 9.1l.9-3.4a3 3 0 0 1 2.9-2.2Z" /></svg>
        </span>
        <span>{VERB[activity.type] ?? 'Playing'}</span>
        <b>{activity.name}</b>
      </div>
    )
    if (sub || start) {
      meta = (
        <div className="dc-bar">
          {sub && <span className="dc-artist dc-sub">{sub}</span>}
          {start && <span className="dc-elapsed">{clock(now - start)} elapsed</span>}
        </div>
      )
    }
    art = assetUrl(activity)
  }

  return (
    <aside className="dc" data-status={status} data-visible={visible || undefined} data-bare={!line || undefined} aria-label="Discord status" aria-live="polite">
      <div className="dc-av">
        <img src={avatar} alt="" width={44} height={44} decoding="async" onError={() => setAvatarFailed(true)} />
        <span className="dc-dot" />
      </div>
      <div className="dc-body">
        <div className="dc-top">
          <span className="dc-name">{name}</span>
          <span className="dc-status"><i />{STATUS_LABEL[status]}</span>
        </div>
        {line}
        {meta}
      </div>
      <Art src={art} />
    </aside>
  )
}
