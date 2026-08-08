import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { OwnerActions } from '@/components/marketplace/OwnerActions'
import { formatPrice } from '@/components/marketplace/ListingCard'
import { Listing, ListingStatus } from '@/lib/supabase/queries'

const STATUS_STYLE: Record<ListingStatus, string> = {
  active: 'bg-green-50 text-green-700 border-green-200',
  sold: 'bg-gray-100 text-gray-500 border-gray-200',
  rented: 'bg-amber-50 text-amber-700 border-amber-200',
}

const STATUS_LABEL: Record<ListingStatus, string> = {
  active: 'Active',
  sold: 'Sold',
  rented: 'Rented',
}

function ListingRow({ listing }: { listing: Listing }) {
  const thumb = listing.images?.[0]
  const statusStyle = STATUS_STYLE[listing.status] ?? 'bg-gray-100 text-gray-500 border-gray-200'
  const statusLabel = STATUS_LABEL[listing.status] ?? listing.status

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex gap-4">
        <Link href={`/marketplace/${listing.id}`} className="shrink-0">
          <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100">
            {thumb ? (
              <img src={thumb} alt={listing.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl text-gray-300">
                ⛵
              </div>
            )}
          </div>
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <Link
              href={`/marketplace/${listing.id}`}
              className="font-semibold text-gray-900 text-sm line-clamp-2 hover:text-water-600"
            >
              {listing.title}
            </Link>
            <span
              className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full border ${statusStyle}`}
            >
              {statusLabel}
            </span>
          </div>
          <p className="text-water-600 font-bold text-sm mt-1">{formatPrice(listing)}</p>
          {listing.lake_name && (
            <p className="text-gray-400 text-xs mt-0.5 truncate">📍 {listing.lake_name}</p>
          )}
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
        <div className="flex gap-2">
          <Link
            href={`/marketplace/${listing.id}/edit`}
            className="text-xs font-medium border border-water-300 text-water-600 px-3 py-1.5 rounded-lg hover:bg-water-50 transition-colors"
          >
            Edit
          </Link>
          <Link
            href={`/marketplace/${listing.id}`}
            className="text-xs font-medium border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
          >
            View
          </Link>
        </div>
        <OwnerActions listingId={listing.id} status={listing.status} />
      </div>
    </div>
  )
}

export default async function MyListingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in')

  const { data } = await supabase
    .from('listings')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const listings = (data ?? []) as Listing[]
  const active = listings.filter((l) => l.status === 'active')
  const inactive = listings.filter((l) => l.status !== 'active')

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/marketplace" className="text-sm text-water-600 hover:underline">
            ← Marketplace
          </Link>
          <h1 className="text-xl font-bold text-gray-900">My Listings</h1>
        </div>
        <Link
          href="/marketplace/new"
          className="bg-water-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-water-700 transition-colors"
        >
          + New Listing
        </Link>
      </div>

      {listings.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <p className="text-4xl mb-3">⛵</p>
          <p className="text-gray-900 font-semibold">No listings yet</p>
          <p className="text-gray-500 text-sm mt-1 mb-5">List your first lake item for neighbors to find</p>
          <Link
            href="/marketplace/new"
            className="inline-block bg-water-600 text-white font-semibold px-5 py-2.5 rounded-lg hover:bg-water-700 transition-colors"
          >
            List an Item
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {active.length > 0 && (
            <>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1">
                Active ({active.length})
              </p>
              {active.map((listing) => (
                <ListingRow key={listing.id} listing={listing} />
              ))}
            </>
          )}

          {inactive.length > 0 && (
            <>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1 mt-5">
                Sold / Rented ({inactive.length})
              </p>
              {inactive.map((listing) => (
                <ListingRow key={listing.id} listing={listing} />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}
