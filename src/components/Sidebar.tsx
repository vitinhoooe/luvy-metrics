'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const TX  = '#f0ebff'
const MT  = '#8b7fa0'
const AC = '#c840e0'
const BD  = 'rgba(200,64,224,0.18)'

const navItems = [
  { href: '/dashboard', icon: '📊', label: 'Dashboard' },
  { href: '/tendencias', icon: '🔥', label: 'Tendências' },
  { href: '/estoque', icon: '📦', label: 'Estoque' },
  { href: '/calculadora', icon: '💰', label: 'Calculadora' },
  { href: '/regioes', icon: '🗺️', label: 'Regiões' },
  { href: '/bot', icon: '🤖', label: 'Bot IA' },
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
      background: '#0a0812', borderRight: `1px solid ${BD}`,
      display: 'flex', flexDirection: 'column', zIndex: 100,
      fontFamily: "'Plus Jakarta Sans', sans-serif"
    }}>
      {/* Logo */}
      <div style={{ padding: '24px 20px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '34px', height: '34px',
            background: 'linear-gradient(135deg, #c840e0, #9333ea)',
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

      {/* User info */}
      <div style={{ padding: '12px 20px 16px', borderBottom: `1px solid ${BD}` }}>
        <div style={{
          width: '36px', height: '36px', background: 'rgba(200,64,224,0.2)',
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

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px', overflowY: 'auto' }}>
        {navItems.map(item => {
          const isActive = pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link key={item.href} href={item.href} style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 12px', borderRadius: '8px', marginBottom: '2px',
              textDecoration: 'none', fontSize: '14px',
              fontWeight: isActive ? '600' : '400',
              color: isActive ? AC : MT,
              background: isActive ? 'rgba(200,64,224,0.12)' : 'transparent',
              borderLeft: isActive ? '2px solid #c840e0' : '2px solid transparent',
            }}>
              <span style={{ fontSize: '16px' }}>{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: '12px 16px 20px' }}>
        {perfil?.plano !== 'ativo' && (
          <div style={{
            background: 'rgba(200,64,224,0.08)',
            border: `1px solid ${BD}`,
            borderRadius: '10px', padding: '12px',
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
          border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px',
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
