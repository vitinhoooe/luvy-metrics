import { redirect } from 'next/navigation'
import { Toaster } from 'sonner'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/Sidebar'
import NotificationBell from '@/components/NotificationBell'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('perfis')
    .select('*')
    .eq('user_id', user.id)
    .single()

  const diasTrial = perfil?.trial_expira_em
    ? Math.max(0, Math.ceil((new Date(perfil.trial_expira_em).getTime() - Date.now()) / 86_400_000))
    : 7

  return (
    <div className="min-h-screen bg-[#08060d] flex">
      <Sidebar
        nomeLoja={perfil?.nome_loja ?? ''}
        nomeUsuario={perfil?.nome ?? user.email ?? ''}
        diasTrial={diasTrial}
      />

      <div className="flex-1 ml-60 flex flex-col min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-[#08060d]/80 backdrop-blur-sm border-b border-white/5 px-6 py-3 flex items-center justify-end gap-3">
          <NotificationBell userId={user.id} />
        </header>

        {/* Conteúdo */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>

      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#0d0a13', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' },
        }}
      />
    </div>
  )
}
