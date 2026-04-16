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
      background: '#08060d',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      color: '#f5f0ff'
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <Sidebar user={user} perfil={perfil} />
      <main style={{
        marginLeft: '240px',
        flex: 1,
        padding: '32px',
        minHeight: '100vh',
        background: '#08060d'
      }}>
        {children}
      </main>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#0d0a14', border: '1px solid rgba(200,64,224,0.2)', color: '#f5f0ff' },
        }}
      />
    </div>
  )
}
