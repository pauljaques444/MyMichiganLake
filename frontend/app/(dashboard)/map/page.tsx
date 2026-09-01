import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import MichiganMap from '@/components/map/MichiganMap'
import { fetchLakePolygons } from '@/lib/nhd'

export const revalidate = 3600 // 1 hour — polygon data cached much longer in nhd.ts

export default async function MapPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in')

  const [lakesResult, listingsResult, profileResult] = await Promise.all([
    supabase.from('lakes').select('id, name, county, lat, lng').order('name'),
    supabase
      .from('listings')
      .select('id, title, category, price, price_type, lake_name')
      .eq('status', 'active'),
    supabase.from('profiles').select('lake_id, lake_name').eq('id', user.id).single(),
  ])

  const lakes = lakesResult.data ?? []
  const listings = listingsResult.data ?? []
  const userLakeId = profileResult.data?.lake_id ?? null
  const userLakeName = profileResult.data?.lake_name ?? null

  // Fetch NHD lake polygon data server-side (cached 24h in nhd.ts)
  const polygons = await fetchLakePolygons(
    lakes.map(l => ({ id: l.id, name: l.name, lat: l.lat, lng: l.lng }))
  )

  const polyCount = polygons.features.length

  return (
    <div className="space-y-3">
      {/* Header bar */}
      <div className="bg-white rounded-xl border border-gray-200 px-5 py-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-base font-semibold text-gray-900">Michigan Lakes Map</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {lakes.length} lakes · {listings.length} active listing{listings.length !== 1 ? 's' : ''}
            {polyCount > 0 && <> · {polyCount} lake outlines</>}
            {userLakeName && <> · Your lake: <strong className="text-sky-700">{userLakeName}</strong></>}
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-full bg-blue-100 border-2 border-blue-300" />
            Lake
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-full bg-sky-200 border-2 border-sky-700" />
            Has listings
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-full bg-amber-200 border-2 border-amber-600" />
            Your lake
          </span>
        </div>
      </div>

      {/* Map — isolate keeps Mapbox z-indices from overlapping the nav drawer */}
      <div
        className="bg-white rounded-xl border border-gray-200 overflow-hidden isolate"
        style={{ height: 'calc(100vh - 180px)', minHeight: 480 }}
      >
        <MichiganMap
          lakes={lakes}
          listings={listings}
          userLakeId={userLakeId}
          polygons={polygons}
        />
      </div>
    </div>
  )
}
