import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://luvymetrics.com.br'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const { searchParams } = url
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  console.log('[AUTH CALLBACK] incoming request', {
    url: request.url,
    origin: url.origin,
    host: request.headers.get('host'),
    hasCode: !!code,
    codeLength: code?.length,
    next,
    siteUrl: SITE_URL,
  })

  if (!code) {
    console.error('[AUTH CALLBACK] missing code param')
    return NextResponse.redirect(`${SITE_URL}/login?error=no_code`)
  }

  try {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('[AUTH CALLBACK] exchangeCodeForSession error', {
        message: error.message,
        status: error.status,
        name: error.name,
      })
      return NextResponse.redirect(
        `${SITE_URL}/login?error=exchange&msg=${encodeURIComponent(error.message)}`
      )
    }

    console.log('[AUTH CALLBACK] success', {
      hasSession: !!data.session,
      hasUser: !!data.user,
      userId: data.user?.id,
    })

    return NextResponse.redirect(`${SITE_URL}${next}`)
  } catch (err: any) {
    console.error('[AUTH CALLBACK] unexpected error', {
      message: err?.message,
      stack: err?.stack,
    })
    return NextResponse.redirect(
      `${SITE_URL}/login?error=unexpected&msg=${encodeURIComponent(err?.message ?? 'unknown')}`
    )
  }
}
