import type { SectorFeature, SectorProperties, AlfabetizacaoData } from '../../types'
import { safeNum, sumColumns } from './helpers'
import { MALE_AGE_COLS_15PLUS, FEMALE_AGE_COLS_15PLUS, ALFABETIZACAO_COLS } from '../constants'

function populacao15Plus(p: SectorProperties): number {
  return sumColumns(p, MALE_AGE_COLS_15PLUS) + sumColumns(p, FEMALE_AGE_COLS_15PLUS)
}

function totalAlfabetizadas(p: SectorProperties): number {
  return sumColumns(p, ALFABETIZACAO_COLS)
}

export function aggregateAlfabetizacao(features: SectorFeature[]): AlfabetizacaoData {
  let alfabetizadas = 0
  let pop15 = 0
  for (const f of features) {
    alfabetizadas += totalAlfabetizadas(f.properties)
    pop15 += populacao15Plus(f.properties)
  }
  return {
    alfabetizadas,
    naoAlfabetizadas: Math.max(0, pop15 - alfabetizadas),
  }
}

export function sectorAlfabetizacao(p: SectorProperties): AlfabetizacaoData {
  const alfa = totalAlfabetizadas(p)
  const pop15 = populacao15Plus(p)
  return {
    alfabetizadas: alfa,
    naoAlfabetizadas: Math.max(0, pop15 - alfa),
  }
}
