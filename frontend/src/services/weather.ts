
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
 * @brief Maps an Open-Meteo weather code to a readable condition label and an icon name.
 * @param weatherCode Numeric WMO weather code returned by Open-Meteo.
 * @return An object with the condition text and the iconName, defaulting to Cloudy for unmapped codes.
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
 * @brief Resolves coordinates to a place name through a reverse geocoding API with a 3.5 second timeout.
 * @param lat Latitude in decimal degrees.
 * @param lon Longitude in decimal degrees.
 * @return A promise of the city or locality name, or the formatted coordinates when lookup fails.
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
  }
  return `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`
}

/**
 * @brief Looks up the coordinates of a city by name using the Open-Meteo geocoding API.
 * @param cityName Name of the city to search for.
 * @return A promise of an object with lat, lon and name for the first match, or null when nothing is found or the request fails.
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
  }
  return null
}

/**
 * @brief Fetches current conditions and 24 hourly temperatures from Open-Meteo, falling back to Paris coordinates by default.
 * @param lat Optional latitude, defaulting to Paris when both coordinates are omitted.
 * @param lon Optional longitude, defaulting to Paris when both coordinates are omitted.
 * @param locationName Optional display name for the location, resolved automatically when omitted.
 * @return A promise of a WeatherData object with temperature, humidity, wind, condition, icon, hourly temperatures and location name.
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
