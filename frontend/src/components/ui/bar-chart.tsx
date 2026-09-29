"use client"

import * as React from "react"
import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  Cell,
  Rectangle,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts"

import { cn } from "@/lib/utils"
import { ChartContainer, ChartTooltip } from "@/components/ui/chart"

export type BarRow = Record<string, unknown>

export interface BarReferenceLine {
  y: number
  label?: string
  color?: string
  dashed?: boolean
}

export interface BarChartProps
  extends Omit<React.ComponentProps<typeof ChartContainer>, "config" | "children"> {
  data: BarRow[]
  xKey: string
  yKey: string
  groupKey?: string
  variant?: "gradient" | "striped" | "solid"
  color?: string
  mutedColor?: string
  highlight?: (row: BarRow, index: number) => boolean
  grid?: "dashed" | "solid" | "none"
  showYAxis?: boolean
  showTooltip?: boolean
  showActiveMarker?: boolean
  barRadius?: number
  referenceLines?: BarReferenceLine[]
  xFormatter?: (value: unknown) => string
  yFormatter?: (value: number) => string
  tooltipLabel?: (row: BarRow, index: number) => React.ReactNode
  onBarClick?: (row: BarRow, index: number) => void
}

/**
 * @brief Formats an X axis value, turning ISO date strings into short month and day labels.
 * @param value Raw X axis value, often a date string starting with YYYY-MM-DD.
 * @return A short English date label for ISO dates, otherwise the value converted to a string.
 */
function defaultXFormatter(value: unknown) {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    const [y, m, d] = value.split("-").map(Number)
    return new Date(y!, m! - 1, d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
  }
  return String(value)
}

/**
 * @brief Computes X axis tick labels that show each group's value once, centered under its run of consecutive bars.
 * @param data Chart rows in display order.
 * @param groupKey Row key whose consecutive equal values form a group.
 * @return An array of labels, one per row, that is empty except at each group's middle position.
 */
function groupTicks(data: BarRow[], groupKey: string) {
  const labels: string[] = Array.from({ length: data.length }, () => "")
  let start = 0
  for (let i = 1; i <= data.length; i++) {
    if (i === data.length || data[i]![groupKey] !== data[start]![groupKey]) {
      labels[Math.floor((start + i - 1) / 2)] = String(data[start]![groupKey] ?? "")
      start = i
    }
  }
  return labels
}

interface ShapeProps {
  x?: number
  y?: number
  width?: number
  height?: number
  index?: number
}

/**
 * @brief Renders a configurable bar chart with gradient, striped or solid fills, highlighting, reference lines and a custom tooltip.
 * @param data Array of row objects plotted as bars.
 * @param xKey Row key used for the X axis values.
 * @param yKey Row key holding the numeric bar values.
 * @param groupKey Optional row key whose consecutive equal values are labeled once on the X axis.
 * @param variant Bar fill style: gradient, striped or solid; defaults to gradient.
 * @param color Fill color for highlighted bars; defaults to the chart-1 CSS variable.
 * @param mutedColor Fill color for non-highlighted bars; defaults to muted-foreground.
 * @param highlight Predicate deciding whether a row is highlighted; all rows are by default.
 * @param grid Grid style: dashed, solid or none; defaults to dashed.
 * @param showYAxis Whether the Y axis is displayed; defaults to false.
 * @param showTooltip Whether the hover tooltip is displayed; defaults to true.
 * @param showActiveMarker Whether a circle marker appears on top of the hovered bar; defaults to true.
 * @param barRadius Corner radius of the bars; defaults to 6.
 * @param referenceLines Horizontal reference lines with y value, optional label, color and dashed flag.
 * @param xFormatter Formats X axis values and tooltip labels; defaults to a short date formatter.
 * @param yFormatter Formats Y axis ticks and the tooltip value.
 * @param tooltipLabel Custom function returning the tooltip label node for a row.
 * @param onBarClick Callback invoked with the row and index when a bar is clicked.
 * @param className Extra CSS classes merged onto the chart container.
 * @param props Remaining ChartContainer props forwarded to the underlying container element.
 * @return A ChartContainer wrapping a Recharts bar chart with axes, grid, tooltip, bars and reference lines.
 */
function BarChart({
  data,
  xKey,
  yKey,
  groupKey,
  variant = "gradient",
  color = "var(--chart-1)",
  mutedColor = "var(--muted-foreground)",
  highlight,
  grid = "dashed",
  showYAxis = false,
  showTooltip = true,
  showActiveMarker = true,
  barRadius = 6,
  referenceLines = [],
  xFormatter = defaultXFormatter,
  yFormatter,
  tooltipLabel,
  onBarClick,
  className,
  ...props
}: BarChartProps) {
  const id = React.useId()
  const isHighlighted = React.useCallback(
    (index: number) => (highlight ? highlight(data[index]!, index) : true),
    [data, highlight]
  )
  const tickLabels = React.useMemo(
    () => (groupKey ? groupTicks(data, groupKey) : null),
    [data, groupKey]
  )
  /**
   * @brief Builds the SVG paint reference used to fill a bar, depending on whether it is highlighted.
   * @param index Index of the bar in the data array.
   * @return A url(#...) string pointing to the on or off fill definition.
   */
  const fillFor = (index: number) =>
    `url(#${id}-${isHighlighted(index) ? "on" : "off"})`

  /**
   * @brief Renders the hovered bar with its fill and an optional circular marker on top.
   * @param shape Recharts bar shape props including position, size and index.
   * @return An SVG group with the bar rectangle and, when enabled and non-empty, a marker circle.
   */
  const activeBar = (shape: ShapeProps) => {
    const { x = 0, y = 0, width = 0, height = 0, index = 0 } = shape
    const on = isHighlighted(index)
    return (
      <g>
        <Rectangle {...shape} fill={fillFor(index)} />
        {showActiveMarker && height > 0 ? (
          <circle
            cx={x + width / 2}
            cy={y}
            r={4}
            fill="var(--background)"
            stroke={on ? color : mutedColor}
            strokeWidth={2}
          />
        ) : null}
      </g>
    )
  }

  return (
    <ChartContainer
      data-slot="bar-chart"
      config={{ [yKey]: { label: yKey, color } }}
      className={cn("aspect-auto h-64 w-full", className)}
      {...props}
    >
      <RechartsBarChart
        data={data}
        margin={{ top: 12, right: 8, bottom: 0, left: showYAxis ? 0 : 8 }}
        barCategoryGap="28%"
      >
        <defs>
          {variant === "gradient" ? (
            <>
              <linearGradient id={`${id}-on`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={1} />
                <stop offset="100%" stopColor={color} stopOpacity={0.6} />
              </linearGradient>
              <linearGradient id={`${id}-off`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={mutedColor} stopOpacity={0.35} />
                <stop offset="100%" stopColor={mutedColor} stopOpacity={0.18} />
              </linearGradient>
            </>
          ) : variant === "striped" ? (
            <>
              {(["on", "off"] as const).map((state) => {
                const fill = state === "on" ? color : mutedColor
                const opacity = state === "on" ? 1 : 0.3
                return (
                  <pattern
                    key={state}
                    id={`${id}-${state}`}
                    patternUnits="userSpaceOnUse"
                    width={10}
                    height={10}
                    patternTransform="rotate(45)"
                  >
                    <rect width={10} height={10} fill={fill} fillOpacity={opacity} />
                    <rect
                      width={5}
                      height={10}
                      fill="var(--background)"
                      fillOpacity={0.25}
                    />
                  </pattern>
                )
              })}
            </>
          ) : (
            <>
              <linearGradient id={`${id}-on`}>
                <stop stopColor={color} />
              </linearGradient>
              <linearGradient id={`${id}-off`}>
                <stop stopColor={mutedColor} stopOpacity={0.3} />
              </linearGradient>
            </>
          )}
        </defs>
        {grid !== "none" ? (
          <CartesianGrid
            vertical={false}
            strokeDasharray={grid === "dashed" ? "6 6" : undefined}
          />
        ) : null}
        <XAxis
          dataKey={xKey}
          tickLine={false}
          axisLine={false}
          tickMargin={10}
          interval={tickLabels ? 0 : "preserveStartEnd"}
          minTickGap={tickLabels ? 0 : 24}
          tickFormatter={
            tickLabels ? (_, index) => tickLabels[index] ?? "" : (v) => xFormatter(v)
          }
        />
        <YAxis
          hide={!showYAxis}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          width={44}
          tickFormatter={yFormatter}
        />
        {showTooltip ? (
          <ChartTooltip
            cursor={false}
            isAnimationActive={false}
            content={({ active, payload }) => {
              const entry = payload?.[0]
              if (!active || !entry) return null
              const row = entry.payload as BarRow
              const index = data.indexOf(row)
              const value = Number(row[yKey])
              return (
                <div className="bg-background rounded-lg border px-3 py-2 text-xs shadow-md">
                  <div className="text-sm font-semibold tabular-nums">
                    {yFormatter ? yFormatter(value) : String(value)}
                  </div>
                  <div className="text-muted-foreground">
                    {tooltipLabel ? tooltipLabel(row, index) : xFormatter(row[xKey])}
                  </div>
                </div>
              )
            }}
          />
        ) : null}
        <Bar
          dataKey={yKey}
          radius={barRadius}
          isAnimationActive={false}
          activeBar={activeBar}
          onClick={
            onBarClick
              ? (_, index) => onBarClick(data[index]!, index)
              : undefined
          }
          className={onBarClick ? "cursor-pointer" : undefined}
        >
          {data.map((_, index) => (
            <Cell key={index} fill={fillFor(index)} />
          ))}
        </Bar>
        {referenceLines.map((line, index) => (
          <ReferenceLine
            key={index}
            y={line.y}
            ifOverflow="extendDomain"
            stroke={line.color ?? "var(--muted-foreground)"}
            strokeDasharray={line.dashed === false ? undefined : "4 4"}
            label={
              line.label
                ? {
                    value: line.label,
                    position: "insideTopRight",
                    fill: line.color ?? "var(--muted-foreground)",
                    fontSize: 11,
                  }
                : undefined
            }
          />
        ))}
      </RechartsBarChart>
    </ChartContainer>
  )
}

export { BarChart }
