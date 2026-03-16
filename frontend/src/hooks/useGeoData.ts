import { useState, useEffect } from 'react'
import type { FeatureCollection } from 'geojson'
import type { SectorFeature, FilterOptions } from '../types'
import { GEOJSON_URL } from '../utils/constants'

// Bounds no formato [[minLat, minLng], [maxLat, maxLng]]
export type LatLngBounds = [[number, number], [number, number]]

interface GeoDataState {
  features: SectorFeature[]
  filterOptions: FilterOptions
  initialBounds: LatLngBounds | null
  loading: boolean
  error: string | null
}

/** Calcula o bounding box de todas as features diretamente das coordenadas. */
function computeBounds(features: SectorFeature[]): LatLngBounds | null {
  let minLat = Infinity, maxLat = -Infinity
  let minLng = Infinity, maxLng = -Infinity

  const flatten = (arr: unknown[]): number[][] => {
    if (typeof arr[0] === 'number') return [arr as number[]]
    return (arr as unknown[][]).flatMap(flatten)
  }

  for (const f of features) {
    if (!f.geometry) continue
    const g = f.geometry as { coordinates: unknown[] }
    for (const [lng, lat] of flatten(g.coordinates as unknown[])) {
      const la = lat as number, ln = lng as number
      if (la < minLat) minLat = la
      if (la > maxLat) maxLat = la
      if (ln < minLng) minLng = ln
      if (ln > maxLng) maxLng = ln
    }
  }

  return isFinite(minLat) ? [[minLat, minLng], [maxLat, maxLng]] : null
}

export function useGeoData(): GeoDataState {
  const [state, setState] = useState<GeoDataState>({
    features: [],
    filterOptions: { distritos: [], situacoes: [], favelas: [] },
    initialBounds: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    fetch(GEOJSON_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json() as Promise<FeatureCollection>
      })
      .then((geojson) => {
        const features = geojson.features as SectorFeature[]

        // Extrair opções únicas de filtro
        const distritosSet = new Set<string>()
        const situacoesSet = new Set<string>()
        const favelasSet = new Set<string>()

        for (const f of features) {
          const p = f.properties
          if (p.NM_DIST) distritosSet.add(p.NM_DIST)
          if (p.SITUACAO) situacoesSet.add(p.SITUACAO)
          if (p.NM_FCU) favelasSet.add(p.NM_FCU)
        }

        setState({
          features,
          filterOptions: {
            distritos: Array.from(distritosSet).sort(),
            situacoes: Array.from(situacoesSet).sort(),
            favelas: Array.from(favelasSet).sort(),
          },
          initialBounds: computeBounds(features),
          loading: false,
          error: null,
        })
      })
      .catch((err) => {
        setState((s) => ({ ...s, loading: false, error: String(err) }))
      })
  }, [])

  return state
}
