'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Search, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Listing, ListingCategory } from '@/lib/supabase/queries'
import { ListingCard } from '@/components/marketplace/ListingCard'

const CATEGORIES: { value: ListingCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'boats', label: 'Boats' },
  { value: 'pwc', label: 'PWC' },
  { value: 'kayak', label: 'Kayak' },
  { value: 'canoe', label: 'Canoe' },
  { value: 'paddleboard', label: 'Paddleboard' },
  { value: 'fishing', label: 'Fishing' },
  { value: 'dock', label: 'Dock' },
  { value: 'other', label: 'Other' },
]

export default function MarketplacePage() {
  const [listings, setListings] = useState<Listing[]>([])
  const [category, setCategory] = useState<ListingCategory | 'all'>('all')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [loading, setLoading] = useState(true)

  // Debounce search input 300ms
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(t)
  }, [search])

  const load = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    let query = supabase
      .from('listings')
      .select('*, profiles(*)')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(50)

    if (category !== 'all') query = query.eq('category', category)
    if (debouncedSearch.trim()) query = query.ilike('title', `%${debouncedSearch.trim()}%`)

    const { data } = await query
    setListings((data as Listing[]) ?? [])
    setLoading(false)
  }, [category, debouncedSearch])

  useEffect(() => { load() }, [load])

  const hasFilters = category !== 'all' || debouncedSearch.trim()

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

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search listings..."
          className="w-full border border-gray-200 rounded-lg pl-9 pr-9 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-water-400"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Category filter */}
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

      {/* Results */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-xl aspect-square animate-pulse" />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="text-5xl mb-3">⛵</div>
          {hasFilters ? (
            <>
              <p className="font-medium text-gray-600">No listings match your search</p>
              <button
                onClick={() => { setSearch(''); setCategory('all') }}
                className="inline-block mt-3 text-water-600 text-sm font-semibold hover:underline"
              >
                Clear filters
              </button>
            </>
          ) : (
            <>
              <p className="font-medium text-gray-600">No listings yet</p>
              <p className="text-sm text-gray-400 mt-1">Be the first to list gear on the lake</p>
              <Link
                href="/marketplace/new"
                className="inline-block mt-4 bg-water-600 text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-water-700 transition-colors"
              >
                List Something
              </Link>
            </>
          )}
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
