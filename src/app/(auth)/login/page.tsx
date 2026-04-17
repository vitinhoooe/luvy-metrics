'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const TX = '#faf9ff'
const MT = '#9ca3af'
const AC = '#a78bfa'
const BD = 'rgba(139,92,246,0.2)'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://luvymetrics.com.br'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [enviado, setEnviado] = useState(false)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErro('')

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${SITE_URL}/auth/callback` }
      })

      if (error) {
        setErro(error.message)
        setLoading(false)
        return
      }

      setEnviado(true)
    } catch (err: any) {
      setErro('Erro de conexão. Verifique sua internet e tente novamente.')
    }

    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#0f0e17',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Plus Jakarta Sans', sans-serif", padding: '24px'
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            width: '56px', height: '56px',
            background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
            borderRadius: '16px', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px', fontSize: '24px',
            fontWeight: '900', color: '#fff', letterSpacing: '-1px'
          }}>L</div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', color: TX, letterSpacing: '-1px', margin: '0 0 8px' }}>
            Luvy<span style={{ color: AC }}>Metrics</span>
          </h1>
          <p style={{ color: MT, fontSize: '15px', margin: 0 }}>
            O radar de tendências do seu sex shop
          </p>
        </div>

        <div style={{
          background: '#1e1c2e',
          border: `1px solid ${BD}`,
          borderRadius: '20px', padding: '36px'
        }}>
          {!enviado ? (
            <>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: TX, margin: '0 0 8px' }}>
                Entrar na plataforma
              </h2>
              <p style={{ color: MT, fontSize: '14px', margin: '0 0 28px', lineHeight: '1.6' }}>
                Enviaremos um link mágico para seu email. Sem senha, sem complicação.
              </p>
              <form onSubmit={handleLogin}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: MT, marginBottom: '8px' }}>
                  Seu email
                </label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="seu@email.com" required
                  style={{
                    width: '100%', padding: '14px 16px',
                    background: 'rgba(255,255,255,0.05)',
                    border: `1px solid ${BD}`,
                    borderRadius: '10px', color: TX,
                    fontSize: '15px', outline: 'none',
                    marginBottom: '20px', fontFamily: 'inherit',
                    boxSizing: 'border-box'
                  }}
                  onFocus={e => (e.target.style.borderColor = '#8b5cf6')}
                  onBlur={e => (e.target.style.borderColor = BD)}
                />
                {erro && (
                  <p style={{ color: '#f87171', fontSize: 13, marginBottom: 16, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '10px 14px', lineHeight: 1.5 }}>{erro}</p>
                )}
                <button type="submit" disabled={loading} style={{
                  width: '100%', padding: '14px',
                  background: loading ? 'rgba(139,92,246,0.5)' : 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                  border: 'none', borderRadius: '10px',
                  color: '#fff', fontSize: '15px', fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit'
                }}>
                  {loading ? 'Enviando...' : 'Entrar com link mágico →'}
                </button>
              </form>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📧</div>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: TX, margin: '0 0 12px' }}>Link enviado!</h2>
              <p style={{ color: MT, fontSize: '14px', lineHeight: '1.7', margin: '0 0 8px' }}>
                Verifique sua caixa de entrada em{' '}
                <strong style={{ color: AC }}>{email}</strong>
              </p>
              <p style={{ color: MT, fontSize: '13px', margin: '0 0 24px' }}>
                Pode levar até 2 minutos. Verifique também a pasta de spam.
              </p>
              <button onClick={() => { setEnviado(false); setErro('') }} style={{
                background: 'transparent', border: 'none', color: MT, fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit'
              }}>Tentar novamente</button>
            </div>
          )}
        </div>

        <p style={{ textAlign: 'center', color: MT, fontSize: '13px', marginTop: '24px' }}>
          Ainda não tem conta?{' '}
          <a href="https://pay.cakto.com.br/3at3fir_852772" target="_blank" rel="noopener noreferrer"
            style={{ color: AC, textDecoration: 'none' }}>Assinar agora →</a>
        </p>
      </div>
    </div>
  )
}
