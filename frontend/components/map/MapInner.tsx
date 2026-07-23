'use client'

import 'leaflet/dist/leaflet.css'
import { useEffect, useRef } from 'react'
import type { Map as LeafletMap } from 'leaflet'

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
}

const CATEGORY_EMOJI: Record<string, string> = {
  boats: '⛵', pwc: '🚤', kayak: '🛶', canoe: '🛶',
  paddleboard: '🏄', fishing: '🎣', dock: '⚓', other: '📦',
}

function formatPrice(price: number | null, priceType: string): string {
  if (!price) return 'Free'
  const formatted = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(price)
  if (priceType === 'rent_day') return `${formatted}/day`
  if (priceType === 'rent_hour') return `${formatted}/hr`
  return formatted
}

function buildPopupHtml(lake: MapLake, lakeListings: MapListing[], isHome: boolean): string {
  const header = `
    <div style="font-family:system-ui,sans-serif;min-width:190px;max-width:240px">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px">
        ${isHome ? '<span>🏠</span>' : ''}
        <strong style="font-size:14px;color:#0f172a">${lake.name}</strong>
      </div>
      ${lake.county ? `<div style="font-size:11px;color:#64748b;margin-bottom:10px">${lake.county} County</div>` : ''}
  `

  if (lakeListings.length === 0) {
    return header + `<div style="font-size:12px;color:#94a3b8">No active listings</div></div>`
  }

  const top3 = lakeListings.slice(0, 3)
  const items = top3.map(l => `
    <a href="/marketplace" style="display:flex;align-items:center;gap:7px;padding:5px 0;text-decoration:none;border-bottom:1px solid #f1f5f9">
      <span style="font-size:15px">${CATEGORY_EMOJI[l.category] ?? '📦'}</span>
      <div style="flex:1;min-width:0">
        <div style="font-size:12px;font-weight:600;color:#0f172a;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${l.title}</div>
        <div style="font-size:11px;color:#0369a1">${formatPrice(l.price, l.price_type)}</div>
      </div>
    </a>
  `).join('')

  const seeAll = lakeListings.length > 3
    ? `<a href="/marketplace" style="display:block;margin-top:8px;font-size:11px;font-weight:600;color:#0369a1;text-decoration:none">See all ${lakeListings.length} listings →</a>`
    : `<a href="/marketplace" style="display:block;margin-top:8px;font-size:11px;font-weight:600;color:#0369a1;text-decoration:none">View marketplace →</a>`

  return header + `
    <div style="font-size:11px;color:#374151;margin-bottom:6px;font-weight:600">
      ${lakeListings.length} active listing${lakeListings.length !== 1 ? 's' : ''}
    </div>
    ${items}
    ${seeAll}
  </div>`
}

export default function MapInner({ lakes, listings, userLakeId }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<LeafletMap | null>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    // Group listings by lake name
    const listingsByLake: Record<string, MapListing[]> = {}
    for (const l of listings) {
      if (!l.lake_name) continue
      listingsByLake[l.lake_name] ??= []
      listingsByLake[l.lake_name].push(l)
    }

    import('leaflet').then((L) => {
      // Leaflet default icon fix (webpack mangles the asset URLs)
      // We use circleMarker so this doesn't matter, but fix it anyway
      // in case any plugin uses default markers.

      const map = L.map(containerRef.current!, {
        zoomControl: true,
        attributionControl: true,
      })
      mapRef.current = map

      // Fit Michigan
      map.fitBounds([[41.7, -90.4], [47.5, -82.4]], { padding: [24, 24] })

      L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        {
          attribution: '&copy; <a href="https://carto.com/">Carto</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
          subdomains: 'abcd',
          maxZoom: 19,
        }
      ).addTo(map)

      for (const lake of lakes) {
        const isHome = lake.id === userLakeId
        const lakeListings = listingsByLake[lake.name] ?? []
        const count = lakeListings.length

        const radius = isHome ? 13 : count > 5 ? 11 : count > 0 ? 9 : 7
        const color = isHome ? '#d97706' : '#0369a1'
        const fillColor = isHome ? '#fbbf24' : count > 0 ? '#0ea5e9' : '#7dd3fc'

        const marker = L.circleMarker([lake.lat, lake.lng], {
          radius,
          color,
          fillColor,
          fillOpacity: 0.8,
          weight: isHome ? 3 : 1.5,
        })

        marker.bindPopup(buildPopupHtml(lake, lakeListings, isHome), {
          maxWidth: 260,
          className: 'mml-popup',
        })

        marker.addTo(map)
      }

      // Fly to user's lake after tiles load
      if (userLakeId) {
        const home = lakes.find(l => l.id === userLakeId)
        if (home) {
          map.once('load', () => map.flyTo([home.lat, home.lng], 11, { duration: 1.2 }))
          // also trigger immediately in case tiles already loaded
          setTimeout(() => map.flyTo([home.lat, home.lng], 11, { duration: 1.2 }), 300)
        }
      }
    })

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
    }
  // Run once on mount — lakes/listings/userLakeId are server-fetched and stable
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
  )
}
