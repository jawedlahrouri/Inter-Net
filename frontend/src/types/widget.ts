export type WidgetType = 'weather' | 'custom_api' | 'default'

export interface Widget {
  id: string
  title: string
  type?: WidgetType
  // For default / link
  url?: string
  // For weather
  city?: string
  lat?: number
  lon?: number
  // For custom_api
  apiUrl?: string
  jsonPath?: string
  displayMode?: 'kpi' | 'gauge'
  unit?: string
  refreshIntervalSeconds?: number
  gaugeMin?: number
  gaugeMax?: number
}

export type NewWidgetData = Omit<Widget, 'id'>
