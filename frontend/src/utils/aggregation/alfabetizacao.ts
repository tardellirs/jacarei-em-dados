import type { SectorFeature, SectorProperties, AlfabetizacaoData } from '../../types'
import { sumColumns } from './helpers'
import {
  MALE_AGE_COLS_15PLUS, FEMALE_AGE_COLS_15PLUS, ALFABETIZACAO_COLS,
  MALE_AGE_COLS_60PLUS, FEMALE_AGE_COLS_60PLUS, ALFABETIZACAO_60PLUS_COLS,
} from '../constants'

function populacao15Plus(p: SectorProperties): number {
  return sumColumns(p, MALE_AGE_COLS_15PLUS) + sumColumns(p, FEMALE_AGE_COLS_15PLUS)
}

function populacao60Plus(p: SectorProperties): number {
  return sumColumns(p, MALE_AGE_COLS_60PLUS) + sumColumns(p, FEMALE_AGE_COLS_60PLUS)
}

function totalAlfabetizadas(p: SectorProperties): number {
  return sumColumns(p, ALFABETIZACAO_COLS)
}

function totalAlfabetizadas60Plus(p: SectorProperties): number {
  return sumColumns(p, ALFABETIZACAO_60PLUS_COLS)
}

export function aggregateAlfabetizacao(features: SectorFeature[]): AlfabetizacaoData {
  let alfabetizadas = 0
  let pop15 = 0
  let alfa60 = 0
  let pop60 = 0

  for (const f of features) {
    const p = f.properties
    alfabetizadas += totalAlfabetizadas(p)
    pop15 += populacao15Plus(p)
    alfa60 += totalAlfabetizadas60Plus(p)
    pop60 += populacao60Plus(p)
  }

  return {
    alfabetizadas,
    naoAlfabetizadas: Math.max(0, pop15 - alfabetizadas),
    alfabetizadas60plus: alfa60,
    naoAlfabetizadas60plus: Math.max(0, pop60 - alfa60),
  }
}

export function sectorAlfabetizacao(p: SectorProperties): AlfabetizacaoData {
  const alfa = totalAlfabetizadas(p)
  const pop15 = populacao15Plus(p)
  const alfa60 = totalAlfabetizadas60Plus(p)
  const pop60 = populacao60Plus(p)
  return {
    alfabetizadas: alfa,
    naoAlfabetizadas: Math.max(0, pop15 - alfa),
    alfabetizadas60plus: alfa60,
    naoAlfabetizadas60plus: Math.max(0, pop60 - alfa60),
  }
}
