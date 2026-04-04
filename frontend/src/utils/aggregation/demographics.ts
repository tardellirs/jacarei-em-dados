import type { SectorFeature, SectorProperties } from '../../types'
import { MALE_AGE_COLS, FEMALE_AGE_COLS } from '../constants'
import { safeNum } from './helpers'

export interface DemographicsData {
  populacao: number
  domicilios: number
  area: number
  densidade: number
  masculino: number
  feminino: number
  masculinoPorFaixa: number[]
  femininoPorFaixa: number[]
  hasData: boolean
  sectorCount: number
}

export function aggregateDemographics(features: SectorFeature[]): DemographicsData {
  let populacao = 0
  let domicilios = 0
  let area = 0
  let masculino = 0
  let feminino = 0
  const masculinoPorFaixa = new Array(11).fill(0)
  const femininoPorFaixa = new Array(11).fill(0)
  let hasAnyData = false
  let sectorCount = 0

  for (const f of features) {
    const p = f.properties
    area += safeNum(p.AREA_KM2)

    if (p.V01006 != null) {
      hasAnyData = true
      sectorCount++
      populacao += safeNum(p.V01006)
      domicilios += safeNum(p.V0002)
      masculino += safeNum(p.V01007)
      feminino += safeNum(p.V01008)

      MALE_AGE_COLS.forEach((col, i) => {
        masculinoPorFaixa[i] += safeNum(p[col as keyof SectorProperties] as number | null)
      })
      FEMALE_AGE_COLS.forEach((col, i) => {
        femininoPorFaixa[i] += safeNum(p[col as keyof SectorProperties] as number | null)
      })
    }
  }

  const densidade = area > 0 ? populacao / area : 0

  return {
    populacao, domicilios, area, densidade,
    masculino, feminino, masculinoPorFaixa, femininoPorFaixa,
    hasData: hasAnyData, sectorCount,
  }
}

export function sectorDemographics(p: SectorProperties): DemographicsData {
  const hasData = p.V01006 != null

  if (!hasData) {
    return {
      populacao: 0, domicilios: 0, area: safeNum(p.AREA_KM2), densidade: 0,
      masculino: 0, feminino: 0,
      masculinoPorFaixa: new Array(11).fill(0),
      femininoPorFaixa: new Array(11).fill(0),
      hasData: false, sectorCount: 1,
    }
  }

  const masculinoPorFaixa = MALE_AGE_COLS.map(
    (col) => safeNum(p[col as keyof SectorProperties] as number | null)
  )
  const femininoPorFaixa = FEMALE_AGE_COLS.map(
    (col) => safeNum(p[col as keyof SectorProperties] as number | null)
  )

  const area = safeNum(p.AREA_KM2)
  const populacao = safeNum(p.V01006)

  return {
    populacao, domicilios: safeNum(p.V0002), area,
    densidade: area > 0 ? populacao / area : 0,
    masculino: safeNum(p.V01007), feminino: safeNum(p.V01008),
    masculinoPorFaixa, femininoPorFaixa,
    hasData: true, sectorCount: 1,
  }
}
