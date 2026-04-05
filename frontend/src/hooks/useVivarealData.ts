import { useState, useEffect } from 'react'
import type { VivarealSectorData, VivarealMarketData } from '../types'

interface VivarealDataState {
  sectorData: VivarealSectorData
  marketData: VivarealMarketData | null
  loading: boolean
  error: string | null
}

export function useVivarealData(): VivarealDataState {
  const [state, setState] = useState<VivarealDataState>({
    sectorData: {},
    marketData: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    let cancelled = false

    Promise.all([
      fetch('/vivareal_por_setor.json').then((r) => {
        if (!r.ok) throw new Error(`vivareal_por_setor.json: ${r.status}`)
        return r.json() as Promise<VivarealSectorData>
      }),
      fetch('/vivareal_mercado.json').then((r) => {
        if (!r.ok) throw new Error(`vivareal_mercado.json: ${r.status}`)
        return r.json() as Promise<VivarealMarketData>
      }),
    ])
      .then(([sectorData, marketData]) => {
        if (!cancelled) {
          setState({ sectorData, marketData, loading: false, error: null })
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setState({ sectorData: {}, marketData: null, loading: false, error: err.message })
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  return state
}
