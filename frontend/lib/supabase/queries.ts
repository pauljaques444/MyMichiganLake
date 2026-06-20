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

export type PriceType = 'sale' | 'rent_day' | 'rent_hour' | 'free'
export type ListingCategory = 'boats' | 'pwc' | 'dock' | 'fishing' | 'paddleboard' | 'kayak' | 'other'
export type ListingCondition = 'new' | 'like_new' | 'good' | 'fair'
export type ListingStatus = 'active' | 'sold' | 'rented'

export interface Conversation {
  id: string
  listing_id: string
  buyer_id: string
  seller_id: string
  created_at: string
  listing?: { id: string; title: string; images: string[] } | null
  buyer?: { id: string; display_name: string } | null
  seller?: { id: string; display_name: string } | null
  last_message?: string | null
  unread_count?: number
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  body: string
  read_at: string | null
  created_at: string
}

export interface Listing {
  id: string
  user_id: string
  title: string
  description: string | null
  price: number | null
  price_type: PriceType
  category: ListingCategory
  condition: ListingCondition | null
  lake_name: string | null
  images: string[]
  status: ListingStatus
  created_at: string
  profiles?: Profile | null
}
