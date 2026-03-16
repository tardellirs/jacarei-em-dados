import type { Feature, Geometry } from 'geojson'

export interface SectorProperties {
  CD_SETOR: string
  NM_DIST: string | null
  SITUACAO: string | null
  CD_TIPO: number | null
  NM_FCU: string | null
  AREA_KM2: number | null
  // Totais do GPKG
  V0001: number | null // Total pessoas
  V0002: number | null // Total domicílios
  V0007: number | null // Domicílios particulares ocupados
  // Totais do CSV
  V01006: number | null // Total moradores
  V01007: number | null // Masculino
  V01008: number | null // Feminino
  // Masculino por faixa etária
  V01009: number | null // 0-4
  V01010: number | null // 5-9
  V01011: number | null // 10-14
  V01012: number | null // 15-19
  V01013: number | null // 20-24
  V01014: number | null // 25-29
  V01015: number | null // 30-39
  V01016: number | null // 40-49
  V01017: number | null // 50-59
  V01018: number | null // 60-69
  V01019: number | null // 70+
  // Feminino por faixa etária
  V01020: number | null // 0-4
  V01021: number | null // 5-9
  V01022: number | null // 10-14
  V01023: number | null // 15-19
  V01024: number | null // 20-24
  V01025: number | null // 25-29
  V01026: number | null // 30-39
  V01027: number | null // 40-49
  V01028: number | null // 50-59
  V01029: number | null // 60-69
  V01030: number | null // 70+
}

export type SectorFeature = Feature<Geometry, SectorProperties>

export interface DashboardData {
  populacao: number
  domicilios: number
  area: number
  densidade: number
  masculino: number
  feminino: number
  masculinoPorFaixa: number[]
  femininoPorFaixa: number[]
  hasData: boolean
  sectorCount: number
}

export interface FilterState {
  distrito: string
  situacao: string
  favela: string
}

export interface FilterOptions {
  distritos: string[]
  situacoes: string[]
  favelas: string[]
}
