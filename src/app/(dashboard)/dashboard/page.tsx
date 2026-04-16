import { createClient } from '@/lib/supabase/server'

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
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#f5f0ff', letterSpacing: '-0.5px', marginBottom: '4px' }}>
            {saudacao}, {nomeUsuario}!
          </h1>
          <p style={{ fontSize: '14px', color: '#9d8faa', textTransform: 'capitalize' }}>{dataFormatada}</p>
        </div>
        <div style={{
          background: perfil?.plano === 'ativo' ? 'rgba(34,197,94,0.1)' : 'rgba(200,64,224,0.1)',
          border: `1px solid ${perfil?.plano === 'ativo' ? 'rgba(34,197,94,0.3)' : 'rgba(200,64,224,0.3)'}`,
          borderRadius: '100px', padding: '6px 16px',
          fontSize: '13px', fontWeight: '600',
          color: perfil?.plano === 'ativo' ? '#34d399' : '#c840e0'
        }}>
          {perfil?.plano === 'ativo' ? '✓ Plano ativo' : `Trial — ${diasRestantes} dias restantes`}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px', marginBottom: '32px' }}>
        {[
          { titulo: 'Produtos em alta hoje', valor: String(produtosEmAlta.length), sub: 'crescimento acima de 20%', cor: '#c840e0' },
          { titulo: 'Estoque parado evitado', valor: 'R$ 0,00', sub: 'economia acumulada no mês', cor: '#34d399' },
          { titulo: 'Lucro médio estimado', valor: 'R$ 0,00', sub: 'nos seus cálculos salvos', cor: '#fbbf24' },
          { titulo: 'Alertas hoje', valor: '0', sub: 'oportunidades identificadas', cor: '#60a5fa' },
        ].map((card, i) => (
          <div key={i} style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(200,64,224,0.15)',
            borderRadius: '12px', padding: '24px'
          }}>
            <div style={{ fontSize: '12px', color: '#9d8faa', fontWeight: '500', marginBottom: '12px' }}>
              {card.titulo}
            </div>
            <div style={{ fontSize: '28px', fontWeight: '800', color: card.cor, marginBottom: '6px', letterSpacing: '-1px' }}>
              {card.valor}
            </div>
            <div style={{ fontSize: '12px', color: '#9d8faa' }}>{card.sub}</div>
          </div>
        ))}
      </div>

      <div style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(200,64,224,0.15)',
        borderRadius: '12px', overflow: 'hidden'
      }}>
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid rgba(200,64,224,0.1)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#f5f0ff', margin: '0 0 4px' }}>
              Produtos em Tendência
            </h2>
            <p style={{ fontSize: '13px', color: '#9d8faa', margin: 0 }}>
              {produtos?.length || 0} produtos coletados
            </p>
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(200,64,224,0.06)' }}>
              {['Produto', 'Fonte', 'Crescimento', 'Vendas/dia', 'Preço médio', 'Lucro est.', 'Ação'].map(col => (
                <th key={col} style={{
                  padding: '12px 16px', textAlign: 'left',
                  fontSize: '11px', fontWeight: '600', color: '#9d8faa'
                }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {produtos?.map((p: any, i: number) => {
              const pct = p.crescimento_pct || 0
              const badgeBg = pct > 50 ? 'rgba(239,68,68,0.15)' : pct > 25 ? 'rgba(245,158,11,0.15)' : 'rgba(52,211,153,0.15)'
              const badgeColor = pct > 50 ? '#f87171' : pct > 25 ? '#fbbf24' : '#34d399'
              const badgeIcon = pct > 50 ? '🔥' : pct > 25 ? '↑' : '→'
              const lucro = p.preco_medio ? (p.preco_medio * 0.35).toFixed(2) : '0.00'
              return (
                <tr key={i} style={{ borderBottom: '1px solid rgba(200,64,224,0.06)' }}>
                  <td style={{ padding: '14px 16px' }}>
                    {p.url_produto ? (
                      <a href={p.url_produto} target="_blank" rel="noopener noreferrer"
                        style={{ color: '#c840e0', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}>
                        {p.produto_nome} <span style={{ fontSize: '11px', opacity: 0.6 }}>↗</span>
                      </a>
                    ) : (
                      <span style={{ fontSize: '14px', fontWeight: '500', color: '#f5f0ff' }}>{p.produto_nome}</span>
                    )}
                    <div style={{ fontSize: '11px', color: '#9d8faa', marginTop: '2px' }}>{p.fonte}</div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{
                      background: 'rgba(251,191,36,0.15)', color: '#fbbf24',
                      padding: '3px 8px', borderRadius: '100px', fontSize: '11px', fontWeight: '600'
                    }}>{p.fonte || 'ML'}</span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{
                      background: badgeBg, color: badgeColor,
                      padding: '4px 10px', borderRadius: '100px', fontSize: '12px', fontWeight: '700'
                    }}>{badgeIcon} +{pct}%</span>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: '14px', color: '#f5f0ff' }}>{p.vendas_hoje || 0}</td>
                  <td style={{ padding: '14px 16px', fontSize: '14px', color: '#f5f0ff' }}>R$ {p.preco_medio?.toFixed(2) || '0,00'}</td>
                  <td style={{ padding: '14px 16px', fontSize: '14px', color: '#34d399', fontWeight: '600' }}>R$ {lucro}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <a href="/estoque" style={{
                      background: 'rgba(200,64,224,0.15)', color: '#c840e0',
                      border: '1px solid rgba(200,64,224,0.3)', borderRadius: '6px',
                      padding: '6px 12px', fontSize: '12px', fontWeight: '600', textDecoration: 'none'
                    }}>+ Estoque</a>
                  </td>
                </tr>
              )
            })}
            {(!produtos || produtos.length === 0) && (
              <tr>
                <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#9d8faa', fontSize: '14px' }}>
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
