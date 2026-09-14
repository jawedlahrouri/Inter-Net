import { useState } from 'react'
import type { Widget } from '@/types/widget'

const DEFAULT_WIDGETS: Widget[] = [
  { id: '1', title: 'Widget 1' },
  { id: '2', title: 'Widget 2' },
]

export function useWidgets(initialWidgets: Widget[] = DEFAULT_WIDGETS) {
  const [widgets, setWidgets] = useState<Widget[]>(initialWidgets)

  const addWidget = (title: string) => {
    const trimmed = title.trim()
    if (!trimmed) return
    const newId = (widgets.length + 1).toString()
    setWidgets((prev) => [...prev, { id: newId, title: trimmed }])
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

