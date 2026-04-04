import type { SectorFeature, SectorProperties, RendaData, RendaFaixa } from '../../types'
import { safeNum } from './helpers'
import { IPCA_AGO2022_FEV2026, RENDA_FAIXAS } from '../constants'

function buildDistribuicao(rendaCorrigidaList: number[]): RendaFaixa[] {
  const counts = RENDA_FAIXAS.map(f => ({ label: f.label, count: 0 }))
  for (const valor of rendaCorrigidaList) {
    const idx = RENDA_FAIXAS.findIndex(f => valor < f.maxVal)
    if (idx >= 0) counts[idx].count++
  }
  return counts
}

export function aggregateRenda(features: SectorFeature[]): RendaData {
  let somaRendaXResponsaveis = 0
  let totalResponsaveis = 0
  const rendaCorrigidaList: number[] = []

  for (const f of features) {
    const p = f.properties
    const responsaveis = safeNum(p.V06001)
    const rendaNominal = safeNum(p.V06004)
    if (responsaveis > 0 && rendaNominal > 0) {
      somaRendaXResponsaveis += rendaNominal * responsaveis
      totalResponsaveis += responsaveis
      rendaCorrigidaList.push(rendaNominal * IPCA_AGO2022_FEV2026)
    }
  }

  const rendaMediaCorrigida =
    totalResponsaveis > 0
      ? (somaRendaXResponsaveis / totalResponsaveis) * IPCA_AGO2022_FEV2026
      : 0

  return {
    rendaMediaCorrigida,
    totalResponsaveis,
    sectorCount: rendaCorrigidaList.length,
    distribuicaoSetores: buildDistribuicao(rendaCorrigidaList),
  }
}

export function sectorRenda(p: SectorProperties): RendaData {
  const rendaNominal = safeNum(p.V06004)
  const rendaMediaCorrigida = rendaNominal * IPCA_AGO2022_FEV2026
  return {
    rendaMediaCorrigida,
    totalResponsaveis: safeNum(p.V06001),
    sectorCount: rendaNominal > 0 ? 1 : 0,
    distribuicaoSetores: buildDistribuicao(rendaNominal > 0 ? [rendaMediaCorrigida] : []),
  }
}
