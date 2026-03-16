import { useMemo } from 'react'
import type { SectorFeature, DashboardData } from '../types'
import { aggregateFeatures } from '../utils/aggregation'

export function useDashboard(
  visibleFeatures: SectorFeature[],
  selectedFeatures: SectorFeature[]
): DashboardData {
  return useMemo(() => {
    if (selectedFeatures.length > 0) {
      return aggregateFeatures(selectedFeatures)
    }
    return aggregateFeatures(visibleFeatures)
  }, [visibleFeatures, selectedFeatures])
}
