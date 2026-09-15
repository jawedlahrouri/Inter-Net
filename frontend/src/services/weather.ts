/**
 * Weather Service
 *
 * Fetches meteorological forecasts from the Open-Meteo API
 * and converts WMO weather interpretation codes into user-friendly labels and icons.
 */

export interface WeatherConditionInfo {
  condition: string
  iconName: string
}

export interface WeatherData {
  temperature: number
  humidity: number
  windSpeed: number
  weatherCode: number
  condition: string
  iconName: string
  hourlyTemps: number[]
  locationName: string
}

export const DEFAULT_LATITUDE = 48.8566
export const DEFAULT_LONGITUDE = 2.3522
export const DEFAULT_LOCATION_NAME = 'Paris'

const OPEN_METEO_FORECAST_URL = 'https://api.open-meteo.com/v1/forecast'
const OPEN_METEO_GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search'
const REVERSE_GEOCODE_URL = 'https://api.bigdatacloud.net/data/reverse-geocode-client'

/**
 * Converts a WMO weather code into a friendly condition label and Lucide icon name.
 *
 * Mapping rules:
 * - 0: Sunny ('Sun')
 * - 1-3: Partly Cloudy ('CloudSun')
 * - 45, 48: Fog ('CloudFog')
 * - 51-67, 80-82: Rain ('CloudRain')
 * - 71-77, 85-86: Snow ('Snowflake')
 * - 95+: Thunderstorm ('CloudLightning')
 */
export function getWeatherCondition(weatherCode: number): WeatherConditionInfo {
  if (weatherCode === 0) {
    return { condition: 'Sunny', iconName: 'Sun' }
  }
  if (weatherCode >= 1 && weatherCode <= 3) {
    return { condition: 'Partly Cloudy', iconName: 'CloudSun' }
  }
  if (weatherCode === 45 || weatherCode === 48) {
    return { condition: 'Fog', iconName: 'CloudFog' }
  }
  if ((weatherCode >= 51 && weatherCode <= 67) || (weatherCode >= 80 && weatherCode <= 82)) {
    return { condition: 'Rain', iconName: 'CloudRain' }
  }
  if ((weatherCode >= 71 && weatherCode <= 77) || weatherCode === 85 || weatherCode === 86) {
    return { condition: 'Snow', iconName: 'Snowflake' }
  }
  if (weatherCode >= 95) {
    return { condition: 'Thunderstorm', iconName: 'CloudLightning' }
  }
  return { condition: 'Cloudy', iconName: 'Cloud' }
}

export const getWeatherInfo = getWeatherCondition

/**
 * Reverse geocodes latitude and longitude coordinates into a human-readable city name.
 */
export async function reverseGeocode(lat: number, lon: number): Promise<string> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 3500)
    const response = await fetch(
      `${REVERSE_GEOCODE_URL}?latitude=${lat}&longitude=${lon}&localityLanguage=en`,
      { signal: controller.signal }
    )
    clearTimeout(timeout)

    if (response.ok) {
      const data = await response.json()
      const resolved = data.city || data.locality || data.principalSubdivision
      if (resolved) {
        return resolved
      }
    }
  } catch {
    // Gracefully handle network errors or timeout aborts
  }
  return `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`
}

/**
 * Searches coordinates for a given city name via Open-Meteo Geocoding API.
 */
export async function fetchCoordinatesForCity(
  cityName: string
): Promise<{ lat: number; lon: number; name: string } | null> {
  try {
    const url = `${OPEN_METEO_GEOCODING_URL}?name=${encodeURIComponent(cityName)}&count=1&language=en&format=json`
    const response = await fetch(url)
    if (!response.ok) return null

    const data = await response.json()
    if (Array.isArray(data.results) && data.results.length > 0) {
      const first = data.results[0]
      return {
        lat: Number(first.latitude),
        lon: Number(first.longitude),
        name: String(first.name),
      }
    }
  } catch {
    // Return null if geocoding fails
  }
  return null
}

/**
 * Fetches current weather and 24h hourly forecast from the Open-Meteo API.
 * Defaults to Paris (lat: 48.8566, lon: 2.3522) if coordinates are not provided.
 */
export async function fetchWeather(
  lat?: number,
  lon?: number,
  locationName?: string
): Promise<WeatherData> {
  const isDefault = lat === undefined && lon === undefined
  const finalLat = lat ?? DEFAULT_LATITUDE
  const finalLon = lon ?? DEFAULT_LONGITUDE

  const url = new URL(OPEN_METEO_FORECAST_URL)
  url.searchParams.set('latitude', finalLat.toString())
  url.searchParams.set('longitude', finalLon.toString())
  url.searchParams.set(
    'current',
    'temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m'
  )
  url.searchParams.set('hourly', 'temperature_2m')
  url.searchParams.set('forecast_days', '1')

  const response = await fetch(url.toString())
  if (!response.ok) {
    throw new Error(`Open-Meteo request failed: ${response.statusText} (${response.status})`)
  }

  const data = await response.json()
  const current = data.current ?? {}
  const weatherCode = Number(current.weather_code ?? 0)
  const weatherInfo = getWeatherCondition(weatherCode)

  let resolvedLocation = locationName
  if (!resolvedLocation) {
    if (isDefault) {
      resolvedLocation = DEFAULT_LOCATION_NAME
    } else {
      resolvedLocation = await reverseGeocode(finalLat, finalLon)
    }
  }

  const hourlyTemps: number[] = Array.isArray(data.hourly?.temperature_2m)
    ? (data.hourly.temperature_2m as number[]).slice(0, 24)
    : []

  return {
    temperature: Number(current.temperature_2m ?? 0),
    humidity: Number(current.relative_humidity_2m ?? 0),
    windSpeed: Number(current.wind_speed_10m ?? 0),
    weatherCode,
    condition: weatherInfo.condition,
    iconName: weatherInfo.iconName,
    hourlyTemps,
    locationName: resolvedLocation,
  }
}
