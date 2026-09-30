import * as React from "react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts"

import { cn } from "@/lib/utils"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

export interface TrendSeries {
  key: string
  label: string
  color?: string
}

export interface TrendChartProps
  extends Omit<React.ComponentProps<typeof ChartContainer>, "config" | "children"> {
  data: Record<string, unknown>[]
  xKey: string
  series: TrendSeries[]
  type?: "area" | "line" | "bar"
  fill?: "gradient" | "dots"
  layout?: "vertical" | "horizontal"
  barRadius?: number | "full"
  barSize?: number
  stacked?: boolean
  showLegend?: boolean
  legendPosition?: "top" | "bottom"
  legendAlign?: "left" | "center" | "right"
  showGrid?: boolean
  showYAxis?: boolean
  yDomain?: React.ComponentProps<typeof YAxis>["domain"]
  xFormatter?: (value: unknown) => string
  yFormatter?: (value: number) => string
}

/**
 * @brief Formats an X axis value, turning ISO date strings into short month and day labels.
 * @param value The raw X axis value, possibly an ISO date string.
 * @return A short date label for date strings, otherwise the value converted to a string.
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



const PILL = 9999

type Radius = number | [number, number, number, number]

/**
 * @brief Computes the corner radius of a bar, rounding only the outer ends of stacked bars.
 * @param radius The bar corner radius in pixels, or full for a pill shape.
 * @param stacked Whether the bars are stacked.
 * @param hasNegative Whether the data contains negative values.
 * @param horizontal Whether bars are laid out horizontally.
 * @param index The position of the series within the stack.
 * @param count The total number of series in the stack.
 * @return A single radius number or a four-value corner radius tuple.
 */
function barCorners(
  radius: number | "full",
  stacked: boolean,
  hasNegative: boolean,
  horizontal: boolean,
  index: number,
  count: number
): Radius {
  const r = radius === "full" ? PILL : radius
  if (!stacked || count === 1) return r
  if (hasNegative) return 0
  if (index === count - 1) return horizontal ? [0, r, r, 0] : [r, r, 0, 0]
  if (index === 0) return horizontal ? [r, 0, 0, r] : [0, 0, r, r]
  return 0
}

/**
 * @brief Renders a configurable area, line or bar chart of one or more data series using recharts.
 * @param data Array of row objects supplying the chart data points.
 * @param xKey Key in each data row used for the X axis category.
 * @param series List of series definitions with key, label and optional color to draw.
 * @param type Chart kind: area, line or bar; defaults to area.
 * @param fill Area fill style, gradient or dots; defaults to gradient.
 * @param layout Bar orientation, vertical or horizontal; defaults to vertical.
 * @param barRadius Corner radius of bars in pixels, or full for pill shape; defaults to 4.
 * @param barSize Optional fixed bar thickness in pixels.
 * @param stacked Whether series are stacked instead of overlaid.
 * @param showLegend Whether to display the chart legend.
 * @param legendPosition Vertical legend placement, top or bottom; defaults to bottom.
 * @param legendAlign Horizontal legend alignment: left, center or right.
 * @param showGrid Whether to draw the cartesian grid; defaults to true.
 * @param showYAxis Whether to show the value axis; defaults to false.
 * @param yDomain Optional domain (min and max) for the value axis.
 * @param xFormatter Function formatting X axis values and tooltip labels; defaults to a short date formatter.
 * @param yFormatter Optional function formatting numeric values on the Y axis and in the tooltip.
 * @param className Extra CSS classes merged into the chart container sizing.
 * @param props Remaining ChartContainer props forwarded to the underlying container.
 * @return JSX for a chart container with axes, grid, tooltip, optional legend and the series drawn as area, line or bar.
 */
function TrendChart({
  data,
  xKey,
  series,
  type = "area",
  fill = "gradient",
  layout = "vertical",
  barRadius = 4,
  barSize,
  stacked = false,
  showLegend = false,
  legendPosition = "bottom",
  legendAlign = "center",
  showGrid = true,
  showYAxis = false,
  yDomain,
  xFormatter = defaultXFormatter,
  yFormatter,
  className,
  ...props
}: TrendChartProps) {
  const id = React.useId()
  const dots = type === "area" && fill === "dots"
  const horizontal = type === "bar" && layout === "horizontal"
  const hasNegative = React.useMemo(
    () =>
      data.some((row) =>
        series.some((s) => {
          const v = row[s.key]
          return typeof v === "number" && v < 0
        })
      ),
    [data, series]
  )
  const config = Object.fromEntries(
    series.map((s, index) => [
      s.key,
      { label: s.label, color: s.color ?? `var(--chart-${(index % 5) + 1})` },
    ])
  ) satisfies ChartConfig

  const axes = (
    <>
      {showGrid ? (
        <CartesianGrid vertical={horizontal} horizontal={!horizontal} />
      ) : null}
      {horizontal ? (
        <>
          <XAxis
            type="number"
            hide={!showYAxis}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            domain={yDomain}
            tickFormatter={yFormatter}
          />
          <YAxis
            type="category"
            dataKey={xKey}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            width="auto"
            tickFormatter={xFormatter}
          />
        </>
      ) : (
        <>
          <XAxis
            dataKey={xKey}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={32}
            tickFormatter={xFormatter}
          />
          {showYAxis ? (
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              width="auto"
              domain={yDomain}
              tickFormatter={yFormatter}
            />
          ) : yDomain ? (
            <YAxis hide domain={yDomain} />
          ) : null}
        </>
      )}
      {hasNegative ? (
        <ReferenceLine
          {...(horizontal ? { x: 0 } : { y: 0 })}
          stroke="var(--border)"
          strokeWidth={1}
        />
      ) : null}
      <ChartTooltip
        cursor={false}
        content={
          <ChartTooltipContent
            indicator={type === "bar" ? "dashed" : "dot"}
            labelFormatter={(value) => xFormatter(value)}
            formatter={
              yFormatter
                ? (value, name) => (
                    <div className="flex w-full items-center justify-between gap-4">
                      <span className="text-muted-foreground">
                        {config[name as string]?.label ?? name}
                      </span>
                      <span className="font-mono font-medium tabular-nums">
                        {yFormatter(Number(value))}
                      </span>
                    </div>
                  )
                : undefined
            }
          />
        }
      />
      {showLegend ? (
        <ChartLegend
          verticalAlign={legendPosition}
          align={legendAlign}
          content={
            <ChartLegendContent
              className={
                legendAlign === "right"
                  ? "justify-end"
                  : legendAlign === "left"
                    ? "justify-start"
                    : undefined
              }
            />
          }
        />
      ) : null}
    </>
  )

  const margin = {
    top: 8,
    right: 8,
    bottom: 0,
    left: showYAxis || horizontal ? 0 : 8,
  }

  return (
    <ChartContainer
      data-slot="trend-chart"
      config={config}
      className={cn("aspect-auto h-64 w-full", className)}
      {...props}
    >
      {type === "bar" ? (
        <BarChart
          data={data}
          layout={horizontal ? "vertical" : "horizontal"}
          margin={margin}
          stackOffset={stacked ? "sign" : "none"}
        >
          {axes}
          {series.map((s, index) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              fill={`var(--color-${s.key})`}
              barSize={barSize}
              radius={barCorners(
                barRadius,
                stacked,
                hasNegative,
                horizontal,
                index,
                series.length
              )}
              stackId={stacked ? "stack" : undefined}
            />
          ))}
        </BarChart>
      ) : type === "line" ? (
        <LineChart data={data} margin={margin}>
          {axes}
          {series.map((s) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              stroke={`var(--color-${s.key})`}
              strokeWidth={2}
              dot={false}
            />
          ))}
        </LineChart>
      ) : (
        <AreaChart
          data={data}
          margin={margin}
          stackOffset={stacked ? "sign" : "none"}
        >
          <defs>
            {series.map((s) => (
              <linearGradient
                key={s.key}
                id={`${id}-${s.key}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="5%"
                  stopColor={`var(--color-${s.key})`}
                  stopOpacity={dots ? 0.08 : 0.6}
                />
                <stop
                  offset="95%"
                  stopColor={`var(--color-${s.key})`}
                  stopOpacity={dots ? 0.9 : 0.05}
                />
              </linearGradient>
            ))}
            {dots ? (
              <>
                <pattern
                  id={`${id}-dots`}
                  patternUnits="userSpaceOnUse"
                  width={6}
                  height={6}
                >
                  <circle cx={3} cy={3} r={1.25} fill="#fff" />
                </pattern>
                <mask
                  id={`${id}-mask`}
                  maskUnits="userSpaceOnUse"
                  x={0}
                  y={0}
                  width="100%"
                  height="100%"
                >
                  <rect width="100%" height="100%" fill={`url(#${id}-dots)`} />
                </mask>
              </>
            ) : null}
          </defs>
          {axes}
          {series.map((s) => (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              stroke={`var(--color-${s.key})`}
              fill={`url(#${id}-${s.key})`}
              fillOpacity={dots ? 1 : undefined}
              strokeWidth={2}
              stackId={stacked ? "stack" : undefined}
            />
          ))}
        </AreaChart>
      )}
    </ChartContainer>
  )
}

export { TrendChart }
