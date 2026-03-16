import { useState, useCallback } from 'react'
import type { FilterState, SectorFeature } from '../types'

const EMPTY_FILTERS: FilterState = {
  distrito: '',
  situacao: '',
  favela: '',
}

interface UseFiltersReturn {
  filters: FilterState
  selectedSector: SectorFeature | null
  setFilter: (key: keyof FilterState, value: string) => void
  setSelectedSector: (f: SectorFeature | null) => void
  clearAll: () => void
  applyFilters: (features: SectorFeature[]) => SectorFeature[]
}

export function useFilters(): UseFiltersReturn {
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS)
  const [selectedSector, setSelectedSector] = useState<SectorFeature | null>(null)

  const setFilter = useCallback((key: keyof FilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setSelectedSector(null)
  }, [])

  const clearAll = useCallback(() => {
    setFilters(EMPTY_FILTERS)
    setSelectedSector(null)
  }, [])

  const applyFilters = useCallback(
    (features: SectorFeature[]): SectorFeature[] => {
      return features.filter((f) => {
        const p = f.properties
        if (filters.distrito && p.NM_DIST !== filters.distrito) return false
        if (filters.situacao && p.SITUACAO !== filters.situacao) return false
        if (filters.favela && p.NM_FCU !== filters.favela) return false
        return true
      })
    },
    [filters]
  )

  return { filters, selectedSector, setFilter, setSelectedSector, clearAll, applyFilters }
}
