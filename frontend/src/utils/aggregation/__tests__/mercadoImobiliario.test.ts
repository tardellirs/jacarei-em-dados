import { describe, it, expect } from 'vitest'
import type { SectorFeature, SectorProperties, VivarealSectorData, VivarealMarketData } from '../../../types'
import { aggregateMercadoImobiliario, sectorMercadoImobiliario } from '../mercadoImobiliario'

function makeFeature(cdSetor: string): SectorFeature {
  return {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [0, 0] },
    properties: {
      CD_SETOR: cdSetor,
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
      V06001: null, V06004: null,
    } as SectorProperties,
  }
}

const mockSectorData: VivarealSectorData = {
  'S001': { cs: 10, cr: 3, msp: 400_000, mrp: 2_500, mpm2s: 5_000, mpm2r: 30, mua: 80 },
  'S002': { cs: 5,  cr: 2, msp: 600_000, mrp: 3_500, mpm2s: 7_000, mpm2r: 40, mua: 90 },
}

const mockMarketData: VivarealMarketData = {
  metadata: {
    total_sale: 1000, total_rental: 200,
    absorption_factor: 4, income_multiplier: 1.5,
    max_property_factor: 42, ipca_correction: 1.1665,
    generated_at: '2026-04-04T00:00:00Z',
    residential_types: ['HOME', 'APARTMENT'],
  },
  brackets: [
    { label: 'Econômico',  min: 0,       max: 150_000, max_label: 'R$ 150.000', demand: 3000, supply: 100, gap: 2900 },
    { label: 'Standard',   min: 150_000, max: 250_000, max_label: 'R$ 250.000', demand: 5000, supply: 800, gap: 4200 },
  ],
  summary: {
    total_sale: 1000, median_sale_price: 500_000,
    total_demand: 8000, total_supply: 1000,
    total_rental: 200, median_rental_price: 3000,
    median_rental_pm2: 35, median_sale_pm2: 6000,
  },
}

describe('aggregateMercadoImobiliario', () => {
  it('soma counts corretamente para múltiplos setores', () => {
    const features = [makeFeature('S001'), makeFeature('S002')]
    const result = aggregateMercadoImobiliario(features, mockSectorData, mockMarketData)
    expect(result.countSale).toBe(15)    // 10 + 5
    expect(result.countRental).toBe(5)   // 3 + 2
  })

  it('retorna zeros para setor sem dados no lookup', () => {
    const features = [makeFeature('S999')]
    const result = aggregateMercadoImobiliario(features, mockSectorData, mockMarketData)
    expect(result.countSale).toBe(0)
    expect(result.countRental).toBe(0)
  })

  it('computa 10 brackets dinamicamente a partir dos features', () => {
    const features = [makeFeature('S001')]
    const result = aggregateMercadoImobiliario(features, mockSectorData, mockMarketData)
    expect(result.brackets).toHaveLength(10)
    expect(result.brackets[0].label).toBe('Econômico')
    expect(result.brackets[9].label).toBe('Super Luxo')
  })

  it('computa brackets mesmo quando marketData é null', () => {
    const features = [makeFeature('S001')]
    const result = aggregateMercadoImobiliario(features, mockSectorData, null)
    expect(result.brackets).toHaveLength(10)
    expect(result.summary).not.toBeNull()
  })

  it('calcula mediana ponderada de preços pelo número de anúncios', () => {
    const features = [makeFeature('S001'), makeFeature('S002')]
    const result = aggregateMercadoImobiliario(features, mockSectorData, mockMarketData)
    // média ponderada: (400k × 10 + 600k × 5) / 15 = (4M + 3M) / 15 = 466.666
    expect(result.medianSalePrice).toBeCloseTo(466_667, -3)
  })

  it('funciona com sectorData vazio', () => {
    const features = [makeFeature('S001')]
    const result = aggregateMercadoImobiliario(features, {}, null)
    expect(result.countSale).toBe(0)
    expect(result.medianSalePrice).toBeNull()
  })
})

describe('sectorMercadoImobiliario', () => {
  it('retorna dados do setor específico', () => {
    const result = sectorMercadoImobiliario('S001', mockSectorData, mockMarketData)
    expect(result.countSale).toBe(10)
    expect(result.medianSalePrice).toBe(400_000)
    expect(result.medianPriceM2Sale).toBe(5_000)
  })

  it('retorna zeros para setor sem dados', () => {
    const result = sectorMercadoImobiliario('UNKNOWN', mockSectorData, mockMarketData)
    expect(result.countSale).toBe(0)
    expect(result.countRental).toBe(0)
    expect(result.medianSalePrice).toBeNull()
  })

  it('retorna brackets do marketData quando sem feature', () => {
    const result = sectorMercadoImobiliario('S001', mockSectorData, mockMarketData)
    // Sem feature, usa fallback do marketData
    expect(result.brackets).toHaveLength(2)
    expect(result.summary?.total_sale).toBe(1000)
  })
})
