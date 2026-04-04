import type { SectorFeature, SectorProperties, CorRacaData } from '../../types'
import { safeNum } from './helpers'

export function aggregateCorRaca(features: SectorFeature[]): CorRacaData {
  const result: CorRacaData = { branca: 0, preta: 0, amarela: 0, parda: 0, indigena: 0 }
  for (const f of features) {
    const p = f.properties
    result.branca += safeNum(p.V01317)
    result.preta += safeNum(p.V01318)
    result.amarela += safeNum(p.V01319)
    result.parda += safeNum(p.V01320)
    result.indigena += safeNum(p.V01321)
  }
  return result
}

export function sectorCorRaca(p: SectorProperties): CorRacaData {
  return {
    branca: safeNum(p.V01317),
    preta: safeNum(p.V01318),
    amarela: safeNum(p.V01319),
    parda: safeNum(p.V01320),
    indigena: safeNum(p.V01321),
  }
}
