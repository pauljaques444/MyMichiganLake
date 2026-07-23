'use client'

import dynamic from 'next/dynamic'
import type { MapLake, MapListing } from './MapInner'

interface Props {
  lakes: MapLake[]
  listings: MapListing[]
  userLakeId: string | null
}

const MapInner = dynamic(() => import('./MapInner'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-slate-50">
      <div className="text-center text-gray-400">
        <div className="text-4xl mb-3">🗺️</div>
        <p className="text-sm font-medium">Loading map…</p>
      </div>
    </div>
  ),
})

export default function MichiganMap(props: Props) {
  return <MapInner {...props} />
}
