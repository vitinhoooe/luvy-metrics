'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const TX = '#faf9ff'
const MT = '#9ca3af'
const AC = '#a78bfa'
const BD = 'rgba(139,92,246,0.12)'

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
    ? Math.max(0, Math.ceil(
        (new Date(perfil.trial_expira_em).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      ))
    : 7

  return (
    <div style={{
      position: 'fixed', left: 0, top: 0, bottom: 0, width: '240px',
      background: '#13111e', borderRight: `1px solid ${BD}`,
      display: 'flex', flexDirection: 'column', zIndex: 100,
      fontFamily: "'Plus Jakarta Sans', sans-serif"
    }}>
      <div style={{ padding: '24px 20px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '34px', height: '34px',
            background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
            borderRadius: '10px', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontSize: '16px', fontWeight: '900',
            color: '#fff', letterSpacing: '-1px'
          }}>L</div>
          <span style={{ fontSize: '18px', fontWeight: '800', color: TX, letterSpacing: '-0.5px' }}>
            Luvy<span style={{ color: AC }}>Metrics</span>
          </span>
        </div>
      </div>

      <div style={{ padding: '12px 20px 16px', borderBottom: `1px solid ${BD}` }}>
        <div style={{
          width: '36px', height: '36px', background: 'rgba(139,92,246,0.2)',
          borderRadius: '50%', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: '15px', fontWeight: '700',
          color: AC, marginBottom: '8px'
        }}>
          {(perfil?.nome || user?.email || 'U')[0].toUpperCase()}
        </div>
        <div style={{ fontSize: '13px', fontWeight: '600', color: TX, marginBottom: '2px' }}>
          {perfil?.nome_loja || 'Minha Loja'}
        </div>
        <div style={{ fontSize: '11px', color: MT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {user?.email}
        </div>
      </div>

      <nav style={{ flex: 1, padding: '12px', overflowY: 'auto' }}>
        {navItems.map(item => {
          const isActive = pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link key={item.href} href={item.href} style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 12px', borderRadius: '10px', marginBottom: '2px',
              textDecoration: 'none', fontSize: '14px',
              fontWeight: isActive ? '600' : '400',
              color: isActive ? AC : MT,
              background: isActive ? 'rgba(139,92,246,0.15)' : 'transparent',
              borderLeft: isActive ? '2px solid #8b5cf6' : '2px solid transparent',
            }}>
              <span style={{ fontSize: '16px' }}>{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div style={{ padding: '12px 16px 20px' }}>
        {perfil?.plano !== 'ativo' && (
          <div style={{
            background: 'rgba(139,92,246,0.1)',
            border: '1px solid rgba(139,92,246,0.2)',
            borderRadius: '12px', padding: '12px',
            marginBottom: '12px', textAlign: 'center'
          }}>
            <div style={{ fontSize: '11px', color: MT, marginBottom: '4px' }}>Período de teste</div>
            <div style={{ fontSize: '14px', fontWeight: '700', color: AC }}>
              {diasRestantes} dias restantes
            </div>
          </div>
        )}
        <button onClick={handleSair} style={{
          width: '100%', padding: '10px', background: 'transparent',
          border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px',
          color: MT, fontSize: '13px', cursor: 'pointer',
          fontFamily: 'inherit', display: 'flex',
          alignItems: 'center', justifyContent: 'center', gap: '8px'
        }}>
          Sair
        </button>
      </div>
    </div>
  )
}
