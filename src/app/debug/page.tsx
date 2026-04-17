'use client'

import { useState } from 'react'

export default function DebugPage() {
  const [result, setResult] = useState('')

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  async function testar() {
    setResult('Testando...')
    try {
      const res = await fetch(`${url}/auth/v1/health`, {
        headers: { apikey: key || '' },
      })
      const data = await res.json()
      setResult(`✅ Supabase OK: ${JSON.stringify(data)}`)
    } catch (err: any) {
      setResult(`❌ ERRO: ${err.message}`)
    }
  }

  return (
    <div style={{ padding: 40, fontFamily: 'monospace', fontSize: 14, maxWidth: 600 }}>
      <h2>Debug LuvyMetrics</h2>
      <p>SUPABASE_URL: {url ? `✅ ${url}` : '❌ VAZIO'}</p>
      <p>ANON_KEY: {key ? `✅ ${key.slice(0, 30)}...` : '❌ VAZIO'}</p>
      <button onClick={testar} style={{ padding: '10px 20px', marginTop: 16, cursor: 'pointer' }}>
        Testar conexão
      </button>
      <pre style={{ marginTop: 16, background: '#f3f4f6', padding: 16, borderRadius: 8, whiteSpace: 'pre-wrap' }}>
        {result}
      </pre>
    </div>
  )
}
