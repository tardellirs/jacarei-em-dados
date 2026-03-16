import { useState, useEffect } from 'react'
import type { FeatureCollection } from 'geojson'
import type { SectorFeature, FilterOptions } from '../types'
import { GEOJSON_URL } from '../utils/constants'

interface GeoDataState {
  features: SectorFeature[]
  filterOptions: FilterOptions
  loading: boolean
  error: string | null
}

export function useGeoData(): GeoDataState {
  const [state, setState] = useState<GeoDataState>({
    features: [],
    filterOptions: { distritos: [], situacoes: [], favelas: [] },
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
