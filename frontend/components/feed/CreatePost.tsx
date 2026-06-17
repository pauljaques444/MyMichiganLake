'use client'

import { useState } from 'react'
import { AlertTriangle, Send } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Post, PostCategory } from '@/lib/supabase/queries'

const CATEGORIES: { value: PostCategory; label: string }[] = [
  { value: 'general', label: 'General' },
  { value: 'safety', label: 'Safety' },
  { value: 'water_conditions', label: 'Water Conditions' },
  { value: 'events', label: 'Event' },
  { value: 'recommendations', label: 'Recommendation' },
  { value: 'lost_found', label: 'Lost & Found' },
  { value: 'for_sale', label: 'For Sale' },
]

export default function CreatePost({ onCreated }: { onCreated: (post: Post) => void }) {
  const [body, setBody] = useState('')
  const [category, setCategory] = useState<PostCategory>('general')
  const [isUrgent, setIsUrgent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit() {
    if (!body.trim()) return
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setError('You must be signed in to post.')
      setLoading(false)
      return
    }

    const { data, error: insertError } = await supabase
      .from('posts')
      .insert({ body, category, is_urgent: isUrgent, user_id: user.id })
      .select('*, profiles(*)')
      .single()

    if (insertError) {
      setError(insertError.message)
    } else if (data) {
      onCreated(data as Post)
      setBody('')
      setCategory('general')
      setIsUrgent(false)
    }

    setLoading(false)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
      <textarea
        className="w-full text-sm text-gray-800 placeholder-gray-400 resize-none focus:outline-none"
        rows={3}
        placeholder="Share something with your waterfront neighbors..."
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as PostCategory)}
            className="text-xs border rounded-lg px-2 py-1.5 text-gray-600 focus:outline-none focus:ring-1 focus:ring-water-400"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={isUrgent}
              onChange={(e) => setIsUrgent(e.target.checked)}
              className="rounded"
            />
            <AlertTriangle size={13} className="text-red-500" />
            Urgent
          </label>
        </div>
        <div className="flex items-center gap-2">
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button
            disabled={!body.trim() || loading}
            onClick={submit}
            className="flex items-center gap-1.5 bg-water-600 text-white text-sm font-medium px-4 py-1.5 rounded-lg hover:bg-water-700 disabled:opacity-40 transition-colors"
          >
            <Send size={13} /> {loading ? 'Posting...' : 'Post'}
          </button>
        </div>
      </div>
    </div>
  )
}
