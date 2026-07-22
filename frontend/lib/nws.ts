const COUNTY_FIPS: Record<string, number> = {
  Alcona: 1, Alger: 3, Allegan: 5, Alpena: 7, Antrim: 9, Arenac: 11,
  Baraga: 13, Barry: 15, Bay: 17, Benzie: 19, Berrien: 21, Branch: 23,
  Calhoun: 25, Cass: 27, Charlevoix: 29, Cheboygan: 31, Chippewa: 33,
  Clare: 35, Clinton: 37, Crawford: 39, Delta: 41, Dickinson: 43, Eaton: 45,
  Emmet: 47, Genesee: 49, Gladwin: 51, Gogebic: 53, 'Grand Traverse': 55,
  Gratiot: 57, Hillsdale: 59, Houghton: 61, Huron: 63, Ingham: 65,
  Ionia: 67, Iosco: 69, Iron: 71, Isabella: 73, Jackson: 75, Kalamazoo: 77,
  Kalkaska: 79, Kent: 81, Keweenaw: 83, Lake: 85, Lapeer: 87, Leelanau: 89,
  Lenawee: 91, Livingston: 93, Luce: 95, Mackinac: 97, Macomb: 99,
  Manistee: 101, Marquette: 103, Mason: 105, Mecosta: 107, Menominee: 109,
  Midland: 111, Missaukee: 113, Monroe: 115, Montcalm: 117, Montmorency: 119,
  Muskegon: 121, Newaygo: 123, Oakland: 125, Oceana: 127, Ogemaw: 129,
  Ontonagon: 131, Osceola: 133, Oscoda: 135, Otsego: 137, Ottawa: 139,
  'Presque Isle': 141, Roscommon: 143, Saginaw: 145, 'St. Clair': 147,
  'St. Joseph': 149, Sanilac: 151, Schoolcraft: 153, Shiawassee: 155,
  Tuscola: 157, 'Van Buren': 159, Washtenaw: 161, Wayne: 163, Wexford: 165,
}

export const COUNTY_LOCAL_ALERTS: Record<string, { name: string; url: string; note?: string }> = {
  Charlevoix:       { name: 'BE ALERT (Smart911)', url: 'https://www.smart911.com/smart911/ref/reg.action?pa=CCEOEM', note: 'Shared with Cheboygan & Emmet' },
  Cheboygan:        { name: 'BE ALERT (Smart911)', url: 'https://www.smart911.com/smart911/ref/reg.action?pa=CCEOEM', note: 'Shared with Charlevoix & Emmet' },
  Emmet:            { name: 'BE ALERT (Smart911)', url: 'https://www.smart911.com/smart911/ref/reg.action?pa=CCEOEM', note: 'Shared with Charlevoix & Cheboygan' },
  'Grand Traverse': { name: 'Grand Traverse Alert (CodeRED)', url: 'https://www.gtcountymi.gov/288/CodeRED' },
  Allegan:          { name: 'AlleganAlert (Smart911)', url: 'https://www.allegancounty.org/courts-law-enforcement/emergency-management/emergency-alerts', note: 'Text AlleganAlert to 78015' },
  Berrien:          { name: 'B-WARN!', url: 'https://www.berriencounty.org/1283/B-WARN' },
  Calhoun:          { name: 'RAVE Alerts', url: 'https://www.calhouncountymi.gov/departments/sheriffs_office/rave_emergency_notifications.php', note: 'Text CALHOUN to 67283' },
  Oakland:          { name: 'OakAlert (RAVE)', url: 'https://www.oakgov.com/community/emergency-management/oakalert' },
  Manistee:         { name: 'CodeRED', url: 'https://www.manisteecountymi.gov/205/CodeRED-Emergency-Notifications' },
  'Presque Isle':   { name: 'CodeRED', url: 'https://presqueislecounty.org/codered/' },
  Alpena:           { name: 'Alert Center', url: 'https://www.alpenacounty.org/AlertCenter.aspx' },
  Livingston:       { name: 'LivCo Alert (Smart911)', url: 'https://milivcounty.gov/emergency-management/livco-alert-system/' },
  Osceola:          { name: 'Nixle', url: 'https://www.osceolaemd.us/NIXLE' },
}

export function countyToNwsZone(county: string): string | null {
  const fips = COUNTY_FIPS[county]
  if (!fips) return null
  return `MIC${String(fips).padStart(3, '0')}`
}

export function countyOemUrl(county: string): string {
  const known = COUNTY_LOCAL_ALERTS[county]
  if (known) return known.url
  // Generic Michigan OEM search as fallback
  return `https://www.google.com/search?q=${encodeURIComponent(county + ' County Michigan emergency management alerts')}`
}

export interface NwsAlert {
  id: string
  event: string
  headline: string | null
  description: string | null
  instruction: string | null
  severity: 'Extreme' | 'Severe' | 'Moderate' | 'Minor' | 'Unknown'
  urgency: string
  certainty: string
  effective: string
  expires: string | null
  areaDesc: string
}

export async function fetchNwsAlerts(zone: string): Promise<NwsAlert[]> {
  const res = await fetch(
    `https://api.weather.gov/alerts/active?zone=${zone}`,
    {
      headers: {
        'User-Agent': 'MyMichiganLake (mymichiganlake.netlify.app)',
        Accept: 'application/geo+json',
      },
      next: { revalidate: 300 },
    }
  )
  if (!res.ok) throw new Error(`NWS ${res.status}`)
  const data = await res.json() as { features?: unknown[] }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((data.features ?? []) as any[])
    .filter((f) => f.properties?.status === 'Actual')
    .map((f) => ({
      id: f.id as string,
      event: f.properties.event as string,
      headline: (f.properties.headline ?? null) as string | null,
      description: (f.properties.description ?? null) as string | null,
      instruction: (f.properties.instruction ?? null) as string | null,
      severity: (f.properties.severity ?? 'Unknown') as NwsAlert['severity'],
      urgency: f.properties.urgency as string,
      certainty: f.properties.certainty as string,
      effective: f.properties.effective as string,
      expires: (f.properties.expires ?? null) as string | null,
      areaDesc: f.properties.areaDesc as string,
    }))
}
