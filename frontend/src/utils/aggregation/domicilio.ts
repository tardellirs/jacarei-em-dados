import type { SectorFeature, SectorProperties, DomicilioData } from '../../types'
import { safeNum } from './helpers'
import { DOMICILIO_MORADORES_COLS, DOMICILIO_TIPO_COLS, DOMICILIO_TIPO_LABELS } from '../constants'

export function aggregateDomicilio(features: SectorFeature[]): DomicilioData {
  const porMoradores = new Array(10).fill(0)
  const porTipo = DOMICILIO_TIPO_LABELS.map(label => ({ label, value: 0 }))

  for (const f of features) {
    const p = f.properties
    DOMICILIO_MORADORES_COLS.forEach((col, i) => {
      porMoradores[i] += safeNum(p[col as keyof SectorProperties] as number | null)
    })
    DOMICILIO_TIPO_COLS.forEach((col, i) => {
      porTipo[i].value += safeNum(p[col as keyof SectorProperties] as number | null)
    })
  }

  return { porMoradores, porTipo }
}

export function sectorDomicilio(p: SectorProperties): DomicilioData {
  const porMoradores = DOMICILIO_MORADORES_COLS.map(
    col => safeNum(p[col as keyof SectorProperties] as number | null)
  )
  const porTipo = DOMICILIO_TIPO_COLS.map((col, i) => ({
    label: DOMICILIO_TIPO_LABELS[i],
    value: safeNum(p[col as keyof SectorProperties] as number | null),
  }))
  return { porMoradores, porTipo }
}
