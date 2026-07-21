'use client'

import { ExternalLink, Megaphone } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { AdCampaign } from '@/lib/supabase/queries'

interface Props {
  campaign: AdCampaign
  lakeId?: string | null
}

export default function SponsoredCard({ campaign, lakeId }: Props) {
  async function trackImpression() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('ad_impressions').insert({
      campaign_id: campaign.id,
      user_id: user.id,
      lake_id: lakeId ?? null,
      placement: campaign.placement,
    })
  }

  return (
    <article
      className="bg-white rounded-xl border border-gray-200 p-5 space-y-3 hover:shadow-sm transition-shadow"
      onMouseEnter={trackImpression}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
            <Megaphone size={16} />
          </div>
          <div>
            <p className="font-semibold text-sm text-gray-900">{campaign.title}</p>
            <p className="text-xs text-gray-400">Promoted</p>
          </div>
        </div>
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
          Sponsored
        </span>
      </div>

      {campaign.image_url && (
        <img
          src={campaign.image_url}
          alt={campaign.title}
          className="w-full rounded-lg object-cover max-h-48"
        />
      )}

      <p className="text-gray-700 text-sm leading-relaxed">{campaign.body}</p>

      <div className="flex items-center pt-1 border-t border-gray-100">
        <a
          href={campaign.cta_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs font-semibold text-water-600 hover:text-water-700 transition-colors"
        >
          {campaign.cta_text}
          <ExternalLink size={12} />
        </a>
      </div>
    </article>
  )
}
