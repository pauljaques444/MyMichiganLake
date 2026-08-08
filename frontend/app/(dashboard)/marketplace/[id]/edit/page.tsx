import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { EditListingForm } from '@/components/marketplace/EditListingForm'
import { Listing } from '@/lib/supabase/queries'

export default async function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in')

  const { data: listing } = await supabase.from('listings').select('*').eq('id', id).single()

  if (!listing) notFound()
  if (listing.user_id !== user.id) redirect(`/marketplace/${id}`)

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/marketplace/${id}`} className="text-sm text-water-600 hover:underline">
          ← Back to listing
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Edit Listing</h1>
      </div>
      <EditListingForm listing={listing as Listing} />
    </div>
  )
}
