import { useEffect, useRef, useState } from 'react'
import { BrainrotTroupe } from './BrainrotTroupe'
import { BrainrotSahurPet } from './BrainrotSahurPet'

export const BRAINROT_START_CONCERT_EVENT = 'brainrot:start-concert'

const CONCERT_CHANCE_PER_SECOND = 1 / 100

interface BrainrotModeProps {
  musicUrl: string
  onConcertChange?: (playing: boolean) => void
}

/**
 * @brief Drives the brainrot mode: a surprise concert rolled every second, and Sahur chasing the cursor otherwise.
 * @param musicUrl URL of the concert track, preloaded as soon as the mode is mounted.
 * @param onConcertChange Optional callback notified when a concert starts or ends.
 * @return The concert overlay while a concert is on, or Sahur's cursor-chasing layer the rest of the time.
 */
export function BrainrotMode({ musicUrl, onConcertChange }: BrainrotModeProps) {
  const [concertActive, setConcertActive] = useState(false)
  const [audio] = useState(() => {
    const el = new Audio(musicUrl)
    el.preload = 'auto'
    return el
  })
  const concertActiveRef = useRef(false)

  useEffect(() => {
    concertActiveRef.current = concertActive
    onConcertChange?.(concertActive)
  }, [concertActive, onConcertChange])

  useEffect(() => () => onConcertChange?.(false), [onConcertChange])

  useEffect(() => {
    const prime = () => {
      if (concertActiveRef.current) return
      audio.muted = true
      audio
        .play()
        .then(() => {
          if (concertActiveRef.current) return
          audio.pause()
          audio.currentTime = 0
        })
        .catch(() => {})
        .finally(() => {
          audio.muted = false
        })
    }
    window.addEventListener('pointerdown', prime, { once: true })
    window.addEventListener('keydown', prime, { once: true })
    return () => {
      window.removeEventListener('pointerdown', prime)
      window.removeEventListener('keydown', prime)
      audio.pause()
    }
  }, [audio])

  useEffect(() => {
    if (concertActive) return
    const id = setInterval(() => {
      const userHasInteracted = navigator.userActivation?.hasBeenActive ?? true
      if (userHasInteracted && Math.random() < CONCERT_CHANCE_PER_SECOND) setConcertActive(true)
    }, 1000)
    return () => clearInterval(id)
  }, [concertActive])

  useEffect(() => {
    const start = () => setConcertActive(true)
    window.addEventListener(BRAINROT_START_CONCERT_EVENT, start)
    return () => window.removeEventListener(BRAINROT_START_CONCERT_EVENT, start)
  }, [])

  return concertActive ? (
    <BrainrotTroupe audio={audio} onFinished={() => setConcertActive(false)} />
  ) : (
    <BrainrotSahurPet />
  )
}

export default BrainrotMode
