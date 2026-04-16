'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const navItems = [
  { href: '/dashboard', icon: '📊', label: 'Dashboard' },
  { href: '/tendencias', icon: '🔥', label: 'Tendências' },
  { href: '/estoque', icon: '📦', label: 'Estoque' },
  { href: '/calculadora', icon: '💰', label: 'Calculadora' },
  { href: '/regioes', icon: '🗺️', label: 'Regiões' },
  { href: '/configuracoes', icon: '⚙️', label: 'Configurações' },
]

export default function Sidebar({ user, perfil }: any) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSair() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const diasRestantes = perfil?.trial_expira_em
    ? Math.max(0, Math.ceil((new Date(perfil.trial_expira_em).getTime() - Date.now()) / 86400000))
    : 7

  return (
    <div style={{
      position: 'fixed', left: 0, top: 0, bottom: 0, width: 240,
      background: '#1a1333', display: 'flex', flexDirection: 'column', zIndex: 100,
      fontFamily: "'Plus Jakarta Sans', sans-serif",
    }}>
      <div style={{ padding: '24px 20px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 32, height: 32, background: 'linear-gradient(135deg,#7c3aed,#9333ea)',
            borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 900, color: '#fff', fontSize: 16,
          }}>L</div>
          <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px' }}>
            <span style={{ color: '#111827' }}>Luvy</span>
            <span style={{ color: '#7c3aed' }}>Metrics</span>
          </span>
        </div>
      </div>

      <div style={{ padding: '12px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{
          width: 36, height: 36, background: 'rgba(124,58,237,0.3)', borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 15, fontWeight: 700, color: '#a78bfa', marginBottom: 8,
        }}>
          {(perfil?.nome || user?.email || 'U')[0].toUpperCase()}
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 2 }}>
          {perfil?.nome_loja || 'Minha Loja'}
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {user?.email}
        </div>
      </div>

      <nav style={{ flex: 1, padding: 12, overflowY: 'auto' }}>
        {navItems.map(item => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link key={item.href} href={item.href} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', borderRadius: 10, marginBottom: 2,
              textDecoration: 'none', fontSize: 14,
              fontWeight: isActive ? 600 : 400,
              color: isActive ? '#fff' : 'rgba(255,255,255,0.55)',
              background: isActive ? 'rgba(124,58,237,0.25)' : 'transparent',
              borderLeft: isActive ? '2px solid #a78bfa' : '2px solid transparent',
            }}>
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div style={{ padding: '12px 16px 20px' }}>
        {perfil?.plano !== 'ativo' && (
          <div style={{
            background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.25)',
            borderRadius: 12, padding: 12, marginBottom: 12, textAlign: 'center',
          }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>Período de teste</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#a78bfa' }}>{diasRestantes} dias restantes</div>
          </div>
        )}
        <button onClick={handleSair} style={{
          width: '100%', padding: 10, background: 'transparent',
          border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10,
          color: 'rgba(255,255,255,0.5)', fontSize: 13, cursor: 'pointer',
          fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>Sair</button>
      </div>
    </div>
  )
}
