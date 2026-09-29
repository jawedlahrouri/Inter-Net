import { useState, useEffect, useRef } from 'react'
import { Volume2, VolumeX, Square, Play } from 'lucide-react'
import { useSettings } from '@/context/SettingsContext'
import { MUSIC_PRESETS } from '@/config/musicPresets'

/**
 * @brief Renders the floating background music player that loops the customized track and lets the user stop or restart it.
 * @return A fixed bottom-right control showing the track name with a stop button while playing, or a play button when stopped.
 */
export function BackgroundMusicPlayer() {
  const { customization } = useSettings()

  const currentTrackUrl = customization.background_music || MUSIC_PRESETS[0].url
  const currentTrackName = customization.background_music_name || MUSIC_PRESETS[0].title

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [isStoppedByUser, setIsStoppedByUser] = useState<boolean>(false)

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio()
    }

    const audio = audioRef.current
    audio.loop = true
    audio.volume = 0.35

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
            setIsPlaying(false)

            /**
             * @brief Retries starting audio playback after the first pointer or keyboard interaction when autoplay was blocked.
             */
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

    /**
     * @brief Restarts the audio when the track ends unless the user has stopped the music.
     */
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

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
      }
    }
  }, [])

  /**
   * @brief Pauses the audio and records that the user stopped the music.
   */
  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause()
    }
    setIsPlaying(false)
    setIsStoppedByUser(true)
  }

  /**
   * @brief Clears the stopped flag and resumes audio playback, marking the player as playing on success.
   */
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
          <div className="flex items-end gap-0.5 h-3.5 text-primary shrink-0" aria-hidden="true">
            <span className="w-0.5 bg-current rounded-full animate-[pulse_0.6s_ease-in-out_infinite] h-2.5" />
            <span className="w-0.5 bg-current rounded-full animate-[pulse_0.8s_ease-in-out_infinite_0.2s] h-3.5" />
            <span className="w-0.5 bg-current rounded-full animate-[pulse_0.5s_ease-in-out_infinite_0.4s] h-1.5" />
          </div>

          <div className="flex items-center gap-1.5 max-w-[160px] truncate">
            <Volume2 className="size-3.5 text-primary shrink-0" />
            <span className="font-medium text-foreground truncate">{currentTrackName}</span>
          </div>

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
