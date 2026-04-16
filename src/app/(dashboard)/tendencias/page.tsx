'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import type { ProdutoTendencia } from '@/types'

const FONTES = ['Todos', 'Mercado Livre', 'Shopee', 'Google Trends']
const CATEGORIAS = ['Todos', 'Vibradores', 'Géis', 'Plugs', 'Roupas Íntimas', 'Acessórios', 'Outros']

const TX = '#111827'
const MT = '#6b7280'
const AC = '#7c3aed'
const GR = '#059669'
const BD = '#e5e7eb'
const CARD: React.CSSProperties = { background: '#fff', border: `1px solid ${BD}`, borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }
const INP: React.CSSProperties = { background: '#fff', border: '1.5px solid #d1d5db', borderRadius: 8, padding: '10px 14px', color: TX, fontSize: 14, outline: 'none', fontFamily: 'inherit' }

const SAZONALIDADE = [
  { evento: 'Carnaval', data: '2027-02-14', emoji: '🎭', produtos: ['Fantasias sensuais', 'Acessórios de festa', 'Gel corporal'] },
  { evento: 'Dia dos Namorados', data: '2026-06-12', emoji: '💑', produtos: ['Vibradores premium', 'Kits para casais', 'Lubrificantes especiais'] },
  { evento: 'Halloween', data: '2026-10-31', emoji: '🎃', produtos: ['Fantasias adultas', 'Acessórios temáticos', 'Kits surpresa'] },
  { evento: 'Natal / Réveillon', data: '2026-12-25', emoji: '🎁', produtos: ['Kits presentes íntimos', 'Embalagens especiais', 'Combos casal'] },
]

function diasFaltam(d: string) { return Math.max(0, Math.ceil((new Date(d).getTime() - Date.now()) / 86400000)) }
function fmt(v: number) { return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }

function badgeFonte(f: string) {
  if (f === 'Mercado Livre') return { bg: '#fef3c7', color: '#d97706' }
  if (f === 'Shopee') return { bg: '#ffedd5', color: '#ea580c' }
  return { bg: '#dbeafe', color: '#2563eb' }
}

export default function TendenciasPage() {
  const [produtos, setProdutos] = useState<ProdutoTendencia[]>([])
  const [carregando, setCarregando] = useState(true)
  const [atualizando, setAtualizando] = useState(false)
  const [busca, setBusca] = useState('')
  const [fonte, setFonte] = useState('Todos')
  const [categoria, setCategoria] = useState('Todos')
  const [aba, setAba] = useState<'tendencias' | 'comparador' | 'sazonalidade'>('tendencias')
  const [buscaComp, setBuscaComp] = useState('')

  const buscarProdutos = useCallback(async () => {
    setCarregando(true)
    try {
      const supabase = createClient()
      const { data } = await supabase.from('produtos_tendencia').select('*').order('crescimento_pct', { ascending: false })
      setProdutos(data ?? [])
    } catch {}
    setCarregando(false)
  }, [])

  useEffect(() => { buscarProdutos() }, [buscarProdutos])

  async function atualizarDados() {
    setAtualizando(true)
    try {
      const res = await fetch('/api/cron/coletar', { headers: { Authorization: `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET ?? ''}` } })
      if (res.ok) { const d = await res.json(); toast.success(`${d.coletados} produtos coletados!`); buscarProdutos() }
      else toast.error('Erro ao atualizar')
    } catch { toast.error('Erro ao atualizar') }
    setAtualizando(false)
  }

  async function adicionarAoEstoque(p: ProdutoTendencia) {
    try {
      const res = await fetch('/api/estoque', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ produto_nome: p.produto_nome, quantidade: 0, quantidade_minima: 5, preco_custo: p.preco_medio * 0.5, preco_venda: p.preco_medio, categoria: p.categoria }) })
      if (res.ok) toast.success('Adicionado ao estoque!'); else toast.error('Erro')
    } catch { toast.error('Erro') }
  }

  const filtrados = produtos.filter(p => {
    const mBusca = p.produto_nome.toLowerCase().includes(busca.toLowerCase())
    const mFonte = fonte === 'Todos' || p.fonte === fonte
    const mCat = categoria === 'Todos' || p.categoria === categoria
    return mBusca && mFonte && mCat
  })

  // Comparador: agrupa produtos similares por nome de diferentes fontes
  const comparados = (() => {
    if (!buscaComp.trim()) return []
    const termo = buscaComp.toLowerCase()
    const matches = produtos.filter(p => p.produto_nome.toLowerCase().includes(termo))
    // Group by normalized name
    const groups: Record<string, { ml?: ProdutoTendencia; shopee?: ProdutoTendencia; outros?: ProdutoTendencia }> = {}
    for (const p of matches) {
      const key = p.produto_nome.toLowerCase().slice(0, 30)
      if (!groups[key]) groups[key] = {}
      if (p.fonte === 'Mercado Livre') groups[key].ml = p
      else if (p.fonte === 'Shopee') groups[key].shopee = p
      else groups[key].outros = p
    }
    return Object.entries(groups).map(([, g]) => g)
  })()

  const explosao = filtrados[0]

  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: TX, marginBottom: 4 }}>Radar de Tendências</h1>
        <p style={{ fontSize: 14, color: MT }}>Produtos em alta no mercado adulto em tempo real</p>
      </div>

      {/* Abas */}
      <div style={{ display: 'flex', gap: 4, padding: 4, background: '#f3f4f6', borderRadius: 12, width: 'fit-content', marginBottom: 24 }}>
        {([['tendencias', '🔥 Tendências'], ['comparador', '📊 Comparador'], ['sazonalidade', '📅 Sazonalidade']] as const).map(([key, label]) => (
          <button key={key} onClick={() => setAba(key)}
            style={{
              padding: '8px 16px', borderRadius: 8, fontSize: 14, fontWeight: 500, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              background: aba === key ? AC : 'transparent',
              color: aba === key ? '#fff' : MT,
            }}>{label}</button>
        ))}
      </div>

      {aba === 'tendencias' ? (
        <>
          {/* Filtros */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
            <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar produto..." style={{ ...INP, minWidth: 200 }} />
            {[{ val: fonte, set: setFonte, opts: FONTES }, { val: categoria, set: setCategoria, opts: CATEGORIAS }].map(({ val, set, opts }, i) => (
              <select key={i} value={val} onChange={e => set(e.target.value)} style={INP}>
                {opts.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            ))}
            <button onClick={atualizarDados} disabled={atualizando} style={{
              padding: '10px 16px', borderRadius: 8, fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer',
              background: '#f5f3ff', color: AC, marginLeft: 'auto', opacity: atualizando ? 0.5 : 1,
            }}>{atualizando ? 'Atualizando...' : '↻ Atualizar dados'}</button>
          </div>

          {carregando ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={{ ...CARD, padding: 24, height: 180 }}><div style={{ height: 16, background: '#f3f4f6', borderRadius: 4, width: '70%', marginBottom: 8 }} /><div style={{ height: 12, background: '#f3f4f6', borderRadius: 4, width: '40%' }} /></div>
              ))}
            </div>
          ) : filtrados.length === 0 ? (
            <div style={{ padding: 80, textAlign: 'center' }}>
              <p style={{ fontSize: 32, marginBottom: 12 }}>🔍</p>
              <p style={{ color: MT }}>
                {fonte !== 'Todos' ? `Ainda coletando dados de ${fonte}. Clique em "Atualizar dados" para buscar agora.` : 'Nenhum produto com esses filtros.'}
              </p>
            </div>
          ) : (
            <>
              {explosao && (
                <div style={{ ...CARD, background: '#f5f3ff', borderColor: '#ddd6fe', padding: 24, marginBottom: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <span style={{ fontSize: 18 }}>🔥</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: AC, textTransform: 'uppercase', letterSpacing: 1 }}>Explosão do dia</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                    <div>
                      <h2 style={{ fontSize: 20, fontWeight: 700, color: TX, marginBottom: 4 }}>{explosao.produto_nome}</h2>
                      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={{ fontSize: 28, fontWeight: 800, color: AC }}>+{explosao.crescimento_pct.toFixed(0)}%</span>
                        <span style={{ fontSize: 14, color: MT }}>{explosao.vendas_hoje} vendas/dia</span>
                        <span style={{ fontSize: 14, color: MT }}>{fmt(explosao.preco_medio)} médio</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {explosao.url_produto && <a href={explosao.url_produto} target="_blank" rel="noopener noreferrer" style={{ padding: '8px 16px', borderRadius: 8, border: `1px solid ${BD}`, color: TX, fontSize: 14, textDecoration: 'none' }}>Ver ↗</a>}
                      <button onClick={() => adicionarAoEstoque(explosao)} style={{ padding: '8px 16px', borderRadius: 8, background: AC, color: '#fff', fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer' }}>+ Estoque</button>
                    </div>
                  </div>
                </div>
              )}

              {/* Tabela de produtos */}
              <div style={{ ...CARD, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f9fafb' }}>
                      {['Produto', 'Fonte', 'Crescimento', 'Vendas/dia', 'Preço', 'Ação'].map(c => (
                        <th key={c} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: MT, borderBottom: `1px solid ${BD}` }}>{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtrados.map((p, i) => {
                      const pct = p.crescimento_pct || 0
                      const f = badgeFonte(p.fonte)
                      return (
                        <tr key={i} style={{ borderBottom: `1px solid ${BD}` }}>
                          <td style={{ padding: '12px 16px' }}>
                            {p.url_produto ? (
                              <a href={p.url_produto} target="_blank" rel="noopener noreferrer" style={{ color: AC, textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>{p.produto_nome} ↗</a>
                            ) : <span style={{ fontSize: 14, fontWeight: 500, color: TX }}>{p.produto_nome}</span>}
                            {p.categoria && <div style={{ fontSize: 11, color: MT, marginTop: 2 }}>{p.categoria}</div>}
                          </td>
                          <td style={{ padding: '12px 16px' }}><span style={{ background: f.bg, color: f.color, padding: '3px 8px', borderRadius: 100, fontSize: 11, fontWeight: 600 }}>{p.fonte}</span></td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{ background: pct > 50 ? '#fef2f2' : pct > 25 ? '#fffbeb' : '#ecfdf5', color: pct > 50 ? '#dc2626' : pct > 25 ? '#d97706' : GR, padding: '4px 10px', borderRadius: 100, fontSize: 12, fontWeight: 700 }}>+{pct.toFixed(0)}%</span>
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: 14, color: TX }}>{p.vendas_hoje}</td>
                          <td style={{ padding: '12px 16px', fontSize: 14, color: TX }}>{fmt(p.preco_medio)}</td>
                          <td style={{ padding: '12px 16px' }}>
                            <button onClick={() => adicionarAoEstoque(p)} style={{ background: '#f5f3ff', color: AC, border: '1px solid #ddd6fe', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>+ Estoque</button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>

      ) : aba === 'comparador' ? (
        <>
          <div style={{ marginBottom: 24 }}>
            <input value={buscaComp} onChange={e => setBuscaComp(e.target.value)} placeholder="Digite um produto para comparar preços..." style={{ ...INP, width: '100%', maxWidth: 500 }} />
          </div>

          {!buscaComp.trim() ? (
            <div style={{ padding: 80, textAlign: 'center' }}>
              <p style={{ fontSize: 40, marginBottom: 12 }}>📊</p>
              <p style={{ color: MT, fontSize: 15 }}>Digite o nome de um produto para comparar preços entre marketplaces.</p>
            </div>
          ) : comparados.length === 0 ? (
            <div style={{ padding: 60, textAlign: 'center' }}>
              <p style={{ fontSize: 32, marginBottom: 12 }}>🔍</p>
              <p style={{ color: MT }}>Nenhum produto encontrado para &quot;{buscaComp}&quot;.</p>
            </div>
          ) : (
            <div style={{ ...CARD, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f9fafb' }}>
                    {['Produto', 'Mercado Livre', 'Shopee', 'Diferença', 'Mais vendas', 'Margem est.'].map(c => (
                      <th key={c} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: MT, borderBottom: `1px solid ${BD}` }}>{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comparados.map((g, i) => {
                    const nome = g.ml?.produto_nome || g.shopee?.produto_nome || g.outros?.produto_nome || ''
                    const mlPreco = g.ml?.preco_medio || 0
                    const shPreco = g.shopee?.preco_medio || 0
                    const diff = mlPreco && shPreco ? (((shPreco - mlPreco) / mlPreco) * 100).toFixed(0) : null
                    const menorML = mlPreco && shPreco ? mlPreco <= shPreco : false
                    const maisVendas = (g.ml?.vendas_hoje || 0) >= (g.shopee?.vendas_hoje || 0) ? 'ML' : 'Shopee'
                    const custoEst = Math.min(mlPreco || 999, shPreco || 999) * 0.4
                    const vendaEst = Math.max(mlPreco || 0, shPreco || 0)
                    const margem = vendaEst > 0 ? (((vendaEst - custoEst) / vendaEst) * 100).toFixed(0) : '—'
                    return (
                      <tr key={i} style={{ borderBottom: `1px solid ${BD}` }}>
                        <td style={{ padding: '12px 16px', fontWeight: 500, color: TX, fontSize: 14 }}>{nome.slice(0, 50)}</td>
                        <td style={{ padding: '12px 16px', fontSize: 14, color: menorML ? GR : TX, fontWeight: menorML ? 600 : 400 }}>{mlPreco ? fmt(mlPreco) : '—'}</td>
                        <td style={{ padding: '12px 16px', fontSize: 14, color: !menorML && shPreco ? GR : TX, fontWeight: !menorML && shPreco ? 600 : 400 }}>
                          {shPreco ? fmt(shPreco) : <span style={{ color: MT, fontSize: 12 }}>Em coleta</span>}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: diff && Number(diff) < 0 ? GR : '#dc2626' }}>{diff ? `${diff}%` : '—'}</td>
                        <td style={{ padding: '12px 16px' }}><span style={{ background: maisVendas === 'ML' ? '#fef3c7' : '#ffedd5', color: maisVendas === 'ML' ? '#d97706' : '#ea580c', padding: '3px 8px', borderRadius: 100, fontSize: 11, fontWeight: 600 }}>{maisVendas}</span></td>
                        <td style={{ padding: '12px 16px', fontSize: 14, color: GR, fontWeight: 600 }}>{margem}%</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {!produtos.some(p => p.fonte === 'Shopee') && (
                <div style={{ padding: '16px 24px', background: '#fffbeb', borderTop: `1px solid ${BD}`, fontSize: 13, color: '#d97706' }}>
                  Dados da Shopee em coleta — disponível em breve. Clique em &quot;Atualizar dados&quot; na aba Tendências.
                </div>
              )}
            </div>
          )}
        </>

      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ fontSize: 14, color: MT, marginBottom: 8 }}>Planeje seu estoque com antecedência para os grandes eventos.</p>
          {SAZONALIDADE.map(s => {
            const dias = diasFaltam(s.data)
            return (
              <div key={s.evento} style={{ ...CARD, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <span style={{ fontSize: 40 }}>{s.emoji}</span>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 700, color: TX, marginBottom: 4 }}>{s.evento}</h3>
                    <p style={{ fontSize: 13, color: MT }}>{new Date(s.data).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                      {s.produtos.map(p => <span key={p} style={{ background: '#f5f3ff', color: AC, padding: '3px 10px', borderRadius: 100, fontSize: 12 }}>{p}</span>)}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 28, fontWeight: 800, color: TX }}>{dias}</p>
                  <p style={{ fontSize: 12, color: MT }}>{dias === 1 ? 'dia' : 'dias'}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
