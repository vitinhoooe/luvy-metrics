import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user?.email !== 'paulobernardobtt@gmail.com') redirect('/dashboard')

  return (
    <div style={{ padding: 32, fontFamily: 'sans-serif', maxWidth: 800, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 24 }}>Admin LuvyMetrics</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <a href="/admin/prospectos" style={{ padding: 20, background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 12, textDecoration: 'none', color: '#111827', fontWeight: 600 }}>
          🎯 Prospecção — Buscar e enviar emails
        </a>
        <a href="/api/cron/coletar" target="_blank" style={{ padding: 20, background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 12, textDecoration: 'none', color: '#111827', fontWeight: 600 }}>
          🔄 Executar coleta de dados agora
        </a>
        <a href="/api/cron/prospectar" target="_blank" style={{ padding: 20, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, textDecoration: 'none', color: '#111827', fontWeight: 600 }}>
          📧 Executar prospecção agora
        </a>
      </div>
    </div>
  )
}
