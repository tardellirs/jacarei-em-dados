import type { SectorFeature, SectorProperties, DashboardData } from '../../types'
import { aggregateDemographics, sectorDemographics } from './demographics'
import { aggregateCorRaca, sectorCorRaca } from './corRaca'
import { aggregateAlfabetizacao, sectorAlfabetizacao } from './alfabetizacao'
import { aggregateDomicilio, sectorDomicilio } from './domicilio'
import { aggregateParentesco, sectorParentesco } from './parentesco'
import { aggregateIndigenasQuilombolas, sectorIndigenasQuilombolas } from './indigenasQuilombolas'
import { aggregateRenda, sectorRenda } from './renda'

export function aggregateFeatures(features: SectorFeature[]): DashboardData {
  const demo = aggregateDemographics(features)
  return {
    ...demo,
    corRaca: aggregateCorRaca(features),
    alfabetizacao: aggregateAlfabetizacao(features),
    domicilio: aggregateDomicilio(features),
    parentesco: aggregateParentesco(features),
    indigenasQuilombolas: aggregateIndigenasQuilombolas(features),
    renda: aggregateRenda(features),
  }
}

export function sectorToDashboard(p: SectorProperties): DashboardData {
  const demo = sectorDemographics(p)
  return {
    ...demo,
    corRaca: sectorCorRaca(p),
    alfabetizacao: sectorAlfabetizacao(p),
    domicilio: sectorDomicilio(p),
    parentesco: sectorParentesco(p),
    indigenasQuilombolas: sectorIndigenasQuilombolas(p),
    renda: sectorRenda(p),
  }
}
