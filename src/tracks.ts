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
 *
 * Added tracks are royalty-free Pixabay Music under the Pixabay Content License
 * (free use on websites; attribution is optional). Official titles and source
 * pages, recorded for credit:
 *   Good Night — FASSounds
 *     official: Good Night - Lofi Cozy Chill Music
 *     https://pixabay.com/music/beats-good-night-lofi-cozy-chill-music-160166/
 *   Lofi Study — FASSounds
 *     official: Lofi Study - Calm Peaceful Chill Hop
 *     https://pixabay.com/music/beats-lofi-study-calm-peaceful-chill-hop-112191/
 *   Focus Zone — FASSounds
 *     official: Focus Zone - Relax Mellow Lofi Music
 *     https://pixabay.com/music/beats-focus-zone-relax-mellow-lofi-music-259701/
 *   Sakura — FASSounds
 *     official: Sakura - Mellow Japan Lofi Beats
 *     https://pixabay.com/music/beats-sakura-mellow-japan-lofi-beats-265429/
 *   Calm Mind — FASSounds
 *     official: Calm Mind - Chill Lofi Beat Background Music
 *     https://pixabay.com/music/beats-calm-mind-chill-lofi-beat-background-music-259700/
 */
export const tracks: Track[] = [
  {
    file: '/audio/take-it-easy-2013-remaster.mp3',
    title: 'Take It Easy',
    artist: 'Eagles',
    art: '/art/take-it-easy.jpg',
  },
  {
    file: '/audio/good-night.mp3',
    title: 'Good Night',
    artist: 'FASSounds',
    art: '/art/good-night.jpg',
  },
  {
    file: '/audio/lofi-study.mp3',
    title: 'Lofi Study',
    artist: 'FASSounds',
    art: '/art/lofi-study.jpg',
  },
  {
    file: '/audio/focus-zone.mp3',
    title: 'Focus Zone',
    artist: 'FASSounds',
    art: '/art/focus-zone.jpg',
  },
  {
    file: '/audio/sakura.mp3',
    title: 'Sakura',
    artist: 'FASSounds',
    art: '/art/sakura.jpg',
  },
  {
    file: '/audio/calm-mind.mp3',
    title: 'Calm Mind',
    artist: 'FASSounds',
    art: '/art/calm-mind.jpg',
  },
]
