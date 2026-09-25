import { useState, useEffect, useRef } from 'react'
import { Volume2, VolumeX, Square, Play } from 'lucide-react'
import { useSettings } from '@/context/SettingsContext'
import { MUSIC_PRESETS } from '@/config/musicPresets'

export function BackgroundMusicPlayer() {
  const { customization } = useSettings()

  // Musique configurée pour la page ou Lo-Fi par défaut
  const currentTrackUrl = customization.background_music || MUSIC_PRESETS[0].url
  const currentTrackName = customization.background_music_name || MUSIC_PRESETS[0].title

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [isStoppedByUser, setIsStoppedByUser] = useState<boolean>(false)

  // Gestion de la lecture audio automatique par défaut
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio()
    }

    const audio = audioRef.current
    audio.loop = true
    audio.volume = 0.35 // Volume d'ambiance doux

    if (audio.src !== currentTrackUrl) {
      audio.src = currentTrackUrl
      audio.load()
    }

    if (!isStoppedByUser) {
      const playPromise = audio.play()
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true)
          })
          .catch(() => {
            // Contournement des restrictions d'autoplay du navigateur dès la première interaction
            setIsPlaying(false)

            const startOnInteraction = () => {
              if (audioRef.current && !isStoppedByUser) {
                audioRef.current
                  .play()
                  .then(() => setIsPlaying(true))
                  .catch(() => {})
              }
            }

            window.addEventListener('pointerdown', startOnInteraction, { once: true })
            window.addEventListener('keydown', startOnInteraction, { once: true })
          })
      }
    } else {
      audio.pause()
      setIsPlaying(false)
    }

    const handleEnded = () => {
      if (!isStoppedByUser) {
        audio.play().catch(() => {})
      }
    }

    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('ended', handleEnded)
    }
  }, [currentTrackUrl, isStoppedByUser])

  // Arrêt propre lors du démontage du composant
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
      }
    }
  }, [])

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause()
    }
    setIsPlaying(false)
    setIsStoppedByUser(true)
  }

  const handlePlay = () => {
    setIsStoppedByUser(false)
    if (audioRef.current) {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {})
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 select-none">
      {isPlaying ? (
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-full border border-primary/40 bg-card/95 backdrop-blur-md shadow-lg shadow-black/30 transition-all text-xs">
          {/* Égaliseur animé discret */}
          <div className="flex items-end gap-0.5 h-3.5 text-primary shrink-0" aria-hidden="true">
            <span className="w-0.5 bg-current rounded-full animate-[pulse_0.6s_ease-in-out_infinite] h-2.5" />
            <span className="w-0.5 bg-current rounded-full animate-[pulse_0.8s_ease-in-out_infinite_0.2s] h-3.5" />
            <span className="w-0.5 bg-current rounded-full animate-[pulse_0.5s_ease-in-out_infinite_0.4s] h-1.5" />
          </div>

          <div className="flex items-center gap-1.5 max-w-[160px] truncate">
            <Volume2 className="size-3.5 text-primary shrink-0" />
            <span className="font-medium text-foreground truncate">{currentTrackName}</span>
          </div>

          {/* Bouton unique pour arrêter la musique */}
          <button
            type="button"
            onClick={handleStop}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 hover:text-rose-300 font-semibold text-[11px] transition-all cursor-pointer border border-rose-500/20 shadow-xs"
            title="Arrêter la musique de fond"
          >
            <Square className="size-2.5 fill-current" />
            <span>Arrêter</span>
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={handlePlay}
          className="flex items-center gap-2 px-3 py-2 rounded-full border border-border/80 bg-card/90 hover:bg-card backdrop-blur-md shadow-md text-xs text-muted-foreground hover:text-foreground transition-all cursor-pointer"
          title="Relancer la musique de fond"
        >
          <VolumeX className="size-3.5 text-muted-foreground" />
          <span className="text-[11px]">Musique arrêtée</span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-semibold border border-primary/20">
            <Play className="size-2.5 fill-current" />
            Activer
          </span>
        </button>
      )}
    </div>
  )
}

export default BackgroundMusicPlayer
