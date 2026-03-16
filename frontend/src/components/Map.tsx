import { useEffect, useRef, useMemo } from 'react'
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet'
import type { Layer, PathOptions, Map as LeafletMap } from 'leaflet'
import type { Feature } from 'geojson'
import type { SectorFeature } from '../types'
import { MAP_CENTER, MAP_ZOOM } from '../utils/constants'
import 'leaflet/dist/leaflet.css'

interface MapProps {
  features: SectorFeature[]
  selectedSector: SectorFeature | null
  onSectorClick: (f: SectorFeature) => void
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
  // Default: sem preenchimento, contorno preto
  return {
    fillColor: '#1D4ED8',
    fillOpacity: 0,
    color: '#1a1a1a',
    weight: 0.7,
  }
}

function FitBounds({ features }: { features: SectorFeature[] }) {
  const map = useMap()
  const prevLen = useRef(0)

  useEffect(() => {
    if (features.length === 0 || features.length === prevLen.current) return
    prevLen.current = features.length

    try {
      const latlngs: [number, number][] = []
      for (const f of features) {
        const coords = f.geometry
        if (!coords) continue
        // Flat-map all coordinates to get bounding box
        const flatten = (arr: unknown[]): number[][] => {
          if (typeof arr[0] === 'number') return [arr as number[]]
          return (arr as unknown[][]).flatMap(flatten)
        }
        const g = coords as { coordinates: unknown[] }
        const pts = flatten(g.coordinates as unknown[])
        for (const [lng, lat] of pts) {
          latlngs.push([lat as number, lng as number])
        }
      }
      if (latlngs.length > 0) {
        map.fitBounds(latlngs, { padding: [20, 20] })
      }
    } catch {
      // ignore fitBounds errors
    }
  }, [features, map])

  return null
}

export function MapView({ features, selectedSector, onSectorClick }: MapProps) {
  const selectedCd = selectedSector?.properties?.CD_SETOR ?? null
  const geoJsonKey = useMemo(
    () => features.map((f) => f.properties.CD_SETOR).join(','),
    [features]
  )

  // We need a separate key that also changes when selection changes
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
      <FitBounds features={features} />
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
