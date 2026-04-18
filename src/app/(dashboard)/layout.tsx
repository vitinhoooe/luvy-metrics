import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Toaster } from 'sonner'
import Sidebar from '@/components/Sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('perfis').select('nome, nome_loja, trial_expira_em, plano, ativo').eq('id', user.id).single()

  // Admin sempre tem acesso
  const ADMIN_EMAIL = 'paulobernardobtt@gmail.com'
  if (user.email !== ADMIN_EMAIL) {
    if (perfil?.plano === 'cancelado' || perfil?.ativo === false) {
      redirect('/reativar')
    }
    if (perfil?.plano === 'trial' && perfil?.trial_expira_em) {
      if (new Date(perfil.trial_expira_em) < new Date()) {
        redirect('/assinar')
      }
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8f7ff', fontFamily: "'Plus Jakarta Sans', sans-serif", color: '#111827' }}>
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <Sidebar user={user} perfil={perfil} />
      <main style={{ marginLeft: 240, flex: 1, padding: 32, minHeight: '100vh' }}>
        {children}
      </main>
      <Toaster position="top-right" toastOptions={{ style: { background: '#fff', border: '1px solid #e5e7eb', color: '#111827' } }} />
    </div>
  )
}
