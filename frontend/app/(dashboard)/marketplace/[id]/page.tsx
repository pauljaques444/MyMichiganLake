import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { OwnerActions } from '@/components/marketplace/OwnerActions'
import { MessageThread } from '@/components/marketplace/MessageThread'
import { formatPrice } from '@/components/marketplace/ListingCard'

const CATEGORY_LABELS: Record<string, string> = {
  boats: 'Boats', pwc: 'PWC / Jet Ski', dock: 'Dock Equipment',
  fishing: 'Fishing Gear', paddleboard: 'Paddleboard', kayak: 'Kayak', other: 'Other',
}
const CONDITION_LABELS: Record<string, string> = {
  new: 'New', like_new: 'Like New', good: 'Good', fair: 'Fair',
}

export default async function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: listing } = await supabase
    .from('listings')
    .select('*, profiles(*)')
    .eq('id', id)
    .single()

  if (!listing) notFound()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  const isOwner = user?.id === listing.user_id

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <Link href="/marketplace" className="text-sm text-water-600 hover:underline">
        ← Back to marketplace
      </Link>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {listing.images?.length > 0 ? (
          <img
            src={listing.images[0]}
            alt={listing.title}
            className="w-full aspect-video object-cover"
          />
        ) : (
          <div className="w-full aspect-video bg-gray-100 flex items-center justify-center text-6xl text-gray-300">
            ⛵
          </div>
        )}

        {listing.images?.length > 1 && (
          <div className="flex gap-2 p-3 overflow-x-auto">
            {listing.images.slice(1).map((src: string, i: number) => (
              <img
                key={i}
                src={src}
                alt=""
                className="w-20 h-20 object-cover rounded-lg border border-gray-200 shrink-0"
              />
            ))}
          </div>
        )}

        <div className="p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{listing.title}</h1>
              <p className="text-2xl font-bold text-water-600 mt-1">{formatPrice(listing)}</p>
            </div>
            <span className="shrink-0 bg-gray-100 text-gray-600 text-xs font-medium px-2.5 py-1 rounded-full">
              {CATEGORY_LABELS[listing.category] ?? listing.category}
            </span>
          </div>

          <div className="flex flex-wrap gap-3 text-sm text-gray-500">
            {listing.condition && (
              <span className="bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-full text-xs">
                {CONDITION_LABELS[listing.condition]}
              </span>
            )}
            {listing.lake_name && (
              <span className="bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-full text-xs">
                📍 {listing.lake_name}
              </span>
            )}
            {listing.status !== 'active' && (
              <span className="bg-red-50 border border-red-200 text-red-600 px-2.5 py-1 rounded-full text-xs font-medium uppercase">
                {listing.status}
              </span>
            )}
          </div>

          {listing.description && (
            <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
              {listing.description}
            </p>
          )}

          <div className="border-t pt-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-water-100 flex items-center justify-center text-water-700 font-bold text-sm">
              {listing.profiles?.display_name?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {listing.profiles?.display_name ?? 'Lake neighbor'}
              </p>
              {listing.profiles?.lake_name && (
                <p className="text-xs text-gray-400">{listing.profiles.lake_name}</p>
              )}
            </div>
          </div>

          {isOwner ? (
            <OwnerActions listingId={listing.id} status={listing.status} />
          ) : (
            listing.status === 'active' && (
              <MessageThread
                listingId={listing.id}
                sellerId={listing.user_id}
                sellerName={listing.profiles?.display_name ?? 'Seller'}
              />
            )
          )}
        </div>
      </div>
    </div>
  )
}
