'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import type { ProdutoTendencia } from '@/types'

// ─── Hooks ────────────────────────────────────────────────────────
function useContador(valorFinal: number, duracao = 1200) {
  const [valor, setValor] = useState(0)
  useEffect(() => {
    if (valorFinal <= 0) { setValor(0); return }
    const inicio = Date.now()
    const timer = setInterval(() => {
      const p = Math.min((Date.now() - inicio) / duracao, 1)
      const ease = 1 - Math.pow(1 - p, 3)
      setValor(Math.floor(ease * valorFinal))
      if (p >= 1) clearInterval(timer)
    }, 16)
    return () => clearInterval(timer)
  }, [valorFinal, duracao])
  return valor
}

function useFadeIn(delay = 0) {
  const [vis, setVis] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setVis(true), delay)
    return () => clearTimeout(t)
  }, [delay])
  return vis
}

// ─── Skeleton ─────────────────────────────────────────────────────
function Sk({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-white/[0.06] rounded-xl ${className}`} />
}

function SkeletonDashboard() {
  return (
    <>
      <div className="flex items-center justify-between mb-10">
        <div className="space-y-2">
          <Sk className="h-7 w-56" />
          <Sk className="h-4 w-36" />
        </div>
        <Sk className="h-8 w-40 rounded-full" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        {[0,1,2,3].map((i) => (
          <div key={i} className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 space-y-3">
            <Sk className="h-6 w-6 rounded-lg" />
            <Sk className="h-3 w-20" />
            <Sk className="h-7 w-14" />
            <Sk className="h-3 w-28" />
          </div>
        ))}
      </div>
      <div className="border border-white/5 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5"><Sk className="h-5 w-44" /></div>
        {[0,1,2,3,4].map((i) => (
          <div key={i} className="px-6 py-4 border-b border-white/5 flex gap-4 items-center">
            <Sk className="h-9 w-9 rounded-xl flex-shrink-0" />
            <Sk className="h-4 flex-1" />
            <Sk className="h-5 w-20 rounded-full" />
            <Sk className="h-4 w-14" />
          </div>
        ))}
      </div>
    </>
  )
}

// ─── Card de métrica ──────────────────────────────────────────────
function CardMetrica({
  emoji, label, valor, formato, subtitulo, delay,
}: {
  emoji: string; label: string; valor: number
  formato: 'moeda' | 'inteiro'; subtitulo: string; delay: number
}) {
  const vis      = useFadeIn(delay)
  const contador = useContador(valor)

  const txt =
    formato === 'moeda'
      ? contador.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      : contador.toLocaleString('pt-BR')

  return (
    <div
      style={{
        opacity: vis ? 1 : 0,
        transform: vis ? 'translateY(0)' : 'translateY(16px)',
        transition: 'opacity 400ms ease, transform 400ms ease',
      }}
      className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5 hover:border-white/15 transition-colors"
    >
      <div className="text-xl mb-3">{emoji}</div>
      <p className="text-[11px] text-zinc-500 font-medium uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-bold text-white tabular-nums">{txt}</p>
      <p className="text-[11px] text-zinc-600 mt-1.5">{subtitulo}</p>
    </div>
  )
}

// ─── Badge crescimento ────────────────────────────────────────────
function BadgeCrescimento({ pct }: { pct: number }) {
  if (pct > 50)
    return <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse">🔥 +{pct.toFixed(0)}%</span>
  if (pct >= 25)
    return <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">↑ +{pct.toFixed(0)}%</span>
  return <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">→ +{pct.toFixed(0)}%</span>
}

// ─── Badge fonte ──────────────────────────────────────────────────
function BadgeFonte({ fonte }: { fonte: string }) {
  const cfg: Record<string, { dot: string; text: string; cls: string }> = {
    'Mercado Livre': { dot: '🟡', text: 'ML',     cls: 'bg-yellow-500/8 text-yellow-500 border-yellow-500/20' },
    'Shopee':        { dot: '🟠', text: 'Shopee', cls: 'bg-orange-500/8 text-orange-400 border-orange-500/20' },
    'Google Trends': { dot: '🔵', text: 'Trends', cls: 'bg-blue-500/8 text-blue-400 border-blue-500/20'   },
  }
  const c = cfg[fonte] ?? { dot: '⚪', text: fonte, cls: 'bg-white/5 text-zinc-400 border-white/10' }
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border ${c.cls}`}>
      {c.dot} {c.text}
    </span>
  )
}

// ─── Modal Estoque ────────────────────────────────────────────────
function ModalEstoque({ produto, userId, onFechar }: { produto: ProdutoTendencia; userId: string; onFechar: () => void }) {
  const [quantidade,  setQuantidade]  = useState(10)
  const [qtdMinima,   setQtdMinima]   = useState(5)
  const [precoCusto,  setPrecoCusto]  = useState(produto.preco_medio * 0.5)
  const [precoVenda,  setPrecoVenda]  = useState(produto.preco_medio)
  const [carregando,  setCarregando]  = useState(false)

  async function salvar() {
    setCarregando(true)
    const supabase = createClient()
    const { error } = await supabase.from('estoque_usuario').insert({
      user_id: userId,
      produto_nome: produto.produto_nome,
      quantidade, quantidade_minima: qtdMinima,
      preco_custo: precoCusto, preco_venda: precoVenda,
      categoria: produto.categoria,
    })
    if (error) toast.error('Erro ao adicionar ao estoque')
    else { toast.success('Produto adicionado!'); onFechar() }
    setCarregando(false)
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0d0a13] border border-white/10 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-white">Adicionar ao estoque</h2>
          <button onClick={onFechar} className="text-zinc-500 hover:text-white transition-colors text-lg">✕</button>
        </div>
        <p className="text-sm text-zinc-400 bg-white/5 rounded-xl px-3 py-2 mb-4 line-clamp-1">📦 {produto.produto_nome}</p>
        <div className="grid grid-cols-2 gap-3 mb-3">
          {[
            { label: 'Quantidade', val: quantidade, set: setQuantidade, step: 1 },
            { label: 'Qtd. mínima', val: qtdMinima, set: setQtdMinima, step: 1 },
          ].map(({ label, val, set, step }) => (
            <div key={label}>
              <label className="block text-xs text-zinc-500 mb-1">{label}</label>
              <input type="number" value={val} onChange={(e) => set(Number(e.target.value))} min={0} step={step}
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#c840e0]/50" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 mb-5">
          {[
            { label: 'Custo (R$)', val: precoCusto, set: setPrecoCusto },
            { label: 'Venda (R$)', val: precoVenda, set: setPrecoVenda },
          ].map(({ label, val, set }) => (
            <div key={label}>
              <label className="block text-xs text-zinc-500 mb-1">{label}</label>
              <input type="number" value={val} onChange={(e) => set(Number(e.target.value))} step={0.01} min={0}
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#c840e0]/50" />
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={onFechar} className="flex-1 py-2.5 rounded-xl border border-white/10 text-zinc-400 text-sm hover:bg-white/5 transition-all">Cancelar</button>
          <button onClick={salvar} disabled={carregando}
            className="flex-1 py-2.5 rounded-xl bg-[#c840e0] text-white text-sm font-semibold hover:bg-[#b030cc] disabled:opacity-50 transition-all">
            {carregando ? 'Salvando...' : 'Adicionar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Botão WhatsApp ───────────────────────────────────────────────
function BotaoWhatsApp({ tendencias }: { tendencias: ProdutoTendencia[] }) {
  const WPP = process.env.NEXT_PUBLIC_WPP_SUPORTE ?? '5521999999999'

  function abrirWhatsApp() {
    const top3 = tendencias.slice(0, 3)
    if (top3.length === 0) { toast.error('Nenhum produto em tendência'); return }

    const lista = top3
      .map((p, i) => `${i + 1}. ${p.produto_nome} — +${p.crescimento_pct.toFixed(0)}% 🔥`)
      .join('\n')

    const msg = encodeURIComponent(
      `📊 *Top tendências hoje no LuvyMetrics:*\n\n${lista}\n\nAcesse: https://luvymetrics.com.br`
    )
    window.open(`https://wa.me/${WPP}?text=${msg}`, '_blank')
  }

  return (
    <button
      onClick={abrirWhatsApp}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-green-600/15 border border-green-600/25 text-green-400 text-sm font-medium hover:bg-green-600/25 transition-all"
    >
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
      Compartilhar tendências
    </button>
  )
}

// ─── Tipos props ──────────────────────────────────────────────────
type Props = {
  saudacao: string; nomeUsuario: string; dataFormatada: string; diasTrial: number
  produtosEmAlta: number; estoqueEvitado: number; lucroMedio: number; alertasHoje: number
  tendencias: ProdutoTendencia[]; userId: string
}

// ─── Componente principal ─────────────────────────────────────────
export default function DashboardConteudo({
  saudacao, nomeUsuario, dataFormatada, diasTrial,
  produtosEmAlta, estoqueEvitado, lucroMedio, alertasHoje,
  tendencias, userId,
}: Props) {
  const [modalProduto, setModalProduto] = useState<ProdutoTendencia | null>(null)
  const [pagina, setPagina] = useState(1)
  const POR_PAGINA = 10
  const totalPaginas = Math.ceil(tendencias.length / POR_PAGINA)
  const paginados     = tendencias.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA)

  const emojiCat: Record<string, string> = {
    Vibradores: '💜', 'Plugs Anais': '🔮', Lubrificantes: '💧',
    Acessórios: '✨', Kits: '📦', Adultos: '🔞', Tendência: '📈',
  }

  const cards = [
    { emoji: '📊', label: 'Produtos em alta',      valor: produtosEmAlta,  formato: 'inteiro' as const, subtitulo: 'crescimento > 20% hoje', delay: 0   },
    { emoji: '💡', label: 'Estoque evitado',        valor: estoqueEvitado,  formato: 'moeda'   as const, subtitulo: 'economia acumulada',      delay: 80  },
    { emoji: '💰', label: 'Lucro médio / unidade',  valor: lucroMedio,      formato: 'moeda'   as const, subtitulo: 'nos seus cálculos',        delay: 160 },
    { emoji: '🔔', label: 'Alertas hoje',           valor: alertasHoje,     formato: 'inteiro' as const, subtitulo: 'oportunidades enviadas',   delay: 240 },
  ]

  return (
    <>
      {/* ── Header ───────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-10">
        <div>
          <h1 className="text-2xl font-bold text-white">{saudacao}, {nomeUsuario}!</h1>
          <p className="text-zinc-500 text-sm mt-0.5 capitalize">{dataFormatada}</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <BotaoWhatsApp tendencias={tendencias} />
          <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${
            diasTrial > 3
              ? 'bg-green-500/8 border-green-500/20 text-green-400'
              : 'bg-red-500/8 border-red-500/20 text-red-400'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${diasTrial > 3 ? 'bg-green-400' : 'bg-red-400'} animate-pulse`} />
            Trial — {diasTrial}d restantes
          </span>
        </div>
      </div>

      {/* ── Cards ────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        {cards.map((c) => <CardMetrica key={c.label} {...c} />)}
      </div>

      {/* ── Tabela ───────────────────────────────── */}
      <div className="bg-white/[0.02] border border-white/[0.07] rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">Produtos em tendência</h2>
            <p className="text-xs text-zinc-600 mt-0.5">{tendencias.length} produtos coletados</p>
          </div>
        </div>

        {tendencias.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-4xl mb-3">📊</p>
            <p className="text-zinc-400 text-sm font-medium">Nenhum produto em alta hoje</p>
            <p className="text-zinc-600 text-xs mt-1">Os dados são coletados automaticamente às 6h</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02]">
                    {['Produto', 'Fonte', 'Crescimento', 'Vendas / dia', 'Preço médio', 'Lucro est.', ''].map((col) => (
                      <th key={col} className="text-left text-[11px] text-zinc-500 font-medium px-5 py-3 uppercase tracking-wider">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginados.map((p) => {
                    const lucroEst = p.preco_medio * 0.35
                    const emoji    = emojiCat[p.categoria] ?? '🛍️'
                    return (
                      <tr key={p.id} className="border-t border-white/[0.04] hover:bg-white/[0.03] transition-colors">

                        {/* Produto */}
                        <td className="px-5 py-3.5 max-w-[220px]">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-base flex-shrink-0">
                              {emoji}
                            </div>
                            <div className="min-w-0">
                              {p.url_produto ? (
                                <a href={p.url_produto} target="_blank" rel="noopener noreferrer"
                                  className="text-white font-medium hover:text-[#c840e0] transition-colors line-clamp-1 text-sm">
                                  {p.produto_nome}
                                </a>
                              ) : (
                                <span className="text-white font-medium line-clamp-1 text-sm">{p.produto_nome}</span>
                              )}
                              <p className="text-[11px] text-zinc-600">{p.categoria}</p>
                            </div>
                          </div>
                        </td>

                        {/* Fonte */}
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <BadgeFonte fonte={p.fonte} />
                        </td>

                        {/* Crescimento */}
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <BadgeCrescimento pct={p.crescimento_pct} />
                        </td>

                        {/* Vendas */}
                        <td className="px-5 py-3.5 text-zinc-400 tabular-nums">
                          {p.vendas_hoje.toLocaleString('pt-BR')}
                        </td>

                        {/* Preço */}
                        <td className="px-5 py-3.5 text-zinc-300 tabular-nums">
                          {p.preco_medio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </td>

                        {/* Lucro est. */}
                        <td className="px-5 py-3.5 text-emerald-400 font-medium tabular-nums">
                          {lucroEst.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </td>

                        {/* Ação */}
                        <td className="px-5 py-3.5">
                          <button
                            onClick={() => setModalProduto(p)}
                            className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-zinc-400 text-xs hover:text-white hover:border-white/20 transition-all whitespace-nowrap"
                          >
                            + Estoque
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            {totalPaginas > 1 && (
              <div className="px-6 py-3.5 border-t border-white/5 flex items-center justify-between">
                <p className="text-xs text-zinc-600">
                  {(pagina - 1) * POR_PAGINA + 1}–{Math.min(pagina * POR_PAGINA, tendencias.length)} de {tendencias.length}
                </p>
                <div className="flex gap-1.5">
                  <button onClick={() => setPagina((p) => Math.max(1, p - 1))} disabled={pagina === 1}
                    className="px-3 py-1 rounded-lg border border-white/10 text-zinc-400 text-xs hover:bg-white/5 disabled:opacity-30 transition-all">← Ant.</button>
                  <button onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))} disabled={pagina === totalPaginas}
                    className="px-3 py-1 rounded-lg border border-white/10 text-zinc-400 text-xs hover:bg-white/5 disabled:opacity-30 transition-all">Próx. →</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal */}
      {modalProduto && (
        <ModalEstoque produto={modalProduto} userId={userId} onFechar={() => setModalProduto(null)} />
      )}
    </>
  )
}
