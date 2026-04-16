import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AdminProspectosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user?.email !== 'paulobernardobtt@gmail.com') redirect('/dashboard')

  return (
    <div style={{ padding: 32, fontFamily: 'sans-serif', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Prospecção</h1>
          <p style={{ fontSize: 14, color: '#6b7280' }}>Busque sex shops e envie propostas</p>
        </div>
        <a href="/admin" style={{ fontSize: 14, color: '#7c3aed', textDecoration: 'none' }}>← Voltar</a>
      </div>
      <iframe src="/prospectos" style={{ width: '100%', height: 'calc(100vh - 120px)', border: 'none', borderRadius: 12 }} />
    </div>
  )
}
