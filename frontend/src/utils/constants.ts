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
