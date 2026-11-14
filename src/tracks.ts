export type Track = {
  /** Path to the audio file in /public. */
  file: string
  title: string
  artist: string
  /** Optional square cover in /public. A generated tile is shown when missing. */
  art?: string
}

/**
 * The playlist. It plays top to bottom and loops.
 * To add a song: put the mp3 in public/audio, the cover in public/art, and add a line here.
 */
export const tracks: Track[] = [
  {
    file: '/audio/take-it-easy-2013-remaster.mp3',
    title: 'Take It Easy',
    artist: 'Eagles',
    art: '/art/take-it-easy.jpg',
  },
]
