import { useEffect, useRef, useMemo } from 'react'
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet'
import type { Layer, PathOptions } from 'leaflet'
import type { Feature } from 'geojson'
import type { SectorFeature } from '../types'
import type { LatLngBounds } from '../hooks/useGeoData'
import { MAP_CENTER, MAP_ZOOM } from '../utils/constants'
import 'leaflet/dist/leaflet.css'

interface MapProps {
  features: SectorFeature[]
  selectedSector: SectorFeature | null
  onSectorClick: (f: SectorFeature) => void
  initialBounds: LatLngBounds | null
  resetZoomSignal?: number
}

function styleFeature(feature: Feature | undefined, selectedCd: string | null): PathOptions {
  const props = (feature as SectorFeature)?.properties
  const isSelected = props?.CD_SETOR === selectedCd

  if (isSelected) {
    return {
      fillColor: '#1D4ED8',
      fillOpacity: 0.65,
      color: '#1E3A8A',
      weight: 2,
    }
  }
  return {
    fillColor: '#1D4ED8',
    fillOpacity: 0,
    color: '#1a1a1a',
    weight: 1.1,
  }
}

/**
 * Ajusta o zoom quando features mudam (filtros) ou quando o sinal de reset dispara.
 * NÃO é responsável pelo zoom inicial — esse é gerenciado pelo prop `bounds`
 * do MapContainer, que funciona sincronamente na primeira renderização.
 */
function FitBounds({
  features,
  resetZoomSignal,
  initialBounds,
}: {
  features: SectorFeature[]
  resetZoomSignal?: number
  initialBounds: LatLngBounds | null
}) {
  const map = useMap()
  const isFirstRun = useRef(true)
  const prevSignal = useRef<number | undefined>(undefined)

  useEffect(() => {
    // Pular o primeiro disparo: o MapContainer já aplicou initialBounds na montagem
    if (isFirstRun.current) {
      isFirstRun.current = false
      prevSignal.current = resetZoomSignal
      return
    }

    if (features.length === 0) return

    const signalChanged =
      resetZoomSignal !== undefined && resetZoomSignal !== prevSignal.current
    prevSignal.current = resetZoomSignal

    // Se o sinal de reset disparou, voltar aos bounds completos do município
    if (signalChanged && initialBounds) {
      map.fitBounds(initialBounds, { padding: [4, 4] })
      return
    }

    // Caso contrário, calcular bounds das features visíveis (pós-filtro)
    try {
      const latlngs: [number, number][] = []
      const flatten = (arr: unknown[]): number[][] => {
        if (typeof arr[0] === 'number') return [arr as number[]]
        return (arr as unknown[][]).flatMap(flatten)
      }
      for (const f of features) {
        if (!f.geometry) continue
        const g = f.geometry as { coordinates: unknown[] }
        for (const [lng, lat] of flatten(g.coordinates as unknown[])) {
          latlngs.push([lat as number, lng as number])
        }
      }
      if (latlngs.length > 0) {
        map.fitBounds(latlngs, { padding: [4, 4] })
      }
    } catch {
      // ignore fitBounds errors
    }
  }, [features, map, resetZoomSignal, initialBounds])

  return null
}

export function MapView({
  features,
  selectedSector,
  onSectorClick,
  initialBounds,
  resetZoomSignal,
}: MapProps) {
  const selectedCd = selectedSector?.properties?.CD_SETOR ?? null
  const geoJsonKey = useMemo(
    () => features.map((f) => f.properties.CD_SETOR).join(','),
    [features]
  )
  const renderKey = `${geoJsonKey}|${selectedCd}`

  function onEachFeature(feature: Feature, layer: Layer) {
    const props = (feature as SectorFeature).properties
    const hasData = props.V01006 != null
    const pop = hasData ? `${Number(props.V01006).toLocaleString('pt-BR')} hab.` : 'Sem dados'

    layer.bindTooltip(
      `<div class="text-xs font-medium">${props.CD_SETOR}</div>
       <div class="text-xs text-slate-600">${props.NM_DIST ?? ''}</div>
       <div class="text-xs font-semibold mt-0.5">${pop}</div>`,
      { sticky: true, className: 'leaflet-tooltip-custom' }
    )

    layer.on({
      mouseover(e) {
        const l = e.target
        if (props.CD_SETOR !== selectedCd) {
          l.setStyle({ fillColor: '#3B82F6', fillOpacity: 0.40, weight: 1.2, color: '#1a1a1a' })
        }
      },
      mouseout(e) {
        const l = e.target
        if (props.CD_SETOR !== selectedCd) {
          l.setStyle(styleFeature(feature, selectedCd))
        }
      },
      click() {
        onSectorClick(feature as SectorFeature)
      },
    })
  }

  return (
    <MapContainer
      // Se os bounds já foram calculados, usa-os diretamente na primeira renderização.
      // O spinner de loading garante que MapContainer só monta após os dados estarem prontos.
      bounds={initialBounds ?? undefined}
      boundsOptions={{ padding: [4, 4] }}
      // Fallback caso os bounds ainda não estejam disponíveis
      center={MAP_CENTER}
      zoom={MAP_ZOOM}
      className="w-full h-full"
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <GeoJSON
        key={renderKey}
        data={{ type: 'FeatureCollection', features } as GeoJSON.FeatureCollection}
        style={(f) => styleFeature(f, selectedCd)}
        onEachFeature={onEachFeature}
      />
      <FitBounds
        features={features}
        resetZoomSignal={resetZoomSignal}
        initialBounds={initialBounds}
      />
    </MapContainer>
  )
}

// Suppress leaflet default icon missing warning
import L from 'leaflet'
delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})
