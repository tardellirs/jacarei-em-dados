import { useEffect, useRef, useMemo, useState } from 'react'
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet'
import type { Layer, PathOptions } from 'leaflet'
import type { Feature } from 'geojson'
import type { SectorFeature, SelectionMode, OverlayType } from '../types'
import type { LatLngBounds } from '../hooks/useGeoData'
import {
  MAP_CENTER,
  MAP_ZOOM,
  OVERLAY_CONFIGS,
  OVERLAY_ORDER,
} from '../utils/constants'
import { DrawControl } from './DrawControl'
import 'leaflet/dist/leaflet.css'

interface MapProps {
  features: SectorFeature[]
  selectedSector: SectorFeature | null
  selectedCds: Set<string>
  selectionMode: SelectionMode
  onSectorClick: (f: SectorFeature) => void
  onSectorToggle: (cd: string) => void
  onPolygonComplete: (coords: [number, number][]) => void
  onStartDrawing: () => void
  onClearSelection: () => void
  initialBounds: LatLngBounds | null
  resetZoomSignal?: number
  activeOverlay: OverlayType | null
  onToggleOverlay: (type: OverlayType) => void
}

function overlayColor(idx: number, config: { colors: readonly string[]; noDataColor: string }): string {
  return idx >= 0 ? config.colors[idx] : config.noDataColor
}

function styleFeature(
  feature: Feature | undefined,
  selectedCds: Set<string>,
  selectedSectorCd: string | null,
  activeOverlay: OverlayType | null,
  bracketMap: Map<string, number>
): PathOptions {
  const props = (feature as SectorFeature)?.properties
  const cd = props?.CD_SETOR
  const isSelected = cd ? selectedCds.has(cd) || cd === selectedSectorCd : false

  if (!activeOverlay) {
    if (isSelected) {
      return { fillColor: '#1D4ED8', fillOpacity: 0.65, color: '#1E3A8A', weight: 2 }
    }
    return { fillColor: '#1D4ED8', fillOpacity: 0, color: '#1a1a1a', weight: 1.1 }
  }

  const config = OVERLAY_CONFIGS[activeOverlay]
  const idx = cd != null ? (bracketMap.get(cd) ?? -1) : -1
  const fillColor = overlayColor(idx, config)
  const noData = idx === -1

  if (isSelected) {
    return { fillColor, fillOpacity: noData ? 0.35 : 0.70, color: '#1E3A8A', weight: 3 }
  }
  return { fillColor, fillOpacity: noData ? 0.35 : 0.55, color: '#1a1a1a', weight: 1.1 }
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
  selectedSector,
  selectedCds,
  selectionMode,
  onSectorClick,
  onSectorToggle,
  onPolygonComplete,
  onStartDrawing,
  onClearSelection,
  initialBounds,
  resetZoomSignal,
  activeOverlay,
  onToggleOverlay,
}: MapProps) {
  const selectedSectorCd = selectedSector?.properties.CD_SETOR ?? null

  // Pré-computa índice de faixa por setor para o overlay ativo
  const bracketMap = useMemo(() => {
    const map = new Map<string, number>()
    if (!activeOverlay) return map

    const config = OVERLAY_CONFIGS[activeOverlay]
    for (const f of features) {
      const cd = f.properties.CD_SETOR
      const val = config.getValue(f.properties)
      if (val == null) {
        map.set(cd, -1)
        continue
      }
      const idx = config.brackets.findIndex((b) => val < b.maxVal)
      map.set(cd, idx >= 0 ? idx : config.brackets.length - 1)
    }
    return map
  }, [features, activeOverlay])

  const geoJsonKey = useMemo(
    () => features.map((f) => f.properties.CD_SETOR).join(','),
    [features]
  )
  const selectedKey = useMemo(
    () => Array.from(selectedCds).sort().join(',') + '|' + (selectedSectorCd ?? ''),
    [selectedCds, selectedSectorCd]
  )
  const renderKey = `${geoJsonKey}|${selectedKey}|overlay:${activeOverlay ?? 'none'}`

  function onEachFeature(feature: Feature, layer: Layer) {
    const props = (feature as SectorFeature).properties
    const cd = props.CD_SETOR
    const isSelected = selectedCds.has(cd) || cd === selectedSectorCd

    layer.on({
      mouseover(e) {
        const l = e.target
        if (!isSelected) {
          if (activeOverlay) {
            const config = OVERLAY_CONFIGS[activeOverlay]
            const idx = bracketMap.get(cd) ?? -1
            l.setStyle({ fillColor: overlayColor(idx, config), fillOpacity: 0.75, weight: 1.5, color: '#1a1a1a' })
          } else {
            l.setStyle({ fillColor: '#3B82F6', fillOpacity: 0.40, weight: 1.2, color: '#1a1a1a' })
          }
        }
      },
      mouseout(e) {
        const l = e.target
        if (!isSelected) {
          l.setStyle(styleFeature(feature, selectedCds, selectedSectorCd, activeOverlay, bracketMap))
        }
      },
      click() {
        if (selectionMode === 'selected') {
          onSectorToggle(cd)
        } else if (selectionMode === 'none') {
          onSectorClick(feature as SectorFeature)
        }
      },
    })
  }

  const activeConfig = activeOverlay ? OVERLAY_CONFIGS[activeOverlay] : null

  // Estado do painel de camadas
  const [panelOpen, setPanelOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  // Fecha ao clicar fora
  useEffect(() => {
    if (!panelOpen) return
    function onMouseDown(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setPanelOpen(false)
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [panelOpen])

  function handleOverlaySelect(type: OverlayType) {
    onToggleOverlay(type)
    setPanelOpen(false)
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
          style={(f) => styleFeature(f, selectedCds, selectedSectorCd, activeOverlay, bracketMap)}
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

      {/* Legenda do overlay ativo — bottom-left */}
      {activeConfig && (
        <div className="absolute bottom-6 left-3 z-[1000] bg-white/90 backdrop-blur-sm border border-slate-200 rounded-lg shadow-md px-3 py-2.5">
          <p className="text-[11px] font-semibold text-slate-700 mb-1.5">{activeConfig.title}</p>
          {activeConfig.brackets.map((bracket, i) => (
            <div key={i} className="flex items-center gap-2 mb-1">
              <span
                className="w-4 h-3 rounded-sm shrink-0 border border-black/10"
                style={{ backgroundColor: activeConfig.colors[i] }}
              />
              <span className="text-[11px] text-slate-600">{bracket.label}</span>
            </div>
          ))}
          <div className="flex items-center gap-2 mt-1 pt-1 border-t border-slate-200">
            <span
              className="w-4 h-3 rounded-sm shrink-0 border border-black/10"
              style={{ backgroundColor: activeConfig.noDataColor }}
            />
            <span className="text-[11px] text-slate-400">Sem dados</span>
          </div>
        </div>
      )}

      {/* Toolbar top-left — abaixo do zoom +/- */}
      <div className="absolute top-[92px] left-2.5 z-[1000] flex flex-col gap-1">

        {/* Botão único de camadas + painel dropdown */}
        <div ref={panelRef} className="relative">
          <button
            onClick={() => setPanelOpen((v) => !v)}
            title="Camadas do mapa"
            className={[
              'flex items-center gap-1.5 px-2 py-1.5 border rounded-lg shadow-sm text-xs font-medium transition-colors whitespace-nowrap',
              activeOverlay
                ? 'bg-amber-100 border-amber-400 text-amber-800 hover:bg-amber-200'
                : panelOpen
                ? 'bg-slate-100 border-slate-400 text-slate-700'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50',
            ].join(' ')}
          >
            {/* Ícone de camadas empilhadas */}
            <svg viewBox="0 0 20 20" className="w-3.5 h-3.5 fill-current shrink-0">
              <path d="M10 2L2 6.5 10 11l8-4.5L10 2z" opacity="0.45"/>
              <path d="M2 10l8 4.5L18 10" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.65"/>
              <path d="M2 13.5l8 4.5 8-4.5" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="1"/>
            </svg>
            {activeConfig ? activeConfig.buttonLabel : 'Camadas'}
            {/* Indicador de overlay ativo */}
            {activeOverlay && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
            )}
          </button>

          {/* Painel de seleção — abre à direita */}
          {panelOpen && (
            <div className="absolute left-full ml-2 top-0 w-52 bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden">
              <div className="px-3 py-2 bg-slate-50 border-b border-slate-200">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Camadas do mapa</p>
              </div>

              {OVERLAY_ORDER.map((type) => {
                const config = OVERLAY_CONFIGS[type]
                const isActive = activeOverlay === type
                return (
                  <button
                    key={type}
                    onClick={() => handleOverlaySelect(type)}
                    className={[
                      'w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-left transition-colors',
                      isActive
                        ? 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                        : 'text-slate-700 hover:bg-slate-50',
                    ].join(' ')}
                  >
                    {/* Swatch com cor representativa do meio da escala */}
                    <span
                      className="w-4 h-4 rounded shrink-0 border border-black/10"
                      style={{ backgroundColor: config.colors[2] }}
                    />
                    <span className="flex-1 font-medium">{config.buttonLabel}</span>
                    {isActive && (
                      <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 shrink-0 text-amber-600 fill-none stroke-current stroke-2">
                        <polyline points="2,8 6,12 14,4" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </button>
                )
              })}

              {/* Remover camada ativa */}
              {activeOverlay && (
                <>
                  <div className="border-t border-slate-100 mx-3" />
                  <button
                    onClick={() => handleOverlaySelect(activeOverlay)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 shrink-0 fill-none stroke-current stroke-2">
                      <circle cx="8" cy="8" r="6" />
                      <line x1="5" y1="8" x2="11" y2="8" strokeLinecap="round"/>
                    </svg>
                    Remover camada
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Separador */}
        <div className="border-t border-slate-300 mx-1 my-0.5" />

        {/* Botão polígono — visível apenas no modo 'none' */}
        {selectionMode === 'none' && (
          <button
            onClick={onStartDrawing}
            title="Desenhar polígono para selecionar setores"
            className="flex items-center gap-1.5 px-2 py-1.5 bg-white border border-slate-300 rounded-lg shadow-sm text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap"
          >
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-none stroke-current stroke-2 shrink-0">
              <polygon points="12,3 20,8 20,16 12,21 4,16 4,8" />
            </svg>
            Polígono
          </button>
        )}
      </div>

      {/* Status bars bottom-center — instruções de desenho / seleção */}
      {(selectionMode === 'drawing' || selectionMode === 'selected') && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000]">
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
      )}
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
