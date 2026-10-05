import { useEffect, useRef } from 'react'
import { drawSahurBody, getPixelScale } from './brainrotCharacters'
import {
  HIT_RADIUS,
  HIT_STOP_FRAMES,
  REACH_X,
  REACH_Y,
  SHOULDER_X,
  SHOULDER_Y,
  BAT_LENGTH,
  createAttackState,
  drawBatterArm,
  stepAttack,
} from './sahurBatter'

const GROUND_OFFSET = 9
const SPAWN_MARGIN = 50
const WALK_SPEED = 1.6
const CHASE_SPEED = 2.4
const KNOCKBACK = 7
const SPRING = 0.012
const DAMPING = 0.94
const IMPACT_FRAMES = 26
const TRAIL_POINTS = 6
const CURSOR_HIDDEN_CLASS = 'brainrot-cursor'
const CLICKABLE_SELECTOR =
  'a,button,input,select,textarea,label,summary,[role="button"],[role="switch"],[role="tab"],[role="menuitem"]'

const CURSOR_SPRITE = [
  'X.......',
  'XX......',
  'XWX.....',
  'XWWX....',
  'XWWWX...',
  'XWWWWX..',
  'XWWWWWX.',
  'XWWWXXXX',
  'XWXWX...',
  'XX.XWX..',
  'X..XWX..',
  '....XX..',
]

/**
 * @brief Renders Tung Tung Tung Sahur as a desktop pet that chases the pointer and smashes a fake cursor with a full bat swing.
 * @return A click-through canvas above the whole page; the system cursor is hidden while the pointer is over the page.
 */
export function BrainrotSahurPet() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    let scale = getPixelScale()
    let width = 0
    let height = 0

    const resize = () => {
      scale = getPixelScale()
      width = Math.ceil(window.innerWidth / scale)
      height = Math.ceil(window.innerHeight / scale)
      canvas.width = width
      canvas.height = height
    }
    resize()

    const mouse = { x: 0, y: 0, present: false, clickable: false }
    const offset = { x: 0, y: 0, vx: 0, vy: 0 }
    const pet = {
      x: Math.random() < 0.5 ? -SPAWN_MARGIN : width + SPAWN_MARGIN,
      y: height - GROUND_OFFSET,
      dir: 1,
      moving: false,
    }
    pet.dir = pet.x < 0 ? 1 : -1
    const attack = createAttackState()

    const setCursorHidden = (hidden: boolean) => {
      document.documentElement.classList.toggle(CURSOR_HIDDEN_CLASS, hidden)
    }

    const handleMove = (e: MouseEvent) => {
      mouse.x = e.clientX / scale
      mouse.y = e.clientY / scale
      mouse.present = true
      mouse.clickable = e.target instanceof Element && e.target.closest(CLICKABLE_SELECTOR) !== null
      setCursorHidden(true)
    }
    const handleLeave = () => {
      mouse.present = false
      setCursorHidden(false)
    }
    window.addEventListener('mousemove', handleMove)
    window.addEventListener('resize', resize)
    window.addEventListener('blur', handleLeave)
    document.addEventListener('mouseleave', handleLeave)

    const shadow = (x: number, y: number, w: number, h: number) => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)'
      ctx.beginPath()
      ctx.ellipse(x, y, w / 2, h / 2, 0, 0, Math.PI * 2)
      ctx.fill()
    }

    const drawCursor = (cx: number, cy: number, fill: string, tilt: number) => {
      ctx.save()
      ctx.translate(Math.round(cx), Math.round(cy))
      ctx.rotate(tilt)
      CURSOR_SPRITE.forEach((row, ry) => {
        for (let rx = 0; rx < row.length; rx++) {
          const cell = row[rx]
          if (cell === '.') continue
          ctx.fillStyle = cell === 'X' ? '#0b0b12' : fill
          ctx.fillRect(rx, ry, 1, 1)
        }
      })
      ctx.restore()
    }

    const drawImpact = (px: number, py: number, age: number) => {
      const radius = 4 + age * 1.4
      ctx.fillStyle = age < 4 ? '#ffffff' : '#fde047'
      for (let i = 0; i < 12; i++) {
        const a = (i * Math.PI) / 6
        const r = i % 2 === 0 ? radius : radius * 0.6
        ctx.fillRect(Math.round(px + Math.cos(a) * r), Math.round(py + Math.sin(a) * r), 2, 2)
      }
      const rise = age * 0.8
      const alpha = Math.max(0, 1 - age / IMPACT_FRAMES)
      ctx.save()
      ctx.globalAlpha = alpha
      ctx.font = 'bold 9px monospace'
      ctx.textAlign = 'center'
      ctx.lineWidth = 3
      ctx.strokeStyle = '#1c0b2e'
      ctx.strokeText('TUNG!', Math.round(px), Math.round(py - 14 - rise))
      ctx.fillStyle = '#fde047'
      ctx.fillText('TUNG!', Math.round(px), Math.round(py - 14 - rise))
      ctx.restore()
    }

    let f = 0
    let impactAge = IMPACT_FRAMES
    let impactX = 0
    let impactY = 0
    const history: { x: number; y: number }[] = []
    let last = performance.now()
    let rafId = 0

    const render = (now: number) => {
      const dtFrames = Math.min(0.1, (now - last) / 1000) * 60
      last = now
      f += dtFrames

      offset.vx -= offset.x * SPRING * dtFrames
      offset.vy -= offset.y * SPRING * dtFrames
      const damp = Math.pow(DAMPING, dtFrames)
      offset.vx *= damp
      offset.vy *= damp
      offset.x += offset.vx * dtFrames
      offset.y += offset.vy * dtFrames

      const cx = Math.min(width - 1, Math.max(0, mouse.x + offset.x))
      const cy = Math.min(height - 1, Math.max(0, mouse.y + offset.y))

      const attacking = attack.phase !== 'idle'
      let targetX = width / 2
      let targetY = height - GROUND_OFFSET
      if (mouse.present) {
        if (!attacking && Math.abs(cx - pet.x) > 20) pet.dir = cx > pet.x ? 1 : -1
        targetX = cx - pet.dir * REACH_X
        targetY = Math.min(height - 4, Math.max(40, cy + REACH_Y))
      }

      let nearTarget = false
      if (!attacking || !mouse.present) {
        const dx = targetX - pet.x
        const dy = targetY - pet.y
        const dist = Math.hypot(dx, dy)
        const step = (mouse.present ? CHASE_SPEED : WALK_SPEED) * dtFrames
        if (dist > step) {
          pet.x += (dx / dist) * step
          pet.y += (dy / dist) * step
          pet.moving = true
          if (!mouse.present) pet.dir = dx >= 0 ? 1 : -1
        } else {
          pet.x = targetX
          pet.y = targetY
          pet.moving = false
        }
        nearTarget = dist < 12
      } else {
        pet.moving = false
      }

      const bounce = pet.moving ? Math.abs(Math.sin(f * 0.5)) * 3 : 0
      const frame = stepAttack(attack, dtFrames, mouse.present && nearTarget, f)

      if (frame.hitCrossed) {
        const tipX = pet.x + pet.dir * (SHOULDER_X - Math.sin(frame.angle) * BAT_LENGTH)
        const tipY = pet.y - SHOULDER_Y + Math.cos(frame.angle) * BAT_LENGTH
        if (Math.hypot(tipX - cx, tipY - cy) < HIT_RADIUS) {
          offset.vx += pet.dir * KNOCKBACK
          offset.vy += -3 + (Math.random() - 0.5) * 2
          attack.hitStop = HIT_STOP_FRAMES
          impactAge = 0
          impactX = cx
          impactY = cy
        }
      }

      ctx.clearRect(0, 0, width, height)

      const shake = attack.hitStop > 0 ? (Math.random() - 0.5) * 3 : 0
      const groundY = Math.round(pet.y)
      shadow(Math.round(pet.x), groundY + 2, 14, 4)
      ctx.save()
      ctx.translate(Math.round(pet.x + shake), Math.round(pet.y - bounce - frame.hop + frame.crouch))
      ctx.scale(pet.dir, 1)
      ctx.rotate(frame.lean * 0.035)
      drawSahurBody(ctx, 0, 0)
      drawBatterArm(ctx, frame.angle, frame.trailFrom)
      ctx.restore()

      if (mouse.present) {
        history.push({ x: cx, y: cy })
        if (history.length > TRAIL_POINTS) history.shift()
        const speed = Math.hypot(offset.vx, offset.vy)
        if (speed > 1.2) {
          history.slice(0, -1).forEach((pt, i, arr) => {
            ctx.globalAlpha = ((i + 1) / (arr.length + 1)) * 0.35
            drawCursor(pt.x, pt.y, '#ffffff', 0)
          })
          ctx.globalAlpha = 1
        }
        if (impactAge < IMPACT_FRAMES) {
          drawImpact(impactX, impactY, impactAge)
          impactAge += dtFrames
        }
        const tilt = Math.max(-1.1, Math.min(1.1, offset.vx * 0.14))
        drawCursor(cx, cy, mouse.clickable ? '#facc15' : '#ffffff', tilt)
      } else {
        history.length = 0
      }

      rafId = requestAnimationFrame(render)
    }
    rafId = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('resize', resize)
      window.removeEventListener('blur', handleLeave)
      document.removeEventListener('mouseleave', handleLeave)
      setCursorHidden(false)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[9999] size-full"
      style={{ imageRendering: 'pixelated' }}
    />
  )
}

export default BrainrotSahurPet
