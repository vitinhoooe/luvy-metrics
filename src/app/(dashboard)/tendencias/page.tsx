'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import type { ProdutoTendencia } from '@/types'

const FONTES = ['Todos', 'Mercado Livre', 'Shopee', 'Google Trends']
const CATEGORIAS = ['Todos', 'Vibradores', 'Géis e Lubrificantes', 'Plugs Anais', 'Roupas Íntimas', 'Acessórios', 'Preservativos', 'Fetiches', 'Kits']

const TX = '#111827'
const MT = '#6b7280'
const AC = '#7c3aed'
const GR = '#059669'
const BD = '#e5e7eb'
const CARD: React.CSSProperties = { background: '#fff', border: `1px solid ${BD}`, borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }
const INP: React.CSSProperties = { background: '#fff', border: '1.5px solid #d1d5db', borderRadius: 8, padding: '10px 14px', color: TX, fontSize: 14, outline: 'none', fontFamily: 'inherit' }

const PER_PAGE = 20

export default function TendenciasPage() {
  const [produtos, setProdutos] = useState<ProdutoTendencia[]>([])
  const [carregando, setCarregando] = useState(true)
  const [atualizando, setAtualizando] = useState(false)
  const [busca, setBusca] = useState('')
  const [fonte, setFonte] = useState('Todos')
  const [categoria, setCategoria] = useState('Todos')
  const [pagina, setPagina] = useState(1)

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
      const res = await fetch('/api/cron/coletar')
      if (res.ok) { const d = await res.json(); toast.success(`${d.coletados} produtos coletados!`); buscarProdutos() }
      else toast.error('Erro ao atualizar')
    } catch { toast.error('Erro ao atualizar') }
    setAtualizando(false)
  }

  async function adicionarAoEstoque(p: ProdutoTendencia) {
    try {
      const res = await fetch('/api/estoque', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ produto_nome: p.produto_nome, quantidade: 0, quantidade_minima: 5, preco_custo: p.preco_medio * 0.5, preco_venda: p.preco_medio, categoria: p.categoria }) })
      if (res.ok) toast.success('Adicionado ao estoque!')
      else toast.error('Erro')
    } catch { toast.error('Erro') }
  }

  const filtrados = produtos.filter(p => {
    const mBusca = p.produto_nome.toLowerCase().includes(busca.toLowerCase())
    const mFonte = fonte === 'Todos' || p.fonte === fonte
    const mCat = categoria === 'Todos' || p.categoria === categoria
    return mBusca && mFonte && mCat
  })

  const totalPaginas = Math.ceil(filtrados.length / PER_PAGE)
  const paginados = filtrados.slice((pagina - 1) * PER_PAGE, pagina * PER_PAGE)
  const explosao = filtrados[0]

  // Reset page on filter change
  useEffect(() => { setPagina(1) }, [busca, fonte, categoria])

  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: TX, marginBottom: 4 }}>Radar de Tendências</h1>
        <p style={{ fontSize: 14, color: MT }}>Produtos em alta no mercado adulto — {filtrados.length} produtos</p>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
        <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar produto..." style={{ ...INP, minWidth: 200 }} />
        <select value={fonte} onChange={e => setFonte(e.target.value)} style={INP}>
          {FONTES.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <select value={categoria} onChange={e => setCategoria(e.target.value)} style={INP}>
          {CATEGORIAS.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <button onClick={atualizarDados} disabled={atualizando} style={{
          padding: '10px 16px', borderRadius: 8, fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer',
          background: '#f5f3ff', color: AC, marginLeft: 'auto', opacity: atualizando ? 0.5 : 1,
        }}>{atualizando ? 'Atualizando...' : '↻ Atualizar dados'}</button>
      </div>

      {carregando ? (
        <div style={{ padding: 80, textAlign: 'center', color: MT }}>Carregando...</div>
      ) : filtrados.length === 0 ? (
        <div style={{ padding: 80, textAlign: 'center' }}>
          <p style={{ fontSize: 32, marginBottom: 12 }}>🔍</p>
          <p style={{ color: MT }}>{fonte !== 'Todos' ? `Ainda coletando dados de ${fonte}. Clique em "Atualizar dados".` : 'Nenhum produto com esses filtros.'}</p>
        </div>
      ) : (
        <>
          {/* Explosão do dia */}
          {explosao && pagina === 1 && (
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
                    <span style={{ fontSize: 14, color: MT }}>R$ {explosao.preco_medio.toFixed(2)} médio</span>
                  </div>
                </div>
                <button onClick={() => adicionarAoEstoque(explosao)} style={{ padding: '8px 16px', borderRadius: 8, background: AC, color: '#fff', fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer' }}>+ Estoque</button>
              </div>
            </div>
          )}

          {/* Tabela */}
          <div style={{ ...CARD, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  {['Produto', 'Categoria', 'Crescimento', 'Vendas/dia', 'Preço', 'Ação'].map(c => (
                    <th key={c} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: MT, borderBottom: `1px solid ${BD}` }}>{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginados.map((p, i) => {
                  const pct = p.crescimento_pct || 0
                  return (
                    <tr key={i} style={{ borderBottom: `1px solid ${BD}` }}>
                      <td style={{ padding: '12px 16px' }}>
                        {p.url_produto ? (
                          <a href={p.url_produto} target="_blank" rel="noopener noreferrer"
                            style={{ color: AC, textDecoration: 'none', fontWeight: 600, fontSize: 14 }}
                            onMouseEnter={e => (e.target as HTMLElement).style.textDecoration = 'underline'}
                            onMouseLeave={e => (e.target as HTMLElement).style.textDecoration = 'none'}>
                            {p.produto_nome} ↗
                          </a>
                        ) : <span style={{ fontWeight: 600, fontSize: 14, color: TX }}>{p.produto_nome}</span>}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: MT }}>{p.categoria || '—'}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ background: pct > 50 ? '#fef2f2' : pct > 25 ? '#fffbeb' : '#ecfdf5', color: pct > 50 ? '#dc2626' : pct > 25 ? '#d97706' : GR, padding: '4px 10px', borderRadius: 100, fontSize: 12, fontWeight: 700 }}>+{pct.toFixed(0)}%</span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 14, color: TX }}>{p.vendas_hoje}</td>
                      <td style={{ padding: '12px 16px', fontSize: 14, color: TX }}>R$ {p.preco_medio.toFixed(2)}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <button onClick={() => adicionarAoEstoque(p)} style={{ background: '#f5f3ff', color: AC, border: '1px solid #ddd6fe', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>+ Estoque</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {/* Paginação */}
            {totalPaginas > 1 && (
              <div style={{ padding: '16px 24px', borderTop: `1px solid ${BD}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: MT }}>Página {pagina} de {totalPaginas} ({filtrados.length} produtos)</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setPagina(p => Math.max(1, p - 1))} disabled={pagina === 1}
                    style={{ padding: '6px 14px', borderRadius: 8, fontSize: 13, border: `1px solid ${BD}`, color: pagina === 1 ? '#d1d5db' : TX, background: '#fff', cursor: 'pointer' }}>← Anterior</button>
                  <button onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))} disabled={pagina === totalPaginas}
                    style={{ padding: '6px 14px', borderRadius: 8, fontSize: 13, border: `1px solid ${BD}`, color: pagina === totalPaginas ? '#d1d5db' : TX, background: '#fff', cursor: 'pointer' }}>Próxima →</button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </>
  )
}
