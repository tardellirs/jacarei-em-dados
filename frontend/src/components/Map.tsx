import { useEffect, useRef, useMemo } from 'react'
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet'
import type { Layer, PathOptions } from 'leaflet'
import type { Feature } from 'geojson'
import type { SectorFeature, SelectionMode } from '../types'
import type { LatLngBounds } from '../hooks/useGeoData'
import { MAP_CENTER, MAP_ZOOM } from '../utils/constants'
import { DrawControl } from './DrawControl'
import 'leaflet/dist/leaflet.css'

interface MapProps {
  features: SectorFeature[]
  selectedCds: Set<string>
  selectionMode: SelectionMode
  onSectorClick: (f: SectorFeature) => void
  onSectorToggle: (cd: string) => void
  onPolygonComplete: (coords: [number, number][]) => void
  onStartDrawing: () => void
  onClearSelection: () => void
  initialBounds: LatLngBounds | null
  resetZoomSignal?: number
}

function styleFeature(feature: Feature | undefined, selectedCds: Set<string>): PathOptions {
  const props = (feature as SectorFeature)?.properties
  const isSelected = props?.CD_SETOR ? selectedCds.has(props.CD_SETOR) : false

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
  const prevFeaturesLen = useRef(-1)
  const prevSignal = useRef<number | undefined>(undefined)

  useEffect(() => {
    if (features.length === 0) return

    const lenChanged = features.length !== prevFeaturesLen.current
    const signalChanged =
      resetZoomSignal !== undefined && resetZoomSignal !== prevSignal.current

    if (!lenChanged && !signalChanged) return

    prevFeaturesLen.current = features.length
    prevSignal.current = resetZoomSignal

    if (signalChanged && initialBounds) {
      map.fitBounds(initialBounds, { padding: [10, 10], animate: true })
      return
    }

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
        map.fitBounds(latlngs, { padding: [10, 10] })
      }
    } catch {
      // ignore fitBounds errors
    }
  }, [features, map, resetZoomSignal, initialBounds])

  return null
}

export function MapView({
  features,
  selectedCds,
  selectionMode,
  onSectorClick,
  onSectorToggle,
  onPolygonComplete,
  onStartDrawing,
  onClearSelection,
  initialBounds,
  resetZoomSignal,
}: MapProps) {
  const geoJsonKey = useMemo(
    () => features.map((f) => f.properties.CD_SETOR).join(','),
    [features]
  )
  const selectedKey = useMemo(
    () => Array.from(selectedCds).sort().join(','),
    [selectedCds]
  )
  const renderKey = `${geoJsonKey}|${selectedKey}`

  function onEachFeature(feature: Feature, layer: Layer) {
    const props = (feature as SectorFeature).properties
    const cd = props.CD_SETOR

    layer.on({
      mouseover(e) {
        const l = e.target
        if (!selectedCds.has(cd)) {
          l.setStyle({ fillColor: '#3B82F6', fillOpacity: 0.40, weight: 1.2, color: '#1a1a1a' })
        }
      },
      mouseout(e) {
        const l = e.target
        if (!selectedCds.has(cd)) {
          l.setStyle(styleFeature(feature, selectedCds))
        }
      },
      click() {
        if (selectionMode === 'selected') {
          onSectorToggle(cd)
        } else if (selectionMode === 'none') {
          onSectorClick(feature as SectorFeature)
        }
        // drawing mode: clicks handled by DrawControl
      },
    })
  }

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={MAP_CENTER}
        zoom={MAP_ZOOM}
        zoomSnap={1}
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
          style={(f) => styleFeature(f, selectedCds)}
          onEachFeature={onEachFeature}
        />
        <FitBounds
          features={features}
          resetZoomSignal={resetZoomSignal}
          initialBounds={initialBounds}
        />
        <DrawControl
          mode={selectionMode}
          onPolygonComplete={onPolygonComplete}
          onCancel={onClearSelection}
        />
      </MapContainer>

      {/* Toolbar flutuante */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] flex gap-2">
        {selectionMode === 'none' && (
          <button
            onClick={onStartDrawing}
            title="Desenhar polígono para selecionar setores"
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 rounded-lg shadow-md text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-colors"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current stroke-2">
              <polygon points="12,3 20,8 20,16 12,21 4,16 4,8" />
            </svg>
            Selecionar por polígono
          </button>
        )}

        {selectionMode === 'drawing' && (
          <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-300 rounded-lg shadow-md text-sm text-amber-800">
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current stroke-2 shrink-0">
              <circle cx="12" cy="12" r="9" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>Clique para adicionar vértices · Duplo clique ou clique no 1º vértice para fechar</span>
            <button
              onClick={onClearSelection}
              className="ml-1 text-amber-700 hover:text-amber-900 font-medium underline shrink-0"
            >
              Cancelar
            </button>
          </div>
        )}

        {selectionMode === 'selected' && (
          <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-300 rounded-lg shadow-md text-sm text-blue-800">
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current stroke-2 shrink-0">
              <polyline points="20,6 9,17 4,12" />
            </svg>
            <span>{selectedCds.size} setor{selectedCds.size !== 1 ? 'es' : ''} selecionado{selectedCds.size !== 1 ? 's' : ''} · Clique para adicionar/remover</span>
            <button
              onClick={onClearSelection}
              title="Limpar seleção"
              className="ml-1 shrink-0 text-blue-600 hover:text-blue-900"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current stroke-2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
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
