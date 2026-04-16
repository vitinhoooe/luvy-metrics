import { createClient } from '@/lib/supabase/server'

const TX = '#111827'
const MT = '#6b7280'
const AC = '#7c3aed'
const GR = '#059669'
const BD = '#e5e7eb'

function badgeFonte(fonte: string) {
  if (fonte === 'Mercado Livre') return { bg: '#fef3c7', color: '#d97706' }
  if (fonte === 'Shopee') return { bg: '#ffedd5', color: '#ea580c' }
  return { bg: '#dbeafe', color: '#2563eb' }
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [produtosRes, perfilRes, estoqueRes] = await Promise.all([
    supabase.from('produtos_tendencia').select('*').order('crescimento_pct', { ascending: false }).limit(10),
    supabase.from('perfis').select('nome, nome_loja, trial_expira_em, plano').eq('id', user?.id).single(),
    supabase.from('estoque_usuario').select('id', { count: 'exact', head: true }).eq('user_id', user?.id ?? '').eq('ativo', true),
  ])

  const produtos = produtosRes.data
  const perfil = perfilRes.data
  const totalEstoque = estoqueRes.count ?? 0
  const agora = new Date()
  const hora = agora.getHours()
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'
  const nomeUsuario = perfil?.nome || user?.email?.split('@')[0] || 'lojista'
  const dataFormatada = agora.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
  const diasRestantes = perfil?.trial_expira_em ? Math.max(0, Math.ceil((new Date(perfil.trial_expira_em).getTime() - agora.getTime()) / 86400000)) : 7
  const produtosEmAlta = produtos?.filter(p => p.crescimento_pct > 20) || []

  const CARD = { background: '#fff', border: `1px solid ${BD}`, borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: TX, marginBottom: 4 }}>{saudacao}, {nomeUsuario}!</h1>
          <p style={{ fontSize: 14, color: MT, textTransform: 'capitalize' }}>{dataFormatada}</p>
        </div>
        <div style={{
          background: perfil?.plano === 'ativo' ? '#ecfdf5' : '#f5f3ff',
          border: `1px solid ${perfil?.plano === 'ativo' ? '#a7f3d0' : '#ddd6fe'}`,
          borderRadius: 100, padding: '6px 16px', fontSize: 13, fontWeight: 600,
          color: perfil?.plano === 'ativo' ? GR : AC,
        }}>
          {perfil?.plano === 'ativo' ? '✓ Plano ativo' : `Trial — ${diasRestantes} dias`}
        </div>
      </div>

      {/* 2 cards úteis */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 32 }}>
        <div style={{ ...CARD, padding: 28 }}>
          <div style={{ fontSize: 12, color: MT, fontWeight: 500, marginBottom: 12 }}>Produtos em alta hoje</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: AC, marginBottom: 4 }}>{produtosEmAlta.length}</div>
          <div style={{ fontSize: 12, color: MT }}>crescimento acima de 20%</div>
        </div>
        <div style={{ ...CARD, padding: 28 }}>
          <div style={{ fontSize: 12, color: MT, fontWeight: 500, marginBottom: 12 }}>Produtos no seu estoque</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: GR, marginBottom: 4 }}>{totalEstoque}</div>
          <div style={{ fontSize: 12, color: MT }}>cadastrados e ativos</div>
        </div>
      </div>

      {/* Tabela */}
      <div style={{ ...CARD, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${BD}` }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: TX, margin: '0 0 4px' }}>Produtos em Tendência</h2>
          <p style={{ fontSize: 13, color: MT, margin: 0 }}>{produtos?.length || 0} produtos mais recentes</p>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              {['Produto', 'Fonte', 'Crescimento', 'Vendas/dia', 'Preço médio'].map(col => (
                <th key={col} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: MT, borderBottom: `1px solid ${BD}` }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {produtos?.map((p: any, i: number) => {
              const pct = p.crescimento_pct || 0
              const badgeBg = pct > 50 ? '#fef2f2' : pct > 25 ? '#fffbeb' : '#ecfdf5'
              const badgeColor = pct > 50 ? '#dc2626' : pct > 25 ? '#d97706' : GR
              const fonte = badgeFonte(p.fonte || 'ML')
              return (
                <tr key={i} style={{ borderBottom: `1px solid ${BD}` }}>
                  <td style={{ padding: '14px 16px' }}>
                    {p.url_produto ? (
                      <a href={p.url_produto} target="_blank" rel="noopener noreferrer"
                        style={{ color: AC, textDecoration: 'none', fontWeight: 600, fontSize: 14 }}
                        onMouseEnter={e => (e.target as HTMLElement).style.textDecoration = 'underline'}
                        onMouseLeave={e => (e.target as HTMLElement).style.textDecoration = 'none'}>
                        {p.produto_nome} ↗
                      </a>
                    ) : <span style={{ fontWeight: 600, fontSize: 14, color: TX }}>{p.produto_nome}</span>}
                    {p.categoria && <div style={{ fontSize: 11, color: MT, marginTop: 2 }}>{p.categoria}</div>}
                  </td>
                  <td style={{ padding: '14px 16px' }}><span style={{ background: fonte.bg, color: fonte.color, padding: '3px 8px', borderRadius: 100, fontSize: 11, fontWeight: 600 }}>{p.fonte || 'ML'}</span></td>
                  <td style={{ padding: '14px 16px' }}><span style={{ background: badgeBg, color: badgeColor, padding: '4px 10px', borderRadius: 100, fontSize: 12, fontWeight: 700 }}>+{pct}%</span></td>
                  <td style={{ padding: '14px 16px', fontSize: 14, color: TX }}>{p.vendas_hoje || 0}</td>
                  <td style={{ padding: '14px 16px', fontSize: 14, color: TX }}>R$ {p.preco_medio?.toFixed(2) || '0,00'}</td>
                </tr>
              )
            })}
            {(!produtos || !produtos.length) && (
              <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center', color: MT }}>Nenhum produto. Vá em Tendências e clique em &quot;Atualizar dados&quot;.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
