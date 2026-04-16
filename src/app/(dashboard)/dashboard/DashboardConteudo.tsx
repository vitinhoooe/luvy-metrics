'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import type { ProdutoTendencia } from '@/types'

// ─── Contador animado ─────────────────────────────────────────────
function useContador(fim: number, ms = 1000) {
  const [v, setV] = useState(0)
  useEffect(() => {
    if (fim <= 0) { setV(0); return }
    const t0 = Date.now()
    const id = setInterval(() => {
      const p = Math.min((Date.now() - t0) / ms, 1)
      setV(Math.floor((1 - Math.pow(1 - p, 3)) * fim))
      if (p >= 1) clearInterval(id)
    }, 16)
    return () => clearInterval(id)
  }, [fim, ms])
  return v
}

function useFadeIn(delay = 0) {
  const [ok, setOk] = useState(false)
  useEffect(() => { const t = setTimeout(() => setOk(true), delay); return () => clearTimeout(t) }, [delay])
  return ok
}

// ─── Skeleton ─────────────────────────────────────────────────────
function Sk({ w = 'w-full', h = 'h-4' }: { w?: string; h?: string }) {
  return <div className={`animate-pulse rounded-lg bg-white/[0.05] ${w} ${h}`} />
}

// ─── Card de métrica ──────────────────────────────────────────────
function CardMetrica({ label, valor, formato, sub, delay }: {
  label: string; valor: number; formato: 'moeda' | 'int'; sub: string; delay: number
}) {
  const ok  = useFadeIn(delay)
  const cnt = useContador(valor)
  const txt = formato === 'moeda'
    ? cnt.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    : cnt.toLocaleString('pt-BR')

  return (
    <div style={{
      background: 'var(--card)', border: '1px solid var(--border)',
      borderRadius: 12, padding: '20px 24px',
      opacity: ok ? 1 : 0, transform: ok ? 'translateY(0)' : 'translateY(12px)',
      transition: 'opacity 380ms ease, transform 380ms ease',
    }}>
      <p style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 500, letterSpacing: '0.5px' }}>{label}</p>
      <p style={{ fontSize: 28, fontWeight: 700, color: 'var(--text)', margin: '8px 0 4px', tabularNums: true } as React.CSSProperties}>{txt}</p>
      <p style={{ fontSize: 12, color: 'var(--muted)' }}>{sub}</p>
    </div>
  )
}

// ─── Badge crescimento ────────────────────────────────────────────
function Badge({ pct }: { pct: number }) {
  const [bg, color] =
    pct > 50 ? ['var(--red-soft)', 'var(--red)'] :
    pct >= 25 ? ['var(--gold-soft)', 'var(--gold)'] :
                ['var(--green-soft)', 'var(--green)']
  return (
    <span style={{ background: bg, color, fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 6, whiteSpace: 'nowrap' as const }}>
      +{pct.toFixed(0)}%
    </span>
  )
}

// ─── Badge fonte ──────────────────────────────────────────────────
function BadgeFonte({ fonte }: { fonte: string }) {
  const map: Record<string, [string, string]> = {
    'Mercado Livre': ['rgba(245,158,11,0.1)', '#f59e0b'],
    'Shopee':        ['rgba(249,115,22,0.1)', '#f97316'],
    'Google Trends': ['rgba(59,130,246,0.1)', '#60a5fa'],
  }
  const [bg, color] = map[fonte] ?? ['rgba(255,255,255,0.05)', 'var(--muted)']
  const label = fonte === 'Mercado Livre' ? 'ML' : fonte === 'Google Trends' ? 'Trends' : fonte
  return (
    <span style={{ background: bg, color, fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 6, whiteSpace: 'nowrap' as const }}>
      {label}
    </span>
  )
}

// ─── Modal Estoque ────────────────────────────────────────────────
function ModalEstoque({ p, userId, onClose }: { p: ProdutoTendencia; userId: string; onClose: () => void }) {
  const [qtd,    setQtd]    = useState(10)
  const [min,    setMin]    = useState(5)
  const [custo,  setCusto]  = useState(Number((p.preco_medio * 0.5).toFixed(2)))
  const [venda,  setVenda]  = useState(Number(p.preco_medio.toFixed(2)))
  const [saving, setSaving] = useState(false)

  async function salvar() {
    setSaving(true)
    const { error } = await createClient().from('estoque_usuario').insert({
      user_id: userId, produto_nome: p.produto_nome,
      quantidade: qtd, quantidade_minima: min,
      preco_custo: custo, preco_venda: venda, categoria: p.categoria,
    })
    if (error) toast.error('Erro ao adicionar')
    else { toast.success('Adicionado ao estoque!'); onClose() }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16 }} className="w-full max-w-sm p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <p style={{ fontWeight: 600, color: 'var(--text)' }}>Adicionar ao estoque</p>
          <button onClick={onClose} style={{ color: 'var(--muted)' }} className="hover:text-white transition-colors text-lg leading-none">✕</button>
        </div>
        <p className="text-sm mb-4 line-clamp-1" style={{ color: 'var(--muted)', background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '8px 12px' }}>
          {p.produto_nome}
        </p>
        <div className="grid grid-cols-2 gap-3 mb-3">
          {[['Quantidade', qtd, setQtd], ['Qtd. mínima', min, setMin]].map(([l, v, s]) => (
            <div key={l as string}>
              <label className="block mb-1" style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 500 }}>{l as string}</label>
              <input type="number" value={v as number} onChange={(e) => (s as (n: number) => void)(Number(e.target.value))} min={0}
                className="w-full px-3 py-2 rounded-lg text-sm text-white focus:outline-none focus:ring-1"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', focusRingColor: 'var(--accent)' } as React.CSSProperties} />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 mb-5">
          {[['Custo (R$)', custo, setCusto], ['Venda (R$)', venda, setVenda]].map(([l, v, s]) => (
            <div key={l as string}>
              <label className="block mb-1" style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 500 }}>{l as string}</label>
              <input type="number" value={v as number} onChange={(e) => (s as (n: number) => void)(Number(e.target.value))} step={0.01} min={0}
                className="w-full px-3 py-2 rounded-lg text-sm text-white focus:outline-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)' }} />
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg text-sm transition-colors"
            style={{ border: '1px solid var(--border)', color: 'var(--muted)' }}>Cancelar</button>
          <button onClick={salvar} disabled={saving} className="flex-1 py-2 rounded-lg text-sm font-semibold text-white transition-opacity disabled:opacity-50"
            style={{ background: 'var(--accent)' }}>{saving ? 'Salvando...' : 'Adicionar'}</button>
        </div>
      </div>
    </div>
  )
}

// ─── Props ────────────────────────────────────────────────────────
type Props = {
  saudacao: string; nomeUsuario: string; dataFormatada: string; diasTrial: number
  produtosEmAlta: number; estoqueEvitado: number; lucroMedio: number; alertasHoje: number
  tendencias: ProdutoTendencia[]; userId: string
}

export default function DashboardConteudo({
  saudacao, nomeUsuario, dataFormatada, diasTrial,
  produtosEmAlta, estoqueEvitado, lucroMedio, alertasHoje,
  tendencias, userId,
}: Props) {
  const [modal, setModal] = useState<ProdutoTendencia | null>(null)
  const [pagina, setPagina] = useState(1)
  const POR_PAGINA = 10
  const total = Math.ceil(tendencias.length / POR_PAGINA)
  const rows  = tendencias.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA)

  const cards = [
    { label: 'Produtos em alta',       valor: produtosEmAlta,  formato: 'int'   as const, sub: 'crescimento acima de 20% hoje',   delay: 0   },
    { label: 'Estoque parado evitado', valor: estoqueEvitado,  formato: 'moeda' as const, sub: 'economia acumulada no mês',        delay: 80  },
    { label: 'Lucro médio por unidade',valor: lucroMedio,      formato: 'moeda' as const, sub: 'nos seus cálculos salvos',         delay: 160 },
    { label: 'Alertas enviados hoje',  valor: alertasHoje,     formato: 'int'   as const, sub: 'oportunidades identificadas',      delay: 240 },
  ]

  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-10">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{saudacao}, {nomeUsuario}!</h1>
          <p className="mt-1 capitalize" style={{ fontSize: 13, color: 'var(--muted)' }}>{dataFormatada}</p>
        </div>
        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium w-fit"
          style={{
            background: diasTrial > 3 ? 'var(--green-soft)' : 'var(--red-soft)',
            color: diasTrial > 3 ? 'var(--green)' : 'var(--red)',
            border: `1px solid ${diasTrial > 3 ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
          }}>
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: diasTrial > 3 ? 'var(--green)' : 'var(--red)' }} />
          Trial — {diasTrial} {diasTrial === 1 ? 'dia restante' : 'dias restantes'}
        </span>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {cards.map((c) => <CardMetrica key={c.label} {...c} />)}
      </div>

      {/* Tabela */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div>
            <p style={{ fontWeight: 600, color: 'var(--text)' }}>Produtos em tendência</p>
            <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{tendencias.length} produtos coletados</p>
          </div>
        </div>

        {tendencias.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-4xl mb-3">📊</p>
            <p style={{ color: 'var(--muted)', fontSize: 14 }}>Nenhum produto em alta no momento</p>
            <p style={{ color: 'var(--muted2)', fontSize: 12, marginTop: 4 }}>Os dados são coletados automaticamente às 6h</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full" style={{ fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}>
                    {['Produto', 'Fonte', 'Crescimento', 'Vendas / dia', 'Preço médio', 'Lucro est.', ''].map((col) => (
                      <th key={col} className="text-left px-5 py-3"
                        style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 500, letterSpacing: '0.4px' }}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((p) => (
                    <tr key={p.id} className="transition-colors" style={{ borderTop: '1px solid var(--border)' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>

                      {/* Produto */}
                      <td className="px-5 py-3 max-w-[220px]">
                        {p.url_produto ? (
                          <a href={p.url_produto} target="_blank" rel="noopener noreferrer"
                            className="font-medium line-clamp-1 transition-colors hover:underline"
                            style={{ color: 'var(--accent)', textDecoration: 'none' }}>
                            {p.produto_nome}
                            <span style={{ fontSize: 10, marginLeft: 4, opacity: 0.5 }}>↗</span>
                          </a>
                        ) : (
                          <span className="font-medium line-clamp-1" style={{ color: 'var(--text)' }}>{p.produto_nome}</span>
                        )}
                        <p style={{ fontSize: 11, color: 'var(--muted2)', marginTop: 1 }}>{p.categoria}</p>
                      </td>

                      {/* Fonte */}
                      <td className="px-5 py-3"><BadgeFonte fonte={p.fonte} /></td>

                      {/* Crescimento */}
                      <td className="px-5 py-3"><Badge pct={p.crescimento_pct} /></td>

                      {/* Vendas */}
                      <td className="px-5 py-3" style={{ color: 'var(--muted)', fontVariantNumeric: 'tabular-nums' }}>
                        {p.vendas_hoje.toLocaleString('pt-BR')}
                      </td>

                      {/* Preço */}
                      <td className="px-5 py-3" style={{ color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>
                        {p.preco_medio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </td>

                      {/* Lucro est. */}
                      <td className="px-5 py-3 font-medium" style={{ color: 'var(--green)', fontVariantNumeric: 'tabular-nums' }}>
                        {(p.preco_medio * 0.35).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </td>

                      {/* Ação */}
                      <td className="px-5 py-3">
                        <button onClick={() => setModal(p)}
                          className="px-3 py-1 rounded-lg text-xs font-medium transition-colors"
                          style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '1px solid rgba(124,92,252,0.2)' }}>
                          + Estoque
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            {total > 1 && (
              <div className="flex items-center justify-between px-6 py-3" style={{ borderTop: '1px solid var(--border)' }}>
                <p style={{ fontSize: 12, color: 'var(--muted)' }}>
                  {(pagina - 1) * POR_PAGINA + 1}–{Math.min(pagina * POR_PAGINA, tendencias.length)} de {tendencias.length}
                </p>
                <div className="flex gap-1.5">
                  {[['← Ant.', pagina === 1, () => setPagina(p => p - 1)], ['Próx. →', pagina === total, () => setPagina(p => p + 1)]].map(([l, dis, fn]) => (
                    <button key={l as string} onClick={fn as () => void} disabled={dis as boolean}
                      className="px-3 py-1 rounded-lg text-xs transition-colors disabled:opacity-30"
                      style={{ border: '1px solid var(--border)', color: 'var(--muted)' }}>
                      {l as string}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {modal && <ModalEstoque p={modal} userId={userId} onClose={() => setModal(null)} />}
    </>
  )
}
