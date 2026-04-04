import type { SectorFeature, SectorProperties, ParentescoData } from '../../types'
import { safeNum } from './helpers'
import { PARENTESCO_IDADE_COLS, PARENTESCO_IDADE_LABELS } from '../constants'

export function aggregateParentesco(features: SectorFeature[]): ParentescoData {
  let masculino = 0
  let feminino = 0
  const porFaixaEtaria = PARENTESCO_IDADE_LABELS.map(label => ({ label, value: 0 }))

  for (const f of features) {
    const p = f.properties
    masculino += safeNum(p.V01062)
    feminino += safeNum(p.V01063)
    PARENTESCO_IDADE_COLS.forEach((col, i) => {
      porFaixaEtaria[i].value += safeNum(p[col as keyof SectorProperties] as number | null)
    })
  }

  return {
    porSexo: { masculino, feminino },
    porFaixaEtaria,
  }
}

export function sectorParentesco(p: SectorProperties): ParentescoData {
  return {
    porSexo: {
      masculino: safeNum(p.V01062),
      feminino: safeNum(p.V01063),
    },
    porFaixaEtaria: PARENTESCO_IDADE_COLS.map((col, i) => ({
      label: PARENTESCO_IDADE_LABELS[i],
      value: safeNum(p[col as keyof SectorProperties] as number | null),
    })),
  }
}
