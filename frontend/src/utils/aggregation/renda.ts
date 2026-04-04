import type { SectorFeature, SectorProperties, RendaData, RendaFaixa } from '../../types'
import { safeNum } from './helpers'
import { IPCA_AGO2022_FEV2026, RENDA_FAIXAS } from '../constants'

function buildDistribuicao(entries: { rendaCorrigida: number; responsaveis: number }[]): RendaFaixa[] {
  const totals = RENDA_FAIXAS.map(f => ({ label: f.label, domicilios: 0 }))
  for (const { rendaCorrigida, responsaveis } of entries) {
    const idx = RENDA_FAIXAS.findIndex(f => rendaCorrigida < f.maxVal)
    if (idx >= 0) totals[idx].domicilios += responsaveis
  }
  return totals
}

export function aggregateRenda(features: SectorFeature[]): RendaData {
  let somaRendaXResponsaveis = 0
  let totalResponsaveis = 0
  const entries: { rendaCorrigida: number; responsaveis: number }[] = []

  for (const f of features) {
    const p = f.properties
    const responsaveis = safeNum(p.V06001)
    const rendaNominal = safeNum(p.V06004)
    if (responsaveis > 0 && rendaNominal > 0) {
      somaRendaXResponsaveis += rendaNominal * responsaveis
      totalResponsaveis += responsaveis
      entries.push({ rendaCorrigida: rendaNominal * IPCA_AGO2022_FEV2026, responsaveis })
    }
  }

  return {
    rendaMediaCorrigida:
      totalResponsaveis > 0
        ? (somaRendaXResponsaveis / totalResponsaveis) * IPCA_AGO2022_FEV2026
        : 0,
    totalResponsaveis,
    sectorCount: entries.length,
    distribuicaoSetores: buildDistribuicao(entries),
  }
}

export function sectorRenda(p: SectorProperties): RendaData {
  const rendaNominal = safeNum(p.V06004)
  const responsaveis = safeNum(p.V06001)
  const rendaCorrigida = rendaNominal * IPCA_AGO2022_FEV2026
  return {
    rendaMediaCorrigida: rendaCorrigida,
    totalResponsaveis: responsaveis,
    sectorCount: rendaNominal > 0 ? 1 : 0,
    distribuicaoSetores: buildDistribuicao(
      rendaNominal > 0 ? [{ rendaCorrigida, responsaveis }] : []
    ),
  }
}
