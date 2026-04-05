import type {
  SectorFeature,
  VivarealSectorData,
  VivarealMarketData,
  MercadoImobiliarioData,
  MarketBracket,
} from '../../types'
import { safeNum } from './helpers'
import {
  IPCA_AGO2022_FEV2026,
  INCOME_MULTIPLIER,
  MAX_PROPERTY_FACTOR,
  ABSORPTION_FACTOR,
  MARKET_BRACKETS,
} from '../constants'

function weightedMedian(pairs: { value: number; weight: number }[]): number | null {
  const valid = pairs.filter((p) => p.value > 0 && p.weight > 0)
  if (valid.length === 0) return null
  const sumW = valid.reduce((s, p) => s + p.weight, 0)
  return sumW > 0 ? valid.reduce((s, p) => s + p.value * p.weight, 0) / sumW : null
}

function nullableRound(v: number | null): number | null {
  return v != null ? Math.round(v) : null
}

function bracketIndex(value: number): number {
  for (let i = 0; i < MARKET_BRACKETS.length; i++) {
    if (value < MARKET_BRACKETS[i].max) return i
  }
  return MARKET_BRACKETS.length - 1
}

function fmtMax(max: number): string {
  if (max === Infinity) return 'Acima'
  return `R$ ${max.toLocaleString('pt-BR')}`
}

/**
 * Calcula brackets Demanda × Oferta dinamicamente a partir dos features selecionados.
 * - Demanda: calculada do censo (V06001, V06004) dos features
 * - Oferta: somada dos sb[] (supply_by_bracket) dos setores no vivarealSectorData
 */
function computeBrackets(
  features: SectorFeature[],
  sectorData: VivarealSectorData,
): MarketBracket[] {
  const n = MARKET_BRACKETS.length
  const demand = new Array(n).fill(0)
  const supply = new Array(n).fill(0)

  for (const f of features) {
    const p = f.properties
    const cd = p.CD_SETOR

    // Demanda: do censo
    const responsaveis = safeNum(p.V06001)
    const rendaNominal = safeNum(p.V06004)
    if (responsaveis > 0 && rendaNominal > 0) {
      const rendaCorrigida = rendaNominal * IPCA_AGO2022_FEV2026
      const rendaFamiliar  = rendaCorrigida * INCOME_MULTIPLIER
      const valorMaximo    = rendaFamiliar * MAX_PROPERTY_FACTOR
      const demandaSetor   = responsaveis / ABSORPTION_FACTOR
      demand[bracketIndex(valorMaximo)] += demandaSetor
    }

    // Oferta: do vivareal
    const entry = sectorData[cd]
    if (entry?.sb) {
      for (let i = 0; i < Math.min(entry.sb.length, n); i++) {
        supply[i] += entry.sb[i]
      }
    }
  }

  return MARKET_BRACKETS.map((b, i) => ({
    label:     b.label,
    min:       b.min,
    max:       b.max === Infinity ? null : b.max,
    max_label: fmtMax(b.max),
    demand:    Math.round(demand[i] * 10) / 10,
    supply:    supply[i],
    gap:       Math.round((demand[i] - supply[i]) * 10) / 10,
  }))
}

export function aggregateMercadoImobiliario(
  features: SectorFeature[],
  sectorData: VivarealSectorData,
  _marketData: VivarealMarketData | null
): MercadoImobiliarioData {
  let countSale = 0
  let countRental = 0
  const salePricePairs: { value: number; weight: number }[] = []
  const rentalPricePairs: { value: number; weight: number }[] = []
  const priceM2SalePairs: { value: number; weight: number }[] = []
  const priceM2RentalPairs: { value: number; weight: number }[] = []

  for (const f of features) {
    const cd = f.properties.CD_SETOR
    const entry = sectorData[cd]
    if (!entry) continue

    const cs = entry.cs ?? 0
    const cr = entry.cr ?? 0
    countSale   += cs
    countRental += cr

    if (entry.msp && cs > 0) salePricePairs.push({ value: entry.msp, weight: cs })
    if (entry.mrp && cr > 0) rentalPricePairs.push({ value: entry.mrp, weight: cr })
    if (entry.mpm2s && cs > 0) priceM2SalePairs.push({ value: entry.mpm2s, weight: cs })
    if (entry.mpm2r && cr > 0) priceM2RentalPairs.push({ value: entry.mpm2r, weight: cr })
  }

  const brackets = computeBrackets(features, sectorData)
  const totalDemand = brackets.reduce((s, b) => s + b.demand, 0)

  return {
    countSale,
    countRental,
    medianSalePrice:     nullableRound(weightedMedian(salePricePairs)),
    medianRentalPrice:   nullableRound(weightedMedian(rentalPricePairs)),
    medianPriceM2Sale:   nullableRound(weightedMedian(priceM2SalePairs)),
    medianPriceM2Rental: nullableRound(weightedMedian(priceM2RentalPairs)),
    brackets,
    summary: {
      total_sale:          countSale,
      median_sale_price:   nullableRound(weightedMedian(salePricePairs)),
      total_demand:        Math.round(totalDemand * 10) / 10,
      total_supply:        countSale,
      total_rental:        countRental,
      median_rental_price: nullableRound(weightedMedian(rentalPricePairs)),
      median_rental_pm2:   nullableRound(weightedMedian(priceM2RentalPairs)),
      median_sale_pm2:     nullableRound(weightedMedian(priceM2SalePairs)),
    },
  }
}

export function sectorMercadoImobiliario(
  cdSetor: string,
  sectorData: VivarealSectorData,
  marketData: VivarealMarketData | null,
  feature?: SectorFeature,
): MercadoImobiliarioData {
  const entry = sectorData[cdSetor]

  // Se temos o feature, podemos calcular brackets para este setor
  if (feature) {
    return aggregateMercadoImobiliario([feature], sectorData, marketData)
  }

  return {
    countSale:           entry?.cs ?? 0,
    countRental:         entry?.cr ?? 0,
    medianSalePrice:     entry?.msp ?? null,
    medianRentalPrice:   entry?.mrp ?? null,
    medianPriceM2Sale:   entry?.mpm2s ?? null,
    medianPriceM2Rental: entry?.mpm2r ?? null,
    brackets:            marketData?.brackets ?? [],
    summary:             marketData?.summary ?? null,
  }
}
