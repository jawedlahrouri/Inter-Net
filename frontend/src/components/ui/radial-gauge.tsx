import * as React from "react"

import { cn } from "@/lib/utils"

export interface RadialGaugeProps extends React.ComponentProps<"div"> {
  value: number
  min?: number
  max?: number
  size?: number
  thickness?: number
  segments?: number
  gap?: number
  startAngle?: number
  sweep?: number
  color?: string
  trackColor?: string
  children?: React.ReactNode
}

/**
 * @brief Rounds a number to three decimal places.
 * @param n The number to round.
 * @return The number rounded to three decimals.
 */
const round = (n: number) => Math.round(n * 1000) / 1000

/**
 * @brief Converts a polar angle and radius around a center into SVG cartesian coordinates, with 0 degrees pointing up.
 * @param cx The x coordinate of the circle center.
 * @param cy The y coordinate of the circle center.
 * @param r The radius of the circle.
 * @param angleDeg The angle in degrees, measured clockwise from the top.
 * @return An object with the rounded x and y coordinates of the point.
 */
function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return { x: round(cx + r * Math.cos(rad)), y: round(cy + r * Math.sin(rad)) }
}

/**
 * @brief Builds an SVG path string describing a circular arc between two angles.
 * @param cx The x coordinate of the circle center.
 * @param cy The y coordinate of the circle center.
 * @param r The radius of the arc.
 * @param from The start angle in degrees.
 * @param to The end angle in degrees.
 * @return An SVG path data string starting with a move command followed by an arc command.
 */
function arcPath(cx: number, cy: number, r: number, from: number, to: number) {
  const start = polar(cx, cy, r, from)
  const end = polar(cx, cy, r, to)
  const largeArc = to - from > 180 ? 1 : 0
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`
}

/**
 * @brief Renders a radial gauge as an SVG arc, optionally segmented, that fills according to a value between a min and max.
 * @param value Current value that determines how much of the arc is filled.
 * @param min Lower bound of the value range; defaults to 0.
 * @param max Upper bound of the value range; defaults to 100.
 * @param size Width of the gauge in pixels; defaults to 160.
 * @param thickness Stroke width of the arc in pixels; defaults to 10.
 * @param segments Number of discrete arc segments; 0 draws a continuous arc.
 * @param gap Angular gap in degrees between segments; defaults to 2.
 * @param startAngle Angle in degrees where the arc starts; defaults to centered on the top.
 * @param sweep Total angular span of the arc in degrees; defaults to 180.
 * @param color Stroke color of the filled portion of the arc.
 * @param trackColor Stroke color of the unfilled background track.
 * @param className Extra CSS classes merged into the gauge container.
 * @param children Optional content rendered centered inside the gauge.
 * @param props Remaining div props forwarded to the gauge container.
 * @return A meter div containing an SVG track and progress arc, with optional centered children.
 */
function RadialGauge({
  value,
  min = 0,
  max = 100,
  size = 160,
  thickness = 10,
  segments = 0,
  gap = 2,
  startAngle,
  sweep = 180,
  color = "var(--chart-1)",
  trackColor = "var(--muted)",
  className,
  children,
  ...props
}: RadialGaugeProps) {
  const fraction = Math.min(1, Math.max(0, (value - min) / (max - min || 1)))
  const start = startAngle ?? (sweep >= 360 ? 0 : -sweep / 2)
  const r = size / 2 - thickness / 2
  const cx = size / 2
  const cy = size / 2
  const angles = Array.from({ length: 64 }, (_, i) => start + (sweep * i) / 63)
  const ys = angles.map((a) => polar(cx, cy, r, a).y)
  const top = Math.max(0, Math.min(...ys) - thickness / 2)
  const bottom = Math.min(size, Math.max(...ys) + thickness / 2)
  const height = bottom - top

  const arcs: { from: number; to: number; filled: boolean }[] = []
  if (segments > 0) {
    const step = sweep / segments
    for (let i = 0; i < segments; i++) {
      const from = start + i * step + gap / 2
      const to = start + (i + 1) * step - gap / 2
      const mid = (i + 0.5) / segments
      arcs.push({ from, to, filled: mid <= fraction })
    }
  }

  return (
    <div
      data-slot="radial-gauge"
      role="meter"
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      className={cn("relative inline-flex shrink-0", className)}
      style={{ width: size, height }}
      {...props}
    >
      <svg
        width={size}
        height={height}
        viewBox={`0 ${top} ${size} ${height}`}
        className="absolute inset-0"
        aria-hidden="true"
      >
        {segments > 0 ? (
          arcs.map((arc, index) => (
            <path
              key={index}
              d={arcPath(cx, cy, r, arc.from, arc.to)}
              fill="none"
              stroke={arc.filled ? color : trackColor}
              strokeWidth={thickness}
              strokeLinecap="butt"
            />
          ))
        ) : (
          <>
            <path
              d={arcPath(cx, cy, r, start, start + sweep - (sweep >= 360 ? 0.01 : 0))}
              fill="none"
              stroke={trackColor}
              strokeWidth={thickness}
              strokeLinecap={sweep >= 360 ? "butt" : "round"}
            />
            {fraction > 0 ? (
              <path
                d={arcPath(cx, cy, r, start, start + sweep * fraction)}
                fill="none"
                stroke={color}
                strokeWidth={thickness}
                strokeLinecap="round"
                className="transition-[d] duration-500"
              />
            ) : null}
          </>
        )}
      </svg>
      {children ? (
        <div
          className={cn(
            "absolute inset-x-0 flex flex-col items-center justify-center text-center",
            sweep > 200 ? "inset-y-0" : "bottom-0"
          )}
        >
          {children}
        </div>
      ) : null}
    </div>
  )
}

export { RadialGauge }
