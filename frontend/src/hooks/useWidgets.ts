import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import type { Widget, NewWidgetData, WidgetType } from '@/types/widget'
import {
  fetchUserWidgets,
  createUserWidget,
  updateUserWidget,
  deleteWidgetApi,
  reorderUserWidgets,
  type ApiUserWidget,
  getStoredToken,
} from '@/services/api'

/**
 * @brief Converts a widget returned by the API into the frontend Widget model, normalizing its type and defaults.
 * @param uw The user widget object as returned by the backend API.
 * @return A Widget object with mapped type, parameters, refresh interval, dashboard id and dimensions.
 */
export function mapApiToWidget(uw: ApiUserWidget): Widget {
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
    width: uw.width || 1,
    height: uw.height || 1,
  }
}

/**
 * @brief Converts a frontend widget into the payload expected by the backend, keeping only the parameters relevant to its type.
 * @param data Partial widget data to serialize, including its type and type-specific fields.
 * @return An object with type, title, params_values, refresh_rate, width and height for the API.
 */
export function mapWidgetToApiPayload(data: Partial<Widget>) {
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
    width: data.width || 1,
    height: data.height || 1,
  }
}

/**
 * @brief Provides the user's widgets with loading state and functions to add, update, remove and reload them, synced with the API when logged in.
 * @return An object with widgets, loading, addWidget, updateWidget, removeWidget and reloadWidgets.
 */
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

  /**
   * @brief Adds a new widget through the API when authenticated, or locally with a temporary id otherwise.
   * @param data The data of the new widget to create.
   */
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

  /**
   * @brief Optimistically updates a widget in local state and persists the change to the API when the user is authenticated.
   * @param id Identifier of the widget to update.
   * @param updatedFields Partial widget fields to merge into the existing widget.
   */
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

  /**
   * @brief Removes a widget from local state and deletes it through the API when the user is authenticated.
   * @param id Identifier of the widget to remove.
   */
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

  /**
   * @brief Reorders widgets in state and persists the new order to the backend API.
   * @param reorderedSubset The reordered subset of widgets.
   */
  const reorderWidgets = async (reorderedSubset: Widget[]) => {
    const subsetIds = new Set(reorderedSubset.map((w) => w.id))
    const firstIndex = widgets.findIndex((w) => subsetIds.has(w.id))

    let nextAllWidgets: Widget[] = []
    if (firstIndex !== -1) {
      const before = widgets.filter((w, idx) => idx < firstIndex && !subsetIds.has(w.id))
      const after = widgets.filter((w, idx) => idx >= firstIndex && !subsetIds.has(w.id))
      nextAllWidgets = [...before, ...reorderedSubset, ...after]
    } else {
      nextAllWidgets = [...reorderedSubset, ...widgets.filter((w) => !subsetIds.has(w.id))]
    }

    setWidgets(nextAllWidgets)

    if (user || getStoredToken()) {
      try {
        const numericIds = nextAllWidgets
          .map((w) => Number(w.id))
          .filter((id) => !isNaN(id))
        await reorderUserWidgets(numericIds)
      } catch (err) {
        console.error('Erreur réordonnancement widgets:', err)
      }
    }
  }

  return {
    widgets,
    loading,
    addWidget,
    updateWidget,
    removeWidget,
    reorderWidgets,
    reloadWidgets,
  }
}

export default useWidgets

