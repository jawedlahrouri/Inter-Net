import { useState } from 'react'
import type { Widget, NewWidgetData } from '@/types/widget'

const DEFAULT_WIDGETS: Widget[] = [
  {
    id: '1',
    title: 'Météo locale',
    type: 'weather',
  },
  {
    id: '2',
    title: 'Statut API Backend',
    type: 'custom_api',
    apiUrl: 'http://127.0.0.1:8000/api/v1/health',
    jsonPath: 'status',
    displayMode: 'kpi',
    refreshIntervalSeconds: 15,
  },
]

export function useWidgets(initialWidgets: Widget[] = DEFAULT_WIDGETS) {
  const [widgets, setWidgets] = useState<Widget[]>(initialWidgets)

  const addWidget = (data: NewWidgetData) => {
    const newId = Date.now().toString()
    setWidgets((prev) => [...prev, { id: newId, ...data }])
  }

  const removeWidget = (id: string) => {
    setWidgets((prev) => prev.filter((w) => w.id !== id))
  }

  return {
    widgets,
    addWidget,
    removeWidget,
  }
}

export default useWidgets
