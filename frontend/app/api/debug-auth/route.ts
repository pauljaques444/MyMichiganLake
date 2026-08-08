import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const now = Math.floor(Date.now() / 1000)

  // getSession reads from cookie without a DB round-trip
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({
      status: 'no_session',
      session_error: sessionError?.message ?? null,
      server_unix: now,
      server_time: new Date(now * 1000).toISOString(),
    })
  }

  // Decode JWT payload without verifying signature
  const payloadB64 = session.access_token.split('.')[1]
  const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString())

  // Test a minimal DB query to see if PostgREST accepts the JWT
  const { error: dbError } = await supabase.from('profiles').select('id').limit(1).maybeSingle()

  return NextResponse.json({
    status: 'has_session',
    user_email: session.user.email,
    jwt_iat: payload.iat,
    jwt_iat_human: new Date(payload.iat * 1000).toISOString(),
    jwt_exp: payload.exp,
    jwt_exp_human: new Date(payload.exp * 1000).toISOString(),
    server_unix: now,
    server_time: new Date(now * 1000).toISOString(),
    iat_is_future: payload.iat > now,
    seconds_ahead: payload.iat - now,
    is_expired: payload.exp < now,
    db_test: dbError ? `ERROR: ${dbError.message}` : 'OK',
  })
}
