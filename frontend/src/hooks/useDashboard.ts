import { useMemo } from 'react'
import type { SectorFeature, DashboardData } from '../types'
import { aggregateFeatures, sectorToDashboard } from '../utils/aggregation'

export function useDashboard(
  visibleFeatures: SectorFeature[],
  selectedFeatures: SectorFeature[],  // seleção por polígono (multi)
  selectedSector: SectorFeature | null // seleção por clique simples (single)
): DashboardData {
  return useMemo(() => {
    if (selectedFeatures.length > 0) {
      return aggregateFeatures(selectedFeatures)
    }
    if (selectedSector) {
      return sectorToDashboard(selectedSector.properties)
    }
    return aggregateFeatures(visibleFeatures)
  }, [visibleFeatures, selectedFeatures, selectedSector])
}
