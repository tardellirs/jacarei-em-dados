import { describe, it, expect } from 'vitest'
import type { SectorFeature, SectorProperties } from '../../../types'
import { aggregateFeatures, sectorToDashboard } from '../index'
import { aggregateCorRaca } from '../corRaca'
import { aggregateAlfabetizacao } from '../alfabetizacao'
import { aggregateDomicilio } from '../domicilio'
import { aggregateParentesco } from '../parentesco'
import { aggregateIndigenasQuilombolas } from '../indigenasQuilombolas'
import { safeNum } from '../helpers'

function makeFeature(props: Partial<SectorProperties>): SectorFeature {
  return {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [0, 0] },
    properties: {
      CD_SETOR: '352440205000001',
      NM_DIST: null, SITUACAO: null, CD_TIPO: null, NM_FCU: null,
      AREA_KM2: 1.0,
      V0001: null, V0002: null, V0007: null,
      V01006: null, V01007: null, V01008: null,
      V01009: null, V01010: null, V01011: null, V01012: null, V01013: null,
      V01014: null, V01015: null, V01016: null, V01017: null, V01018: null, V01019: null,
      V01020: null, V01021: null, V01022: null, V01023: null, V01024: null,
      V01025: null, V01026: null, V01027: null, V01028: null, V01029: null, V01030: null,
      V01317: null, V01318: null, V01319: null, V01320: null, V01321: null,
      V00748: null, V00749: null, V00750: null, V00751: null, V00752: null, V00753: null,
      V00754: null, V00755: null, V00756: null, V00757: null, V00758: null, V00759: null, V00760: null,
      V00017: null, V00018: null, V00019: null, V00020: null, V00021: null,
      V00022: null, V00023: null, V00024: null, V00025: null, V00026: null,
      V00047: null, V00048: null, V00049: null, V00050: null, V00051: null, V00052: null,
      V01062: null, V01063: null, V01064: null, V01065: null, V01066: null, V01067: null, V01068: null,
      V01690: null, V01691: null, V01692: null, V01696: null, V01697: null, V01698: null, V01699: null,
      V03196: null, V03197: null, V03198: null, V03199: null, V03200: null, V03201: null, V03202: null,
      ...props,
    } as SectorProperties,
  }
}

describe('safeNum', () => {
  it('returns 0 for null/undefined/NaN', () => {
    expect(safeNum(null)).toBe(0)
    expect(safeNum(undefined)).toBe(0)
    expect(safeNum(NaN)).toBe(0)
  })
  it('returns the number for valid values', () => {
    expect(safeNum(42)).toBe(42)
  })
})

describe('aggregateCorRaca', () => {
  it('sums race/color across features', () => {
    const features = [
      makeFeature({ V01317: 100, V01318: 20, V01319: 5, V01320: 50, V01321: 3 }),
      makeFeature({ V01317: 200, V01318: 30, V01319: 10, V01320: 80, V01321: 7 }),
    ]
    const result = aggregateCorRaca(features)
    expect(result.branca).toBe(300)
    expect(result.preta).toBe(50)
    expect(result.amarela).toBe(15)
    expect(result.parda).toBe(130)
    expect(result.indigena).toBe(10)
  })
})

describe('aggregateAlfabetizacao', () => {
  it('computes literate vs non-literate for 15+ population', () => {
    const features = [
      makeFeature({
        // 15+ demographic age cols (male): V01012..V01019
        V01012: 10, V01013: 10, V01014: 10, V01015: 10,
        V01016: 10, V01017: 10, V01018: 10, V01019: 10,
        // 15+ demographic age cols (female): V01023..V01030
        V01023: 10, V01024: 10, V01025: 10, V01026: 10,
        V01027: 10, V01028: 10, V01029: 10, V01030: 10,
        // total 15+ = 160
        // literate: V00748..V00760 = 13 cols
        V00748: 10, V00749: 10, V00750: 10, V00751: 10,
        V00752: 10, V00753: 10, V00754: 10, V00755: 10,
        V00756: 10, V00757: 5, V00758: 5, V00759: 5, V00760: 5,
        // total literate = 120
      }),
    ]
    const result = aggregateAlfabetizacao(features)
    expect(result.alfabetizadas).toBe(110)
    expect(result.naoAlfabetizadas).toBe(50) // 160 - 110
  })
})

describe('aggregateDomicilio', () => {
  it('sums household counts by residents and type', () => {
    const features = [
      makeFeature({
        V00017: 10, V00018: 20, V00019: 15, V00020: 5, V00021: 3,
        V00022: 1, V00023: 0, V00024: 0, V00025: 0, V00026: 0,
        V00047: 30, V00048: 5, V00049: 10, V00050: 2, V00051: 0, V00052: 1,
      }),
    ]
    const result = aggregateDomicilio(features)
    expect(result.porMoradores[0]).toBe(10)
    expect(result.porMoradores[1]).toBe(20)
    expect(result.porTipo[0].label).toBe('Casa')
    expect(result.porTipo[0].value).toBe(30)
    expect(result.porTipo[2].label).toBe('Apartamento')
    expect(result.porTipo[2].value).toBe(10)
  })
})

describe('aggregateParentesco', () => {
  it('sums household head by sex and age', () => {
    const features = [
      makeFeature({ V01062: 40, V01063: 30, V01064: 2, V01065: 8, V01066: 20, V01067: 25, V01068: 15 }),
    ]
    const result = aggregateParentesco(features)
    expect(result.porSexo.masculino).toBe(40)
    expect(result.porSexo.feminino).toBe(30)
    expect(result.porFaixaEtaria[0].value).toBe(2)
    expect(result.porFaixaEtaria[4].label).toBe('60 anos ou mais')
  })
})

describe('aggregateIndigenasQuilombolas', () => {
  it('sums indigenous and quilombola data', () => {
    const features = [
      makeFeature({
        V01690: 11, V01691: 6, V01692: 5, V01696: 3, V01697: 4, V01698: 3, V01699: 1,
        V03196: 0, V03197: 0, V03198: 0, V03199: 0, V03200: 0, V03201: 0, V03202: 0,
      }),
    ]
    const result = aggregateIndigenasQuilombolas(features)
    expect(result.indigenas.total).toBe(11)
    expect(result.indigenas.masculino).toBe(6)
    expect(result.indigenas.porFaixaEtaria).toEqual([3, 4, 3, 1])
    expect(result.quilombolas.total).toBe(0)
  })
})

describe('aggregateFeatures (unified)', () => {
  it('returns complete DashboardData with all categories', () => {
    const features = [makeFeature({ V01006: 100, V0002: 50, AREA_KM2: 2.0 })]
    const result = aggregateFeatures(features)
    expect(result.populacao).toBe(100)
    expect(result.corRaca).toBeDefined()
    expect(result.alfabetizacao).toBeDefined()
    expect(result.domicilio).toBeDefined()
    expect(result.parentesco).toBeDefined()
    expect(result.indigenasQuilombolas).toBeDefined()
  })
})

describe('sectorToDashboard', () => {
  it('converts single sector properties to full DashboardData', () => {
    const feature = makeFeature({ V01006: 200, AREA_KM2: 0.5 })
    const result = sectorToDashboard(feature.properties)
    expect(result.populacao).toBe(200)
    expect(result.hasData).toBe(true)
    expect(result.corRaca).toBeDefined()
  })

  it('returns hasData=false for sector without V01006', () => {
    const feature = makeFeature({ AREA_KM2: 1.0 })
    const result = sectorToDashboard(feature.properties)
    expect(result.hasData).toBe(false)
    expect(result.area).toBe(1.0)
  })
})
