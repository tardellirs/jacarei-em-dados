import { useMemo } from 'react'
import type {
  SectorFeature,
  DashboardData,
  VivarealSectorData,
  VivarealMarketData,
} from '../types'
import { aggregateFeatures, sectorToDashboard } from '../utils/aggregation'

export function useDashboard(
  visibleFeatures: SectorFeature[],
  selectedFeatures: SectorFeature[],   // seleção por polígono (multi)
  selectedSector: SectorFeature | null, // seleção por clique simples (single)
  vivarealSectorData?: VivarealSectorData,
  vivarealMarketData?: VivarealMarketData | null
): DashboardData {
  const ctx = useMemo(
    () => ({ vivarealSectorData, vivarealMarketData }),
    [vivarealSectorData, vivarealMarketData]
  )

  return useMemo(() => {
    if (selectedFeatures.length > 0) {
      return aggregateFeatures(selectedFeatures, ctx)
    }
    if (selectedSector) {
      return sectorToDashboard(selectedSector.properties, {
        ...ctx,
        sectorFeature: selectedSector,
      })
    }
    return aggregateFeatures(visibleFeatures, ctx)
  }, [visibleFeatures, selectedFeatures, selectedSector, ctx])
}
