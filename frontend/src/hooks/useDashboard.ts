import { useMemo } from 'react'
import type { SectorFeature, DashboardData } from '../types'
import { aggregateFeatures, sectorToDashboard } from '../utils/aggregation'

export function useDashboard(
  visibleFeatures: SectorFeature[],
  selectedSector: SectorFeature | null
): DashboardData {
  return useMemo(() => {
    if (selectedSector) {
      return sectorToDashboard(selectedSector.properties)
    }
    return aggregateFeatures(visibleFeatures)
  }, [visibleFeatures, selectedSector])
}
