export type PostCategory =
  | 'general'
  | 'safety'
  | 'lost_found'
  | 'events'
  | 'recommendations'
  | 'for_sale'
  | 'water_conditions'

export interface Profile {
  id: string
  display_name: string
  bio: string | null
  avatar_url: string | null
  lake_name: string | null
  onboarding_complete: boolean
}

export interface Post {
  id: string
  user_id: string
  body: string
  category: PostCategory
  is_urgent: boolean
  created_at: string
  profiles: Profile | null
}
