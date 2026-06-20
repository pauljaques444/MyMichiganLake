'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Conversation } from '@/lib/supabase/queries'

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      const { data } = await supabase
        .from('conversations')
        .select(`
          *,
          listing:listings(id, title, images),
          buyer:profiles!conversations_buyer_id_fkey(id, display_name),
          seller:profiles!conversations_seller_id_fkey(id, display_name)
        `)
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order('created_at', { ascending: false })

      const enriched = await Promise.all(
        (data ?? []).map(async (c) => {
          const { data: msgs } = await supabase
            .from('messages')
            .select('body, sender_id, read_at')
            .eq('conversation_id', c.id)
            .order('created_at', { ascending: false })
            .limit(1)

          const { count } = await supabase
            .from('messages')
            .select('id', { count: 'exact', head: true })
            .eq('conversation_id', c.id)
            .neq('sender_id', user.id)
            .is('read_at', null)

          return { ...c, last_message: msgs?.[0]?.body ?? null, unread_count: count ?? 0 }
        })
      )

      setConversations(enriched as Conversation[])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-gray-100 rounded-xl h-20 animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <h1 className="text-xl font-bold text-gray-900">Messages</h1>

      {conversations.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="text-4xl mb-3">💬</div>
          <p className="font-medium text-gray-600">No messages yet</p>
          <p className="text-sm text-gray-400 mt-1">
            When you contact a seller or receive an inquiry, it&apos;ll appear here
          </p>
          <Link
            href="/marketplace"
            className="inline-block mt-4 text-water-600 text-sm font-semibold hover:underline"
          >
            Browse marketplace →
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {conversations.map((c) => {
            const isBuyer = c.buyer_id === userId
            const other = isBuyer ? c.seller : c.buyer
            const hasUnread = (c.unread_count ?? 0) > 0

            return (
              <Link
                key={c.id}
                href={`/marketplace/${c.listing_id}`}
                className={`flex items-center gap-3 bg-white rounded-xl border p-4 hover:shadow-sm transition-shadow ${
                  hasUnread ? 'border-water-300' : 'border-gray-200'
                }`}
              >
                <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                  {c.listing?.images?.[0] ? (
                    <img src={c.listing.images[0]} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl text-gray-300">⛵</div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {c.listing?.title ?? 'Listing'}
                  </p>
                  <p className="text-xs text-gray-400">
                    {isBuyer ? 'Seller' : 'Buyer'}: {other?.display_name ?? 'Lake neighbor'}
                  </p>
                  {c.last_message && (
                    <p className={`text-xs truncate mt-0.5 ${hasUnread ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>
                      {c.last_message}
                    </p>
                  )}
                </div>

                {hasUnread && (
                  <span className="shrink-0 bg-water-600 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {c.unread_count}
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
