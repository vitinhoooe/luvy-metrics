'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function NovaSenha() {
  const [senha, setSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [sessaoOk, setSessaoOk] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    async function inicializa() {
      const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : ''
      const hashParams = new URLSearchParams(hash)
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')
      const queryParams = new URLSearchParams(window.location.search)
      const code = queryParams.get('code')

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })
        window.history.replaceState(null, '', window.location.pathname)
        if (!error) { setSessaoOk(true); return }
      } else if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        window.history.replaceState(null, '', window.location.pathname)
        if (!error) { setSessaoOk(true); return }
      }

      const { data } = await supabase.auth.getSession()
      if (data.session) setSessaoOk(true)
      else setErro('Link inválido ou expirado. Solicite um novo link em "Esqueci minha senha".')
    }
    inicializa()
  }, [])

  async function handleNovaSenha(e: React.FormEvent) {
    e.preventDefault()
    if (senha !== confirmar) {
      setErro('As senhas não coincidem.')
      return
    }
    if (senha.length < 6) {
      setErro('A senha deve ter pelo menos 6 caracteres.')
      return
    }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: senha })
    if (error) {
      setErro(error.message)
      setLoading(false)
      return
    }
    router.push('/dashboard')
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
          <h2 style={{
            fontSize: '20px', fontWeight: '700',
            color: '#f5f0ff', margin: '0 0 24px'
          }}>Criar nova senha</h2>

          {erro && (
            <div style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: '8px', padding: '12px',
              color: '#f87171', fontSize: '14px',
              marginBottom: '16px'
            }}>{erro}</div>
          )}

          <form onSubmit={handleNovaSenha}>
            <input
              type="password"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              placeholder="Nova senha (mín. 6 caracteres)"
              required
              minLength={6}
              style={{
                width: '100%', padding: '14px 16px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(200,64,224,0.25)',
                borderRadius: '10px', color: '#f5f0ff',
                fontSize: '15px', outline: 'none',
                marginBottom: '12px', fontFamily: 'inherit',
                boxSizing: 'border-box'
              }}
            />
            <input
              type="password"
              value={confirmar}
              onChange={e => setConfirmar(e.target.value)}
              placeholder="Confirmar senha"
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
            <button type="submit" disabled={loading || !sessaoOk}
              style={{
                width: '100%', padding: '14px',
                background: 'linear-gradient(135deg,#c840e0,#9333ea)',
                border: 'none', borderRadius: '10px',
                color: '#fff', fontSize: '15px',
                fontWeight: '600', cursor: 'pointer',
                fontFamily: 'inherit'
              }}>
              {loading ? 'Salvando...' : 'Salvar senha →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
