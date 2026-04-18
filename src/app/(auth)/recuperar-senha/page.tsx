'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function RecuperarSenha() {
  const [email, setEmail] = useState('')
  const [enviado, setEnviado] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleRecuperar(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://luvymetrics.com.br/nova-senha'
    })
    setEnviado(true)
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#08060d',
      display: 'flex', alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Plus Jakarta Sans',sans-serif",
      padding: '24px'
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(200,64,224,0.2)',
          borderRadius: '20px', padding: '36px'
        }}>
          {!enviado ? (
            <>
              <h2 style={{
                fontSize: '20px', fontWeight: '700',
                color: '#f5f0ff', margin: '0 0 8px'
              }}>Recuperar acesso</h2>
              <p style={{
                color: '#9d8faa', fontSize: '14px',
                margin: '0 0 24px'
              }}>
                Digite seu email e enviaremos um link
                para criar uma nova senha.
              </p>
              <form onSubmit={handleRecuperar}>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  style={{
                    width: '100%', padding: '14px 16px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(200,64,224,0.25)',
                    borderRadius: '10px', color: '#f5f0ff',
                    fontSize: '15px', outline: 'none',
                    marginBottom: '16px', fontFamily: 'inherit',
                    boxSizing: 'border-box'
                  }}
                />
                <button type="submit" disabled={loading}
                  style={{
                    width: '100%', padding: '14px',
                    background: 'linear-gradient(135deg,#c840e0,#9333ea)',
                    border: 'none', borderRadius: '10px',
                    color: '#fff', fontSize: '15px',
                    fontWeight: '600', cursor: 'pointer',
                    fontFamily: 'inherit'
                  }}>
                  {loading ? 'Enviando...' : 'Enviar link →'}
                </button>
              </form>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📧</div>
              <h2 style={{ color: '#f5f0ff', fontSize: '20px', fontWeight: '700', margin: '0 0 12px' }}>
                Email enviado!
              </h2>
              <p style={{ color: '#9d8faa', fontSize: '14px' }}>
                Verifique sua caixa de entrada e
                clique no link para criar nova senha.
              </p>
            </div>
          )}
        </div>
        <p style={{ textAlign: 'center', marginTop: '16px' }}>
          <a href="/login" style={{ color: '#c840e0', fontSize: '13px', textDecoration: 'none' }}>
            ← Voltar para o login
          </a>
        </p>
      </div>
    </div>
  )
}
