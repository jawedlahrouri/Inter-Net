
export interface JsonExtractResult {
  value: any
  found: boolean
}

/**
 * @brief Splits a JSON path string such as data.users[0].name into its ordered key segments.
 * @param path The JSON path string, optionally starting with a dollar sign.
 * @return An array of path segments, empty if the path is invalid, blank or the root.
 */
export function parseJsonPath(path: string): string[] {
  if (!path || typeof path !== 'string') {
    return []
  }

  let cleanPath = path.trim()
  if (!cleanPath) {
    return []
  }

  if (cleanPath === '$') {
    return []
  }
  if (cleanPath.startsWith('$.')) {
    cleanPath = cleanPath.slice(2)
  } else if (cleanPath.startsWith('$[')) {
    cleanPath = cleanPath.slice(1)
  }

  const segments: string[] = []
  const regex = /\[\s*(?:['"]([^'"]+)['"]|([0-9]+)|([^'"][^\]]*))\s*\]|([^.[\]]+)/g
  let match: RegExpExecArray | null

  while ((match = regex.exec(cleanPath)) !== null) {
    const token = match[1] ?? match[2] ?? match[3] ?? match[4]
    if (token !== undefined && token !== '') {
      segments.push(token)
    }
  }

  return segments
}

/**
 * @brief Safely extracts a value from any JSON data structure given a path.
 * @param data The object, array, or primitive to extract from.
 * @param path The path string (e.g. "bpi.USD.rate_float", "data.users[0].name", "status").
 * @returns { value: any; found: boolean }
 */
export function extractJsonValue(
  data: any,
  path: string
): JsonExtractResult {
  if (data === undefined) {
    return { value: undefined, found: false }
  }

  if (typeof path !== 'string') {
    return { value: undefined, found: false }
  }

  const trimmed = path.trim()

  if (trimmed === '' || trimmed === '$') {
    return { value: data, found: true }
  }

  const segments = parseJsonPath(trimmed)
  if (segments.length === 0) {
    return { value: undefined, found: false }
  }

  let current = data

  for (let i = 0; i < segments.length; i++) {
    if (current === null || current === undefined) {
      return { value: undefined, found: false }
    }

    const key = segments[i]

    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      if (!Object.prototype.hasOwnProperty.call(current, key)) {
        return { value: undefined, found: false }
      }
    }

    if (Array.isArray(current)) {
      const index = Number(key)
      if (Number.isInteger(index) && index >= 0 && index < current.length) {
        current = current[index]
      } else if (key in current) {
        current = (current as any)[key]
      } else {
        return { value: undefined, found: false }
      }
    } else if (typeof current === 'object') {
      if (Object.prototype.hasOwnProperty.call(current, key) || key in current) {
        current = current[key]
      } else {
        return { value: undefined, found: false }
      }
    } else {
      return { value: undefined, found: false }
    }
  }

  return { value: current, found: true }
}

export interface DiscoveredPath {
  path: string
  value: any
  type: 'number' | 'string' | 'boolean' | 'count'
  suggestedMode?: 'kpi' | 'gauge'
}

/**
 * @brief Recursively explores JSON data to list displayable leaf paths and array lengths with a suggested display mode.
 * @param data The JSON value to explore.
 * @param prefix The path accumulated so far for the current node.
 * @param depth The current recursion depth, exploration stops beyond 5.
 * @param results The accumulator of discovered paths, capped at 60 entries.
 * @return The list of discovered paths with their value, type and suggested kpi or gauge mode.
 */
export function discoverJsonPaths(
  data: any,
  prefix = '',
  depth = 0,
  results: DiscoveredPath[] = []
): DiscoveredPath[] {
  if (depth > 5 || results.length >= 60) return results
  if (data === null || data === undefined) return results

  if (Array.isArray(data)) {
    results.push({
      path: prefix ? `${prefix}.length` : 'length',
      value: data.length,
      type: 'count',
      suggestedMode: 'kpi',
    })
    if (data.length > 0) {
      discoverJsonPaths(data[0], prefix ? `${prefix}[0]` : '[0]', depth + 1, results)
    }
    return results
  }

  if (typeof data === 'object') {
    for (const [key, val] of Object.entries(data)) {
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue
      const currentPath = prefix ? `${prefix}.${key}` : key
      if (val !== null && typeof val === 'object') {
        discoverJsonPaths(val, currentPath, depth + 1, results)
      } else if (val !== undefined && val !== null) {
        const isNum = typeof val === 'number'
        const isPercentage =
          isNum &&
          val >= 0 &&
          val <= 100 &&
          /(percent|pct|usage|load|progress|cpu|ram|battery)/i.test(key)

        results.push({
          path: currentPath,
          value: val,
          type: typeof val as 'number' | 'string' | 'boolean',
          suggestedMode: isPercentage ? 'gauge' : 'kpi',
        })
      }
    }
  }

  return results
}

const METRIC_KEYWORDS = [
  'count', 'total', 'length', 'items', 'stargazers', 'followers',
  'price', 'rate', 'value', 'amount', 'balance', 'score', 'status',
  'healthy', 'uptime', 'temp', 'speed', 'humidity', 'users', 'online'
]

const LOW_PRIORITY_KEYS = [
  'id', 'node_id', 'sha', 'url', 'avatar_url', 'html_url', 'etag',
  'gravatar_id', 'type', 'created_at', 'updated_at'
]

/**
 * @brief Scores a discovered path by type, metric-like keywords, low-priority keys and nesting depth.
 * @param item The discovered path entry to score.
 * @return The numeric relevance score, where higher means a better default metric.
 */
function calculatePathScore(item: DiscoveredPath): number {
  const lowerPath = item.path.toLowerCase()
  let score = 0

  if (item.type === 'number' || item.type === 'count') score += 50
  if (item.type === 'string') score += 10

  for (const kw of METRIC_KEYWORDS) {
    if (lowerPath.includes(kw)) {
      score += 40
      break
    }
  }

  for (const lk of LOW_PRIORITY_KEYS) {
    if (lowerPath.endsWith(`.${lk}`) || lowerPath === lk) {
      score -= 30
      break
    }
  }

  const depth = (item.path.match(/\./g) || []).length
  score -= depth * 5

  return score
}

/**
 * @brief Selects the highest-scoring path from the discovered paths as the default one.
 * @param paths The list of discovered paths to choose from.
 * @return The best-scoring path, or undefined if the list is empty.
 */
export function findBestDefaultPath(paths: DiscoveredPath[]): DiscoveredPath | undefined {
  if (!paths || paths.length === 0) return undefined

  let best = paths[0]
  let bestScore = calculatePathScore(best)

  for (let i = 1; i < paths.length; i++) {
    const score = calculatePathScore(paths[i])
    if (score > bestScore) {
      bestScore = score
      best = paths[i]
    }
  }

  return best
}


