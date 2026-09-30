"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { formatNumber, type NumberFormat } from "@/lib/format"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export const DEFAULT_COMPACT_FROM = 100_000

export interface MetricValueProps extends Omit<React.ComponentProps<"span">, "children"> {
  value: number | string
  format?: NumberFormat
  currency?: string
  maximumFractionDigits?: number
  compactFrom?: number
  suffix?: React.ReactNode
}

/**
 * @brief Renders a formatted metric number, abbreviating large values and showing the full value in a tooltip.
 * @param value Metric to display; numbers are formatted, strings are shown as is.
 * @param format Number format style (number, compact, currency or percent).
 * @param currency Currency code used when formatting as currency.
 * @param maximumFractionDigits Maximum number of fraction digits to show in the formatted number.
 * @param compactFrom Absolute value threshold from which numbers are abbreviated; defaults to 100000.
 * @param suffix Optional node appended after the value, such as a unit.
 * @param className Extra CSS classes merged with the tabular-nums styling.
 * @param props Remaining span props forwarded to the underlying span element.
 * @return A span with the formatted value, wrapped in a tooltip with the full value when it is abbreviated.
 */
function MetricValue({
  value,
  format,
  currency,
  maximumFractionDigits,
  compactFrom = DEFAULT_COMPACT_FROM,
  suffix,
  className,
  ...props
}: MetricValueProps) {
  const classes = cn("tabular-nums", className)

  if (typeof value !== "number") {
    return (
      <span data-slot="metric-value" className={classes} {...props}>
        {value}
        {suffix}
      </span>
    )
  }

  const full = formatNumber(value, { format, currency, maximumFractionDigits })
  const abbreviate = format !== "percent" && Math.abs(value) >= compactFrom
  if (!abbreviate) {
    return (
      <span data-slot="metric-value" className={classes} {...props}>
        {full}
        {suffix}
      </span>
    )
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            data-slot="metric-value"
            data-compact=""
            className={cn(classes, "cursor-default")}
            {...props}
          >
            {formatNumber(value, { format, currency, compact: true })}
            {suffix}
          </span>
        </TooltipTrigger>
        <TooltipContent className="tabular-nums">
          {full}
          {suffix}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export { MetricValue }
