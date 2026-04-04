import type { SectorFeature, SectorProperties, RendaData } from '../../types'
import { safeNum } from './helpers'

export function aggregateRenda(features: SectorFeature[]): RendaData {
  let somaRendaXResponsaveis = 0
  let totalResponsaveis = 0

  for (const f of features) {
    const p = f.properties
    const responsaveis = safeNum(p.V06001)
    const rendaMedia = safeNum(p.V06004)
    if (responsaveis > 0 && rendaMedia > 0) {
      somaRendaXResponsaveis += rendaMedia * responsaveis
      totalResponsaveis += responsaveis
    }
  }

  return {
    rendaMedia: totalResponsaveis > 0 ? somaRendaXResponsaveis / totalResponsaveis : 0,
    totalResponsaveis,
  }
}

export function sectorRenda(p: SectorProperties): RendaData {
  return {
    rendaMedia: safeNum(p.V06004),
    totalResponsaveis: safeNum(p.V06001),
  }
}
