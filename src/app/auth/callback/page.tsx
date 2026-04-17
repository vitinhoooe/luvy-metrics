'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    // Supabase pode colocar tokens na hash fragment (#)
    const hash = window.location.hash
    if (hash) {
      const params = new URLSearchParams(hash.substring(1))
      const accessToken = params.get('access_token')
      const refreshToken = params.get('refresh_token')

      if (accessToken && refreshToken) {
        supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        }).then(({ error }) => {
          if (!error) router.push('/dashboard')
          else router.push('/login?error=session')
        })
        return
      }
    }

    // Se não tem hash, verifica se já tem sessão
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) router.push('/dashboard')
      else router.push('/login?error=auth')
    })
  }, [router])

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', background: '#f8f7ff', fontFamily: 'sans-serif',
      color: '#6b7280', fontSize: 14,
    }}>
      Autenticando...
    </div>
  )
}
