export type NumberFormat = "number" | "compact" | "currency" | "percent"

export interface FormatNumberOptions {
  format?: NumberFormat
  currency?: string
  locale?: string
  maximumFractionDigits?: number
  compact?: boolean
}

const formatterCache = new Map<string, Intl.NumberFormat>()

/**
 * @brief Returns a cached Intl.NumberFormat for the given locale and options, creating it on first use.
 * @param locale BCP 47 locale tag used to format numbers.
 * @param options Intl.NumberFormat options that define the formatting style.
 * @return The cached or newly created Intl.NumberFormat instance.
 */
function getFormatter(locale: string, options: Intl.NumberFormatOptions) {
  const key = locale + JSON.stringify(options)
  let formatter = formatterCache.get(key)
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, options)
    formatterCache.set(key, formatter)
  }
  return formatter
}

/**
 * @brief Formats a number as plain, compact, currency or percent text using Intl.NumberFormat.
 * @param value Number to format.
 * @param format Formatting style: number, compact, currency or percent; defaults to number.
 * @param currency ISO currency code used for currency formatting; defaults to USD.
 * @param locale BCP 47 locale tag used by Intl.NumberFormat; defaults to en-US.
 * @param maximumFractionDigits Maximum fraction digits; when omitted, a default depends on the format.
 * @param compact Whether to use compact notation such as 1.2K for number and currency formats.
 * @return The formatted string, or an em dash when the value is not finite.
 */
export function formatNumber(
  value: number,
  {
    format = "number",
    currency = "USD",
    locale = "en-US",
    maximumFractionDigits,
    compact = false,
  }: FormatNumberOptions = {}
): string {
  if (!Number.isFinite(value)) return "—"

  const compactOptions: Intl.NumberFormatOptions = compact
    ? maximumFractionDigits === undefined
      ? { notation: "compact", maximumSignificantDigits: 3 }
      : { notation: "compact", maximumFractionDigits }
    : {}
  switch (format) {
    case "compact":
      return getFormatter(locale, {
        notation: "compact",
        maximumFractionDigits: maximumFractionDigits ?? 1,
      }).format(value)
    case "currency":
      return getFormatter(locale, {
        style: "currency",
        currency,
        maximumFractionDigits: maximumFractionDigits ?? 2,
        ...compactOptions,
      }).format(value)
    case "percent":
      return getFormatter(locale, {
        style: "percent",
        maximumFractionDigits: maximumFractionDigits ?? 1,
      }).format(value)
    default:
      return getFormatter(locale, {
        maximumFractionDigits: maximumFractionDigits ?? 0,
        ...compactOptions,
      }).format(value)
  }
}

/**
 * @brief Formats a ratio as a signed percentage with one decimal.
 * @param delta Relative change expressed as a ratio, for example 0.05 for 5%.
 * @param locale BCP 47 locale tag used for formatting.
 * @return The signed percent string, or an em dash when the delta is not finite.
 */
export function formatDelta(delta: number, locale = "en-US"): string {
  if (!Number.isFinite(delta)) return "—"
  return getFormatter(locale, {
    style: "percent",
    signDisplay: "exceptZero",
    maximumFractionDigits: 1,
    minimumFractionDigits: 1,
  }).format(delta)
}

/**
 * @brief Computes the relative change between a current and a previous value.
 * @param current Current value.
 * @param previous Previous value used as the baseline.
 * @return The change divided by the absolute previous value, or 0 when the previous value is falsy.
 */
export function computeDelta(current: number, previous: number): number {
  if (!previous) return 0
  return (current - previous) / Math.abs(previous)
}
