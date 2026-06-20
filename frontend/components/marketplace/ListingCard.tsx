import Link from 'next/link'
import { Listing } from '@/lib/supabase/queries'

const CATEGORY_LABELS: Record<string, string> = {
  boats: 'Boats', pwc: 'PWC / Jet Ski', dock: 'Dock Equipment',
  fishing: 'Fishing', paddleboard: 'Paddleboard', kayak: 'Kayak', canoe: 'Canoe', other: 'Other',
}

export function formatPrice(listing: Pick<Listing, 'price' | 'price_type'>): string {
  if (listing.price_type === 'free') return 'Free'
  if (!listing.price) return 'Contact'
  const p = `$${Number(listing.price).toFixed(0)}`
  if (listing.price_type === 'rent_day') return `${p}/day`
  if (listing.price_type === 'rent_hour') return `${p}/hr`
  return p
}

export function ListingCard({ listing }: { listing: Listing }) {
  const thumb = listing.images?.[0]

  return (
    <Link
      href={`/marketplace/${listing.id}`}
      className="group block bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
    >
      <div className="aspect-square bg-gray-100 relative overflow-hidden">
        {thumb ? (
          <img
            src={thumb}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl text-gray-300">
            ⛵
          </div>
        )}
        <span className="absolute top-2 left-2 bg-water-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
          {CATEGORY_LABELS[listing.category] ?? listing.category}
        </span>
      </div>
      <div className="p-3">
        <p className="font-semibold text-gray-900 text-sm line-clamp-2">{listing.title}</p>
        <p className="text-water-600 font-bold mt-1">{formatPrice(listing)}</p>
        {listing.lake_name && (
          <p className="text-gray-400 text-xs mt-0.5 truncate">{listing.lake_name}</p>
        )}
      </div>
    </Link>
  )
}
