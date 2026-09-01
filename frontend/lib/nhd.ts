import type { FeatureCollection, Geometry, GeoJsonProperties } from 'geojson'

export interface DBLake {
  id: string
  name: string
  lat: number
  lng: number
}

export type LakePolygonCollection = FeatureCollection<
  Geometry,
  GeoJsonProperties & { lake_id: string; lake_name: string }
>

function centroid(geometry: Geometry): [number, number] | null {
  if (geometry.type === 'Polygon') {
    const ring = geometry.coordinates[0]
    const lat = ring.reduce((s, c) => s + c[1], 0) / ring.length
    const lng = ring.reduce((s, c) => s + c[0], 0) / ring.length
    return [lat, lng]
  }
  if (geometry.type === 'MultiPolygon') {
    const ring = geometry.coordinates[0][0]
    const lat = ring.reduce((s, c) => s + c[1], 0) / ring.length
    const lng = ring.reduce((s, c) => s + c[0], 0) / ring.length
    return [lat, lng]
  }
  return null
}

function distSq(a: [number, number], b: [number, number]) {
  return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2
}

export async function fetchLakePolygons(
  lakes: DBLake[]
): Promise<LakePolygonCollection> {
  const empty: LakePolygonCollection = { type: 'FeatureCollection', features: [] }
  if (!lakes.length) return empty

  try {
    const nameList = lakes
      .map(l => `'${l.name.replace(/'/g, "''")}'`)
      .join(',')

    const url = new URL(
      'https://hydro.nationalmap.gov/arcgis/rest/services/nhd/MapServer/8/query'
    )
    url.searchParams.set('where', `FTYPE IN (390,436) AND GNIS_NAME IN (${nameList})`)
    url.searchParams.set('geometry', '-90.4,41.7,-82.4,47.5')
    url.searchParams.set('geometryType', 'esriGeometryEnvelope')
    url.searchParams.set('spatialRel', 'esriSpatialRelIntersects')
    url.searchParams.set('outFields', 'GNIS_NAME,AREASQKM')
    url.searchParams.set('returnGeometry', 'true')
    url.searchParams.set('f', 'geojson')

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 10_000)

    let nhdRaw: FeatureCollection
    try {
      const res = await fetch(url.toString(), {
        signal: controller.signal,
        next: { revalidate: 86400 },
      })
      clearTimeout(timer)
      if (!res.ok) return empty
      nhdRaw = await res.json()
    } catch {
      clearTimeout(timer)
      return empty
    }

    // Group NHD features by GNIS name
    const byName: Record<string, typeof nhdRaw.features> = {}
    for (const f of nhdRaw.features) {
      const name = f.properties?.GNIS_NAME as string | undefined
      if (!name) continue
      ;(byName[name] ??= []).push(f)
    }

    // For each DB lake, pick the closest-centroid NHD feature with matching name
    const features: LakePolygonCollection['features'] = []
    for (const lake of lakes) {
      const candidates = byName[lake.name] ?? []
      if (!candidates.length) continue

      let best = candidates[0]
      let bestDist = Infinity
      const target: [number, number] = [lake.lat, lake.lng]

      for (const c of candidates) {
        if (!c.geometry) continue
        const cen = centroid(c.geometry as Geometry)
        if (!cen) continue
        const d = distSq(cen, target)
        if (d < bestDist) { bestDist = d; best = c }
      }

      features.push({
        type: 'Feature',
        geometry: best.geometry as Geometry,
        properties: {
          ...(best.properties ?? {}),
          lake_id: lake.id,
          lake_name: lake.name,
        },
      })
    }

    return { type: 'FeatureCollection', features }
  } catch {
    return { type: 'FeatureCollection', features: [] }
  }
}
