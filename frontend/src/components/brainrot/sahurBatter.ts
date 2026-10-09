export const BAT_LENGTH = 26
export const SHOULDER_X = 10
export const SHOULDER_Y = 41
export const HIT_ANGLE = -1.15
export const REACH_X = SHOULDER_X - Math.sin(HIT_ANGLE) * BAT_LENGTH
export const REACH_Y = SHOULDER_Y - Math.cos(HIT_ANGLE) * BAT_LENGTH
export const HIT_RADIUS = 28
export const HIT_STOP_FRAMES = 5

const REST_ANGLE = 0.15
const WINDUP_ANGLE = -3.3
const FOLLOW_THROUGH_ANGLE = -0.2
const WINDUP_FRAMES = 20
const SWING_FRAMES = 6
const RECOVER_FRAMES = 22
const COOLDOWN_FRAMES = 14
const TRAIL_LENGTH = 3

type AttackPhase = 'idle' | 'windup' | 'swing' | 'recover'

export interface AttackState {
  phase: AttackPhase
  t: number
  cooldown: number
  hitStop: number
  hit: boolean
  prevAngle: number
  trail: number[]
}

export interface AttackFrame {
  angle: number
  lean: number
  crouch: number
  hop: number
  hitCrossed: boolean
  trailFrom: number | null
}

/**
 * @brief Creates the initial state of the batter's attack animation.
 * @return An idle attack state with no cooldown.
 */
export function createAttackState(): AttackState {
  return { phase: 'idle', t: 0, cooldown: 0, hitStop: 0, hit: false, prevAngle: REST_ANGLE, trail: [] }
}

const easeOutCubic = (p: number) => 1 - Math.pow(1 - p, 3)
const easeInQuad = (p: number) => p * p

/**
 * @brief Advances the attack animation (idle, wind-up, swing, recover) by one step.
 * @param a Attack state, mutated in place.
 * @param dt Elapsed time in 60 fps frames.
 * @param canStart Whether the batter is in position and may begin a new swing.
 * @param f Global animation frame, used for the idle sway.
 * @return The arm angle, body offsets and whether the bat crossed the impact angle on this step.
 */
export function stepAttack(a: AttackState, dt: number, canStart: boolean, f: number): AttackFrame {
  if (a.hitStop > 0) {
    a.hitStop -= dt
    return { angle: HIT_ANGLE, lean: 4, crouch: 0, hop: 2, hitCrossed: false, trailFrom: a.trail[0] ?? null }
  }

  let angle = REST_ANGLE
  let lean = 0
  let crouch = 0
  let hop = 0
  let hitCrossed = false
  let trailFrom: number | null = null

  if (a.phase === 'idle') {
    a.cooldown -= dt
    if (canStart && a.cooldown <= 0) {
      a.phase = 'windup'
      a.t = 0
      a.hit = false
    }
    angle = REST_ANGLE + Math.sin(f * 0.1) * 0.05
  } else if (a.phase === 'windup') {
    a.t += dt
    const p = Math.min(1, a.t / WINDUP_FRAMES)
    const e = easeOutCubic(p)
    angle = REST_ANGLE + (WINDUP_ANGLE - REST_ANGLE) * e
    if (p > 0.7) angle += Math.sin(a.t * 2.5) * 0.06
    crouch = 2 * e
    lean = -3 * e
    if (p >= 1) {
      a.phase = 'swing'
      a.t = 0
      a.trail = []
    }
  } else if (a.phase === 'swing') {
    a.t += dt
    const p = Math.min(1, a.t / SWING_FRAMES)
    angle = WINDUP_ANGLE + (FOLLOW_THROUGH_ANGLE - WINDUP_ANGLE) * easeInQuad(p)
    lean = 4
    hop = Math.sin(p * Math.PI) * 3
    if (!a.hit && a.prevAngle < HIT_ANGLE && angle >= HIT_ANGLE) {
      a.hit = true
      hitCrossed = true
      angle = HIT_ANGLE
    }
    a.trail.push(angle)
    if (a.trail.length > TRAIL_LENGTH) a.trail.shift()
    trailFrom = a.trail[0]
    if (p >= 1) {
      a.phase = 'recover'
      a.t = 0
    }
  } else {
    a.t += dt
    const p = Math.min(1, a.t / RECOVER_FRAMES)
    angle = FOLLOW_THROUGH_ANGLE + (REST_ANGLE - FOLLOW_THROUGH_ANGLE) * easeOutCubic(p)
    lean = 4 * (1 - p)
    if (p >= 1) {
      a.phase = 'idle'
      a.cooldown = COOLDOWN_FRAMES
    }
  }

  a.prevAngle = angle
  return { angle, lean, crouch, hop, hitCrossed, trailFrom }
}

/**
 * @brief Draws the batter's right arm and baseball bat rotated around the shoulder, with an optional swing swoosh.
 * @param ctx 2D context to draw on, already translated to the feet and flipped for the facing direction.
 * @param angle Canvas rotation of the arm: 0 hangs straight down, negative lifts the bat forward and up, positive goes back.
 * @param trailFrom Earlier arm angle of the swing; when set, a white swoosh is drawn between it and the current angle.
 */
export function drawBatterArm(ctx: CanvasRenderingContext2D, angle: number, trailFrom: number | null): void {
  ctx.fillStyle = '#b77946'
  ctx.fillRect(6, -SHOULDER_Y - 2, 6, 3)

  ctx.save()
  ctx.translate(SHOULDER_X, -SHOULDER_Y)

  if (trailFrom !== null && angle - trailFrom > 0.15) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)'
    ctx.beginPath()
    ctx.arc(0, 0, BAT_LENGTH + 2, trailFrom + Math.PI / 2, angle + Math.PI / 2, false)
    ctx.arc(0, 0, 16, angle + Math.PI / 2, trailFrom + Math.PI / 2, true)
    ctx.closePath()
    ctx.fill()
  }

  ctx.rotate(angle)
  ctx.fillStyle = '#b77946'
  ctx.fillRect(-1.5, 0, 3, 6)
  ctx.fillStyle = '#804f23'
  ctx.fillRect(-1.5, 5, 3, 3)
  ctx.fillStyle = '#e2ab6f'
  ctx.fillRect(-2, 8, 4, 18)
  ctx.fillRect(-3, 18, 6, 8)
  ctx.fillStyle = '#c98a4d'
  ctx.fillRect(1, 9, 1, 16)
  ctx.fillStyle = '#fde68a'
  ctx.fillRect(-3, 25, 6, 1)
  ctx.restore()
}

export function drawBatSprite(ctx: CanvasRenderingContext2D, angle: number): void {
  ctx.save()
  ctx.rotate(angle)
  ctx.fillStyle = '#b77946'
  ctx.fillRect(-1.5, -4, 3, 6)
  ctx.fillStyle = '#804f23'
  ctx.fillRect(-1.5, 2, 3, 3)
  ctx.fillStyle = '#e2ab6f'
  ctx.fillRect(-2, 5, 4, 18)
  ctx.fillRect(-3, 15, 6, 8)
  ctx.fillStyle = '#c98a4d'
  ctx.fillRect(1, 6, 1, 16)
  ctx.fillStyle = '#fde68a'
  ctx.fillRect(-3, 22, 6, 1)
  ctx.restore()
}
