import { createClient } from '@/lib/supabase/server'

const TX = '#f0ebff'
const MT = '#8b7fa0'
const AC = '#c840e0'
const GR = '#34d399'
const BD = 'rgba(200,64,224,0.18)'
const CARD_BG = 'rgba(255,255,255,0.04)'

function badgeFonte(fonte: string) {
  if (fonte === 'Mercado Livre') return { bg: 'rgba(251,191,36,0.15)', color: '#fbbf24' }
  if (fonte === 'Shopee') return { bg: 'rgba(249,115,22,0.15)', color: '#fb923c' }
  return { bg: 'rgba(96,165,250,0.15)', color: '#60a5fa' }
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: produtos } = await supabase
    .from('produtos_tendencia')
    .select('*')
    .order('crescimento_pct', { ascending: false })
    .limit(10)

  const { data: perfil } = await supabase
    .from('perfis')
    .select('nome, nome_loja, trial_expira_em, plano')
    .eq('id', user?.id)
    .single()

  const agora = new Date()
  const hora = agora.getHours()
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'
  const nomeUsuario = perfil?.nome || user?.email?.split('@')[0] || 'lojista'

  const dataFormatada = agora.toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })

  const diasRestantes = perfil?.trial_expira_em
    ? Math.max(0, Math.ceil(
        (new Date(perfil.trial_expira_em).getTime() - agora.getTime()) / (1000 * 60 * 60 * 24)
      ))
    : 7

  const produtosEmAlta = produtos?.filter(p => p.crescimento_pct > 20) || []

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: TX, letterSpacing: '-0.5px', marginBottom: '4px' }}>
            {saudacao}, {nomeUsuario}!
          </h1>
          <p style={{ fontSize: '14px', color: MT, textTransform: 'capitalize' }}>{dataFormatada}</p>
        </div>
        <div style={{
          background: perfil?.plano === 'ativo' ? 'rgba(34,197,94,0.1)' : 'rgba(147,51,234,0.1)',
          border: `1px solid ${perfil?.plano === 'ativo' ? 'rgba(34,197,94,0.3)' : 'rgba(147,51,234,0.3)'}`,
          borderRadius: '100px', padding: '6px 16px',
          fontSize: '13px', fontWeight: '600',
          color: perfil?.plano === 'ativo' ? GR : '#9333ea'
        }}>
          {perfil?.plano === 'ativo' ? '✓ Plano ativo' : `Trial — ${diasRestantes} dias restantes`}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px', marginBottom: '32px' }}>
        {[
          { titulo: 'Produtos em alta hoje', valor: String(produtosEmAlta.length), sub: 'crescimento acima de 20%', cor: AC },
          { titulo: 'Estoque parado evitado', valor: 'R$ 0,00', sub: 'economia acumulada no mês', cor: GR },
          { titulo: 'Lucro médio estimado', valor: 'R$ 0,00', sub: 'nos seus cálculos salvos', cor: '#fbbf24' },
          { titulo: 'Alertas hoje', valor: '0', sub: 'oportunidades identificadas', cor: '#60a5fa' },
        ].map((card, i) => (
          <div key={i} style={{
            background: CARD_BG,
            border: `1px solid ${BD}`,
            borderRadius: '12px', padding: '24px'
          }}>
            <div style={{ fontSize: '12px', color: MT, fontWeight: '500', marginBottom: '12px' }}>
              {card.titulo}
            </div>
            <div style={{ fontSize: '28px', fontWeight: '800', color: card.cor, marginBottom: '6px', letterSpacing: '-1px' }}>
              {card.valor}
            </div>
            <div style={{ fontSize: '12px', color: MT }}>{card.sub}</div>
          </div>
        ))}
      </div>

      <div style={{
        background: 'rgba(255,255,255,0.02)',
        border: `1px solid ${BD}`,
        borderRadius: '12px', overflow: 'hidden'
      }}>
        <div style={{
          padding: '20px 24px',
          borderBottom: `1px solid ${BD}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: TX, margin: '0 0 4px' }}>
              Produtos em Tendência
            </h2>
            <p style={{ fontSize: '13px', color: MT, margin: 0 }}>
              {produtos?.length || 0} produtos coletados
            </p>
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(147,51,234,0.06)' }}>
              {['Produto', 'Fonte', 'Crescimento', 'Vendas/dia', 'Preço médio', 'Lucro est.', 'Ação'].map(col => (
                <th key={col} style={{
                  padding: '12px 16px', textAlign: 'left',
                  fontSize: '11px', fontWeight: '600', color: MT
                }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {produtos?.map((p: any, i: number) => {
              const pct = p.crescimento_pct || 0
              const badgeBg = pct > 50 ? 'rgba(239,68,68,0.15)' : pct > 25 ? 'rgba(245,158,11,0.15)' : 'rgba(52,211,153,0.15)'
              const badgeColor = pct > 50 ? '#f87171' : pct > 25 ? '#fbbf24' : GR
              const badgeIcon = pct > 50 ? '🔥' : pct > 25 ? '↑' : '→'
              const lucro = p.preco_medio ? (p.preco_medio * 0.35).toFixed(2) : '0.00'
              const fonte = badgeFonte(p.fonte || p.marketplace || 'Google Trends')
              return (
                <tr key={i} style={{ borderBottom: `1px solid rgba(200,64,224,0.06)` }}>
                  <td style={{ padding: '14px 16px' }}>
                    {p.url_produto ? (
                      <a href={p.url_produto} target="_blank" rel="noopener noreferrer"
                        style={{ color: AC, textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}>
                        {p.produto_nome} <span style={{ fontSize: '11px', opacity: 0.6 }}>↗</span>
                      </a>
                    ) : (
                      <span style={{ fontSize: '14px', fontWeight: '500', color: TX }}>{p.produto_nome}</span>
                    )}
                    <div style={{ fontSize: '11px', color: MT, marginTop: '2px' }}>{p.categoria}</div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{
                      background: fonte.bg, color: fonte.color,
                      padding: '3px 8px', borderRadius: '100px', fontSize: '11px', fontWeight: '600'
                    }}>{p.fonte || p.marketplace || 'ML'}</span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{
                      background: badgeBg, color: badgeColor,
                      padding: '4px 10px', borderRadius: '100px', fontSize: '12px', fontWeight: '700'
                    }}>{badgeIcon} +{pct}%</span>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: '14px', color: TX }}>{p.vendas_hoje || 0}</td>
                  <td style={{ padding: '14px 16px', fontSize: '14px', color: TX }}>R$ {p.preco_medio?.toFixed(2) || '0,00'}</td>
                  <td style={{ padding: '14px 16px', fontSize: '14px', color: GR, fontWeight: '600' }}>R$ {lucro}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <a href="/estoque" style={{
                      background: 'rgba(147,51,234,0.15)', color: '#9333ea',
                      border: '1px solid rgba(147,51,234,0.3)', borderRadius: '6px',
                      padding: '6px 12px', fontSize: '12px', fontWeight: '600', textDecoration: 'none'
                    }}>+ Estoque</a>
                  </td>
                </tr>
              )
            })}
            {(!produtos || produtos.length === 0) && (
              <tr>
                <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: MT, fontSize: '14px' }}>
                  Nenhum produto ainda. Vá em Tendências e clique em &quot;Atualizar dados&quot;.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
