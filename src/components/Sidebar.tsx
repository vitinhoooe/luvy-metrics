'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const navItems = [
  { label: 'Dashboard',     href: '/dashboard',      emoji: '📊' },
  { label: 'Tendências',    href: '/tendencias',     emoji: '🔥' },
  { label: 'Estoque',       href: '/estoque',        emoji: '📦' },
  { label: 'Calculadora',   href: '/calculadora',    emoji: '💰' },
  { label: 'Regiões',       href: '/regioes',        emoji: '🗺️' },
  { label: 'Bot IA',        href: '/bot',            emoji: '🤖' },
  { label: 'Configurações', href: '/configuracoes',  emoji: '⚙️' },
]

type SidebarProps = {
  nomeLoja: string
  nomeUsuario: string
  diasTrial: number
}

export default function Sidebar({ nomeLoja, nomeUsuario, diasTrial }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const inicial = (nomeLoja || nomeUsuario || 'U')[0].toUpperCase()

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-[#0d0a13] border-r border-white/5 flex flex-col z-40">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-[#c840e0] flex items-center justify-center shadow-lg shadow-[#c840e0]/20 flex-shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="font-bold text-white text-sm tracking-tight">LuvyMetrics</span>
        </div>
      </div>

      {/* Avatar + loja */}
      <div className="px-4 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-600 to-[#c840e0] flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-md shadow-[#c840e0]/20">
            {inicial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white text-sm font-semibold truncate">{nomeLoja || 'Minha Loja'}</p>
            <p className="text-zinc-500 text-xs truncate">{nomeUsuario}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto">
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const ativo = pathname === item.href
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    ativo
                      ? 'bg-[#c840e0]/15 text-white border border-[#c840e0]/25 shadow-sm'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className="text-base leading-none">{item.emoji}</span>
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Trial + Sair */}
      <div className="px-4 py-4 border-t border-white/5 space-y-2">
        <div className={`rounded-xl px-3 py-2.5 border ${
          diasTrial <= 2
            ? 'bg-red-500/10 border-red-500/20'
            : 'bg-[#c840e0]/10 border-[#c840e0]/20'
        }`}>
          <p className="text-xs text-zinc-400">Período de teste</p>
          <p className={`text-sm font-semibold mt-0.5 ${diasTrial <= 2 ? 'text-red-400' : 'text-[#c840e0]'}`}>
            {diasTrial} {diasTrial === 1 ? 'dia restante' : 'dias restantes'}
          </p>
        </div>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-zinc-500 hover:text-white hover:bg-white/5 transition-all text-left"
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sair
        </button>
      </div>
    </aside>
  )
}
