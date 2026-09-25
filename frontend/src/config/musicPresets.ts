export interface MusicPreset {
  id: string
  title: string
  artist: string
  genre: string
  url: string
  description: string
  badgeColor: string
}

export const MUSIC_PRESETS: MusicPreset[] = [
  {
    id: 'lofi-chill',
    title: 'Lo-Fi Chill Beats',
    artist: 'Lofi Records',
    genre: 'Lo-Fi / Focus',
    url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3',
    description: 'Rythmes apaisants et doux crépitements de vinyle pour la concentration.',
    badgeColor: 'border-purple-500/40 text-purple-400 bg-purple-500/10',
  },
  {
    id: 'synthwave-cyber',
    title: 'Neon Cyberpunk Dreams',
    artist: 'Retro Wave',
    genre: 'Synthwave',
    url: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3',
    description: 'Basses électroniques rétro-futuristes et synthétiseurs immersifs.',
    badgeColor: 'border-pink-500/40 text-pink-400 bg-pink-500/10',
  },
  {
    id: 'deep-space',
    title: 'Deep Space Orbit',
    artist: 'Cosmic Sound',
    genre: 'Ambient',
    url: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c07e05f6.mp3',
    description: 'Nappes spatiales profondes et atmosphères planantes d’apesanteur.',
    badgeColor: 'border-sky-500/40 text-sky-400 bg-sky-500/10',
  },
  {
    id: 'rainy-cafe',
    title: 'Pluie d’Automne & Café',
    artist: 'Nature Sounds',
    genre: 'Ambiance Nature',
    url: 'https://cdn.pixabay.com/download/audio/2021/09/06/audio_731422fa70.mp3',
    description: 'Bruit de pluie relaxante sur vitre et ambiance feutrée.',
    badgeColor: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10',
  },
  {
    id: 'zen-meditation',
    title: 'Sérénité Zen & Cloches',
    artist: 'Peaceful Mind',
    genre: 'Méditation',
    url: 'https://cdn.pixabay.com/download/audio/2022/10/14/audio_9939f77cb7.mp3',
    description: 'Bols tibétains et harmonies acoustiques douces.',
    badgeColor: 'border-amber-500/40 text-amber-400 bg-amber-500/10',
  },
]
