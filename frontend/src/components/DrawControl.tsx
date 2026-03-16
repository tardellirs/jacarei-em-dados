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
  const previewPolygonRef = useRef<L.Polygon | null>(null)
  const polygonLayerRef = useRef<L.Polygon | null>(null)
  const firstMarkerRef = useRef<L.CircleMarker | null>(null)

  const cleanup = () => {
    markersRef.current.forEach((m) => map.removeLayer(m))
    markersRef.current = []
    if (polylineRef.current) {
      map.removeLayer(polylineRef.current)
      polylineRef.current = null
    }
    if (previewPolygonRef.current) {
      map.removeLayer(previewPolygonRef.current)
      previewPolygonRef.current = null
    }
    if (polygonLayerRef.current) {
      map.removeLayer(polygonLayerRef.current)
      polygonLayerRef.current = null
    }
    verticesRef.current = []
    firstMarkerRef.current = null
  }

  const updatePreviewPolygon = (verts: [number, number][]) => {
    if (previewPolygonRef.current) {
      map.removeLayer(previewPolygonRef.current)
      previewPolygonRef.current = null
    }
    if (verts.length >= 3) {
      const latlngs = verts.map(([lng, lat]) => [lat, lng] as [number, number])
      previewPolygonRef.current = L.polygon(latlngs, {
        color: 'transparent',
        weight: 0,
        fillColor: '#EF4444',
        fillOpacity: 0.15,
        interactive: false,
      }).addTo(map)
    }
  }

  const finishPolygon = () => {
    const verts = verticesRef.current
    if (verts.length < 3) {
      cleanup()
      onCancel()
      return
    }

    // Remove drawing layers
    if (polylineRef.current) {
      map.removeLayer(polylineRef.current)
      polylineRef.current = null
    }
    if (previewPolygonRef.current) {
      map.removeLayer(previewPolygonRef.current)
      previewPolygonRef.current = null
    }
    markersRef.current.forEach((m) => map.removeLayer(m))
    markersRef.current = []
    firstMarkerRef.current = null

    // Draw completed polygon (amber outline, red fill)
    const poly = L.polygon(verts.map(([lng, lat]) => [lat, lng] as [number, number]), {
      color: '#EF4444',
      weight: 2,
      fillColor: '#EF4444',
      fillOpacity: 0.15,
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
      L.DomEvent.stopPropagation(e as unknown as Event)

      const { lng, lat } = e.latlng
      const coord: [number, number] = [lng, lat]
      verticesRef.current.push(coord)

      const verts = verticesRef.current

      // First vertex marker (larger, clickable to close polygon)
      if (verts.length === 1) {
        const marker = L.circleMarker([lat, lng], {
          radius: 6,
          color: '#B91C1C',
          fillColor: '#EF4444',
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
          color: '#B91C1C',
          fillColor: '#EF4444',
          fillOpacity: 1,
          weight: 1.5,
        }).addTo(map)
        markersRef.current.push(marker)
      }

      // Update dashed polyline
      if (polylineRef.current) {
        map.removeLayer(polylineRef.current)
      }
      if (verts.length >= 2) {
        const latlngs = verts.map(([lng, lat]) => [lat, lng] as [number, number])
        polylineRef.current = L.polyline(latlngs, {
          color: '#EF4444',
          weight: 3,
          dashArray: '6, 6',
        }).addTo(map)
      }

      // Update fill preview from 3rd point onward
      updatePreviewPolygon(verts)
    }

    const handleDblClick = (e: L.LeafletMouseEvent) => {
      L.DomEvent.stopPropagation(e as unknown as Event)
      L.DomEvent.preventDefault(e as unknown as Event)
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
