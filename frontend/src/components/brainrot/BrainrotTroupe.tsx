import { useEffect, useRef, useState } from 'react'
import { BRAINROT_CHARACTERS, getPixelScale } from './brainrotCharacters'

export interface BrainrotTroupeProps {
  speed?: number
  audio: HTMLAudioElement
  audioVolume?: number
  onFinished: () => void
}

const BPM = 128
const FPS = 60
const GROUND_OFFSET = 9
const STAGE_HEIGHT = 13
const HIT_HALF_WIDTH = 20
const HIT_TOP = 75
const HIT_BOTTOM = 5
const ENTRY_STAGGER = 26
const ENTRY_DURATION = 150
const ENTRY_MARGIN = 50
const LEAVE_STAGGER = 18
const LEAVE_DURATION = 110
const AUDIO_FALLBACK_MS = 150_000
const LIGHT_COLORS = ['255,0,127', '56,189,248', '168,85,247', '250,204,21', '52,211,153', '244,114,182']
const LIGHT_SCALE = 0.5

/**
 * @brief Renders a full-screen concert overlay where the eight brainrots walk in from both screen edges under moving stage lights.
 * @param speed Animation speed multiplier applied to the beat, the lights and the bounces.
 * @param audio Preloaded audio element of the concert track, played once; the troupe walks off when it ends.
 * @param audioVolume Music volume between 0 and 1; defaults to 0.5.
 * @param onFinished Callback invoked once the troupe has left the screen.
 * @return A fixed, click-through layer with a dimming veil, a light show canvas, a pixel-art stage canvas, a hover tooltip and a play prompt when autoplay is blocked.
 */
export function BrainrotTroupe({ speed = 1, audio, audioVolume = 0.5, onFinished }: BrainrotTroupeProps) {
  const spriteCanvasRef = useRef<HTMLCanvasElement>(null)
  const lightCanvasRef = useRef<HTMLCanvasElement>(null)
  const speedRef = useRef(speed)
  const hoveredRef = useRef(-1)
  const reactionsRef = useRef<number[]>(BRAINROT_CHARACTERS.map(() => 0))
  const positionsRef = useRef<number[]>(BRAINROT_CHARACTERS.map(() => -ENTRY_MARGIN))
  const metricsRef = useRef({ scale: 3, groundY: 0 })
  const [hovered, setHovered] = useState(-1)
  const [tooltipPos, setTooltipPos] = useState({ left: 0, bottom: 0 })
  const [veilVisible, setVeilVisible] = useState(false)
  const [audioBlocked, setAudioBlocked] = useState(false)
  const leaveRequestedRef = useRef(false)
  const onFinishedRef = useRef(onFinished)
  const tryPlayRef = useRef<() => void>(() => {})

  useEffect(() => {
    onFinishedRef.current = onFinished
  }, [onFinished])

  useEffect(() => {
    speedRef.current = speed
  }, [speed])

  useEffect(() => {
    const id = requestAnimationFrame(() => setVeilVisible(true))
    return () => cancelAnimationFrame(id)
  }, [])

  useEffect(() => {
    audio.loop = false
    audio.volume = audioVolume
    audio.currentTime = 0

    let fallbackTimer: ReturnType<typeof setTimeout> | undefined

    const tryPlay = () => {
      audio.play().catch((err) => {
        console.warn('[brainrot] lecture audio bloquée ou impossible :', err)
        setAudioBlocked(true)
      })
    }
    tryPlayRef.current = tryPlay

    const handlePlaying = () => {
      setAudioBlocked(false)
      clearTimeout(fallbackTimer)
      window.removeEventListener('pointerdown', tryPlay)
      window.removeEventListener('keydown', tryPlay)
    }
    const handleEnded = () => {
      leaveRequestedRef.current = true
    }
    const handleError = () => {
      console.error('[brainrot] erreur de chargement audio :', audio.error)
      setAudioBlocked(true)
    }

    audio.addEventListener('playing', handlePlaying)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('error', handleError)
    window.addEventListener('pointerdown', tryPlay)
    window.addEventListener('keydown', tryPlay)
    fallbackTimer = setTimeout(handleEnded, AUDIO_FALLBACK_MS)
    tryPlay()

    return () => {
      clearTimeout(fallbackTimer)
      audio.removeEventListener('playing', handlePlaying)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('error', handleError)
      window.removeEventListener('pointerdown', tryPlay)
      window.removeEventListener('keydown', tryPlay)
      audio.pause()
    }
  }, [audio, audioVolume])

  useEffect(() => {
    const spriteCanvas = spriteCanvasRef.current
    const lightCanvas = lightCanvasRef.current
    const ctx = spriteCanvas?.getContext('2d')
    const lctx = lightCanvas?.getContext('2d')
    if (!spriteCanvas || !lightCanvas || !ctx || !lctx) return

    let virtualW = 0
    let virtualH = 0
    let lightW = 0
    let lightH = 0

    const resize = () => {
      const scale = getPixelScale()
      virtualW = Math.ceil(window.innerWidth / scale)
      virtualH = Math.ceil(window.innerHeight / scale)
      spriteCanvas.width = virtualW
      spriteCanvas.height = virtualH
      lightW = Math.ceil(window.innerWidth * LIGHT_SCALE)
      lightH = Math.ceil(window.innerHeight * LIGHT_SCALE)
      lightCanvas.width = lightW
      lightCanvas.height = lightH
      metricsRef.current = { scale, groundY: virtualH - GROUND_OFFSET }
    }
    resize()
    window.addEventListener('resize', resize)

    const count = BRAINROT_CHARACTERS.length
    const half = count / 2
    const targetX = (idx: number) => (virtualW * (idx + 0.5)) / count

    const shadow = (x: number, y: number, w: number, h: number) => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)'
      ctx.beginPath()
      ctx.ellipse(x, y, w / 2, h / 2, 0, 0, Math.PI * 2)
      ctx.fill()
    }

    const drawStage = () => {
      ctx.fillStyle = 'rgba(30, 10, 60, 0.9)'
      ctx.fillRect(0, virtualH - STAGE_HEIGHT, virtualW, STAGE_HEIGHT)
      ctx.fillStyle = '#ff007f'
      ctx.fillRect(0, virtualH - STAGE_HEIGHT, virtualW, 1)
      ctx.fillStyle = 'rgba(255, 0, 127, 0.35)'
      for (let gx = 0; gx < virtualW; gx += 12) {
        ctx.fillRect(gx, virtualH - STAGE_HEIGHT + 1, 1, STAGE_HEIGHT - 1)
      }
    }

    const drawLights = (time: number, beat: number, intensity: number) => {
      lctx.clearRect(0, 0, lightW, lightH)
      lctx.globalCompositeOperation = 'lighter'

      const beams = 7
      for (let i = 0; i < beams; i++) {
        const originX = (lightW * (i + 0.5)) / beams
        const angle = Math.sin(time * 0.9 + i * 1.3) * 0.55 + (i - (beams - 1) / 2) * 0.07
        const length = lightH * 1.25
        const endX = originX + Math.sin(angle) * length
        const endY = Math.cos(angle) * length
        const spread = 0.07 + 0.03 * beat
        const color = LIGHT_COLORS[(i + Math.floor(time / 3)) % LIGHT_COLORS.length]
        const alpha = intensity * (0.35 + 0.35 * beat)

        const grad = lctx.createLinearGradient(originX, 0, endX, endY)
        grad.addColorStop(0, `rgba(${color},${alpha})`)
        grad.addColorStop(1, `rgba(${color},0)`)
        lctx.fillStyle = grad
        lctx.beginPath()
        lctx.moveTo(originX, 0)
        lctx.lineTo(endX + Math.cos(angle) * length * spread, endY - Math.sin(angle) * length * spread)
        lctx.lineTo(endX - Math.cos(angle) * length * spread, endY + Math.sin(angle) * length * spread)
        lctx.closePath()
        lctx.fill()
      }

      const floorY = lightH - GROUND_OFFSET * LIGHT_SCALE * getPixelScale()
      for (let i = 0; i < count; i++) {
        const cx = (positionsRef.current[i] / virtualW) * lightW
        const color = LIGHT_COLORS[(i + Math.floor(time / 2)) % LIGHT_COLORS.length]
        const radius = lightH * 0.35
        const pool = lctx.createRadialGradient(cx, floorY, 0, cx, floorY, radius)
        pool.addColorStop(0, `rgba(${color},${intensity * (0.25 + 0.2 * beat)})`)
        pool.addColorStop(1, `rgba(${color},0)`)
        lctx.fillStyle = pool
        lctx.fillRect(cx - radius, floorY - radius, radius * 2, radius * 2)
      }

      if (beat > 0.8) {
        lctx.fillStyle = `rgba(255,255,255,${intensity * (beat - 0.8) * 0.25})`
        lctx.fillRect(0, 0, lightW, lightH)
      }
      lctx.globalCompositeOperation = 'source-over'
    }

    let frame = 0
    let leaveStart = -1
    let finished = false
    let last = performance.now()
    let rafId = 0

    const render = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000)
      last = now
      frame += dt * FPS * speedRef.current

      const seconds = frame / FPS
      const beatPhase = (seconds * BPM) / 60
      const beat = Math.pow(1 - (beatPhase % 1), 3)

      if (leaveRequestedRef.current && leaveStart < 0) {
        leaveStart = frame
        setVeilVisible(false)
      }
      const leaveFrac =
        leaveStart < 0 ? 0 : Math.min(1, (frame - leaveStart) / (LEAVE_DURATION + LEAVE_STAGGER * (half - 1)))
      const intensity = Math.min(1, seconds / 3) * (1 - leaveFrac)
      let allGone = leaveStart >= 0

      drawLights(seconds, beat, intensity)

      ctx.clearRect(0, 0, virtualW, virtualH)
      drawStage()

      const groundY = metricsRef.current.groundY
      BRAINROT_CHARACTERS.forEach((char, idx) => {
        const fromLeft = idx < half
        const order = fromLeft ? half - 1 - idx : idx - half
        const t = Math.min(1, Math.max(0, (frame - order * ENTRY_STAGGER) / ENTRY_DURATION))
        const eased = 1 - Math.pow(1 - t, 3)
        const startX = fromLeft ? -ENTRY_MARGIN : virtualW + ENTRY_MARGIN
        const leaveOrder = fromLeft ? idx : count - 1 - idx
        const u =
          leaveStart < 0
            ? 0
            : Math.min(1, Math.max(0, (frame - leaveStart - leaveOrder * LEAVE_STAGGER) / LEAVE_DURATION))
        if (u < 1) allGone = false
        const x = u > 0 ? targetX(idx) + (startX - targetX(idx)) * u * u : startX + (targetX(idx) - startX) * eased
        positionsRef.current[idx] = x

        const arriving = t < 1 || u > 0
        const bounce = arriving
          ? Math.abs(Math.sin(frame * 0.5)) * 4
          : Math.abs(Math.sin(beatPhase * Math.PI + idx * 0.3)) * 5

        let react = reactionsRef.current[idx]
        if (react > 0) {
          react *= 0.9
          if (react < 0.2) react = 0
          reactionsRef.current[idx] = react
        }

        if (hoveredRef.current === idx && !arriving) {
          ctx.strokeStyle = '#facc15'
          ctx.lineWidth = 1
          ctx.strokeRect(x - 18, groundY - 72, 36, 78)
        }

        char.draw(ctx, x, groundY, frame, bounce, react, shadow)
      })

      if (allGone && !finished) {
        finished = true
        onFinishedRef.current()
        return
      }
      rafId = requestAnimationFrame(render)
    }
    rafId = requestAnimationFrame(render)

    /**
     * @brief Finds the character under a pointer position.
     * @param e Mouse event received on the window.
     * @return The index of the character under the pointer, or -1 when there is none.
     */
    const findCharacterAt = (e: MouseEvent): number => {
      const { scale, groundY } = metricsRef.current
      const x = e.clientX / scale
      const y = e.clientY / scale
      return BRAINROT_CHARACTERS.findIndex(
        (_, i) =>
          x >= positionsRef.current[i] - HIT_HALF_WIDTH &&
          x <= positionsRef.current[i] + HIT_HALF_WIDTH &&
          y >= groundY - HIT_TOP &&
          y <= groundY + HIT_BOTTOM
      )
    }

    const handleMove = (e: MouseEvent) => {
      const idx = findCharacterAt(e)
      if (idx === hoveredRef.current) return
      hoveredRef.current = idx
      setHovered(idx)
      if (idx >= 0) {
        const { scale, groundY } = metricsRef.current
        setTooltipPos({
          left: positionsRef.current[idx] * scale,
          bottom: window.innerHeight - (groundY - HIT_TOP) * scale + 8,
        })
      }
    }

    const handleClick = (e: MouseEvent) => {
      const idx = findCharacterAt(e)
      if (idx >= 0) reactionsRef.current[idx] = 16
    }

    window.addEventListener('mousemove', handleMove)
    window.addEventListener('click', handleClick)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('click', handleClick)
    }
  }, [])

  const hoveredChar = hovered >= 0 ? BRAINROT_CHARACTERS[hovered] : null

  return (
    <div className="pointer-events-none fixed inset-0 z-30" aria-hidden="true">
      <div
        className="absolute inset-0 transition-opacity duration-[2500ms]"
        style={{ background: 'rgba(6, 3, 22, 0.5)', opacity: veilVisible ? 1 : 0 }}
      />
      <canvas
        ref={lightCanvasRef}
        className="absolute inset-0 size-full"
        style={{ mixBlendMode: 'screen' }}
      />
      <canvas
        ref={spriteCanvasRef}
        className="absolute inset-0 size-full"
        style={{ imageRendering: 'pixelated' }}
      />
      {audioBlocked && (
        <button
          type="button"
          onClick={() => tryPlayRef.current()}
          className="pointer-events-auto absolute bottom-16 left-1/2 z-10 -translate-x-1/2 cursor-pointer rounded-full border border-pink-400/80 bg-black/85 px-4 py-2 text-xs font-semibold text-pink-300 shadow-lg"
        >
          🔊 Cliquer pour lancer la musique
        </button>
      )}
      {hoveredChar && (
        <div
          className="absolute -translate-x-1/2 whitespace-nowrap rounded-full border border-yellow-400/80 bg-black/85 px-3 py-1 text-[11px] text-yellow-300 shadow-lg"
          style={{ left: tooltipPos.left, bottom: tooltipPos.bottom }}
        >
          <span className="text-white">{hoveredChar.name}</span> • {hoveredChar.subtitle}
        </div>
      )}
    </div>
  )
}

export default BrainrotTroupe
