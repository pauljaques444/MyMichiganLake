'use server'

import { createClient } from '@/lib/supabase/server'

export type InquiryState = { success: boolean; error?: string }

export async function submitPartnerInquiry(
  _prev: InquiryState,
  formData: FormData,
): Promise<InquiryState> {
  const business_name = formData.get('business_name')?.toString().trim()
  const contact_name  = formData.get('contact_name')?.toString().trim()
  const email         = formData.get('email')?.toString().trim()
  const phone         = formData.get('phone')?.toString().trim() || null
  const website       = formData.get('website')?.toString().trim() || null
  const lakes_served  = formData.get('lakes_served')?.toString().trim() || null
  const ad_interest   = formData.get('ad_interest')?.toString().trim() || null
  const message       = formData.get('message')?.toString().trim() || null

  if (!business_name || !contact_name || !email) {
    return { success: false, error: 'Business name, contact name, and email are required.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('partner_inquiries').insert({
    business_name,
    contact_name,
    email,
    phone,
    website,
    lakes_served,
    ad_interest,
    message,
  })

  if (error) {
    return { success: false, error: 'Failed to submit. Please try again or email us directly.' }
  }

  return { success: true }
}
