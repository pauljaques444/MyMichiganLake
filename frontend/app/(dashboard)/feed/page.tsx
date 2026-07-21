'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import PostCard from '@/components/feed/PostCard'
import SponsoredCard from '@/components/feed/SponsoredCard'
import CreatePost from '@/components/feed/CreatePost'
import WeatherCard from '@/components/feed/WeatherCard'
import type { Post, AdCampaign } from '@/lib/supabase/queries'

const AD_EVERY = 5

export default function FeedPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [ad, setAd] = useState<AdCampaign | null>(null)
  const [lakeId, setLakeId] = useState<string | null>(null)
  const [lakeName, setLakeName] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const supabase = createClient()

      const [postsResult, { data: { user } }] = await Promise.all([
        supabase
          .from('posts')
          .select('*, profiles(*)')
          .order('created_at', { ascending: false })
          .limit(50),
        supabase.auth.getUser(),
      ])

      if (postsResult.error) {
        setError(postsResult.error.message)
        setLoading(false)
        return
      }
      setPosts((postsResult.data as Post[]) ?? [])

      // Resolve user's lake for ad targeting
      let userLakeId: string | null = null
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('lake_id, lake_name')
          .eq('id', user.id)
          .single()
        userLakeId = profile?.lake_id ?? null
        setLakeId(userLakeId)
        setLakeName(profile?.lake_name ?? null)
      }

      // Fetch all active feed_inline campaigns, filter client-side by lake
      const { data: campaigns } = await supabase
        .from('ad_campaigns')
        .select('*')
        .eq('placement', 'feed_inline')
        .eq('active', true)

      if (campaigns?.length) {
        // Prefer lake-targeted ad; fall back to run-of-house
        const targeted = campaigns.filter(
          (c) => c.lake_ids.length > 0 && userLakeId && c.lake_ids.includes(userLakeId)
        )
        const runOfHouse = campaigns.filter((c) => c.lake_ids.length === 0)
        const pool = targeted.length > 0 ? targeted : runOfHouse
        if (pool.length > 0) {
          setAd(pool[Math.floor(Math.random() * pool.length)] as AdCampaign)
        }
      }

      setLoading(false)
    }
    load()
  }, [])

  function handleCreated(post: Post) {
    setPosts((prev) => [post, ...prev])
  }

  // Interleave sponsored cards every AD_EVERY posts
  type FeedItem =
    | { kind: 'post'; post: Post }
    | { kind: 'ad'; slotKey: string }

  const feedItems = posts.reduce<FeedItem[]>((acc, post, i) => {
    acc.push({ kind: 'post', post })
    if (ad && (i + 1) % AD_EVERY === 0) {
      acc.push({ kind: 'ad', slotKey: `ad-slot-${i}` })
    }
    return acc
  }, [])

  return (
    <div className="max-w-2xl space-y-4">
      <WeatherCard lakeName={lakeName} />
      <CreatePost onCreated={handleCreated} />

      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse space-y-3">
              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-full bg-gray-200" />
                <div className="space-y-1.5">
                  <div className="h-3 w-28 bg-gray-200 rounded" />
                  <div className="h-2.5 w-16 bg-gray-100 rounded" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded w-full" />
                <div className="h-3 bg-gray-200 rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
          {error}
        </div>
      )}

      {!loading && !error && posts.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">🌊</div>
          <p className="font-medium">No posts yet</p>
          <p className="text-sm mt-1">Be the first to post in your neighborhood!</p>
        </div>
      )}

      {feedItems.map((item) =>
        item.kind === 'ad' ? (
          <SponsoredCard key={item.slotKey} campaign={ad!} lakeId={lakeId} />
        ) : (
          <PostCard key={item.post.id} post={item.post} />
        )
      )}
    </div>
  )
}
