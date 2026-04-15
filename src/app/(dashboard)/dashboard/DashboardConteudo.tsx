'use client'

import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import type { ProdutoTendencia } from '@/types'

// ─── Hooks utilitários ────────────────────────────────────────────
function useContador(valorFinal: number, duracao = 1000) {
  const [valor, setValor] = useState(0)
  useEffect(() => {
    if (valorFinal <= 0) return
    const inicio = Date.now()
    const timer = setInterval(() => {
      const progresso = Math.min((Date.now() - inicio) / duracao, 1)
      const ease = 1 - Math.pow(1 - progresso, 3) // ease-out cubic
      setValor(Math.floor(ease * valorFinal))
      if (progresso >= 1) clearInterval(timer)
    }, 16)
    return () => clearInterval(timer)
  }, [valorFinal, duracao])
  return valor
}

function useAnimacao(delay = 0) {
  const [visivel, setVisivel] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setVisivel(true), delay)
    return () => clearTimeout(t)
  }, [delay])
  return visivel
}

// ─── Skeleton ─────────────────────────────────────────────────────
function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-white/5 rounded-xl ${className}`} />
}

function SkeletonDashboard() {
  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-8">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-9 w-48 rounded-full" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white/[0.03] border border-white/5 rounded-2xl p-6 space-y-3">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>
      <div className="bg-white/[0.03] border border-white/5 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5">
          <Skeleton className="h-5 w-48" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="px-6 py-4 border-b border-white/5 flex gap-4">
            <Skeleton className="h-10 w-10 rounded-lg flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

// ─── Card de métrica ──────────────────────────────────────────────
type CardProps = {
  emoji: string
  label: string
  valor: number
  formato: 'moeda' | 'inteiro'
  subtitulo: string
  delay: number
}

function CardMetrica({ emoji, label, valor, formato, subtitulo, delay }: CardProps) {
  const visivel = useAnimacao(delay)
  const contador = useContador(valor, 1000)

  const valorFormatado =
    formato === 'moeda'
      ? contador.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      : contador.toLocaleString('pt-BR')

  return (
    <div
      style={{
        opacity: visivel ? 1 : 0,
        transform: visivel ? 'translateY(0)' : 'translateY(20px)',
        transition: 'opacity 400ms ease, transform 400ms ease',
      }}
      className="group bg-white/[0.03] border border-[#c840e0]/20 rounded-2xl p-6 hover:border-[#c840e0]/50 hover:shadow-lg hover:shadow-[#c840e0]/5 transition-all duration-300 cursor-default"
    >
      <div className="text-2xl mb-4">{emoji}</div>
      <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-1">{label}</p>
      <p className="text-3xl font-bold text-white tracking-tight">{valorFormatado}</p>
      <p className="text-xs text-zinc-600 mt-2">{subtitulo}</p>
    </div>
  )
}

// ─── Badge de crescimento ─────────────────────────────────────────
function BadgeCrescimento({ pct }: { pct: number }) {
  if (pct > 50)
    return (
      <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-red-500/15 text-red-400 border border-red-500/25 animate-pulse">
        🔥 +{pct.toFixed(0)}%
      </span>
    )
  if (pct >= 25)
    return (
      <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-green-500/15 text-green-400 border border-green-500/25">
        ↑ Comprar +{pct.toFixed(0)}%
      </span>
    )
  return (
    <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-yellow-500/15 text-yellow-400 border border-yellow-500/25">
      → Monitorar +{pct.toFixed(0)}%
    </span>
  )
}

// ─── Modal Adicionar ao Estoque ───────────────────────────────────
function ModalEstoque({ produto, userId, onFechar }: { produto: ProdutoTendencia; userId: string; onFechar: () => void }) {
  const [quantidade, setQuantidade] = useState(10)
  const [qtdMinima, setQtdMinima] = useState(5)
  const [precoCusto, setPrecoCusto] = useState(produto.preco_medio * 0.5)
  const [precoVenda, setPrecoVenda] = useState(produto.preco_medio)
  const [carregando, setCarregando] = useState(false)

  async function salvar() {
    setCarregando(true)
    const supabase = createClient()
    const { error } = await supabase.from('estoque_usuario').insert({
      user_id: userId,
      produto_nome: produto.produto_nome,
      quantidade,
      quantidade_minima: qtdMinima,
      preco_custo: precoCusto,
      preco_venda: precoVenda,
      categoria: produto.categoria,
    })
    if (error) toast.error('Erro ao adicionar ao estoque')
    else { toast.success('Produto adicionado ao estoque!'); onFechar() }
    setCarregando(false)
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0d0a13] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-white">Adicionar ao Estoque</h2>
          <button onClick={onFechar} className="text-zinc-500 hover:text-white transition-colors">✕</button>
        </div>
        <p className="text-sm text-white bg-white/5 rounded-xl px-4 py-2.5 mb-5 truncate">📦 {produto.produto_nome}</p>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Quantidade inicial', val: quantidade, set: setQuantidade },
              { label: 'Qtd. mínima', val: qtdMinima, set: setQtdMinima },
            ].map(({ label, val, set }) => (
              <div key={label}>
                <label className="block text-xs text-zinc-400 mb-1.5">{label}</label>
                <input type="number" value={val} onChange={(e) => set(Number(e.target.value))} min={1}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#c840e0]/40" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Custo (R$)', val: precoCusto, set: setPrecoCusto },
              { label: 'Venda (R$)', val: precoVenda, set: setPrecoVenda },
            ].map(({ label, val, set }) => (
              <div key={label}>
                <label className="block text-xs text-zinc-400 mb-1.5">{label}</label>
                <input type="number" value={val} onChange={(e) => set(Number(e.target.value))} step={0.01} min={0}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#c840e0]/40" />
              </div>
            ))}
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onFechar} className="flex-1 py-2.5 rounded-xl border border-white/10 text-zinc-400 text-sm hover:bg-white/5 transition-all">Cancelar</button>
          <button onClick={salvar} disabled={carregando}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-[#c840e0] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all">
            {carregando ? 'Salvando...' : 'Adicionar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Banner de valor ──────────────────────────────────────────────
function BannerValor() {
  const visivel = useAnimacao(600)
  const contador = useContador(2847300, 2000)

  return (
    <div
      style={{ opacity: visivel ? 1 : 0, transition: 'opacity 600ms ease' }}
      className="bg-white/[0.03] border border-[#c840e0]/20 rounded-2xl p-6 mb-8"
    >
      <p className="text-sm text-zinc-400 text-center mb-2">
        📊 Este mês, nossos lojistas economizaram coletivamente
      </p>
      <p className="text-4xl font-black text-center text-white tracking-tight mb-1">
        {contador.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
      </p>
      <p className="text-sm text-zinc-500 text-center mb-5">em estoque parado evitado</p>
      <div className="flex flex-wrap justify-center gap-3">
        {[
          { cor: 'bg-green-500/10 border-green-500/20 text-green-400',   texto: '🟢 Média por lojista: R$6.847/mês economizado' },
          { cor: 'bg-[#c840e0]/10 border-[#c840e0]/20 text-purple-400',  texto: '🟣 ROI médio: 23× o investimento' },
          { cor: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400', texto: '🟡 Tempo para o 1º resultado: 4 dias' },
        ].map((p) => (
          <span key={p.texto} className={`px-4 py-2 rounded-full border text-xs font-medium ${p.cor}`}>{p.texto}</span>
        ))}
      </div>
    </div>
  )
}

// ─── Tipos ────────────────────────────────────────────────────────
type Props = {
  saudacao: string
  nomeUsuario: string
  dataFormatada: string
  diasTrial: number
  produtosEmAlta: number
  estoqueEvitado: number
  lucroMedio: number
  alertasHoje: number
  tendencias: ProdutoTendencia[]
  userId: string
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
  const paginados = tendencias.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA)

  const emojiCategoria: Record<string, string> = {
    Vibradores: '💜', 'Plugs Anais': '🔮', Lubrificantes: '💧',
    Acessórios: '✨', Kits: '📦', Adultos: '🔞',
  }

  const cards = [
    { emoji: '📊', label: 'Produtos em alta hoje', valor: produtosEmAlta, formato: 'inteiro' as const, subtitulo: 'crescimento acima de 20%', delay: 0 },
    { emoji: '💡', label: 'Estoque parado evitado', valor: estoqueEvitado, formato: 'moeda' as const,   subtitulo: 'economia acumulada no mês', delay: 100 },
    { emoji: '💰', label: 'Lucro médio estimado',   valor: lucroMedio,    formato: 'moeda' as const,   subtitulo: 'por unidade nas suas vendas', delay: 200 },
    { emoji: '🔔', label: 'Alertas enviados hoje',  valor: alertasHoje,   formato: 'inteiro' as const, subtitulo: 'oportunidades identificadas', delay: 300 },
  ]

  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">{saudacao}, {nomeUsuario}!</h1>
          <p className="text-zinc-500 text-sm mt-0.5 capitalize">{dataFormatada}</p>
        </div>
        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-medium w-fit">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          Trial ativo — {diasTrial} dias restantes
        </span>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {cards.map((c) => <CardMetrica key={c.label} {...c} />)}
      </div>

      {/* Banner valor */}
      <BannerValor />

      {/* Tabela de tendências */}
      <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">Produtos em Tendência</h2>
          <span className="text-xs text-zinc-500">{tendencias.length} produtos</span>
        </div>

        {tendencias.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-3xl mb-3">📊</p>
            <p className="text-zinc-400 text-sm">Nenhum produto em tendência hoje.</p>
            <p className="text-zinc-600 text-xs mt-1">Os dados são coletados diariamente às 6h.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                {/* Cabeçalho */}
                <thead>
                  <tr style={{ background: 'rgba(200,64,224,0.08)' }}>
                    {['Produto', 'Fonte', 'Crescimento', 'Vendas/dia', 'Preço médio', 'Lucro est.', 'Ação'].map((col) => (
                      <th key={col} className="text-left text-xs text-zinc-400 font-semibold px-5 py-3 uppercase tracking-wider">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>

                {/* Linhas */}
                <tbody>
                  {paginados.map((p, i) => {
                    const lucroEst = p.preco_medio * 0.35
                    const emoji = emojiCategoria[p.categoria] ?? '🛍️'
                    return (
                      <tr
                        key={p.id}
                        className={`border-t border-white/5 hover:bg-white/[0.04] transition-colors ${i % 2 === 1 ? 'bg-white/[0.015]' : ''}`}
                      >
                        {/* Produto */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-lg flex-shrink-0">
                              {emoji}
                            </div>
                            <div>
                              {p.url_produto ? (
                                <a
                                  href={p.url_produto}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-white font-medium hover:text-[#c840e0] transition-colors line-clamp-1"
                                >
                                  {p.produto_nome}
                                </a>
                              ) : (
                                <span className="text-white font-medium line-clamp-1">{p.produto_nome}</span>
                              )}
                              <p className="text-xs text-zinc-600">{p.categoria}</p>
                            </div>
                          </div>
                        </td>

                        {/* Fonte */}
                        <td className="px-5 py-3.5">
                          <span className={`text-xs font-medium px-2 py-1 rounded-full border ${
                            p.fonte === 'Mercado Livre' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                            p.fonte === 'Shopee'        ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                                                          'bg-blue-500/10 text-blue-400 border-blue-500/20'
                          }`}>
                            {p.fonte === 'Mercado Livre' ? '🟡' : p.fonte === 'Shopee' ? '🟠' : '🔵'} {p.fonte}
                          </span>
                        </td>

                        {/* Crescimento */}
                        <td className="px-5 py-3.5"><BadgeCrescimento pct={p.crescimento_pct} /></td>

                        {/* Vendas/dia */}
                        <td className="px-5 py-3.5 text-zinc-300">{p.vendas_hoje.toLocaleString('pt-BR')}</td>

                        {/* Preço médio */}
                        <td className="px-5 py-3.5 text-zinc-300">
                          {p.preco_medio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </td>

                        {/* Lucro estimado */}
                        <td className="px-5 py-3.5 text-green-400 font-medium">
                          {lucroEst.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </td>

                        {/* Ação */}
                        <td className="px-5 py-3.5">
                          <button
                            onClick={() => setModalProduto(p)}
                            className="px-3 py-1.5 rounded-lg bg-[#c840e0]/15 border border-[#c840e0]/25 text-[#c840e0] text-xs font-medium hover:bg-[#c840e0]/25 transition-all whitespace-nowrap"
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
              <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between">
                <p className="text-xs text-zinc-500">
                  Página {pagina} de {totalPaginas} — {tendencias.length} produtos
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPagina((p) => Math.max(1, p - 1))}
                    disabled={pagina === 1}
                    className="px-3 py-1.5 rounded-lg border border-white/10 text-zinc-400 text-xs hover:bg-white/5 disabled:opacity-30 transition-all"
                  >
                    ← Anterior
                  </button>
                  <button
                    onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                    disabled={pagina === totalPaginas}
                    className="px-3 py-1.5 rounded-lg border border-white/10 text-zinc-400 text-xs hover:bg-white/5 disabled:opacity-30 transition-all"
                  >
                    Próximo →
                  </button>
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
