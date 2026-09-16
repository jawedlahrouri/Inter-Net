import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import type { Widget, NewWidgetData, WidgetType } from '@/types/widget'
import {
  fetchUserWidgets,
  createUserWidget,
  updateUserWidget,
  deleteWidgetApi,
  type ApiUserWidget,
  getStoredToken,
} from '@/services/api'

function mapApiToWidget(uw: ApiUserWidget): Widget {
  const rawType = uw.type || uw.widget_def?.name || ''
  let type: WidgetType = 'default'
  if (rawType === 'city_temperature' || rawType === 'weather') {
    type = 'weather'
  } else if (rawType === 'custom_api') {
    type = 'custom_api'
  } else if (rawType === 'steam') {
    type = 'steam'
  } else if (rawType === 'github') {
    type = 'github'
  } else {
    type = 'default'
  }


  const p = uw.params_values || {}
  return {
    id: String(uw.id),
    title: uw.title || uw.widget_def?.display_name || 'Widget',
    type,
    city: p.city,
    lat: p.lat,
    lon: p.lon,
    apiUrl: p.apiUrl,
    jsonPath: p.jsonPath,
    displayMode: p.displayMode || 'kpi',
    unit: p.unit,
    refreshIntervalSeconds: uw.refresh_rate || 60,
    gaugeMin: p.gaugeMin,
    gaugeMax: p.gaugeMax,
    url: p.url,
    steamMetric: p.steamMetric,
    githubMetric: p.githubMetric,
    repoFullName: p.repoFullName,
    orgName: p.orgName,
    dashboardId: p.dashboardId || 'default',
  }
}

function mapWidgetToApiPayload(data: Partial<Widget>) {
  let type = 'default'
  const params: Record<string, any> = {
    dashboardId: data.dashboardId || 'default',
  }

  if (data.type === 'weather') {
    type = 'weather'
    if (data.city) params.city = data.city
    if (data.lat !== undefined) params.lat = data.lat
    if (data.lon !== undefined) params.lon = data.lon
  } else if (data.type === 'custom_api') {
    type = 'custom_api'
    if (data.apiUrl) params.apiUrl = data.apiUrl
    if (data.jsonPath) params.jsonPath = data.jsonPath
    if (data.displayMode) params.displayMode = data.displayMode
    if (data.unit) params.unit = data.unit
    if (data.gaugeMin !== undefined) params.gaugeMin = data.gaugeMin
    if (data.gaugeMax !== undefined) params.gaugeMax = data.gaugeMax
  } else if (data.type === 'steam') {
    type = 'steam'
    if (data.steamMetric) params.steamMetric = data.steamMetric
  } else if (data.type === 'github') {
    type = 'github'
    if (data.githubMetric) params.githubMetric = data.githubMetric
    if (data.repoFullName) params.repoFullName = data.repoFullName
    if (data.orgName) params.orgName = data.orgName
  } else {
    type = 'default'
    if (data.url) params.url = data.url
  }

  return {
    type,
    title: data.title,
    params_values: params,
    refresh_rate: data.refreshIntervalSeconds || 60,
  }
}

export function useWidgets() {
  const { user } = useAuth()
  const [widgets, setWidgets] = useState<Widget[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  const reloadWidgets = useCallback(async () => {
    if (!user && !getStoredToken()) {
      setWidgets([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const data = await fetchUserWidgets()
      setWidgets(data.map(mapApiToWidget))
    } catch (err) {
      console.error('Erreur chargement des widgets:', err)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    reloadWidgets()
  }, [reloadWidgets])

  const addWidget = async (data: NewWidgetData) => {
    try {
      if (user || getStoredToken()) {
        const payload = mapWidgetToApiPayload(data)
        const created = await createUserWidget(payload)
        setWidgets((prev) => [...prev, mapApiToWidget(created)])
      } else {
        const tempId = Date.now().toString()
        setWidgets((prev) => [...prev, { id: tempId, ...data }])
      }
    } catch (err) {
      console.error('Erreur création widget:', err)
    }
  }

  const updateWidget = async (id: string, updatedFields: Partial<Widget>) => {
    setWidgets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, ...updatedFields } : w))
    )

    if ((user || getStoredToken()) && !isNaN(Number(id))) {
      try {
        const target = widgets.find((w) => w.id === id)
        const merged = { ...target, ...updatedFields }
        const payload = mapWidgetToApiPayload(merged)
        await updateUserWidget(id, payload)
      } catch (err) {
        console.error('Erreur mise à jour widget:', err)
      }
    }
  }

  const removeWidget = async (id: string) => {
    setWidgets((prev) => prev.filter((w) => w.id !== id))
    if ((user || getStoredToken()) && !isNaN(Number(id))) {
      try {
        await deleteWidgetApi(id)
      } catch (err) {
        console.error('Erreur suppression widget:', err)
      }
    }
  }

  return {
    widgets,
    loading,
    addWidget,
    updateWidget,
    removeWidget,
    reloadWidgets,
  }
}

export default useWidgets
