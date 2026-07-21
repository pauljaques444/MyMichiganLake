import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProfileEditForm from '@/components/profile/ProfileEditForm'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in')

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, bio, lake_name, lake_id')
    .eq('id', user.id)
    .single()

  return (
    <div className="max-w-lg space-y-4">
      {/* Avatar card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-water-200 flex items-center justify-center text-water-700 font-bold text-xl">
          {profile?.display_name?.[0]?.toUpperCase() ?? user.email?.[0]?.toUpperCase()}
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {profile?.display_name ?? 'Lake neighbor'}
          </h1>
          <p className="text-sm text-gray-500">{user.email}</p>
          {profile?.lake_name && (
            <p className="text-sm text-water-600 font-medium mt-0.5">🌊 {profile.lake_name}</p>
          )}
        </div>
      </div>

      {/* Edit form */}
      <ProfileEditForm
        initial={{
          display_name: profile?.display_name ?? null,
          bio: profile?.bio ?? null,
          lake_name: profile?.lake_name ?? null,
          lake_id: profile?.lake_id ?? null,
        }}
      />
    </div>
  )
}
