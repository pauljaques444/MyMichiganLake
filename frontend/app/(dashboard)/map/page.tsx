import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import MichiganMap from '@/components/map/MichiganMap'

export const revalidate = 60

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

  return (
    <div className="space-y-3">
      {/* Header bar */}
      <div className="bg-white rounded-xl border border-gray-200 px-5 py-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-base font-semibold text-gray-900">Michigan Lakes Map</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {lakes.length} lakes · {listings.length} active listing{listings.length !== 1 ? 's' : ''}
            {userLakeName && <> · Your lake: <strong className="text-sky-700">{userLakeName}</strong></>}
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-full bg-sky-400 border border-sky-600" />
            Lake
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-full bg-sky-500 border border-sky-700" />
            Has listings
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-full bg-amber-400 border border-amber-600" />
            Your lake
          </span>
        </div>
      </div>

      {/* Map */}
      <div
        className="bg-white rounded-xl border border-gray-200 overflow-hidden"
        style={{ height: 'calc(100vh - 180px)', minHeight: 480 }}
      >
        <MichiganMap lakes={lakes} listings={listings} userLakeId={userLakeId} />
      </div>
    </div>
  )
}
