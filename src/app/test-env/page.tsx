'use client'
export default function TestEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return (
    <div style={{ padding: 40, fontFamily: 'monospace', fontSize: 16 }}>
      <h2>Teste de variáveis de ambiente</h2>
      <p>SUPABASE_URL: {url ? `✅ ${url.slice(0, 30)}...` : '❌ NÃO EXISTE'}</p>
      <p>SUPABASE_ANON_KEY: {key ? `✅ ${key.slice(0, 20)}...` : '❌ NÃO EXISTE'}</p>
      <p>Timestamp: {new Date().toISOString()}</p>
    </div>
  )
}
