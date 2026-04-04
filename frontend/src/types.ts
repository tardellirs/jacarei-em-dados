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
  // ── Demografia (CSV) ──
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
  // ── Cor ou Raça ──
  V01317: number | null // Branca
  V01318: number | null // Preta
  V01319: number | null // Amarela
  V01320: number | null // Parda
  V01321: number | null // Indígena
  // ── Alfabetização (pessoas alfabetizadas por faixa 15+) ──
  V00748: number | null // 15-19
  V00749: number | null // 20-24
  V00750: number | null // 25-29
  V00751: number | null // 30-34
  V00752: number | null // 35-39
  V00753: number | null // 40-44
  V00754: number | null // 45-49
  V00755: number | null // 50-54
  V00756: number | null // 55-59
  V00757: number | null // 60-64
  V00758: number | null // 65-69
  V00759: number | null // 70-79
  V00760: number | null // 80+
  // ── Domicílio: moradores por domicílio ──
  V00017: number | null // 1 morador
  V00018: number | null // 2 moradores
  V00019: number | null // 3 moradores
  V00020: number | null // 4 moradores
  V00021: number | null // 5 moradores
  V00022: number | null // 6 moradores
  V00023: number | null // 7 moradores
  V00024: number | null // 8 moradores
  V00025: number | null // 9 moradores
  V00026: number | null // 10+ moradores
  // ── Domicílio: tipo ──
  V00047: number | null // Casa
  V00048: number | null // Casa de vila ou condomínio
  V00049: number | null // Apartamento
  V00050: number | null // Habitação em casa de cômodo ou cortiço
  V00051: number | null // Habitação indígena sem paredes ou maloca
  V00052: number | null // Estrutura residencial permanente degradada ou inacabada
  // ── Parentesco ──
  V01062: number | null // Responsável masculino
  V01063: number | null // Responsável feminino
  V01064: number | null // Responsável 12-17 anos
  V01065: number | null // Responsável 18-24 anos
  V01066: number | null // Responsável 25-39 anos
  V01067: number | null // Responsável 40-59 anos
  V01068: number | null // Responsável 60+ anos
  // ── Indígenas ──
  V01690: number | null // Total indígenas
  V01691: number | null // Indígenas masculino
  V01692: number | null // Indígenas feminino
  V01696: number | null // Indígenas 0-14 anos
  V01697: number | null // Indígenas 15-29 anos
  V01698: number | null // Indígenas 30-59 anos
  V01699: number | null // Indígenas 60+ anos
  // ── Quilombolas ──
  V03196: number | null // Total quilombolas
  V03197: number | null // Quilombolas masculino
  V03198: number | null // Quilombolas feminino
  V03199: number | null // Quilombolas 0-14 anos
  V03200: number | null // Quilombolas 15-29 anos
  V03201: number | null // Quilombolas 30-59 anos
  V03202: number | null // Quilombolas 60+ anos
}

export type SectorFeature = Feature<Geometry, SectorProperties>

// ── Categorias do Dashboard ──

export type DashboardCategory =
  | 'demografia'
  | 'cor_ou_raca'
  | 'alfabetizacao'
  | 'domicilio'
  | 'parentesco'
  | 'indigenas_quilombolas'

export interface CorRacaData {
  branca: number
  preta: number
  amarela: number
  parda: number
  indigena: number
}

export interface AlfabetizacaoData {
  alfabetizadas: number
  naoAlfabetizadas: number
  // Subgrupo 60+
  alfabetizadas60plus: number
  naoAlfabetizadas60plus: number
}

export interface DomicilioData {
  porMoradores: number[] // 10 valores: 1, 2, 3, ..., 10+
  porTipo: { label: string; value: number }[]
}

export interface ParentescoData {
  porSexo: { masculino: number; feminino: number }
  porFaixaEtaria: { label: string; value: number }[]
}

export interface PopulacaoEspecialData {
  total: number
  masculino: number
  feminino: number
  porFaixaEtaria: number[] // 4 grupos: 0-14, 15-29, 30-59, 60+
}

export interface IndigenasQuilombolasData {
  indigenas: PopulacaoEspecialData
  quilombolas: PopulacaoEspecialData
}

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
  // Categorias adicionais
  corRaca: CorRacaData
  alfabetizacao: AlfabetizacaoData
  domicilio: DomicilioData
  parentesco: ParentescoData
  indigenasQuilombolas: IndigenasQuilombolasData
}

export type SelectionMode = 'none' | 'drawing' | 'selected'

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
