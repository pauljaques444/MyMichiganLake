'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ListingCategory, PriceType } from '@/lib/supabase/queries'

const CATEGORIES: { value: ListingCategory; label: string }[] = [
  { value: 'boats', label: 'Boats' },
  { value: 'pwc', label: 'PWC / Jet Ski' },
  { value: 'dock', label: 'Dock Equipment' },
  { value: 'fishing', label: 'Fishing Gear' },
  { value: 'paddleboard', label: 'Paddleboard' },
  { value: 'kayak', label: 'Kayak' },
  { value: 'other', label: 'Other' },
]

const PRICE_TYPES: { value: PriceType; label: string }[] = [
  { value: 'sale', label: 'For Sale' },
  { value: 'rent_day', label: 'Rent per Day' },
  { value: 'rent_hour', label: 'Rent per Hour' },
  { value: 'free', label: 'Free / Giveaway' },
]

const CONDITIONS = [
  { value: 'new', label: 'New' },
  { value: 'like_new', label: 'Like New' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
]

export default function NewListingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    price_type: 'sale' as PriceType,
    category: 'other' as ListingCategory,
    condition: 'good',
  })

  function setField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleImages(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, 5 - imageFiles.length)
    const next = [...imageFiles, ...files].slice(0, 5)
    setImageFiles(next)
    setPreviews(next.map((f) => URL.createObjectURL(f)))
  }

  function removeImage(i: number) {
    const next = imageFiles.filter((_, idx) => idx !== i)
    setImageFiles(next)
    setPreviews(next.map((f) => URL.createObjectURL(f)))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setError('Not signed in')
      setLoading(false)
      return
    }

    const imageUrls: string[] = []
    for (const file of imageFiles) {
      const path = `${user.id}/${Date.now()}-${file.name.replace(/\s+/g, '-')}`
      const { error: uploadErr } = await supabase.storage.from('listing-images').upload(path, file)
      if (uploadErr) {
        setError(`Image upload failed: ${uploadErr.message}`)
        setLoading(false)
        return
      }
      const {
        data: { publicUrl },
      } = supabase.storage.from('listing-images').getPublicUrl(path)
      imageUrls.push(publicUrl)
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('lake_name')
      .eq('id', user.id)
      .single()

    const { data: listing, error: insertErr } = await supabase
      .from('listings')
      .insert({
        user_id: user.id,
        title: form.title.trim(),
        description: form.description.trim() || null,
        price: form.price_type !== 'free' && form.price ? parseFloat(form.price) : null,
        price_type: form.price_type,
        category: form.category,
        condition: form.price_type === 'sale' ? form.condition : null,
        lake_name: profile?.lake_name ?? null,
        images: imageUrls,
      })
      .select()
      .single()

    if (insertErr) {
      setError(insertErr.message)
      setLoading(false)
      return
    }

    router.push(`/marketplace/${listing.id}`)
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/marketplace" className="text-sm text-water-600 hover:underline">
          ← Marketplace
        </Link>
        <h1 className="text-xl font-bold text-gray-900">List an Item</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        {/* Photos */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Photos (up to 5)
          </label>
          {previews.length > 0 && (
            <div className="flex gap-2 mb-3 flex-wrap">
              {previews.map((src, i) => (
                <div key={i} className="relative">
                  <img
                    src={src}
                    className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                    alt=""
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center leading-none"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          {previews.length < 5 && (
            <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-water-400 transition-colors">
              <span className="text-2xl">📷</span>
              <span className="text-xs text-gray-500 mt-1">Click to add photos</span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleImages}
              />
            </label>
          )}
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
          <input
            type="text"
            required
            value={form.title}
            onChange={(e) => setField('title', e.target.value)}
            placeholder="e.g. 2019 Sea-Doo Spark, great condition"
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-water-400"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
          <select
            value={form.category}
            onChange={(e) => setField('category', e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-water-400"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* Price type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Listing Type *</label>
          <select
            value={form.price_type}
            onChange={(e) => setField('price_type', e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-water-400"
          >
            {PRICE_TYPES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        {/* Price */}
        {form.price_type !== 'free' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price{form.price_type === 'rent_day' ? ' (per day)' : form.price_type === 'rent_hour' ? ' (per hour)' : ''} *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-400 text-sm">$</span>
              <input
                type="number"
                min="0"
                step="1"
                required
                value={form.price}
                onChange={(e) => setField('price', e.target.value)}
                className="w-full border rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-water-400"
                placeholder="0"
              />
            </div>
          </div>
        )}

        {/* Condition */}
        {form.price_type === 'sale' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
            <select
              value={form.condition}
              onChange={(e) => setField('condition', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-water-400"
            >
              {CONDITIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            rows={4}
            value={form.description}
            onChange={(e) => setField('description', e.target.value)}
            placeholder="Describe your item — include hours of use, reason for selling, pickup location, etc."
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-water-400 resize-none"
          />
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-water-600 text-white font-semibold py-2.5 rounded-lg hover:bg-water-700 disabled:opacity-40 transition-colors"
        >
          {loading ? 'Publishing...' : 'Publish Listing'}
        </button>
      </form>
    </div>
  )
}
