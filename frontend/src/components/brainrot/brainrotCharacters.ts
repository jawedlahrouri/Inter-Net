/**
 * @brief Returns the size in CSS pixels of one virtual art pixel, smaller on narrow screens so the troupe still fits.
 * @return The integer scale between virtual art pixels and CSS pixels.
 */
export function getPixelScale(): number {
  return window.innerWidth < 700 ? 2 : 3
}

type Ctx = CanvasRenderingContext2D
type ShadowFn = (x: number, y: number, width: number, height: number) => void

export interface BrainrotCharacter {
  id: string
  name: string
  subtitle: string
  draw: (ctx: Ctx, x: number, y: number, f: number, bounce: number, react: number, shadow: ShadowFn) => void
}

/**
 * @brief Computes the hovering baseline of the flying character.
 * @param baseY Ground Y coordinate of the character.
 * @param f Current animation frame.
 * @return The Y coordinate of the hovering character.
 */
function cyHover(baseY: number, f: number): number {
  return baseY - 12 + Math.sin(f * 0.15) * 6
}

/**
 * @brief Draws Tung Tung Tung Sahur without his bat arm: legs, wooden body, face and left arm.
 * @param ctx 2D context to draw on.
 * @param x Horizontal center of the character.
 * @param cy Vertical position of the feet.
 */
export function drawSahurBody(ctx: Ctx, x: number, cy: number): void {
  ctx.fillStyle = '#8d5b34'
  ctx.fillRect(x - 5, cy - 24, 3, 24)
  ctx.fillRect(x + 2, cy - 24, 3, 24)
  ctx.fillStyle = '#b77946'
  ctx.fillRect(x - 9, cy - 2, 7, 3)
  ctx.fillRect(x + 2, cy - 2, 7, 3)
  ctx.fillStyle = '#8d5b34'
  ctx.fillRect(x - 9, cy - 2, 2, 1)
  ctx.fillRect(x + 7, cy - 2, 2, 1)

  ctx.fillStyle = '#b77946'
  ctx.fillRect(x - 8, cy - 65, 16, 42)
  ctx.fillStyle = '#9e6132'
  ctx.fillRect(x - 7, cy - 60, 2, 34)
  ctx.fillRect(x + 2, cy - 54, 2, 28)
  ctx.fillRect(x - 6, cy - 68, 12, 3)

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(x - 7, cy - 58, 6, 8)
  ctx.fillRect(x + 1, cy - 58, 6, 8)
  ctx.fillStyle = '#111111'
  ctx.fillRect(x - 5, cy - 56, 4, 5)
  ctx.fillRect(x + 3, cy - 56, 4, 5)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(x - 5, cy - 56, 1, 1)
  ctx.fillRect(x + 3, cy - 56, 1, 1)

  ctx.fillStyle = '#7a4823'
  ctx.fillRect(x - 1, cy - 51, 2, 6)
  ctx.fillRect(x - 5, cy - 43, 10, 2)
  ctx.fillRect(x + 4, cy - 44, 2, 2)

  ctx.fillStyle = '#b77946'
  ctx.fillRect(x - 10, cy - 44, 3, 16)
}

export const BRAINROT_CHARACTERS: BrainrotCharacter[] = [
  {
    id: 'sahur',
    name: 'Tung Tung Tung Sahur',
    subtitle: 'Kentongan en bois & batte',
    draw(ctx, x, y, f, bounce, react, shadow) {
      const cy = y - bounce - react
      shadow(x, y + 2, 14, 4)
      drawSahurBody(ctx, x, cy)

      const strikeAngle = Math.sin(f * 0.25) * 6
      ctx.fillStyle = '#b77946'
      ctx.fillRect(x + 6, cy - 42, 5, 3)

      ctx.fillStyle = '#e2ab6f'
      const batX = x + 10
      const batY = cy - 44 + strikeAngle
      ctx.fillRect(batX, batY, 4, 20)
      ctx.fillStyle = '#804f23'
      ctx.fillRect(batX + 1, batY - 2, 2, 4)

      if (Math.sin(f * 0.25) > 0.8) {
        ctx.fillStyle = '#fde047'
        ctx.fillRect(batX + 5, batY + 14, 3, 3)
      }
    },
  },
  {
    id: 'patapim',
    name: 'Brr Brr Patapim',
    subtitle: 'Singe-arbre aux longues racines',
    draw(ctx, x, y, f, bounce, react, shadow) {
      const cy = y - bounce * 0.7 - react
      shadow(x + 2, y + 2, 26, 4)

      ctx.fillStyle = '#a27b5c'
      ctx.fillRect(x - 18, cy - 5, 20, 6)
      ctx.fillRect(x + 4, cy - 5, 18, 6)

      ctx.fillStyle = '#6f4e37'
      ctx.fillRect(x - 14, cy - 30, 8, 26)
      ctx.fillRect(x + 8, cy - 30, 8, 26)
      ctx.fillStyle = '#22722b'
      ctx.fillRect(x - 15, cy - 24, 2, 12)
      ctx.fillRect(x - 11, cy - 16, 2, 8)
      ctx.fillRect(x + 7, cy - 22, 3, 14)

      ctx.fillStyle = '#f5ede0'
      ctx.fillRect(x - 8, cy - 40, 16, 14)
      ctx.fillRect(x - 10, cy - 36, 20, 8)

      ctx.fillStyle = '#d9986b'
      ctx.fillRect(x - 6, cy - 50, 14, 13)

      const noseSway = Math.sin(f * 0.18) * 1.5
      ctx.fillStyle = '#ea8b60'
      ctx.fillRect(x - 2 + noseSway, cy - 44, 7, 18)
      ctx.fillStyle = '#c76e46'
      ctx.fillRect(x - 1 + noseSway, cy - 28, 5, 3)

      ctx.fillStyle = '#2d1b0d'
      ctx.fillRect(x - 4, cy - 48, 3, 2)
      ctx.fillRect(x + 4, cy - 48, 3, 2)

      ctx.fillStyle = '#1e5f29'
      ctx.fillRect(x - 14, cy - 58, 28, 9)
      ctx.fillRect(x - 10, cy - 64, 20, 7)
      ctx.fillStyle = '#2ca03d'
      ctx.fillRect(x - 8, cy - 62, 5, 4)
      ctx.fillRect(x + 2, cy - 60, 6, 4)
      ctx.fillRect(x - 12, cy - 54, 4, 3)
    },
  },
  {
    id: 'tralalelo',
    name: 'Tralalelo Tralala',
    subtitle: 'Requin bleu aux baskets chantant',
    draw(ctx, x, y, f, bounce, react, shadow) {
      const cy = y - bounce - react
      const groove = Math.sin(f * 0.2) * 3
      shadow(x, y + 2, 16, 4)

      ctx.fillStyle = '#0284c7'
      ctx.fillRect(x - 6, cy - 14, 4, 10)
      ctx.fillRect(x + 3, cy - 14, 4, 10)

      ctx.fillStyle = '#ffffff'
      ctx.fillRect(x - 9, cy - 5, 8, 5)
      ctx.fillRect(x + 2, cy - 5, 8, 5)
      ctx.fillStyle = '#0284c7'
      ctx.fillRect(x - 8, cy - 4, 6, 2)
      ctx.fillRect(x + 3, cy - 4, 6, 2)

      ctx.fillStyle = '#0284c7'
      ctx.fillRect(x - 8 + groove, cy - 38, 17, 26)
      ctx.fillStyle = '#e0f2fe'
      ctx.fillRect(x - 4 + groove, cy - 33, 9, 20)

      ctx.fillStyle = '#0369a1'
      const tailWave = Math.sin(f * 0.25) * 2
      ctx.fillRect(x - 14 + groove + tailWave, cy - 24, 7, 5)
      ctx.fillRect(x - 17 + groove + tailWave, cy - 28, 4, 13)

      ctx.fillStyle = '#0284c7'
      ctx.fillRect(x - 7 + groove, cy - 48, 15, 12)
      ctx.fillRect(x - 9 + groove, cy - 45, 3, 7)

      ctx.fillStyle = '#0369a1'
      ctx.fillRect(x - 12 + groove, cy - 43, 5, 6)

      ctx.fillStyle = '#0f172a'
      ctx.fillRect(x - 5 + groove, cy - 45, 12, 4)
      ctx.fillStyle = '#38bdf8'
      ctx.fillRect(x - 4 + groove, cy - 45, 3, 2)

      ctx.fillStyle = '#881337'
      ctx.fillRect(x - 4 + groove, cy - 39, 9, 5)
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(x - 3 + groove, cy - 39, 7, 1)
      ctx.fillRect(x - 3 + groove, cy - 35, 7, 1)

      ctx.fillStyle = '#64748b'
      ctx.fillRect(x + 9 + groove, cy - 40, 2, 10)
      ctx.fillStyle = '#94a3b8'
      ctx.fillRect(x + 8 + groove, cy - 44, 4, 4)

      if (f % 24 < 12) {
        ctx.fillStyle = '#38bdf8'
        ctx.fillRect(x + 15 + groove, cy - 48, 2, 4)
        ctx.fillRect(x + 17 + groove, cy - 48, 2, 2)
      }
    },
  },
  {
    id: 'tripi',
    name: 'Tripi Tropi',
    subtitle: 'Hybride chat & crevette/poisson',
    draw(ctx, x, y, f, bounce, react, shadow) {
      const cy = y - bounce * 1.2 - react
      const wobble = Math.sin(f * 0.3) * 2
      shadow(x, y + 2, 14, 4)

      ctx.fillStyle = '#f87171'
      ctx.fillRect(x - 10, cy - 10, 10, 8)
      ctx.fillStyle = '#fb923c'
      ctx.fillRect(x - 15, cy - 14, 7, 6)
      ctx.fillStyle = '#f43f5e'
      const finWave = Math.sin(f * 0.35) * 2
      ctx.fillRect(x - 20, cy - 18 + finWave, 6, 12)
      ctx.fillRect(x - 22, cy - 20 + finWave, 3, 16)

      ctx.fillStyle = '#fed7aa'
      ctx.fillRect(x - 5, cy - 15, 16, 14)
      ctx.fillStyle = '#fff7ed'
      ctx.fillRect(x - 2, cy - 12, 11, 10)

      ctx.fillStyle = '#fb923c'
      ctx.fillRect(x + 2, cy - 2, 3, 3)
      ctx.fillRect(x + 8, cy - 2, 3, 3)

      const hx = x + 3 + wobble
      const hy = cy - 28
      ctx.fillStyle = '#fed7aa'
      ctx.fillRect(hx - 8, hy, 16, 14)

      ctx.fillStyle = '#ea580c'
      ctx.fillRect(hx - 8, hy - 4, 4, 5)
      ctx.fillRect(hx + 4, hy - 4, 4, 5)
      ctx.fillStyle = '#fda4af'
      ctx.fillRect(hx - 6, hy - 2, 2, 2)
      ctx.fillRect(hx + 4, hy - 2, 2, 2)

      ctx.fillStyle = '#1e1b4b'
      ctx.fillRect(hx - 6, hy + 4, 4, 5)
      ctx.fillRect(hx + 2, hy + 4, 4, 5)
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(hx - 6, hy + 4, 2, 2)
      ctx.fillRect(hx + 2, hy + 4, 2, 2)

      ctx.fillStyle = '#fb7185'
      ctx.fillRect(hx - 8, hy + 8, 2, 2)
      ctx.fillRect(hx + 6, hy + 8, 2, 2)
      ctx.fillStyle = '#e11d48'
      ctx.fillRect(hx - 1, hy + 9, 3, 2)
    },
  },
  {
    id: 'balerina',
    name: 'Ballerina Cappuccina',
    subtitle: 'Danseuse étoile à tête de tasse de cappuccino',
    draw(ctx, x, y, f, bounce, react, shadow) {
      const sway = Math.sin(f * 0.22)
      const cy = y - Math.abs(bounce * 1.2) - react
      shadow(x, y + 2, 14, 3)

      const skin = '#fcd5b5'

      // Jambe d'appui sur pointe
      ctx.fillStyle = skin
      ctx.fillRect(x - 2, cy - 20, 2, 17)
      ctx.fillStyle = '#f9a8d4'
      ctx.fillRect(x - 3, cy - 3, 3, 3)
      ctx.fillStyle = '#ec4899'
      ctx.fillRect(x - 2, cy - 1, 2, 1)

      // Jambe levée en arabesque, qui ondule
      const lift = Math.round(sway * 2)
      ctx.fillStyle = skin
      ctx.fillRect(x + 1, cy - 21, 3, 2)
      ctx.fillRect(x + 4, cy - 23 + lift, 3, 2)
      ctx.fillRect(x + 7, cy - 25 + lift, 3, 2)
      ctx.fillRect(x + 10, cy - 27 + lift, 3, 2)
      ctx.fillStyle = '#f9a8d4'
      ctx.fillRect(x + 12, cy - 29 + lift, 3, 3)

      // Tutu plissé
      const tutuHalf = 11 + Math.round(sway * 2)
      ctx.fillStyle = '#f472b6'
      ctx.fillRect(x - tutuHalf, cy - 26, tutuHalf * 2, 5)
      ctx.fillStyle = '#fbcfe8'
      ctx.fillRect(x - tutuHalf, cy - 28, tutuHalf * 2, 2)
      ctx.fillStyle = '#ec4899'
      for (let i = -tutuHalf; i < tutuHalf; i += 4) {
        ctx.fillRect(x + i, cy - 21, 2, 2)
      }

      // Buste (justaucorps)
      ctx.fillStyle = '#f9a8d4'
      ctx.fillRect(x - 4, cy - 40, 8, 12)
      ctx.fillStyle = '#fdf2f8'
      ctx.fillRect(x - 4, cy - 40, 8, 2)
      ctx.fillRect(x - 1, cy - 38, 2, 8)

      // Bras droit tendu sur le côté, légère vague
      const wave = Math.round(Math.sin(f * 0.22 + 1) * 1.5)
      ctx.fillStyle = skin
      ctx.fillRect(x + 4, cy - 39, 5, 2)
      ctx.fillRect(x + 9, cy - 40 + wave, 5, 2)
      ctx.fillRect(x + 14, cy - 41 + wave, 2, 2)

      // Bras gauche arrondi au-dessus de la tête
      ctx.fillRect(x - 7, cy - 40, 3, 2)
      ctx.fillRect(x - 10, cy - 46, 3, 7)
      ctx.fillRect(x - 10, cy - 54, 3, 8)
      ctx.fillRect(x - 8, cy - 60, 4, 6)
      ctx.fillRect(x - 5, cy - 63, 5, 3)
      ctx.fillRect(x - 1, cy - 62, 2, 2)

      // Tête : tasse de cappuccino
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(x - 7, cy - 55, 14, 5)
      ctx.fillRect(x - 6, cy - 50, 12, 5)
      ctx.fillRect(x - 5, cy - 45, 10, 4)
      ctx.fillStyle = '#e2e8f0'
      ctx.fillRect(x - 5, cy - 42, 10, 1)
      ctx.fillRect(x + 4, cy - 54, 2, 11)

      // Anse
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(x + 7, cy - 53, 4, 2)
      ctx.fillRect(x + 9, cy - 53, 2, 8)
      ctx.fillRect(x + 6, cy - 46, 5, 2)

      // Café, mousse et cœur en latte art
      ctx.fillStyle = '#78350f'
      ctx.fillRect(x - 7, cy - 57, 14, 3)
      ctx.fillStyle = '#d6a36b'
      ctx.fillRect(x - 6, cy - 58, 12, 2)
      ctx.fillStyle = '#fef3c7'
      ctx.fillRect(x - 3, cy - 57, 2, 2)
      ctx.fillRect(x + 1, cy - 57, 2, 2)
      ctx.fillRect(x - 2, cy - 55, 4, 1)

      // Visage : yeux fermés, joues et sourire
      ctx.fillStyle = '#44403c'
      ctx.fillRect(x - 5, cy - 50, 3, 1)
      ctx.fillRect(x + 2, cy - 50, 3, 1)
      ctx.fillRect(x - 5, cy - 49, 1, 1)
      ctx.fillRect(x + 4, cy - 49, 1, 1)
      ctx.fillStyle = '#fda4af'
      ctx.fillRect(x - 6, cy - 47, 2, 2)
      ctx.fillRect(x + 4, cy - 47, 2, 2)
      ctx.fillStyle = '#e11d48'
      ctx.fillRect(x - 1, cy - 46, 2, 1)
    },
  },
  {
    id: 'assassino',
    name: 'Assassino Capuchino',
    subtitle: 'Tasse ninja noire armée de katanas',
    draw(ctx, x, y, f, bounce, react, shadow) {
      const cy = y - bounce * 0.8 - react
      const crouch = Math.abs(Math.sin(f * 0.2)) * 2
      shadow(x, y + 2, 14, 4)

      ctx.fillStyle = '#1e1b4b'
      ctx.fillRect(x - 7, cy - 23 + crouch, 14, 15)

      ctx.fillStyle = '#0f172a'
      ctx.fillRect(x - 6, cy - 8 + crouch, 4, 8)
      ctx.fillRect(x + 2, cy - 8 + crouch, 4, 8)

      ctx.fillStyle = '#dc2626'
      ctx.fillRect(x - 8, cy - 20 + crouch, 16, 3)
      const ribbonSway = Math.sin(f * 0.3) * 3
      ctx.fillRect(x - 11, cy - 19 + crouch + ribbonSway, 4, 2)
      ctx.fillRect(x - 14, cy - 18 + crouch + ribbonSway, 4, 2)

      ctx.fillStyle = '#f8fafc'
      ctx.fillRect(x - 5, cy - 16 + crouch, 3, 2)
      ctx.fillRect(x + 2, cy - 16 + crouch, 3, 2)
      ctx.fillStyle = '#ef4444'
      ctx.fillRect(x - 4, cy - 16 + crouch, 1, 1)
      ctx.fillRect(x + 3, cy - 16 + crouch, 1, 1)

      ctx.fillStyle = '#475569'
      ctx.fillRect(x - 3, cy - 27 + crouch, 6, 4)

      ctx.fillStyle = '#cbd5e1'
      ctx.fillRect(x - 11, cy - 32 + crouch, 2, 16)
      ctx.fillRect(x + 9, cy - 32 + crouch, 2, 16)

      ctx.fillStyle = '#eab308'
      ctx.fillRect(x - 13, cy - 16 + crouch, 6, 2)
      ctx.fillRect(x + 7, cy - 16 + crouch, 6, 2)

      ctx.fillStyle = '#ffffff'
      ctx.fillRect(x - 11, cy - 28 + crouch, 1, 6)
      ctx.fillRect(x + 9, cy - 28 + crouch, 1, 6)
    },
  },
  {
    id: 'mewol',
    name: 'Le Mewol (Meowl)',
    subtitle: 'Hybride chat & chouette/hibou ailé',
    draw(ctx, x, y, f, _bounce, react, shadow) {
      const wingFlap = Math.sin(f * 0.35)
      const flightY = cyHover(y, f) - react
      shadow(x, y + 2, 16, 3)

      ctx.fillStyle = '#a16207'
      ctx.fillRect(x - 7, flightY - 24, 14, 16)
      ctx.fillStyle = '#fef08a'
      ctx.fillRect(x - 4, flightY - 20, 8, 10)
      ctx.fillStyle = '#854d0e'
      ctx.fillRect(x - 2, flightY - 18, 2, 2)
      ctx.fillRect(x + 1, flightY - 14, 2, 2)

      ctx.fillStyle = '#eab308'
      ctx.fillRect(x - 5, flightY - 7, 3, 3)
      ctx.fillRect(x + 2, flightY - 7, 3, 3)

      const wingH = Math.floor(wingFlap * 7)
      ctx.fillStyle = '#ca8a04'
      ctx.fillRect(x - 20, flightY - 25 - wingH, 14, 7)
      ctx.fillRect(x - 22, flightY - 22 - wingH, 6, 5)
      ctx.fillRect(x + 6, flightY - 25 - wingH, 14, 7)
      ctx.fillRect(x + 16, flightY - 22 - wingH, 6, 5)

      ctx.fillStyle = '#78350f'
      ctx.fillRect(x - 22, flightY - 24 - wingH, 3, 3)
      ctx.fillRect(x + 19, flightY - 24 - wingH, 3, 3)

      ctx.fillStyle = '#d97706'
      ctx.fillRect(x - 8, flightY - 37, 16, 14)

      ctx.fillStyle = '#92400e'
      ctx.fillRect(x - 8, flightY - 43, 4, 6)
      ctx.fillRect(x + 4, flightY - 43, 4, 6)
      ctx.fillStyle = '#fed7aa'
      ctx.fillRect(x - 6, flightY - 40, 2, 3)
      ctx.fillRect(x + 4, flightY - 40, 2, 3)

      ctx.fillStyle = '#facc15'
      ctx.fillRect(x - 6, flightY - 33, 4, 5)
      ctx.fillRect(x + 2, flightY - 33, 4, 5)
      ctx.fillStyle = '#0f172a'
      ctx.fillRect(x - 5, flightY - 33, 2, 5)
      ctx.fillRect(x + 3, flightY - 33, 2, 5)

      ctx.fillStyle = '#fef3c7'
      ctx.fillRect(x - 3, flightY - 27, 6, 4)
      ctx.fillStyle = '#ef4444'
      ctx.fillRect(x - 1, flightY - 27, 2, 2)
    },
  },
  {
    id: 'skibidi',
    name: 'Skibidi Toilet',
    subtitle: 'Cuvette blanche & tête chantante',
    draw(ctx, x, y, f, bounce, react, shadow) {
      const cy = y - bounce * 0.8 - react
      const headWobble = Math.sin(f * 0.4) * 2
      shadow(x, y + 2, 18, 4)

      ctx.fillStyle = '#e2e8f0'
      ctx.fillRect(x - 10, cy - 42, 20, 16)
      ctx.fillStyle = '#94a3b8'
      ctx.fillRect(x - 11, cy - 44, 22, 3)
      ctx.fillStyle = '#cbd5e1'
      ctx.fillRect(x + 5, cy - 40, 3, 3)

      ctx.fillStyle = '#e2e8f0'
      ctx.fillRect(x - 8, cy - 26, 16, 14)
      ctx.fillRect(x - 6, cy - 12, 12, 10)
      ctx.fillRect(x - 9, cy - 2, 18, 3)

      ctx.fillStyle = '#94a3b8'
      ctx.fillRect(x - 9, cy - 27, 18, 4)
      ctx.fillStyle = '#0f172a'
      ctx.fillRect(x - 6, cy - 26, 12, 3)

      const headX = x + headWobble
      const headY = cy - 38

      ctx.fillStyle = '#fbcfe8'
      ctx.fillRect(headX - 3, headY + 7, 6, 5)

      ctx.fillStyle = '#fed7aa'
      ctx.fillRect(headX - 6, headY - 8, 12, 15)
      ctx.fillStyle = '#292524'
      ctx.fillRect(headX - 7, headY - 11, 14, 4)
      ctx.fillRect(headX - 7, headY - 7, 2, 3)

      ctx.fillStyle = '#ffffff'
      ctx.fillRect(headX - 5, headY - 5, 4, 4)
      ctx.fillRect(headX + 1, headY - 5, 4, 4)
      ctx.fillStyle = '#1c1917'
      ctx.fillRect(headX - 4, headY - 4, 2, 2)
      ctx.fillRect(headX + 2, headY - 4, 2, 2)

      const mouthOpen = 3 + Math.floor(Math.sin(f * 0.4) * 2)
      ctx.fillStyle = '#991b1b'
      ctx.fillRect(headX - 4, headY + 1, 8, mouthOpen)
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(headX - 3, headY + 1, 6, 1)
    },
  },
]
