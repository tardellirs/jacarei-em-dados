import type { SectorFeature, SectorProperties, IndigenasQuilombolasData, PopulacaoEspecialData } from '../../types'
import { safeNum } from './helpers'
import {
  INDIGENAS_COLS, INDIGENAS_FAIXA_COLS,
  QUILOMBOLAS_COLS, QUILOMBOLAS_FAIXA_COLS,
} from '../constants'

function emptyPopEspecial(): PopulacaoEspecialData {
  return { total: 0, masculino: 0, feminino: 0, porFaixaEtaria: [0, 0, 0, 0] }
}

export function aggregateIndigenasQuilombolas(features: SectorFeature[]): IndigenasQuilombolasData {
  const indigenas = emptyPopEspecial()
  const quilombolas = emptyPopEspecial()

  for (const f of features) {
    const p = f.properties
    indigenas.total += safeNum(p.V01690)
    indigenas.masculino += safeNum(p.V01691)
    indigenas.feminino += safeNum(p.V01692)
    INDIGENAS_FAIXA_COLS.forEach((col, i) => {
      indigenas.porFaixaEtaria[i] += safeNum(p[col as keyof SectorProperties] as number | null)
    })

    quilombolas.total += safeNum(p.V03196)
    quilombolas.masculino += safeNum(p.V03197)
    quilombolas.feminino += safeNum(p.V03198)
    QUILOMBOLAS_FAIXA_COLS.forEach((col, i) => {
      quilombolas.porFaixaEtaria[i] += safeNum(p[col as keyof SectorProperties] as number | null)
    })
  }

  return { indigenas, quilombolas }
}

export function sectorIndigenasQuilombolas(p: SectorProperties): IndigenasQuilombolasData {
  return {
    indigenas: {
      total: safeNum(p.V01690),
      masculino: safeNum(p.V01691),
      feminino: safeNum(p.V01692),
      porFaixaEtaria: INDIGENAS_FAIXA_COLS.map(
        col => safeNum(p[col as keyof SectorProperties] as number | null)
      ),
    },
    quilombolas: {
      total: safeNum(p.V03196),
      masculino: safeNum(p.V03197),
      feminino: safeNum(p.V03198),
      porFaixaEtaria: QUILOMBOLAS_FAIXA_COLS.map(
        col => safeNum(p[col as keyof SectorProperties] as number | null)
      ),
    },
  }
}
