'use client'

import { MessageCircle, ThumbsUp, AlertTriangle } from 'lucide-react'
import { timeAgo } from '@/lib/utils'
import type { Post } from '@/lib/supabase/queries'

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  general: { label: 'General', color: 'bg-gray-100 text-gray-700' },
  safety: { label: 'Safety', color: 'bg-red-100 text-red-700' },
  lost_found: { label: 'Lost & Found', color: 'bg-yellow-100 text-yellow-700' },
  events: { label: 'Events', color: 'bg-purple-100 text-purple-700' },
  recommendations: { label: 'Recommendations', color: 'bg-green-100 text-green-700' },
  for_sale: { label: 'For Sale', color: 'bg-blue-100 text-blue-700' },
  water_conditions: { label: 'Water Conditions', color: 'bg-water-100 text-water-700' },
}

export default function PostCard({ post }: { post: Post }) {
  const cat = CATEGORY_LABELS[post.category] ?? CATEGORY_LABELS.general
  const displayName = post.profiles?.display_name ?? 'Lake neighbor'
  const initial = displayName[0]?.toUpperCase() ?? '?'

  return (
    <article className="bg-white rounded-xl border border-gray-200 p-5 space-y-3 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-water-200 flex items-center justify-center text-water-700 font-bold text-sm">
            {initial}
          </div>
          <div>
            <p className="font-semibold text-sm text-gray-900">{displayName}</p>
            <p className="text-xs text-gray-400">{timeAgo(post.created_at)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {post.is_urgent && (
            <span className="flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
              <AlertTriangle size={11} /> Urgent
            </span>
          )}
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cat.color}`}>
            {cat.label}
          </span>
        </div>
      </div>

      <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">{post.body}</p>

      <div className="flex items-center gap-4 pt-1 border-t border-gray-100 text-xs text-gray-500">
        <button className="flex items-center gap-1.5 hover:text-water-600 transition-colors">
          <ThumbsUp size={14} />
        </button>
        <button className="flex items-center gap-1.5 hover:text-water-600 transition-colors ml-auto">
          <MessageCircle size={14} />
        </button>
      </div>
    </article>
  )
}
