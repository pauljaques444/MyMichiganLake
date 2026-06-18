'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ListingStatus } from '@/lib/supabase/queries'

export function OwnerActions({ listingId, status }: { listingId: string; status: ListingStatus }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function updateStatus(newStatus: ListingStatus) {
    setLoading(true)
    const supabase = createClient()
    await supabase.from('listings').update({ status: newStatus }).eq('id', listingId)
    router.refresh()
    setLoading(false)
  }

  async function deleteListing() {
    if (!confirm('Delete this listing? This cannot be undone.')) return
    setLoading(true)
    const supabase = createClient()
    await supabase.from('listings').delete().eq('id', listingId)
    router.push('/marketplace')
  }

  return (
    <div className="flex gap-2 flex-wrap">
      {status === 'active' && (
        <>
          <button
            onClick={() => updateStatus('sold')}
            disabled={loading}
            className="flex-1 border border-gray-300 text-gray-700 text-sm font-medium py-2 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors"
          >
            Mark as Sold
          </button>
          <button
            onClick={() => updateStatus('rented')}
            disabled={loading}
            className="flex-1 border border-gray-300 text-gray-700 text-sm font-medium py-2 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors"
          >
            Mark as Rented
          </button>
        </>
      )}
      {status !== 'active' && (
        <button
          onClick={() => updateStatus('active')}
          disabled={loading}
          className="flex-1 border border-water-400 text-water-600 text-sm font-medium py-2 rounded-lg hover:bg-water-50 disabled:opacity-40 transition-colors"
        >
          Relist as Active
        </button>
      )}
      <button
        onClick={deleteListing}
        disabled={loading}
        className="border border-red-200 text-red-500 text-sm font-medium px-4 py-2 rounded-lg hover:bg-red-50 disabled:opacity-40 transition-colors"
      >
        Delete
      </button>
    </div>
  )
}
