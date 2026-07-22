import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  countyToNwsZone,
  countyOemUrl,
  fetchNwsAlerts,
  COUNTY_LOCAL_ALERTS,
  type NwsAlert,
} from '@/lib/nws'

export const revalidate = 300

const SEVERITY_STYLES: Record<string, { border: string; bg: string; badge: string; dot: string }> = {
  Extreme: {
    border: 'border-red-400',
    bg: 'bg-red-50',
    badge: 'bg-red-100 text-red-800',
    dot: 'bg-red-500',
  },
  Severe: {
    border: 'border-orange-400',
    bg: 'bg-orange-50',
    badge: 'bg-orange-100 text-orange-800',
    dot: 'bg-orange-500',
  },
  Moderate: {
    border: 'border-yellow-400',
    bg: 'bg-yellow-50',
    badge: 'bg-yellow-100 text-yellow-800',
    dot: 'bg-yellow-500',
  },
  Minor: {
    border: 'border-blue-300',
    bg: 'bg-blue-50',
    badge: 'bg-blue-100 text-blue-800',
    dot: 'bg-blue-400',
  },
  Unknown: {
    border: 'border-gray-200',
    bg: 'bg-gray-50',
    badge: 'bg-gray-100 text-gray-700',
    dot: 'bg-gray-400',
  },
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  })
}

function AlertCard({ alert }: { alert: NwsAlert }) {
  const sev = alert.severity in SEVERITY_STYLES ? alert.severity : 'Unknown'
  const s = SEVERITY_STYLES[sev]

  return (
    <article className={`rounded-xl border-l-4 ${s.border} ${s.bg} p-5`}>
      <div className="flex items-start gap-3 mb-2">
        <span className={`mt-1 w-2.5 h-2.5 rounded-full flex-shrink-0 ${s.dot}`} />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 text-sm">{alert.event}</h3>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${s.badge}`}>
              {alert.severity}
            </span>
            <span className="text-xs text-gray-500">{alert.urgency} · {alert.certainty}</span>
          </div>
          {alert.headline && (
            <p className="text-sm text-gray-700 leading-snug">{alert.headline}</p>
          )}
        </div>
      </div>

      {alert.description && (
        <details className="mt-3 ml-5.5">
          <summary className="text-xs font-medium text-gray-500 cursor-pointer hover:text-gray-700 select-none">
            Full description
          </summary>
          <p className="mt-2 text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">
            {alert.description}
          </p>
        </details>
      )}

      {alert.instruction && (
        <div className="mt-3 ml-5.5 p-3 bg-white/70 rounded-lg border border-current/10">
          <p className="text-xs font-semibold text-gray-700 mb-1">What to do</p>
          <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">
            {alert.instruction}
          </p>
        </div>
      )}

      <div className="flex gap-4 mt-3 ml-5.5 text-xs text-gray-400">
        <span>Issued {formatTime(alert.effective)}</span>
        {alert.expires && <span>Expires {formatTime(alert.expires)}</span>}
      </div>
    </article>
  )
}

export default async function AlertsPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in')

  const { data: profile } = await supabase
    .from('profiles')
    .select('lake_id, lake_name')
    .eq('id', user.id)
    .single()

  // No lake selected yet
  if (!profile?.lake_id) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
        <div className="text-5xl mb-4">🚨</div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Set your lake to see alerts</h2>
        <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
          Safety alerts are scoped to your county. Add your lake on your profile and we'll
          pull live NOAA / NWS alerts for your area.
        </p>
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 bg-sky-600 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-sky-700 transition-colors"
        >
          Set your lake →
        </Link>
      </div>
    )
  }

  // Resolve county from lake
  const { data: lake } = await supabase
    .from('lakes')
    .select('county')
    .eq('id', profile.lake_id)
    .single()

  const county = lake?.county ?? null
  const nwsZone = county ? countyToNwsZone(county) : null

  let alerts: NwsAlert[] = []
  let fetchError = false

  if (nwsZone) {
    try {
      alerts = await fetchNwsAlerts(nwsZone)
    } catch {
      fetchError = true
    }
  }

  const localSystem = county ? COUNTY_LOCAL_ALERTS[county] ?? null : null
  const oemUrl = county ? countyOemUrl(county) : null

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Safety Alerts</h1>
            {county ? (
              <p className="text-sm text-gray-500 mt-0.5">
                {profile.lake_name} · <strong className="text-gray-700">{county} County</strong>
                {nwsZone && (
                  <span className="ml-2 font-mono text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                    {nwsZone}
                  </span>
                )}
              </p>
            ) : (
              <p className="text-sm text-gray-400 mt-0.5">County not found for {profile.lake_name}</p>
            )}
          </div>
          <a
            href="https://www.weather.gov"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Powered by NOAA / NWS ↗
          </a>
        </div>
      </div>

      {/* Alerts */}
      {fetchError ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-sm text-red-700 font-medium">Unable to reach NOAA right now</p>
          <p className="text-xs text-red-500 mt-1">Check back in a few minutes or visit weather.gov directly.</p>
        </div>
      ) : !nwsZone ? (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center">
          <p className="text-sm text-gray-500">No NWS zone mapping found for {county} County.</p>
        </div>
      ) : alerts.length === 0 ? (
        <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
          <div className="text-3xl mb-3">✅</div>
          <p className="text-sm font-medium text-green-800">No active alerts for {county} County</p>
          <p className="text-xs text-green-600 mt-1">
            NWS data refreshes every 5 minutes. Last checked: {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' })}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs font-medium text-gray-500 px-1">
            {alerts.length} active alert{alerts.length !== 1 ? 's' : ''} for {county} County
          </p>
          {alerts.map((alert) => (
            <AlertCard key={alert.id} alert={alert} />
          ))}
        </div>
      )}

      {/* Local sign-up card */}
      {county && oemUrl && (
        <div className="bg-sky-50 border border-sky-200 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <span className="text-2xl">📱</span>
            <div>
              <h3 className="text-sm font-semibold text-sky-900 mb-1">
                Get push alerts directly to your phone
              </h3>
              {localSystem ? (
                <>
                  <p className="text-xs text-sky-700 mb-3">
                    {county} County uses <strong>{localSystem.name}</strong> for local emergency
                    notifications — severe weather, evacuations, road closures, and more.
                    {localSystem.note && ` ${localSystem.note}.`}
                  </p>
                  <a
                    href={localSystem.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-sky-700 hover:text-sky-900 underline underline-offset-2"
                  >
                    Sign up for {localSystem.name} ↗
                  </a>
                </>
              ) : (
                <>
                  <p className="text-xs text-sky-700 mb-3">
                    {county} County Emergency Management offers local alert registration for severe
                    weather, evacuations, and hazard notices.
                  </p>
                  <a
                    href={oemUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-sky-700 hover:text-sky-900 underline underline-offset-2"
                  >
                    {county} County Emergency Management ↗
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
