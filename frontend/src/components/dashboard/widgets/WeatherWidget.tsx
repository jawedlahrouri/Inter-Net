import { useState, useEffect, useCallback } from 'react'
import {
  Sun,
  CloudSun,
  CloudFog,
  CloudRain,
  Snowflake,
  CloudLightning,
  Cloud,
  Droplets,
  Wind,
  MapPin,
  RefreshCw,
  AlertCircle,
  type LucideIcon,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Sparkline } from '@/components/ui/sparkline'
import { cn } from '@/lib/utils'
import {
  fetchWeather,
  fetchCoordinatesForCity,
  type WeatherData,
} from '@/services/weather'

export interface WeatherWidgetProps {
  city?: string
  lat?: number
  lon?: number
  onLocationDetected?: (cityName: string) => void
  className?: string
}

function getWeatherIconComponent(iconName: string): LucideIcon {
  switch (iconName) {
    case 'Sun':
      return Sun
    case 'CloudSun':
      return CloudSun
    case 'CloudFog':
      return CloudFog
    case 'CloudRain':
      return CloudRain
    case 'Snowflake':
      return Snowflake
    case 'CloudLightning':
      return CloudLightning
    default:
      return Cloud
  }
}

function getWeatherIconColor(iconName: string): string {
  switch (iconName) {
    case 'Sun':
      return 'text-amber-500 dark:text-amber-400'
    case 'CloudSun':
      return 'text-amber-400 dark:text-amber-300'
    case 'CloudFog':
      return 'text-neutral-400 dark:text-neutral-300'
    case 'CloudRain':
      return 'text-sky-500 dark:text-sky-400'
    case 'Snowflake':
      return 'text-cyan-400 dark:text-cyan-300'
    case 'CloudLightning':
      return 'text-yellow-400 dark:text-yellow-300'
    default:
      return 'text-slate-400 dark:text-slate-300'
  }
}

function getBrowserLocation(): Promise<{ lat: number; lon: number } | null> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      resolve(null)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        })
      },
      () => resolve(null),
      { timeout: 7000, maximumAge: 300000 }
    )
  })
}

export function WeatherWidget({
  city,
  lat,
  lon,
  onLocationDetected,
  className,
}: WeatherWidgetProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const loadWeather = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      let targetLat = lat
      let targetLon = lon
      let targetLocation = city

      // If coordinates are missing, resolve from city or navigator geolocation
      if (targetLat === undefined || targetLon === undefined) {
        if (city && city.trim().length > 0) {
          const geo = await fetchCoordinatesForCity(city)
          if (geo) {
            targetLat = geo.lat
            targetLon = geo.lon
            targetLocation = geo.name
          }
        } else {
          const browserCoords = await getBrowserLocation()
          if (browserCoords) {
            targetLat = browserCoords.lat
            targetLon = browserCoords.lon
          }
        }
      }

      const data = await fetchWeather(targetLat, targetLon, targetLocation)
      setWeather(data)

      if (data.locationName) {
        onLocationDetected?.(data.locationName)
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to retrieve meteorological forecast'
      )
    } finally {
      setLoading(false)
    }
  }, [city, lat, lon, onLocationDetected])

  useEffect(() => {
    loadWeather()
  }, [loadWeather])

  // Initial loading state before data is received
  if (loading && !weather) {
    return (
      <Card
        className={cn(
          'min-h-[320px] bg-card border-border flex flex-col items-center justify-center p-6 text-center shadow-xs',
          className
        )}
      >
        <RefreshCw className="size-6 animate-spin text-primary mb-3" />
        <p className="text-sm font-medium text-card-foreground">
          Loading weather forecast...
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Fetching data from Open-Meteo
        </p>
      </Card>
    )
  }

  // Error state with retry action
  if (error && !weather) {
    return (
      <Card
        className={cn(
          'min-h-[320px] bg-card border-border flex flex-col items-center justify-center p-6 text-center space-y-3 shadow-xs',
          className
        )}
      >
        <div className="p-3 rounded-full bg-destructive/10 text-destructive">
          <AlertCircle className="size-6" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-destructive">
            Unable to load weather
          </p>
          <p className="text-xs text-muted-foreground max-w-[220px]">
            {error}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadWeather}
          className="gap-1.5 cursor-pointer mt-1"
        >
          <RefreshCw className="size-3.5" />
          Retry
        </Button>
      </Card>
    )
  }

  if (!weather) {
    return null
  }

  const WeatherIcon = getWeatherIconComponent(weather.iconName)
  const iconColor = getWeatherIconColor(weather.iconName)
  const minTemp = Math.min(...weather.hourlyTemps)
  const maxTemp = Math.max(...weather.hourlyTemps)

  return (
    <Card
      className={cn(
        'min-h-[320px] bg-card border-border flex flex-col justify-between shadow-xs',
        className
      )}
    >
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div className="space-y-0.5 min-w-0">
          <CardTitle className="text-base font-semibold flex items-center gap-1.5 text-card-foreground truncate">
            <MapPin className="size-4 text-muted-foreground shrink-0" />
            <span className="truncate">{weather.locationName}</span>
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            {weather.condition}
          </CardDescription>
        </div>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={loadWeather}
          disabled={loading}
          aria-label="Refresh forecast"
          className="text-muted-foreground hover:text-foreground cursor-pointer shrink-0"
        >
          <RefreshCw className={cn('size-3.5', loading && 'animate-spin')} />
        </Button>
      </CardHeader>

      <CardContent className="space-y-4 pt-1 flex-1 flex flex-col justify-between">
        {/* Main Temperature and Condition Display */}
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-1">
            <span className="text-4xl sm:text-5xl font-bold tracking-tight text-card-foreground tabular-nums">
              {weather.temperature.toFixed(1)}
            </span>
            <span className="text-xl sm:text-2xl font-light text-muted-foreground">
              °C
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-muted/40 border border-border/50 flex items-center justify-center">
            <WeatherIcon className={cn('size-9 sm:size-10', iconColor)} />
          </div>
        </div>

        {/* Humidity and Wind Metrics */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-muted/30 border border-border/40">
            <Droplets className="size-4 text-muted-foreground shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] uppercase tracking-wide font-medium text-muted-foreground">
                Humidity
              </span>
              <span className="text-xs font-semibold tabular-nums text-foreground">
                {weather.humidity}%
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-muted/30 border border-border/40">
            <Wind className="size-4 text-muted-foreground shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] uppercase tracking-wide font-medium text-muted-foreground">
                Wind
              </span>
              <span className="text-xs font-semibold tabular-nums text-foreground">
                {weather.windSpeed} km/h
              </span>
            </div>
          </div>
        </div>

        {/* 24h Temperature Trend Sparkline */}
        {weather.hourlyTemps.length > 1 && (
          <div className="space-y-1.5 pt-2 border-t border-border/50">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span className="font-medium">24h Temperature Trend</span>
              <span className="tabular-nums font-mono">
                {minTemp.toFixed(0)}° / {maxTemp.toFixed(0)}°C
              </span>
            </div>
            <Sparkline
              data={weather.hourlyTemps}
              color="var(--primary)"
              className="h-10 w-full"
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default WeatherWidget
