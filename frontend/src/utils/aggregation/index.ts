import type {
  SectorFeature,
  SectorProperties,
  DashboardData,
  VivarealSectorData,
  VivarealMarketData,
} from '../../types'
import { aggregateDemographics, sectorDemographics } from './demographics'
import { aggregateCorRaca, sectorCorRaca } from './corRaca'
import { aggregateAlfabetizacao, sectorAlfabetizacao } from './alfabetizacao'
import { aggregateDomicilio, sectorDomicilio } from './domicilio'
import { aggregateParentesco, sectorParentesco } from './parentesco'
import { aggregateIndigenasQuilombolas, sectorIndigenasQuilombolas } from './indigenasQuilombolas'
import { aggregateRenda, sectorRenda } from './renda'
import { aggregateMercadoImobiliario, sectorMercadoImobiliario } from './mercadoImobiliario'

export interface AggregationContext {
  vivarealSectorData?: VivarealSectorData
  vivarealMarketData?: VivarealMarketData | null
  /** O feature completo — necessário para calcular brackets dinâmicos em sectorToDashboard */
  sectorFeature?: SectorFeature
}

export function aggregateFeatures(
  features: SectorFeature[],
  ctx?: AggregationContext
): DashboardData {
  const demo = aggregateDemographics(features)
  return {
    ...demo,
    corRaca:                aggregateCorRaca(features),
    alfabetizacao:          aggregateAlfabetizacao(features),
    domicilio:              aggregateDomicilio(features),
    parentesco:             aggregateParentesco(features),
    indigenasQuilombolas:   aggregateIndigenasQuilombolas(features),
    renda:                  aggregateRenda(features),
    mercadoImobiliario:     aggregateMercadoImobiliario(
      features,
      ctx?.vivarealSectorData ?? {},
      ctx?.vivarealMarketData ?? null
    ),
  }
}

export function sectorToDashboard(
  p: SectorProperties,
  ctx?: AggregationContext
): DashboardData {
  const demo = sectorDemographics(p)
  return {
    ...demo,
    corRaca:               sectorCorRaca(p),
    alfabetizacao:         sectorAlfabetizacao(p),
    domicilio:             sectorDomicilio(p),
    parentesco:            sectorParentesco(p),
    indigenasQuilombolas:  sectorIndigenasQuilombolas(p),
    renda:                 sectorRenda(p),
    mercadoImobiliario:    sectorMercadoImobiliario(
      p.CD_SETOR,
      ctx?.vivarealSectorData ?? {},
      ctx?.vivarealMarketData ?? null,
      ctx?.sectorFeature
    ),
  }
}
