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
  drawBatSprite,
  stepAttack,
} from './sahurBatter'
import { BRAINROT_DROP_BAT_EVENT, BRAINROT_TUNG_HIT_EVENT } from './BrainrotMode'

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

interface FallingBat {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  rot: number
  vRot: number
  grounded: boolean
  groundTime: number
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  color: string
  life: number
  maxLife: number
  size: number
}

interface FloatingText {
  text: string
  x: number
  y: number
  vy: number
  life: number
  maxLife: number
  color: string
  scale: number
}

/**
 * @brief Renders Tung Tung Tung Sahur chasing the cursor, with interactive falling bat drops and "TUNG TUNG TUNG SAHUR" combo whacking.
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
      vx: 0,
      vy: 0,
      stun: 0,
      dizzySpin: 0,
    }
    pet.dir = pet.x < 0 ? 1 : -1
    const attack = createAttackState()

    const playerBat = {
      equipped: false,
      swinging: false,
      swingT: 0,
      prevAngle: -0.7,
    }

    const fallingBats: FallingBat[] = []
    const particles: Particle[] = []
    const floatingTexts: FloatingText[] = []

    let comboCount = 0
    let lastHitTime = 0

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

    const hitSahur = (hitX: number, hitY: number) => {
      const now = performance.now()
      if (now - lastHitTime > 4000) {
        comboCount = 0
      }
      comboCount++
      lastHitTime = now

      const hitIndex = (comboCount - 1) % 4
      const isSahur = hitIndex === 3
      const word = isSahur ? 'SAHUR' : 'TUNG'

      window.dispatchEvent(
        new CustomEvent(BRAINROT_TUNG_HIT_EVENT, {
          detail: { count: comboCount, word, index: hitIndex },
        })
      )

      floatingTexts.push({
        text: isSahur ? '💥 SAHUR !!!' : '🪵 TUNG !',
        x: pet.x,
        y: pet.y - 50,
        vy: isSahur ? -2.6 : -1.8,
        life: isSahur ? 55 : 32,
        maxLife: isSahur ? 55 : 32,
        color: isSahur ? '#ec4899' : '#facc15',
        scale: isSahur ? 1.5 : 1.1,
      })

      const particleCount = isSahur ? 24 : 14
      for (let i = 0; i < particleCount; i++) {
        const a = Math.random() * Math.PI * 2
        const spd = 1.5 + Math.random() * (isSahur ? 5 : 3)
        particles.push({
          x: (hitX + pet.x) / 2,
          y: pet.y - 34,
          vx: Math.cos(a) * spd,
          vy: Math.sin(a) * spd - (isSahur ? 3.5 : 1.8),
          color: isSahur
            ? ['#f43f5e', '#ec4899', '#fde047', '#38bdf8', '#a855f7'][i % 5]
            : ['#fde047', '#e2ab6f', '#ffffff', '#b77946'][i % 4],
          life: 25 + Math.random() * 15,
          maxLife: 40,
          size: 2 + Math.random() * (isSahur ? 3 : 2),
        })
      }

      const dirFromHit = pet.x >= hitX ? 1 : -1
      pet.vx = dirFromHit * (isSahur ? 22 : 12)
      pet.vy = isSahur ? -15 : -7
      pet.stun = isSahur ? 80 : 35
      pet.dizzySpin = isSahur ? Math.PI * 4 : 0
      pet.dir = -dirFromHit
    }

    const handlePointerDown = (e: MouseEvent) => {
      if (e.target instanceof Element && e.target.closest('#tung-header-button')) {
        return
      }

      if (playerBat.equipped) {
        playerBat.swinging = true
        playerBat.swingT = 0

        const cx = Math.min(width - 1, Math.max(0, mouse.x + offset.x))
        const cy = Math.min(height - 1, Math.max(0, mouse.y + offset.y))
        const sx = pet.x
        const sy = pet.y - 34
        if (Math.hypot(cx - sx, cy - sy) < 68) {
          hitSahur(cx, cy)
        }
      }
    }

    const handleDropBat = () => {
      const targetX = mouse.present ? mouse.x + (Math.random() - 0.5) * 24 : width / 2
      fallingBats.push({
        id: Math.random(),
        x: targetX,
        y: -30,
        vx: (Math.random() - 0.5) * 1.5,
        vy: 2.2,
        rot: Math.random() * Math.PI,
        vRot: 0.12 * (Math.random() > 0.5 ? 1 : -1),
        grounded: false,
        groundTime: 0,
      })
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key === 't' || e.key === 'T') {
        handleDropBat()
      }
    }

    window.addEventListener('mousemove', handleMove)
    window.addEventListener('resize', resize)
    window.addEventListener('blur', handleLeave)
    document.addEventListener('mouseleave', handleLeave)
    window.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener(BRAINROT_DROP_BAT_EVENT, handleDropBat)

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

      const isStunned = pet.stun > 0
      if (isStunned) {
        pet.x += pet.vx * dtFrames
        pet.y += pet.vy * dtFrames
        pet.vy += 0.5 * dtFrames
        pet.vx *= 0.94
        if (pet.y >= height - GROUND_OFFSET) {
          pet.y = height - GROUND_OFFSET
          pet.vy = -pet.vy * 0.35
          if (Math.abs(pet.vy) < 0.8) pet.vy = 0
        }
        pet.x = Math.max(15, Math.min(width - 15, pet.x))
        pet.stun -= dtFrames
        if (pet.stun < 0) pet.stun = 0
      }

      const attacking = attack.phase !== 'idle'
      let targetX = width / 2
      let targetY = height - GROUND_OFFSET
      if (mouse.present) {
        if (!attacking && !isStunned && Math.abs(cx - pet.x) > 20) {
          pet.dir = cx > pet.x ? 1 : -1
        }
        targetX = cx - pet.dir * REACH_X
        targetY = Math.min(height - 4, Math.max(40, cy + REACH_Y))
      }

      let nearTarget = false
      if (!isStunned && (!attacking || !mouse.present)) {
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
      const frame = stepAttack(attack, dtFrames, !isStunned && mouse.present && nearTarget, f)

      if (!isStunned && frame.hitCrossed) {
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

      for (let i = fallingBats.length - 1; i >= 0; i--) {
        const b = fallingBats[i]
        if (!b.grounded) {
          b.vy += 0.45 * dtFrames
          b.x += b.vx * dtFrames
          b.y += b.vy * dtFrames
          b.rot += b.vRot * dtFrames

          if (Math.hypot(b.x - pet.x, b.y - (pet.y - 45)) < 26) {
            hitSahur(b.x, b.y)
            b.vy = -4
            b.vx = b.x > pet.x ? 2.5 : -2.5
          }

          if (mouse.present && Math.hypot(b.x - cx, b.y - cy) < 36) {
            playerBat.equipped = true
            fallingBats.splice(i, 1)
            continue
          }

          if (b.y >= height - GROUND_OFFSET) {
            b.y = height - GROUND_OFFSET
            b.grounded = true
            b.vy = -b.vy * 0.3
            if (Math.abs(b.vy) < 0.8) b.vy = 0
          }
        } else {
          b.groundTime += dtFrames
          if (mouse.present && Math.hypot(b.x - cx, b.y - cy) < 28) {
            playerBat.equipped = true
            fallingBats.splice(i, 1)
            continue
          }
          if (b.groundTime > 300) {
            fallingBats.splice(i, 1)
            continue
          }
        }

        shadow(Math.round(b.x), height - GROUND_OFFSET + 2, 10, 3)
        ctx.save()
        ctx.translate(Math.round(b.x), Math.round(b.y))
        drawBatSprite(ctx, b.rot)
        ctx.restore()
      }

      const shake =
        attack.hitStop > 0
          ? (Math.random() - 0.5) * 3
          : pet.stun > 20
            ? (Math.random() - 0.5) * 4
            : 0

      const groundY = Math.round(pet.y)
      shadow(Math.round(pet.x), groundY + 2, 14, 4)
      ctx.save()
      ctx.translate(Math.round(pet.x + shake), Math.round(pet.y - bounce - frame.hop + frame.crouch))
      ctx.scale(pet.dir, 1)

      if (pet.dizzySpin > 0 && pet.stun > 0) {
        ctx.rotate((pet.stun / 80) * pet.dizzySpin)
      } else {
        ctx.rotate(frame.lean * 0.035)
      }

      drawSahurBody(ctx, 0, 0)

      if (pet.stun > 0) {
        ctx.fillStyle = '#ef4444'
        ctx.fillRect(-6, -57, 4, 1)
        ctx.fillRect(-5, -58, 1, 3)
        ctx.fillRect(2, -57, 4, 1)
        ctx.fillRect(3, -58, 1, 3)
      }

      drawBatterArm(ctx, frame.angle, frame.trailFrom)
      ctx.restore()

      if (pet.stun > 0) {
        const starCount = 3
        const orbitTime = f * 0.15
        for (let i = 0; i < starCount; i++) {
          const a = orbitTime + (i * Math.PI * 2) / starCount
          const sx = pet.x + Math.cos(a) * 13
          const sy = pet.y - 72 + Math.sin(a) * 4
          ctx.fillStyle = '#fde047'
          ctx.fillRect(Math.round(sx - 1), Math.round(sy - 1), 3, 3)
          ctx.fillStyle = '#ffffff'
          ctx.fillRect(Math.round(sx), Math.round(sy), 1, 1)
        }
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.x += p.vx * dtFrames
        p.y += p.vy * dtFrames
        p.vy += 0.25 * dtFrames
        p.life -= dtFrames
        if (p.life <= 0) {
          particles.splice(i, 1)
          continue
        }
        ctx.save()
        ctx.globalAlpha = Math.max(0, p.life / p.maxLife)
        ctx.fillStyle = p.color
        ctx.fillRect(Math.round(p.x), Math.round(p.y), Math.round(p.size), Math.round(p.size))
        ctx.restore()
      }

      for (let i = floatingTexts.length - 1; i >= 0; i--) {
        const t = floatingTexts[i]
        t.y += t.vy * dtFrames
        t.life -= dtFrames
        if (t.life <= 0) {
          floatingTexts.splice(i, 1)
          continue
        }
        const alpha = Math.max(0, t.life / t.maxLife)
        ctx.save()
        ctx.globalAlpha = alpha
        ctx.font = `bold ${Math.round(11 * t.scale)}px monospace`
        ctx.textAlign = 'center'
        ctx.lineWidth = 3
        ctx.strokeStyle = '#000000'
        ctx.strokeText(t.text, Math.round(t.x), Math.round(t.y))
        ctx.fillStyle = t.color
        ctx.fillText(t.text, Math.round(t.x), Math.round(t.y))
        ctx.restore()
      }

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

        if (playerBat.equipped) {
          let batAngle = -0.7
          let swooshTrail: number | null = null

          if (playerBat.swinging) {
            playerBat.swingT += dtFrames / 7
            const p = Math.min(1, playerBat.swingT)
            batAngle = -1.3 + p * 3.0
            swooshTrail = playerBat.prevAngle
            if (p >= 1) {
              playerBat.swinging = false
              playerBat.swingT = 0
            }
          } else {
            batAngle = -0.7 + Math.sin(f * 0.1) * 0.05
          }
          playerBat.prevAngle = batAngle

          ctx.save()
          ctx.translate(Math.round(cx + 6), Math.round(cy + 4))

          if (playerBat.swinging && swooshTrail !== null) {
            ctx.fillStyle = 'rgba(253, 224, 71, 0.45)'
            ctx.beginPath()
            ctx.arc(0, 0, 30, swooshTrail - Math.PI / 2, batAngle - Math.PI / 2, false)
            ctx.arc(0, 0, 10, batAngle - Math.PI / 2, swooshTrail - Math.PI / 2, true)
            ctx.closePath()
            ctx.fill()
          }

          drawBatSprite(ctx, batAngle)
          ctx.restore()
        }
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
      window.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener(BRAINROT_DROP_BAT_EVENT, handleDropBat)
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
