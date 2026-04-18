'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErro('')

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: senha
      })

      if (error) {
        setErro('Email ou senha incorretos.')
        setLoading(false)
        return
      }

      router.push('/dashboard')
      router.refresh()
    } catch {
      setErro('Erro ao conectar. Tente novamente.')
      setLoading(false)
    }
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
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            width: '56px', height: '56px',
            background: 'linear-gradient(135deg,#7c3aed,#9333ea)',
            borderRadius: '16px',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px', fontSize: '26px'
          }}>⚡</div>
          <h1 style={{
            fontSize: '28px', fontWeight: '800',
            color: '#f5f0ff', letterSpacing: '-1px',
            margin: '0 0 8px'
          }}>
            Luvy<span style={{ color: '#c840e0' }}>Metrics</span>
          </h1>
          <p style={{ color: '#9d8faa', fontSize: '15px', margin: 0 }}>
            O radar de tendências do seu sex shop
          </p>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(200,64,224,0.2)',
          borderRadius: '20px', padding: '36px'
        }}>
          <h2 style={{
            fontSize: '20px', fontWeight: '700',
            color: '#f5f0ff', margin: '0 0 8px'
          }}>Entrar na plataforma</h2>
          <p style={{
            color: '#9d8faa', fontSize: '14px',
            margin: '0 0 24px', lineHeight: '1.6'
          }}>
            Digite seu email e senha para acessar.
          </p>

          {erro && (
            <div style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: '8px', padding: '12px',
              color: '#f87171', fontSize: '14px',
              marginBottom: '16px'
            }}>
              {erro}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <label style={{
              display: 'block', fontSize: '13px',
              fontWeight: '500', color: '#9d8faa',
              marginBottom: '8px'
            }}>Email</label>
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

            <label style={{
              display: 'block', fontSize: '13px',
              fontWeight: '500', color: '#9d8faa',
              marginBottom: '8px'
            }}>Senha</label>
            <input
              type="password"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              placeholder="sua senha"
              required
              style={{
                width: '100%', padding: '14px 16px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(200,64,224,0.25)',
                borderRadius: '10px', color: '#f5f0ff',
                fontSize: '15px', outline: 'none',
                marginBottom: '20px', fontFamily: 'inherit',
                boxSizing: 'border-box'
              }}
            />

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '14px',
                background: loading
                  ? 'rgba(200,64,224,0.5)'
                  : 'linear-gradient(135deg,#c840e0,#9333ea)',
                border: 'none', borderRadius: '10px',
                color: '#fff', fontSize: '15px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit'
              }}
            >
              {loading ? 'Entrando...' : 'Entrar →'}
            </button>
          </form>

          <p style={{
            textAlign: 'center', color: '#9d8faa',
            fontSize: '13px', marginTop: '20px'
          }}>
            Esqueceu a senha?{' '}
            <a
              href="/recuperar-senha"
              style={{ color: '#c840e0', textDecoration: 'none' }}
            >
              Recuperar acesso
            </a>
          </p>
        </div>

        <p style={{
          textAlign: 'center', color: '#9d8faa',
          fontSize: '13px', marginTop: '24px'
        }}>
          Ainda não tem conta?{' '}
          <a
            href="https://pay.cakto.com.br/3at3fir_852772"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#c840e0', textDecoration: 'none' }}
          >
            Assinar agora →
          </a>
        </p>
      </div>
    </div>
  )
}
