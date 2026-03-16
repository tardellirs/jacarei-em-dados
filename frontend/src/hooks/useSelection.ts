import { useState, useCallback, useMemo, useEffect } from 'react'
import type { SelectionMode, SectorFeature } from '../types'

interface UseSelectionReturn {
  mode: SelectionMode
  selectedCds: Set<string>
  selectedFeatures: SectorFeature[]
  startDrawing: () => void
  completePolygon: (cds: string[]) => void
  toggleSector: (cd: string) => void
  clearSelection: () => void
}

export function useSelection(visibleFeatures: SectorFeature[]): UseSelectionReturn {
  const [mode, setMode] = useState<SelectionMode>('none')
  const [selectedCds, setSelectedCds] = useState<Set<string>>(new Set())

  // Prune selectedCds when visible features change (due to filters)
  useEffect(() => {
    if (selectedCds.size === 0) return
    const visibleSet = new Set(visibleFeatures.map((f) => f.properties.CD_SETOR))
    const pruned = new Set([...selectedCds].filter((cd) => visibleSet.has(cd)))
    if (pruned.size !== selectedCds.size) {
      setSelectedCds(pruned)
      if (pruned.size === 0) setMode('none')
    }
  }, [visibleFeatures]) // eslint-disable-line react-hooks/exhaustive-deps

  const selectedFeatures = useMemo(
    () => visibleFeatures.filter((f) => selectedCds.has(f.properties.CD_SETOR)),
    [visibleFeatures, selectedCds]
  )

  const startDrawing = useCallback(() => {
    setSelectedCds(new Set())
    setMode('drawing')
  }, [])

  const completePolygon = useCallback((cds: string[]) => {
    setSelectedCds(new Set(cds))
    setMode(cds.length > 0 ? 'selected' : 'none')
  }, [])

  const toggleSector = useCallback((cd: string) => {
    setSelectedCds((prev) => {
      const next = new Set(prev)
      if (next.has(cd)) {
        next.delete(cd)
      } else {
        next.add(cd)
      }
      if (next.size === 0) setMode('none')
      return next
    })
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedCds(new Set())
    setMode('none')
  }, [])

  return { mode, selectedCds, selectedFeatures, startDrawing, completePolygon, toggleSector, clearSelection }
}
