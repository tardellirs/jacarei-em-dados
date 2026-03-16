import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import type { SelectionMode } from '../types'

interface DrawControlProps {
  mode: SelectionMode
  onPolygonComplete: (coords: [number, number][]) => void
  onCancel: () => void
}

export function DrawControl({ mode, onPolygonComplete, onCancel }: DrawControlProps) {
  const map = useMap()
  const verticesRef = useRef<[number, number][]>([])
  const markersRef = useRef<L.CircleMarker[]>([])
  const polylineRef = useRef<L.Polyline | null>(null)
  const polygonLayerRef = useRef<L.Polygon | null>(null)
  const firstMarkerRef = useRef<L.CircleMarker | null>(null)

  const cleanup = () => {
    markersRef.current.forEach((m) => map.removeLayer(m))
    markersRef.current = []
    if (polylineRef.current) {
      map.removeLayer(polylineRef.current)
      polylineRef.current = null
    }
    if (polygonLayerRef.current) {
      map.removeLayer(polygonLayerRef.current)
      polygonLayerRef.current = null
    }
    verticesRef.current = []
    firstMarkerRef.current = null
  }

  const finishPolygon = () => {
    const verts = verticesRef.current
    if (verts.length < 3) {
      cleanup()
      onCancel()
      return
    }

    // Draw the completed polygon
    if (polylineRef.current) {
      map.removeLayer(polylineRef.current)
      polylineRef.current = null
    }
    markersRef.current.forEach((m) => map.removeLayer(m))
    markersRef.current = []
    firstMarkerRef.current = null

    const poly = L.polygon(verts.map(([lng, lat]) => [lat, lng] as [number, number]), {
      color: '#F59E0B',
      weight: 2,
      fillColor: '#FEF3C7',
      fillOpacity: 0.25,
    })
    poly.addTo(map)
    polygonLayerRef.current = poly
    verticesRef.current = []

    onPolygonComplete(verts)
  }

  useEffect(() => {
    if (mode !== 'drawing') {
      cleanup()
      map.getContainer().style.cursor = ''
      return
    }

    cleanup()
    map.getContainer().style.cursor = 'crosshair'

    const handleClick = (e: L.LeafletMouseEvent) => {
      // Prevent propagation to GeoJSON layers
      L.DomEvent.stopPropagation(e as unknown as Event)

      const { lng, lat } = e.latlng
      const coord: [number, number] = [lng, lat]
      verticesRef.current.push(coord)

      const verts = verticesRef.current

      // First vertex marker (clickable to close polygon)
      if (verts.length === 1) {
        const marker = L.circleMarker([lat, lng], {
          radius: 6,
          color: '#F59E0B',
          fillColor: '#FBBF24',
          fillOpacity: 1,
          weight: 2,
        }).addTo(map)

        marker.on('click', (ev) => {
          L.DomEvent.stopPropagation(ev as unknown as Event)
          if (verticesRef.current.length >= 3) {
            finishPolygon()
          }
        })
        firstMarkerRef.current = marker
        markersRef.current.push(marker)
      } else {
        // Subsequent vertices
        const marker = L.circleMarker([lat, lng], {
          radius: 4,
          color: '#F59E0B',
          fillColor: '#FCD34D',
          fillOpacity: 1,
          weight: 1.5,
        }).addTo(map)
        markersRef.current.push(marker)
      }

      // Update polyline
      if (polylineRef.current) {
        map.removeLayer(polylineRef.current)
      }
      if (verts.length >= 2) {
        const latlngs = verts.map(([lng, lat]) => [lat, lng] as [number, number])
        polylineRef.current = L.polyline(latlngs, {
          color: '#F59E0B',
          weight: 2,
          dashArray: '5, 5',
        }).addTo(map)
      }
    }

    const handleDblClick = (e: L.LeafletMouseEvent) => {
      L.DomEvent.stopPropagation(e as unknown as Event)
      L.DomEvent.preventDefault(e as unknown as Event)
      // Remove the last point added by the click that preceded dblclick
      verticesRef.current.pop()
      if (markersRef.current.length > 0) {
        const last = markersRef.current.pop()!
        map.removeLayer(last)
      }
      finishPolygon()
    }

    map.on('click', handleClick)
    map.on('dblclick', handleDblClick)
    map.doubleClickZoom.disable()

    return () => {
      map.off('click', handleClick)
      map.off('dblclick', handleDblClick)
      map.doubleClickZoom.enable()
      map.getContainer().style.cursor = ''
    }
  }, [mode]) // eslint-disable-line react-hooks/exhaustive-deps

  // Remove drawn polygon when selection is cleared
  useEffect(() => {
    if (mode === 'none') {
      if (polygonLayerRef.current) {
        map.removeLayer(polygonLayerRef.current)
        polygonLayerRef.current = null
      }
    }
  }, [mode, map])

  return null
}
