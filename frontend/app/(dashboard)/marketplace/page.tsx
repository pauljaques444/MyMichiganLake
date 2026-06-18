'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Listing, ListingCategory } from '@/lib/supabase/queries'
import { ListingCard } from '@/components/marketplace/ListingCard'

const CATEGORIES: { value: ListingCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'boats', label: 'Boats' },
  { value: 'pwc', label: 'PWC' },
  { value: 'fishing', label: 'Fishing' },
  { value: 'paddleboard', label: 'Paddleboard' },
  { value: 'kayak', label: 'Kayak' },
  { value: 'dock', label: 'Dock' },
  { value: 'other', label: 'Other' },
]

export default function MarketplacePage() {
  const [listings, setListings] = useState<Listing[]>([])
  const [category, setCategory] = useState<ListingCategory | 'all'>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const supabase = createClient()
      let query = supabase
        .from('listings')
        .select('*, profiles(*)')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(50)

      if (category !== 'all') {
        query = query.eq('category', category)
      }

      const { data } = await query
      setListings((data as Listing[]) ?? [])
      setLoading(false)
    }
    load()
  }, [category])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Marketplace</h1>
        <Link
          href="/marketplace/new"
          className="bg-water-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-water-700 transition-colors"
        >
          + List Item
        </Link>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setCategory(value)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              category === value
                ? 'bg-water-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-water-400'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-xl aspect-square animate-pulse" />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="text-5xl mb-3">⛵</div>
          <p className="font-medium text-gray-600">No listings yet</p>
          <p className="text-sm text-gray-400 mt-1">Be the first to list gear on the lake</p>
          <Link
            href="/marketplace/new"
            className="inline-block mt-4 bg-water-600 text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-water-700 transition-colors"
          >
            List Something
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  )
}
