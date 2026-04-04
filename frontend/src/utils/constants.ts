export const AGE_LABELS = [
  '0-4', '5-9', '10-14', '15-19', '20-24',
  '25-29', '30-39', '40-49', '50-59', '60-69', '70+',
]

export const MALE_AGE_COLS = [
  'V01009', 'V01010', 'V01011', 'V01012', 'V01013',
  'V01014', 'V01015', 'V01016', 'V01017', 'V01018', 'V01019',
] as const

export const FEMALE_AGE_COLS = [
  'V01020', 'V01021', 'V01022', 'V01023', 'V01024',
  'V01025', 'V01026', 'V01027', 'V01028', 'V01029', 'V01030',
] as const

// ── Faixas etárias 15+ (para cálculo de alfabetização) ──
export const MALE_AGE_COLS_15PLUS = [
  'V01012', 'V01013', 'V01014', 'V01015', 'V01016', 'V01017', 'V01018', 'V01019',
] as const

// ── Faixas etárias 60+ (V01018=masc 60-69, V01019=masc 70+, V01029=fem 60-69, V01030=fem 70+) ──
export const MALE_AGE_COLS_60PLUS = ['V01018', 'V01019'] as const
export const FEMALE_AGE_COLS_60PLUS = ['V01029', 'V01030'] as const

// ── Alfabetização 60+ (V00757=60-64, V00758=65-69, V00759=70-79, V00760=80+) ──
export const ALFABETIZACAO_60PLUS_COLS = ['V00757', 'V00758', 'V00759', 'V00760'] as const

export const FEMALE_AGE_COLS_15PLUS = [
  'V01023', 'V01024', 'V01025', 'V01026', 'V01027', 'V01028', 'V01029', 'V01030',
] as const

// ── Alfabetização (V00748..V00760) ──
export const ALFABETIZACAO_COLS = [
  'V00748', 'V00749', 'V00750', 'V00751', 'V00752', 'V00753',
  'V00754', 'V00755', 'V00756', 'V00757', 'V00758', 'V00759', 'V00760',
] as const

// ── Domicílio ──
export const DOMICILIO_MORADORES_COLS = [
  'V00017', 'V00018', 'V00019', 'V00020', 'V00021',
  'V00022', 'V00023', 'V00024', 'V00025', 'V00026',
] as const

export const DOMICILIO_MORADORES_LABELS = [
  '1', '2', '3', '4', '5', '6', '7', '8', '9', '10+',
]

export const DOMICILIO_TIPO_COLS = [
  'V00047', 'V00048', 'V00049', 'V00050', 'V00051', 'V00052',
] as const

export const DOMICILIO_TIPO_LABELS = [
  'Casa',
  'Casa de vila ou condomínio',
  'Apartamento',
  'Casa de cômodo ou cortiço',
  'Habitação indígena / maloca',
  'Estrutura degradada / inacabada',
]

// ── Parentesco ──
export const PARENTESCO_IDADE_COLS = [
  'V01064', 'V01065', 'V01066', 'V01067', 'V01068',
] as const

export const PARENTESCO_IDADE_LABELS = [
  '12 a 17 anos', '18 a 24 anos', '25 a 39 anos', '40 a 59 anos', '60 anos ou mais',
]

// ── Indígenas ──
export const INDIGENAS_COLS = ['V01690', 'V01691', 'V01692'] as const
export const INDIGENAS_FAIXA_COLS = ['V01696', 'V01697', 'V01698', 'V01699'] as const
export const INDIGENAS_FAIXA_LABELS = ['0 a 14 anos', '15 a 29 anos', '30 a 59 anos', '60 anos ou mais']

// ── Quilombolas ──
export const QUILOMBOLAS_COLS = ['V03196', 'V03197', 'V03198'] as const
export const QUILOMBOLAS_FAIXA_COLS = ['V03199', 'V03200', 'V03201', 'V03202'] as const
export const QUILOMBOLAS_FAIXA_LABELS = ['0 a 14 anos', '15 a 29 anos', '30 a 59 anos', '60 anos ou mais']

export const COLOR_MALE = '#3B82F6'   // blue-500
export const COLOR_FEMALE = '#EC4899' // pink-500

export const GEOJSON_URL = '/jacarei_setores_merged.geojson'

export const MAP_CENTER: [number, number] = [-23.305, -45.965]
export const MAP_ZOOM = 12

// Mapeamento de código de estado IBGE → sigla UF
const UF_MAP: Record<string, string> = {
  '11': 'RO', '12': 'AC', '13': 'AM', '14': 'RR', '15': 'PA',
  '16': 'AP', '17': 'TO', '21': 'MA', '22': 'PI', '23': 'CE',
  '24': 'RN', '25': 'PB', '26': 'PE', '27': 'AL', '28': 'SE',
  '29': 'BA', '31': 'MG', '32': 'ES', '33': 'RJ', '35': 'SP',
  '41': 'PR', '42': 'SC', '43': 'RS', '50': 'MS', '51': 'MT',
  '52': 'GO', '53': 'DF',
}

/**
 * Retorna true apenas para setores Urbanos e Rurais, que possuem
 * mapa cartográfico disponível no FTP do IBGE.
 * Massas d'água e demais tipos não têm arquivo PDF disponível.
 */
export function hasSectorPdf(situacao: string | null): boolean {
  return situacao === 'Urbana' || situacao === 'Rural'
}

/**
 * Gera a URL do mapa do setor censitário no FTP do IBGE.
 * MSU = setor Urbano, MSR = setor Rural
 * Padrão: .../SP/3524402/35244020500/MSU/352440205000010/A3_352440205000010_MSU.pdf
 */
export function ibgeSectorPdfUrl(cdSetor: string, situacao: string | null): string {
  const uf = UF_MAP[cdSetor.slice(0, 2)] ?? cdSetor.slice(0, 2)
  const mun = cdSetor.slice(0, 7)
  const subdist = cdSetor.slice(0, 11)
  const tipo = situacao === 'Urbana' ? 'MSU' : 'MSR'
  return [
    'https://geoftp.ibge.gov.br/cartas_e_mapas/mapas_para_fins_de_levantamentos_estatisticos',
    'censo_demografico_2022/mapas_e_descritivos_de_setores_censitarios',
    uf, mun, subdist, tipo, cdSetor,
    `A3_${cdSetor}_${tipo}.pdf`,
  ].join('/')
}
