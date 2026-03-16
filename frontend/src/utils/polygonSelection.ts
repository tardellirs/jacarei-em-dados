import intersect from '@turf/intersect'
import area from '@turf/area'
import { polygon as turfPolygon, multiPolygon as turfMultiPolygon } from '@turf/helpers'
import type { FeatureCollection, Polygon, MultiPolygon } from 'geojson'
import type { SectorFeature } from '../types'

const OVERLAP_THRESHOLD = 0.40

export function findSectorsInPolygon(
  drawnCoords: [number, number][],
  sectors: SectorFeature[]
): string[] {
  if (drawnCoords.length < 3) return []

  // Close the ring if needed
  const ring = [...drawnCoords]
  const first = ring[0]
  const last = ring[ring.length - 1]
  if (first[0] !== last[0] || first[1] !== last[1]) {
    ring.push(first)
  }

  const drawn = turfPolygon([ring])
  const results: string[] = []

  for (const sector of sectors) {
    const geom = sector.geometry
    if (!geom) continue

    try {
      let sectorTurf
      if (geom.type === 'Polygon') {
        sectorTurf = turfPolygon(geom.coordinates as number[][][])
      } else if (geom.type === 'MultiPolygon') {
        sectorTurf = turfMultiPolygon(geom.coordinates as number[][][][])
      } else {
        continue
      }

      const sectorArea = area(sectorTurf)
      if (sectorArea === 0) continue

      const fc = { type: 'FeatureCollection', features: [drawn, sectorTurf] } as FeatureCollection<Polygon | MultiPolygon>
      const overlap = intersect(fc)
      if (!overlap) continue

      const overlapArea = area(overlap)
      if (overlapArea / sectorArea >= OVERLAP_THRESHOLD) {
        results.push(sector.properties.CD_SETOR)
      }
    } catch {
      // skip sectors with invalid geometry
    }
  }

  return results
}
