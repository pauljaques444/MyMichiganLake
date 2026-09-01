'use client'

import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useEffect, useRef } from 'react'
import type { LakePolygonCollection } from '@/lib/nhd'

export type MapLake = {
  id: string
  name: string
  county: string | null
  lat: number
  lng: number
}

export type MapListing = {
  id: string
  title: string
  category: string
  price: number | null
  price_type: string
  lake_name: string | null
}

interface Props {
  lakes: MapLake[]
  listings: MapListing[]
  userLakeId: string | null
  polygons: LakePolygonCollection | null
}

const CATEGORY_EMOJI: Record<string, string> = {
  boats: '⛵', pwc: '🚤', kayak: '🛶', canoe: '🛶',
  paddleboard: '🏄', fishing: '🎣', dock: '⚓', other: '📦',
}

function formatPrice(price: number | null, priceType: string): string {
  if (!price) return 'Free'
  const f = new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', maximumFractionDigits: 0,
  }).format(price)
  if (priceType === 'rent_day') return `${f}/day`
  if (priceType === 'rent_hour') return `${f}/hr`
  return f
}

function buildPopupHtml(
  lake: MapLake,
  lakeListings: MapListing[],
  isHome: boolean,
): string {
  const header = `
    <div style="font-family:system-ui,sans-serif;padding:12px 14px 4px;min-width:190px;max-width:240px">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px">
        ${isHome ? '<span>🏠</span>' : ''}
        <strong style="font-size:14px;color:#0f172a">${lake.name}</strong>
      </div>
      ${lake.county ? `<div style="font-size:11px;color:#64748b;margin-bottom:8px">${lake.county} County</div>` : ''}
  `
  if (!lakeListings.length) {
    return header + `<div style="font-size:12px;color:#94a3b8;padding-bottom:10px">No active listings</div></div>`
  }
  const items = lakeListings.slice(0, 3).map(l => `
    <a href="/marketplace" style="display:flex;align-items:center;gap:7px;padding:5px 0;text-decoration:none;border-bottom:1px solid #f1f5f9">
      <span style="font-size:15px">${CATEGORY_EMOJI[l.category] ?? '📦'}</span>
      <div style="flex:1;min-width:0">
        <div style="font-size:12px;font-weight:600;color:#0f172a;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${l.title}</div>
        <div style="font-size:11px;color:#0369a1">${formatPrice(l.price, l.price_type)}</div>
      </div>
    </a>
  `).join('')
  const footer = lakeListings.length > 3
    ? `<a href="/marketplace" style="display:block;margin-top:8px;padding-bottom:10px;font-size:11px;font-weight:600;color:#0369a1;text-decoration:none">See all ${lakeListings.length} listings →</a>`
    : `<a href="/marketplace" style="display:block;margin-top:8px;padding-bottom:10px;font-size:11px;font-weight:600;color:#0369a1;text-decoration:none">View marketplace →</a>`
  return header +
    `<div style="font-size:11px;color:#374151;margin-bottom:6px;font-weight:600">${lakeListings.length} listing${lakeListings.length !== 1 ? 's' : ''}</div>` +
    items + footer + '</div>'
}

export default function MapInner({ lakes, listings, userLakeId, polygons }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

  useEffect(() => {
    if (!containerRef.current || mapRef.current || !token) return

    mapboxgl.accessToken = token

    const listingsByLake: Record<string, MapListing[]> = {}
    for (const l of listings) {
      if (!l.lake_name) continue
      ;(listingsByLake[l.lake_name] ??= []).push(l)
    }

    const coveredIds = new Set(
      polygons?.features.map(f => f.properties?.lake_id as string) ?? []
    )

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/outdoors-v12',
      bounds: [[-90.4, 41.7], [-82.4, 47.5]],
      fitBoundsOptions: { padding: 48 },
    })
    mapRef.current = map

    map.addControl(new mapboxgl.NavigationControl(), 'top-right')

    map.on('load', () => {
      // ── Lake polygon layers ──────────────────────────────────────
      if (polygons && polygons.features.length > 0) {
        // Enrich with derived properties for paint expressions
        const enriched = {
          ...polygons,
          features: polygons.features.map(f => ({
            ...f,
            properties: {
              ...f.properties,
              listing_count: (listingsByLake[f.properties?.lake_name as string] ?? []).length,
              is_home: f.properties?.lake_id === userLakeId ? 1 : 0,
            },
          })),
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        map.addSource('lakes', { type: 'geojson', data: enriched as any })

        map.addLayer({
          id: 'lake-fill',
          type: 'fill',
          source: 'lakes',
          paint: {
            'fill-color': [
              'case',
              ['==', ['get', 'is_home'], 1], '#fde68a',
              ['>', ['get', 'listing_count'], 0], '#bae6fd',
              '#dbeafe',
            ],
            'fill-opacity': [
              'case',
              ['==', ['get', 'is_home'], 1], 0.60,
              0.40,
            ],
          },
        })

        map.addLayer({
          id: 'lake-outline',
          type: 'line',
          source: 'lakes',
          paint: {
            'line-color': [
              'case',
              ['==', ['get', 'is_home'], 1], '#d97706',
              ['>', ['get', 'listing_count'], 0], '#0369a1',
              '#93c5fd',
            ],
            'line-width': [
              'case',
              ['==', ['get', 'is_home'], 1], 3,
              ['>', ['get', 'listing_count'], 0], 2,
              1,
            ],
          },
        })

        // Popup on polygon click
        map.on('click', 'lake-fill', e => {
          if (!e.features?.length) return
          const props = e.features[0].properties
          const lake = lakes.find(l => l.id === props?.lake_id)
          if (!lake) return
          const html = buildPopupHtml(
            lake,
            listingsByLake[lake.name] ?? [],
            lake.id === userLakeId,
          )
          new mapboxgl.Popup({ maxWidth: '280px', className: 'mml-popup' })
            .setLngLat(e.lngLat)
            .setHTML(html)
            .addTo(map)
        })

        map.on('mouseenter', 'lake-fill', () => {
          map.getCanvas().style.cursor = 'pointer'
        })
        map.on('mouseleave', 'lake-fill', () => {
          map.getCanvas().style.cursor = ''
        })
      }

      // ── Fallback circle markers for lakes without polygon data ──
      for (const lake of lakes) {
        if (coveredIds.has(lake.id)) continue
        const isHome = lake.id === userLakeId
        const lakeListings = listingsByLake[lake.name] ?? []
        const hasListings = lakeListings.length > 0

        const el = document.createElement('div')
        const size = isHome ? 16 : hasListings ? 12 : 9
        Object.assign(el.style, {
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '50%',
          background: isHome ? '#fbbf24' : hasListings ? '#0ea5e9' : '#7dd3fc',
          border: `${isHome ? 3 : 1.5}px solid ${isHome ? '#d97706' : '#0369a1'}`,
          cursor: 'pointer',
        })

        new mapboxgl.Marker({ element: el, anchor: 'center' })
          .setLngLat([lake.lng, lake.lat])
          .setPopup(
            new mapboxgl.Popup({ maxWidth: '280px', className: 'mml-popup' })
              .setHTML(buildPopupHtml(lake, lakeListings, isHome))
          )
          .addTo(map)
      }

      // ── Fly to home lake ─────────────────────────────────────────
      if (userLakeId) {
        const home = lakes.find(l => l.id === userLakeId)
        if (home) {
          setTimeout(() => {
            map.flyTo({ center: [home.lng, home.lat], zoom: 11, duration: 1500 })
          }, 500)
        }
      }
    })

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
    }
  // Stable server props — run once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!token) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-50">
        <div className="text-center text-gray-400 space-y-2">
          <div className="text-4xl">🗺️</div>
          <p className="text-sm font-medium">Map unavailable</p>
          <p className="text-xs">Add NEXT_PUBLIC_MAPBOX_TOKEN to enable the map</p>
        </div>
      </div>
    )
  }

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
}
