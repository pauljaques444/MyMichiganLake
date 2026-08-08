'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Listing, ListingCategory, PriceType } from '@/lib/supabase/queries'

const CATEGORIES: { value: ListingCategory; label: string }[] = [
  { value: 'boats', label: 'Boats' },
  { value: 'pwc', label: 'PWC / Jet Ski' },
  { value: 'dock', label: 'Dock Equipment' },
  { value: 'fishing', label: 'Fishing Gear' },
  { value: 'paddleboard', label: 'Paddleboard' },
  { value: 'kayak', label: 'Kayak' },
  { value: 'canoe', label: 'Canoe' },
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

export function EditListingForm({ listing }: { listing: Listing }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [existingImages, setExistingImages] = useState<string[]>(listing.images ?? [])
  const [newFiles, setNewFiles] = useState<File[]>([])
  const [newPreviews, setNewPreviews] = useState<string[]>([])

  const [form, setForm] = useState({
    title: listing.title,
    description: listing.description ?? '',
    price: listing.price != null ? String(listing.price) : '',
    price_type: listing.price_type,
    category: listing.category,
    condition: listing.condition ?? 'good',
  })

  const totalImages = existingImages.length + newFiles.length

  function setField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function removeExisting(i: number) {
    setExistingImages((prev) => prev.filter((_, idx) => idx !== i))
  }

  function handleNewImages(e: React.ChangeEvent<HTMLInputElement>) {
    const available = 5 - existingImages.length - newFiles.length
    const added = Array.from(e.target.files ?? []).slice(0, available)
    const next = [...newFiles, ...added]
    setNewFiles(next)
    setNewPreviews(next.map((f) => URL.createObjectURL(f)))
  }

  function removeNew(i: number) {
    const next = newFiles.filter((_, idx) => idx !== i)
    setNewFiles(next)
    setNewPreviews(next.map((f) => URL.createObjectURL(f)))
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

    const uploadedUrls: string[] = []
    for (const file of newFiles) {
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
      uploadedUrls.push(publicUrl)
    }

    const images = [...existingImages, ...uploadedUrls]

    const { error: updateErr } = await supabase
      .from('listings')
      .update({
        title: form.title.trim(),
        description: form.description.trim() || null,
        price: form.price_type !== 'free' && form.price ? parseFloat(form.price) : null,
        price_type: form.price_type,
        category: form.category,
        condition: form.price_type === 'sale' ? form.condition : null,
        images,
      })
      .eq('id', listing.id)
      .eq('user_id', user.id)

    if (updateErr) {
      setError(updateErr.message)
      setLoading(false)
      return
    }

    router.push(`/marketplace/${listing.id}`)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
      {/* Photos */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Photos (up to 5)</label>
        {(existingImages.length > 0 || newPreviews.length > 0) && (
          <div className="flex gap-2 mb-3 flex-wrap">
            {existingImages.map((src, i) => (
              <div key={`ex-${i}`} className="relative">
                <img
                  src={src}
                  className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                  alt=""
                />
                <button
                  type="button"
                  onClick={() => removeExisting(i)}
                  className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center leading-none"
                >
                  ×
                </button>
              </div>
            ))}
            {newPreviews.map((src, i) => (
              <div key={`new-${i}`} className="relative">
                <img
                  src={src}
                  className="w-20 h-20 object-cover rounded-lg border border-blue-300"
                  alt=""
                />
                <button
                  type="button"
                  onClick={() => removeNew(i)}
                  className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center leading-none"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        {totalImages < 5 && (
          <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-water-400 transition-colors">
            <span className="text-2xl">📷</span>
            <span className="text-xs text-gray-500 mt-1">Click to add photos</span>
            <input type="file" accept="image/*" multiple className="hidden" onChange={handleNewImages} />
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
            Price
            {form.price_type === 'rent_day'
              ? ' (per day)'
              : form.price_type === 'rent_hour'
              ? ' (per hour)'
              : ''}{' '}
            *
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-gray-400 text-sm">$</span>
            <input
              type="text"
              inputMode="decimal"
              pattern="[0-9]*\.?[0-9]*"
              required
              value={form.price}
              onChange={(e) => setField('price', e.target.value.replace(/[^0-9.]/g, ''))}
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
        {loading ? 'Saving...' : 'Save Changes'}
      </button>
    </form>
  )
}
