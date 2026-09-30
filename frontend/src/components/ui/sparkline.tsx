import * as React from "react"
import {
  Area,
  AreaChart,
  Line,
  LineChart,
  ResponsiveContainer,
} from "recharts"

import { cn } from "@/lib/utils"

export interface SparklineProps extends React.ComponentProps<"div"> {
  data: number[]
  variant?: "area" | "line"
  fill?: "gradient" | "dots"
  color?: string
  curve?: "monotone" | "linear" | "step"
  strokeWidth?: number
}

/**
 * @brief Renders a small axis-less area or line chart from a series of numbers.
 * @param data Array of numbers plotted as the sparkline series.
 * @param variant Chart style, area or line; defaults to area.
 * @param fill Fill style for the area variant, gradient or dots.
 * @param color Stroke and gradient color of the series; defaults to the primary color.
 * @param curve Curve interpolation type: monotone, linear or step.
 * @param strokeWidth Width of the plotted line in pixels; defaults to 1.5.
 * @param className Extra CSS classes merged into the wrapper div sizing.
 * @param props Remaining div props forwarded to the wrapper div.
 * @return A decorative div containing a responsive Recharts area chart with gradient or a line chart.
 */
function Sparkline({
  data,
  variant = "area",
  fill = "gradient",
  color = "var(--primary)",
  curve = "monotone",
  strokeWidth = 1.5,
  className,
  ...props
}: SparklineProps) {
  const id = React.useId()
  const points = React.useMemo(() => data.map((y, i) => ({ i, y })), [data])
  const margin = { top: 2, right: 0, bottom: 0, left: 0 }

  return (
    <div
      data-slot="sparkline"
      aria-hidden="true"
      className={cn("h-10 w-full", className)}
      {...props}
    >
      <ResponsiveContainer width="100%" height="100%">
        {variant === "line" ? (
          <LineChart data={points} margin={margin}>
            <Line
              type={curve}
              dataKey="y"
              stroke={color}
              strokeWidth={strokeWidth}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        ) : (
          <AreaChart data={points} margin={margin}>
            <defs>
              <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type={curve}
              dataKey="y"
              stroke={color}
              strokeWidth={strokeWidth}
              fill={`url(#${id})`}
              dot={false}
              isAnimationActive={false}
            />
          </AreaChart>
        )}
      </ResponsiveContainer>
    </div>
  )
}

export { Sparkline }
