import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Toaster } from 'sonner'
import Sidebar from '@/components/Sidebar'

export default async function DashboardLayout({
  children
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('perfis')
    .select('nome, nome_loja, trial_expira_em, plano')
    .eq('id', user.id)
    .single()

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: '#0f0e17',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      color: '#faf9ff'
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <Sidebar user={user} perfil={perfil} />
      <main style={{
        marginLeft: '240px',
        flex: 1,
        padding: '32px',
        minHeight: '100vh',
        background: '#0f0e17'
      }}>
        {children}
      </main>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#1e1c2e', border: '1px solid rgba(139,92,246,0.2)', color: '#faf9ff' },
        }}
      />
    </div>
  )
}
