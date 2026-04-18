'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function NovaSenha() {
  const [senha, setSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const router = useRouter()

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
            <button type="submit" disabled={loading}
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
