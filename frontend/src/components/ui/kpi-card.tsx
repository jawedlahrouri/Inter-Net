"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { type NumberFormat } from "@/lib/format"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { DeltaBadge, getDeltaDirection } from "@/components/ui/delta-badge"
import { Sparkline } from "@/components/ui/sparkline"
import { MetricValue } from "@/components/ui/metric-value"

export interface KpiCardProps extends Omit<
  React.ComponentProps<typeof Card>,
  "children"
> {
  label: string
  value: number | string
  delta?: number
  deltaLabel?: string
  trend?: number[]
  format?: NumberFormat
  currency?: string
  invertDelta?: boolean
  icon?: React.ReactNode
  children?: React.ReactNode
}

/**
 * @brief Renders a KPI card showing a label, a formatted value, an optional delta badge, sparkline trend and footer content.
 * @param label Title text describing the metric shown on the card.
 * @param value Metric value to display, either a number (formatted) or a string.
 * @param delta Optional relative change used for the delta badge and trend color.
 * @param deltaLabel Optional caption shown in the footer next to the delta.
 * @param trend Optional series of numbers drawn as a sparkline when it has more than one point.
 * @param format Number format style for the value (number, compact, currency or percent); defaults to number.
 * @param currency Currency code used when the value is formatted as currency.
 * @param invertDelta When true, a negative delta is treated as good and a positive one as bad.
 * @param icon Optional icon node displayed before the label.
 * @param className Extra CSS classes merged into the card styling.
 * @param children Optional extra content rendered in the card footer.
 * @param props Remaining props forwarded to the underlying Card component.
 * @return A Card with the metric value, optional delta badge, optional trend sparkline and optional delta label and children.
 */
function KpiCard({
  label,
  value,
  delta,
  deltaLabel,
  trend,
  format = "number",
  currency,
  invertDelta = false,
  icon,
  className,
  children,
  ...props
}: KpiCardProps) {
  const direction = getDeltaDirection(delta)
  const isPositive =
    direction === "flat" ? null : (direction === "up") !== invertDelta
  const trendColor =
    isPositive === true
      ? "var(--color-emerald-500)"
      : isPositive === false
        ? "var(--color-red-500)"
        : "var(--primary)"

  return (
    <Card
      data-slot="kpi-card"
      data-direction={direction}
      className={cn("gap-4 py-5", className)}
      {...props}
    >
      <CardHeader className="px-5">
        <CardDescription className="flex items-center gap-1.5 [&>svg]:size-4">
          {icon}
          {label}
        </CardDescription>
        <CardTitle className="text-2xl font-semibold tabular-nums tracking-tight">
          <MetricValue value={value} format={format} currency={currency} />
        </CardTitle>
        {delta !== undefined ? (
          <CardAction>
            <DeltaBadge delta={delta} invert={invertDelta} />
          </CardAction>
        ) : null}
      </CardHeader>
      {trend && trend.length > 1 ? (
        <CardContent className="px-5">
          <Sparkline data={trend} color={trendColor} />
        </CardContent>
      ) : null}
      {deltaLabel || children ? (
        <CardContent className="text-muted-foreground flex items-center gap-2 px-5 text-xs">
          {deltaLabel ? <span>{deltaLabel}</span> : null}
          {children}
        </CardContent>
      ) : null}
    </Card>
  )
}

export { KpiCard }
