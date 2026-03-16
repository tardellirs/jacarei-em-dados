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
