'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent]       = useState(false)
  const [error, setError]     = useState('')

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    })
    setLoading(false)
    if (err) setError(err.message)
    else setSent(true)
  }

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <div style={{
        minHeight: '100vh',
        background: '#08060d',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        padding: '24px',
      }}>
        <div style={{ width: '100%', maxWidth: 420 }}>

          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 56,
              height: 56,
              borderRadius: 16,
              background: 'linear-gradient(135deg, #c840e0, #9333ea)',
              marginBottom: 16,
              fontSize: 26,
            }}>
              📊
            </div>
            <h1 style={{ color: '#f5f0ff', fontSize: 24, fontWeight: 700, margin: 0 }}>
              LuvyMetrics
            </h1>
            <p style={{ color: '#9d8faa', fontSize: 14, marginTop: 6 }}>
              Inteligência para seu sex shop
            </p>
          </div>

          {/* Card */}
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(200,64,224,0.15)',
            borderRadius: 16,
            padding: 32,
          }}>
            {sent ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>📬</div>
                <h2 style={{ color: '#f5f0ff', fontSize: 20, fontWeight: 600, marginBottom: 8 }}>
                  Verifique seu e-mail
                </h2>
                <p style={{ color: '#9d8faa', fontSize: 14, lineHeight: 1.6 }}>
                  Enviamos um link de acesso para<br />
                  <span style={{ color: '#c840e0', fontWeight: 600 }}>{email}</span>
                </p>
                <p style={{ color: '#6d6079', fontSize: 12, marginTop: 16 }}>
                  Não recebeu? Verifique sua caixa de spam.
                </p>
                <button
                  onClick={() => { setSent(false); setEmail('') }}
                  style={{
                    marginTop: 24,
                    background: 'transparent',
                    border: '1px solid rgba(200,64,224,0.25)',
                    borderRadius: 8,
                    color: '#9d8faa',
                    fontSize: 13,
                    padding: '8px 20px',
                    cursor: 'pointer',
                  }}>
                  Usar outro e-mail
                </button>
              </div>
            ) : (
              <>
                <h2 style={{ color: '#f5f0ff', fontSize: 18, fontWeight: 600, marginBottom: 4 }}>
                  Entrar na plataforma
                </h2>
                <p style={{ color: '#9d8faa', fontSize: 13, marginBottom: 24 }}>
                  Enviaremos um link mágico para seu e-mail
                </p>

                <form onSubmit={enviar}>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{
                      display: 'block',
                      fontSize: 11,
                      color: '#9d8faa',
                      fontWeight: 500,
                      letterSpacing: '0.4px',
                      marginBottom: 6,
                    }}>
                      E-MAIL
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      required
                      style={{
                        width: '100%',
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(200,64,224,0.2)',
                        borderRadius: 8,
                        padding: '11px 14px',
                        color: '#f5f0ff',
                        fontSize: 14,
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                      onFocus={(e) => (e.target.style.borderColor = '#c840e0')}
                      onBlur={(e)  => (e.target.style.borderColor = 'rgba(200,64,224,0.2)')}
                    />
                  </div>

                  {error && (
                    <p style={{
                      color: '#ef4444',
                      fontSize: 12,
                      marginBottom: 12,
                      background: 'rgba(239,68,68,0.08)',
                      border: '1px solid rgba(239,68,68,0.2)',
                      borderRadius: 6,
                      padding: '8px 12px',
                    }}>
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={loading || !email.trim()}
                    style={{
                      width: '100%',
                      background: loading ? 'rgba(200,64,224,0.5)' : '#c840e0',
                      border: 'none',
                      borderRadius: 8,
                      color: '#fff',
                      fontSize: 14,
                      fontWeight: 600,
                      padding: '12px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      transition: 'opacity 0.2s',
                    }}>
                    {loading ? 'Enviando...' : 'Enviar link de acesso'}
                  </button>
                </form>
              </>
            )}
          </div>

          {/* Rodapé */}
          <p style={{ textAlign: 'center', fontSize: 12, color: '#6d6079', marginTop: 24 }}>
            Ainda não tem acesso?{' '}
            <a
              href="https://pay.cakto.com.br/wi3b98b_851240"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#c840e0', textDecoration: 'none' }}>
              Assinar agora →
            </a>
          </p>
        </div>
      </div>
    </>
  )
}
