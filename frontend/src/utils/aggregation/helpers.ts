import type { SectorFeature, SectorProperties } from '../../types'

export function safeNum(v: number | null | undefined): number {
  return (v == null || isNaN(v as number)) ? 0 : (v as number)
}

export function sumColumn(features: SectorFeature[], col: keyof SectorProperties): number {
  let sum = 0
  for (const f of features) {
    sum += safeNum(f.properties[col] as number | null)
  }
  return sum
}

export function sumColumns(props: SectorProperties, cols: readonly (keyof SectorProperties)[]): number {
  let sum = 0
  for (const col of cols) {
    sum += safeNum(props[col] as number | null)
  }
  return sum
}
