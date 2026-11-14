import { useEffect, useImperativeHandle, useRef, useState, type CSSProperties, type Ref } from 'react'
import type { Track } from '../tracks'

export type PlayerHandle = { play: () => void }

type PlayerProps = {
  tracks: Track[]
  visible: boolean
  ref?: Ref<PlayerHandle>
}

const FADE_IN = 1.4
const FADE_OUT = 0.45

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) seconds = 0
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

function initials(title: string) {
  return title
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('')
}

function reducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function Player({ tracks, visible, ref }: PlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const ctxRef = useRef<AudioContext | null>(null)
  const gainRef = useRef<GainNode | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const wantPlayRef = useRef(false)
  const volumeRef = useRef(0.85)
  const mutedRef = useRef(false)
  const pauseTimer = useRef(0)

  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [time, setTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.85)
  const [muted, setMuted] = useState(false)

  const track = tracks[index]
  const count = tracks.length

  const target = () => (mutedRef.current ? 0 : volumeRef.current)

  function ensureGraph() {
    const audio = audioRef.current
    if (ctxRef.current || !audio) return
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return
    try {
      const ctx = new AC()
      const source = ctx.createMediaElementSource(audio)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      analyser.smoothingTimeConstant = 0.82
      const gain = ctx.createGain()
      gain.gain.value = 0
      source.connect(analyser)
      analyser.connect(gain)
      gain.connect(ctx.destination)
      ctxRef.current = ctx
      gainRef.current = gain
      analyserRef.current = analyser
    } catch {
      // Web Audio unavailable: plain element volume is used instead.
    }
  }

  function ramp(value: number, seconds: number) {
    const ctx = ctxRef.current
    const gain = gainRef.current
    const audio = audioRef.current
    if (ctx && gain) {
      const now = ctx.currentTime
      gain.gain.cancelScheduledValues(now)
      gain.gain.setValueAtTime(gain.gain.value, now)
      if (seconds <= 0) gain.gain.setValueAtTime(value, now)
      else gain.gain.linearRampToValueAtTime(value, now + seconds)
    } else if (audio) {
      audio.volume = Math.min(1, Math.max(0, value))
    }
  }

  function startAudio() {
    const audio = audioRef.current
    if (!audio) return
    window.clearTimeout(pauseTimer.current)
    wantPlayRef.current = true
    setPlaying(true)
    ramp(0, 0)
    audio
      .play()
      .then(() => ramp(target(), FADE_IN))
      .catch(() => {
        wantPlayRef.current = false
        setPlaying(false)
      })
  }

  function play() {
    ensureGraph()
    void ctxRef.current?.resume()
    startAudio()
  }

  function pause() {
    wantPlayRef.current = false
    setPlaying(false)
    ramp(0, FADE_OUT)
    window.clearTimeout(pauseTimer.current)
    pauseTimer.current = window.setTimeout(() => {
      if (!wantPlayRef.current) audioRef.current?.pause()
    }, FADE_OUT * 1000)
  }

  function go(step: number, fade = true) {
    const audio = audioRef.current
    if (!audio) return
    if (step < 0 && audio.currentTime > 3) {
      audio.currentTime = 0
      return
    }
    const next = (index + step + count) % count
    const swap = () => {
      if (next === index) {
        audio.currentTime = 0
        if (wantPlayRef.current) startAudio()
      } else {
        setTime(0)
        setDuration(0)
        setIndex(next)
      }
    }
    if (fade && wantPlayRef.current) {
      ramp(0, 0.3)
      window.setTimeout(swap, 300)
    } else {
      swap()
    }
  }

  useImperativeHandle(ref, () => ({ play }))

  // A new source loads when the index changes; keep playing if we were.
  useEffect(() => {
    if (wantPlayRef.current) startAudio()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index])

  useEffect(() => {
    volumeRef.current = volume
    mutedRef.current = muted
    if (wantPlayRef.current) ramp(target(), 0.12)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [volume, muted])

  // Lock screen and media keys.
  useEffect(() => {
    if (!('mediaSession' in navigator) || !track) return
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: track.artist,
      artwork: track.art ? [{ src: track.art, sizes: '480x480', type: 'image/jpeg' }] : [],
    })
    navigator.mediaSession.setActionHandler('play', () => play())
    navigator.mediaSession.setActionHandler('pause', () => pause())
    navigator.mediaSession.setActionHandler('nexttrack', () => go(1))
    navigator.mediaSession.setActionHandler('previoustrack', () => go(-1))
  })

  // Music-reactive light: one smoothed level written to a CSS variable.
  useEffect(() => {
    const root = document.documentElement
    const analyser = analyserRef.current
    if (!playing || !analyser || reducedMotion()) {
      root.style.setProperty('--level', '0')
      return
    }
    const bins = new Uint8Array(analyser.frequencyBinCount)
    let smooth = 0
    let frame = 0
    const tick = () => {
      analyser.getByteFrequencyData(bins)
      let sum = 0
      for (let i = 1; i < 20; i++) sum += bins[i] ?? 0
      const raw = sum / (19 * 255)
      const shaped = Math.min(1, Math.max(0, (raw - 0.35) * 2.2))
      smooth += (shaped - smooth) * 0.12
      root.style.setProperty('--level', (mutedRef.current ? 0 : smooth).toFixed(3))
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(frame)
      root.style.setProperty('--level', '0')
    }
  }, [playing])

  if (!track) return null
  const progress = duration ? Math.min(100, (time / duration) * 100) : 0
  const level = muted ? 0 : volume

  return (
    <aside className="player" data-visible={visible || undefined} data-playing={playing || undefined} aria-label="Music player" inert={!visible || undefined}>
      <audio
        ref={audioRef}
        src={track.file}
        preload="metadata"
        onTimeUpdate={(event) => setTime(event.currentTarget.currentTime)}
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
        onEnded={() => go(1, false)}
      />

      <div className="player-art">
        {track.art ? <img src={track.art} alt="" width={52} height={52} /> : <span>{initials(track.title)}</span>}
      </div>

      <div className="player-body">
        <div className="player-row">
          <div className="player-meta" aria-live="polite">
            <span className="player-title">{track.title}</span>
            <span className="player-artist">
              {track.artist}
              {count > 1 && <span className="player-count"> · {index + 1}/{count}</span>}
            </span>
          </div>

          <div className="player-controls">
            <button type="button" className="player-btn" aria-label="Previous track" onClick={() => go(-1)}>
              <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5.5 5v10" /><path className="fill" d="M15 5.6v8.8a.6.6 0 0 1-.92.5L8.2 10.5a.6.6 0 0 1 0-1l5.88-4.4a.6.6 0 0 1 .92.5Z" /></svg>
            </button>
            <button type="button" className="player-btn player-main" aria-label={playing ? 'Pause' : 'Play'} onClick={playing ? pause : play}>
              {playing ? (
                <svg viewBox="0 0 20 20" aria-hidden="true"><rect className="fill" x="5.5" y="4.5" width="3" height="11" rx="1" /><rect className="fill" x="11.5" y="4.5" width="3" height="11" rx="1" /></svg>
              ) : (
                <svg viewBox="0 0 20 20" aria-hidden="true"><path className="fill" d="M6.5 4.9v10.2a.8.8 0 0 0 1.2.68l8.1-5.1a.8.8 0 0 0 0-1.36L7.7 4.22a.8.8 0 0 0-1.2.68Z" /></svg>
              )}
            </button>
            <button type="button" className="player-btn" aria-label="Next track" onClick={() => go(1)}>
              <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M14.5 5v10" /><path className="fill" d="M5 5.6v8.8a.6.6 0 0 0 .92.5l5.88-4.4a.6.6 0 0 0 0-1l-5.88-4.4A.6.6 0 0 0 5 5.6Z" /></svg>
            </button>
          </div>
        </div>

        <div className="player-row player-timeline">
          <span className="player-time">{formatTime(time)}</span>
          <input
            className="player-range"
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={time}
            aria-label="Seek"
            style={{ '--p': `${progress}%` } as CSSProperties}
            onChange={(event) => {
              const audio = audioRef.current
              if (!audio) return
              audio.currentTime = Number(event.currentTarget.value)
              setTime(audio.currentTime)
            }}
          />
          <span className="player-time">{formatTime(duration)}</span>
          <div className="player-volume">
            <button type="button" className="player-btn player-mute" aria-label={muted ? 'Unmute' : 'Mute'} onClick={() => setMuted((m) => !m)}>
              {level === 0 ? (
                <svg viewBox="0 0 20 20" aria-hidden="true"><path className="fill" d="M3.5 8v4h3l4 3.5v-11l-4 3.5h-3Z" /><path d="m13.5 8 4 4m0-4-4 4" /></svg>
              ) : (
                <svg viewBox="0 0 20 20" aria-hidden="true"><path className="fill" d="M3.5 8v4h3l4 3.5v-11l-4 3.5h-3Z" /><path d="M13.5 7.5a3.5 3.5 0 0 1 0 5M15.5 5.5a6.4 6.4 0 0 1 0 9" /></svg>
              )}
            </button>
            <input
              className="player-range player-level"
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={level}
              aria-label="Volume"
              style={{ '--p': `${level * 100}%` } as CSSProperties}
              onChange={(event) => {
                setVolume(Number(event.currentTarget.value))
                setMuted(false)
              }}
            />
          </div>
        </div>
      </div>
    </aside>
  )
}
