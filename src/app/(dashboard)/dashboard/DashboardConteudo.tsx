'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import type { ProdutoTendencia } from '@/types'

// ─── Cores ────────────────────────────────────────────────────────
const TX  = '#f5f0ff'
const MT  = '#9d8faa'
const MT2 = '#6d6079'
const AC  = '#c840e0'
const GR  = '#34d399'
const RD  = '#ef4444'
const GL  = '#fbbf24'
const BD  = 'rgba(200,64,224,0.15)'

function card(extra?: React.CSSProperties): React.CSSProperties {
  return { background: 'rgba(255,255,255,0.03)', border: `1px solid ${BD}`, borderRadius: 12, ...extra }
}

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
  return <div className={`animate-pulse rounded-lg ${w} ${h}`} style={{ background: 'rgba(255,255,255,0.06)' }} />
}

// ─── Card de métrica ──────────────────────────────────────────────
function CardMetrica({ label, valor, formato, sub, cor, delay }: {
  label: string; valor: number; formato: 'moeda' | 'int'
  sub: string; cor: string; delay: number
}) {
  const ok  = useFadeIn(delay)
  const cnt = useContador(valor)
  const txt = formato === 'moeda'
    ? cnt.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    : cnt.toLocaleString('pt-BR')

  return (
    <div style={{
      ...card({ padding: '20px 24px' }),
      opacity: ok ? 1 : 0,
      transform: ok ? 'translateY(0)' : 'translateY(12px)',
      transition: 'opacity 380ms ease, transform 380ms ease',
    }}>
      <p style={{ fontSize: 11, color: MT, fontWeight: 500, letterSpacing: '0.5px' }}>{label}</p>
      <p style={{ fontSize: 28, fontWeight: 700, color: cor, margin: '8px 0 4px' }}>{txt}</p>
      <p style={{ fontSize: 12, color: MT }}>{sub}</p>
    </div>
  )
}

// ─── Badge crescimento ────────────────────────────────────────────
function Badge({ pct }: { pct: number }) {
  const [bg, color, label] =
    pct > 50  ? ['rgba(239,68,68,0.15)',   '#f87171', `🔥 +${pct.toFixed(0)}%`] :
    pct >= 25 ? ['rgba(245,158,11,0.15)',  GL,        `↑ +${pct.toFixed(0)}%`]  :
                ['rgba(52,211,153,0.15)',  GR,        `→ +${pct.toFixed(0)}%`]
  return (
    <span style={{ background: bg, color, fontSize: 11, fontWeight: 600,
      padding: '2px 8px', borderRadius: 6, whiteSpace: 'nowrap' }}>
      {label}
    </span>
  )
}

// ─── Badge fonte ──────────────────────────────────────────────────
function BadgeFonte({ fonte }: { fonte: string }) {
  const map: Record<string, [string, string]> = {
    'Mercado Livre': ['rgba(245,158,11,0.12)', '#f59e0b'],
    'Shopee':        ['rgba(249,115,22,0.12)', '#f97316'],
    'Google Trends': ['rgba(59,130,246,0.12)', '#60a5fa'],
  }
  const [bg, color] = map[fonte] ?? ['rgba(255,255,255,0.06)', MT]
  const label = fonte === 'Mercado Livre' ? 'ML' : fonte === 'Google Trends' ? 'Trends' : fonte
  return (
    <span style={{ background: bg, color, fontSize: 11, fontWeight: 500,
      padding: '2px 8px', borderRadius: 6, whiteSpace: 'nowrap' }}>
      {label}
    </span>
  )
}

// ─── Modal adicionar ao estoque ───────────────────────────────────
function ModalEstoque({ p, userId, onClose }: { p: ProdutoTendencia; userId: string; onClose: () => void }) {
  const [qtd,    setQtd]    = useState(10)
  const [min,    setMin]    = useState(5)
  const [custo,  setCusto]  = useState(Number((p.preco_medio * 0.5).toFixed(2)))
  const [venda,  setVenda]  = useState(Number(p.preco_medio.toFixed(2)))
  const [saving, setSaving] = useState(false)

  const inp: React.CSSProperties = {
    background: 'rgba(255,255,255,0.06)', border: `1px solid ${BD}`,
    borderRadius: 8, padding: '9px 12px', color: TX, fontSize: 14, width: '100%', outline: 'none',
  }

  async function salvar() {
    setSaving(true)
    try {
      const res = await fetch('/api/estoque', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          produto_nome: p.produto_nome, quantidade: qtd, quantidade_minima: min,
          preco_custo: custo, preco_venda: venda, categoria: p.categoria,
        }),
      })
      if (res.ok) { toast.success('Adicionado ao estoque!'); onClose() }
      else toast.error('Erro ao adicionar')
    } catch {
      toast.error('Erro interno')
    }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div style={{ ...card({ padding: 24, width: '100%', maxWidth: 400 }) }} className="shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <p style={{ fontWeight: 600, color: TX }}>Adicionar ao estoque</p>
          <button onClick={onClose} style={{ color: MT, fontSize: 18, lineHeight: 1 }}
            className="hover:text-white transition-colors">✕</button>
        </div>
        <p className="text-sm mb-4 px-3 py-2 rounded-lg"
          style={{ color: MT, background: 'rgba(255,255,255,0.04)', border: `1px solid ${BD}` }}>
          {p.produto_nome}
        </p>
        <div className="grid grid-cols-2 gap-3 mb-3">
          {([['Quantidade inicial', qtd, setQtd], ['Qtd. mínima', min, setMin]] as const).map(([l, v, s]) => (
            <div key={l}>
              <label className="block mb-1" style={{ fontSize: 11, color: MT, fontWeight: 500 }}>{l}</label>
              <input type="number" value={v} onChange={(e) => s(Number(e.target.value))} min={0} style={inp} />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 mb-5">
          {([['Custo (R$)', custo, setCusto], ['Venda (R$)', venda, setVenda]] as const).map(([l, v, s]) => (
            <div key={l}>
              <label className="block mb-1" style={{ fontSize: 11, color: MT, fontWeight: 500 }}>{l}</label>
              <input type="number" value={v} onChange={(e) => s(Number(e.target.value))} step={0.01} min={0} style={inp} />
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg text-sm transition-colors"
            style={{ border: `1px solid ${BD}`, color: MT }}>Cancelar</button>
          <button onClick={salvar} disabled={saving}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: AC }}>{saving ? 'Salvando...' : 'Adicionar'}</button>
        </div>
      </div>
    </div>
  )
}

// ─── Props ────────────────────────────────────────────────────────
type Props = {
  saudacao: string; nomeUsuario: string; dataFormatada: string; diasTrial: number
  produtosEmAlta: number; estoqueEvitado: number; lucroMedio: number; alertasHoje: number
  tendencias: ProdutoTendencia[]; userId: string; plano?: string
}

export default function DashboardConteudo({
  saudacao, nomeUsuario, dataFormatada, diasTrial,
  produtosEmAlta, estoqueEvitado, lucroMedio, alertasHoje,
  tendencias, userId, plano,
}: Props) {
  const [modal, setModal] = useState<ProdutoTendencia | null>(null)
  const [pagina, setPagina] = useState(1)
  const POR_PAGINA = 10
  const total = Math.ceil(tendencias.length / POR_PAGINA)
  const rows  = tendencias.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA)

  const planoAtivo = plano === 'ativo'

  const cards = [
    { label: 'Produtos em alta hoje',      valor: produtosEmAlta, formato: 'int'   as const, sub: 'crescimento acima de 20% hoje',   cor: AC,  delay: 0   },
    { label: 'Estoque parado evitado',     valor: estoqueEvitado, formato: 'moeda' as const, sub: 'economia acumulada no mês',        cor: GR,  delay: 80  },
    { label: 'Lucro médio por unidade',    valor: lucroMedio,     formato: 'moeda' as const, sub: 'nos seus cálculos salvos',         cor: GL,  delay: 160 },
    { label: 'Alertas enviados hoje',      valor: alertasHoje,    formato: 'int'   as const, sub: 'oportunidades identificadas',      cor: '#60a5fa', delay: 240 },
  ]

  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-10">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: TX }}>{saudacao}, {nomeUsuario}!</h1>
          <p className="mt-1 capitalize" style={{ fontSize: 13, color: MT }}>{dataFormatada}</p>
        </div>
        {planoAtivo ? (
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium w-fit"
            style={{ background: 'rgba(200,64,224,0.12)', color: AC, border: `1px solid ${BD}` }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: AC }} />
            Plano ativo
          </span>
        ) : (
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium w-fit"
            style={{
              background: diasTrial > 3 ? 'rgba(52,211,153,0.1)' : 'rgba(239,68,68,0.1)',
              color: diasTrial > 3 ? GR : RD,
              border: `1px solid ${diasTrial > 3 ? 'rgba(52,211,153,0.25)' : 'rgba(239,68,68,0.25)'}`,
            }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: diasTrial > 3 ? GR : RD }} />
            Trial — {diasTrial} {diasTrial === 1 ? 'dia restante' : 'dias restantes'}
          </span>
        )}
      </div>

      {/* Cards métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {cards.map((c) => <CardMetrica key={c.label} {...c} />)}
      </div>

      {/* Tabela tendências */}
      <div style={{ ...card({ overflow: 'hidden' }) }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${BD}` }}>
          <div>
            <p style={{ fontWeight: 600, color: TX }}>Produtos em tendência</p>
            <p style={{ fontSize: 12, color: MT, marginTop: 2 }}>{tendencias.length} produtos coletados</p>
          </div>
        </div>

        {tendencias.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-4xl mb-3">📊</p>
            <p style={{ color: MT, fontSize: 14 }}>Nenhum produto em alta no momento</p>
            <p style={{ color: MT2, fontSize: 12, marginTop: 4 }}>Os dados são coletados automaticamente às 6h</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full" style={{ fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${BD}`, background: 'rgba(255,255,255,0.02)' }}>
                    {['Produto', 'Fonte', 'Crescimento', 'Vendas / dia', 'Preço médio', 'Lucro est.', ''].map((col) => (
                      <th key={col} className="text-left px-5 py-3"
                        style={{ fontSize: 11, color: MT, fontWeight: 500, letterSpacing: '0.4px' }}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((p) => (
                    <tr key={p.id} className="transition-colors" style={{ borderTop: `1px solid ${BD}` }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>

                      <td className="px-5 py-3 max-w-[220px]">
                        {p.url_produto ? (
                          <a href={p.url_produto} target="_blank" rel="noopener noreferrer"
                            className="font-medium line-clamp-1 hover:underline"
                            style={{ color: AC, textDecoration: 'none' }}>
                            {p.produto_nome}
                            <span style={{ fontSize: 10, marginLeft: 4, opacity: 0.5 }}>↗</span>
                          </a>
                        ) : (
                          <span className="font-medium line-clamp-1" style={{ color: TX }}>{p.produto_nome}</span>
                        )}
                        <p style={{ fontSize: 11, color: MT2, marginTop: 1 }}>{p.categoria}</p>
                      </td>

                      <td className="px-5 py-3"><BadgeFonte fonte={p.fonte} /></td>
                      <td className="px-5 py-3"><Badge pct={p.crescimento_pct} /></td>

                      <td className="px-5 py-3" style={{ color: MT, fontVariantNumeric: 'tabular-nums' }}>
                        {p.vendas_hoje.toLocaleString('pt-BR')}
                      </td>

                      <td className="px-5 py-3" style={{ color: TX, fontVariantNumeric: 'tabular-nums' }}>
                        {p.preco_medio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </td>

                      <td className="px-5 py-3 font-medium" style={{ color: GR, fontVariantNumeric: 'tabular-nums' }}>
                        {(p.preco_medio * 0.35).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </td>

                      <td className="px-5 py-3">
                        <button onClick={() => setModal(p)}
                          className="px-3 py-1 rounded-lg text-xs font-medium transition-colors"
                          style={{ background: 'rgba(200,64,224,0.12)', color: AC, border: `1px solid ${BD}` }}>
                          + Estoque
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {total > 1 && (
              <div className="flex items-center justify-between px-6 py-3" style={{ borderTop: `1px solid ${BD}` }}>
                <p style={{ fontSize: 12, color: MT }}>
                  {(pagina - 1) * POR_PAGINA + 1}–{Math.min(pagina * POR_PAGINA, tendencias.length)} de {tendencias.length}
                </p>
                <div className="flex gap-1.5">
                  <button onClick={() => setPagina((p) => p - 1)} disabled={pagina === 1}
                    className="px-3 py-1 rounded-lg text-xs transition-colors disabled:opacity-30"
                    style={{ border: `1px solid ${BD}`, color: MT }}>← Anterior</button>
                  <button onClick={() => setPagina((p) => p + 1)} disabled={pagina === total}
                    className="px-3 py-1 rounded-lg text-xs transition-colors disabled:opacity-30"
                    style={{ border: `1px solid ${BD}`, color: MT }}>Próximo →</button>
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
