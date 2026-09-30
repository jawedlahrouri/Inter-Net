import * as React from "react"
import { Minus, TrendingDown, TrendingUp } from "lucide-react"

import { cn } from "@/lib/utils"
import { formatDelta } from "@/lib/format"

export type DeltaDirection = "up" | "down" | "flat"

/**
 * @brief Determines whether a numeric delta is rising, falling or flat.
 * @param delta Numeric change value, possibly undefined or non-finite.
 * @return The string up for positive, down for negative, or flat for zero, undefined or non-finite values.
 */
export function getDeltaDirection(delta: number | undefined): DeltaDirection {
  if (delta === undefined || delta === 0 || !Number.isFinite(delta)) return "flat"
  return delta > 0 ? "up" : "down"
}

const directionIcon: Record<DeltaDirection, React.ElementType> = {
  up: TrendingUp,
  down: TrendingDown,
  flat: Minus,
}

export interface DeltaBadgeProps extends React.ComponentProps<"span"> {
  delta: number
  invert?: boolean
  variant?: "outline" | "soft" | "text"
  showIcon?: boolean
}

/**
 * @brief Renders a colored badge showing a delta with a trend icon, where color reflects whether the change is good or bad.
 * @param delta Numeric change value that determines direction, icon and formatted text.
 * @param invert When true, treats decreases as good and increases as bad for coloring.
 * @param variant Badge style: outline, soft or text; defaults to outline.
 * @param showIcon Whether the trend icon is displayed; defaults to true.
 * @param className Extra CSS classes merged onto the badge span.
 * @param children Content overriding the default formatted delta text.
 * @param props Remaining span props forwarded to the underlying element.
 * @return A span with a trend icon and formatted delta text, colored green, red or muted according to direction.
 */
function DeltaBadge({
  delta,
  invert = false,
  variant = "outline",
  showIcon = true,
  className,
  children,
  ...props
}: DeltaBadgeProps) {
  const direction = getDeltaDirection(delta)
  const positive = direction === "flat" ? null : (direction === "up") !== invert
  const Icon = directionIcon[direction]

  return (
    <span
      data-slot="delta-badge"
      data-direction={direction}
      data-positive={positive}
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium tabular-nums",
        variant === "outline" && "rounded-md border px-1.5 py-0.5",
        variant === "soft" && "rounded-md px-1.5 py-0.5",
        variant === "soft" && positive === true && "bg-emerald-500/10",
        variant === "soft" && positive === false && "bg-red-500/10",
        variant === "soft" && positive === null && "bg-muted",
        positive === true && "text-emerald-600 dark:text-emerald-400",
        positive === false && "text-red-600 dark:text-red-400",
        positive === null && "text-muted-foreground",
        className
      )}
      {...props}
    >
      {showIcon ? <Icon className="size-3" aria-hidden="true" /> : null}
      {children ?? formatDelta(delta)}
    </span>
  )
}

export { DeltaBadge }
