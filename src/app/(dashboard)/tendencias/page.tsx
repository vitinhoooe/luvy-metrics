'use client'

import { useState, useEffect, useCallback } from 'react'
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { ProdutoTendencia } from '@/types'

const FONTES     = ['Todos', 'Mercado Livre', 'Shopee', 'Google Trends']
const CATEGORIAS = ['Todos', 'Vibradores', 'Géis', 'Plugs', 'Roupas Íntimas', 'Acessórios', 'Outros']
const PERIODOS   = ['Hoje', '7 dias', '30 dias']

const TX  = '#f5f0ff'
const MT  = '#9d8faa'
const AC  = '#c840e0'
const BD  = 'rgba(200,64,224,0.15)'

const SAZONALIDADE = [
  { evento: 'Carnaval',          data: '2027-02-14', emoji: '🎭', produtos: ['Fantasias sensuais', 'Acessórios de festa', 'Gel corporal'],       cor: 'from-orange-600/20 to-yellow-600/20', borda: 'border-orange-500/20' },
  { evento: 'Dia dos Namorados', data: '2026-06-12', emoji: '💑', produtos: ['Vibradores premium', 'Kits para casais', 'Lubrificantes especiais'], cor: 'from-pink-600/20 to-red-600/20',   borda: 'border-pink-500/20' },
  { evento: 'Halloween',         data: '2026-10-31', emoji: '🎃', produtos: ['Fantasias adultas', 'Acessórios temáticos', 'Kits surpresa'],        cor: 'from-orange-700/20 to-purple-700/20', borda: 'border-orange-600/20' },
  { evento: 'Natal / Réveillon', data: '2026-12-25', emoji: '🎁', produtos: ['Kits presentes íntimos', 'Embalagens especiais', 'Combos casal'],    cor: 'from-red-600/20 to-green-700/20', borda: 'border-red-500/20' },
]

function diasFaltam(dataStr: string) {
  return Math.max(0, Math.ceil((new Date(dataStr).getTime() - Date.now()) / 86_400_000))
}

function gerarSparkline(produto: ProdutoTendencia) {
  const base = produto.vendas_ontem || 10
  return Array.from({ length: 7 }, (_, i) => ({
    d: `D${i + 1}`,
    v: Math.max(0, Math.round(base + (Math.random() - 0.3) * base * 0.4 + (i / 6) * (produto.vendas_hoje - base))),
  }))
}

function badgeFonte(fonte: string) {
  if (fonte === 'Mercado Livre') return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
  if (fonte === 'Shopee')        return 'bg-orange-500/10 text-orange-400 border-orange-500/20'
  return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
}

function emojiFonte(fonte: string) {
  if (fonte === 'Mercado Livre') return '🟡'
  if (fonte === 'Shopee')        return '🟠'
  return '🔵'
}

// ─── Card produto ─────────────────────────────────────────────────
function CardProduto({ produto, onAdicionarEstoque, onCalcular }: {
  produto: ProdutoTendencia
  onAdicionarEstoque: (p: ProdutoTendencia) => void
  onCalcular: (p: ProdutoTendencia) => void
}) {
  const sparkline = gerarSparkline(produto)
  const pct = produto.crescimento_pct

  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 hover:border-[#c840e0]/30 transition-all flex flex-col">
      <div className="flex items-start justify-between gap-2 mb-3">
        <h3 className="text-sm font-semibold text-white leading-snug line-clamp-2 flex-1">{produto.produto_nome}</h3>
        <span className={`flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded-full border ${
          pct > 50 ? 'bg-red-500/15 text-red-400 border-red-500/25 animate-pulse' :
          pct >= 25 ? 'bg-green-500/15 text-green-400 border-green-500/25' :
                     'bg-yellow-500/15 text-yellow-400 border-yellow-500/25'
        }`}>
          {pct > 50 ? '🔥' : pct >= 25 ? '↑' : '→'} +{pct.toFixed(0)}%
        </span>
      </div>

      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border w-fit mb-3 ${badgeFonte(produto.fonte)}`}>
        {emojiFonte(produto.fonte)} {produto.fonte}
      </span>

      <div className="flex-1 mb-3">
        <ResponsiveContainer width="100%" height={55}>
          <LineChart data={sparkline}>
            <Line type="monotone" dataKey="v" stroke="#c840e0" strokeWidth={1.5} dot={false} />
            <Tooltip
              contentStyle={{ background: '#0d0a13', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 10 }}
              formatter={(v) => [v, 'Vendas']}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <div>
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Preço médio</p>
          <p className="text-sm font-bold text-white">
            {produto.preco_medio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Vendas/dia</p>
          <p className="text-sm font-bold text-white">{produto.vendas_hoje.toLocaleString('pt-BR')}</p>
        </div>
      </div>

      <div className="flex gap-2 mt-auto">
        {produto.url_produto ? (
          <a href={produto.url_produto} target="_blank" rel="noopener noreferrer"
            className="flex-1 py-2 rounded-xl border border-white/10 text-zinc-400 text-xs font-medium hover:bg-white/5 hover:text-white transition-all text-center">
            Ver ↗
          </a>
        ) : (
          <button onClick={() => onCalcular(produto)}
            className="flex-1 py-2 rounded-xl border border-white/10 text-zinc-400 text-xs font-medium hover:bg-white/5 hover:text-white transition-all">
            💰 Calcular
          </button>
        )}
        <button onClick={() => onAdicionarEstoque(produto)}
          className="flex-1 py-2 rounded-xl bg-[#c840e0]/10 border border-[#c840e0]/20 text-[#c840e0] text-xs font-medium hover:bg-[#c840e0]/20 transition-all">
          + Estoque
        </button>
      </div>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────
export default function TendenciasPage() {
  const router     = useRouter()
  const [produtos,    setProdutos]    = useState<ProdutoTendencia[]>([])
  const [carregando,  setCarregando]  = useState(true)
  const [atualizando, setAtualizando] = useState(false)
  const [busca,       setBusca]       = useState('')
  const [fonte,       setFonte]       = useState('Todos')
  const [categoria,   setCategoria]   = useState('Todos')
  const [periodo,     setPeriodo]     = useState('Hoje')
  const [aba,         setAba]         = useState<'tendencias' | 'sazonalidade'>('tendencias')

  const buscarProdutos = useCallback(async () => {
    setCarregando(true)
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from('produtos_tendencia')
        .select('*')
        .order('crescimento_pct', { ascending: false })
      setProdutos(data ?? [])
    } catch {}
    setCarregando(false)
  }, [])

  useEffect(() => { buscarProdutos() }, [buscarProdutos])

  async function atualizarDados() {
    setAtualizando(true)
    try {
      const res = await fetch('/api/cron/coletar', {
        headers: { Authorization: `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET ?? ''}` },
      })
      if (res.ok) { toast.success('Dados atualizados!'); buscarProdutos() }
      else toast.error('Erro ao atualizar dados')
    } catch { toast.error('Erro ao atualizar dados') }
    setAtualizando(false)
  }

  async function adicionarAoEstoque(produto: ProdutoTendencia) {
    try {
      const res = await fetch('/api/estoque', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          produto_nome: produto.produto_nome, quantidade: 0, quantidade_minima: 5,
          preco_custo: produto.preco_medio * 0.5, preco_venda: produto.preco_medio,
          categoria: produto.categoria,
        }),
      })
      if (res.ok) toast.success('Produto adicionado ao estoque!')
      else toast.error('Erro ao adicionar ao estoque')
    } catch { toast.error('Erro interno') }
  }

  function irParaCalculadora(produto: ProdutoTendencia) {
    router.push(`/calculadora?produto=${encodeURIComponent(produto.produto_nome)}&preco=${produto.preco_medio}`)
  }

  const filtrados = produtos.filter((p) => {
    const matchBusca = p.produto_nome.toLowerCase().includes(busca.toLowerCase())
    const matchFonte = fonte === 'Todos' || p.fonte === fonte
    const matchCat   = categoria === 'Todos' || p.categoria === categoria
    return matchBusca && matchFonte && matchCat
  })

  const explosao = filtrados[0]

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Radar de Tendências</h1>
        <p className="text-zinc-400 text-sm mt-0.5">Produtos em alta no mercado adulto em tempo real</p>
      </div>

      {/* Abas */}
      <div className="flex gap-1 p-1 bg-white/5 rounded-xl w-fit mb-6 border border-white/10">
        {(['tendencias', 'sazonalidade'] as const).map((a) => (
          <button key={a} onClick={() => setAba(a)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              aba === a ? 'bg-[#c840e0] text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}>
            {a === 'tendencias' ? '🔥 Tendências' : '📅 Sazonalidade'}
          </button>
        ))}
      </div>

      {aba === 'tendencias' ? (
        <>
          {/* Filtros */}
          <div className="flex flex-wrap gap-3 mb-6">
            <input value={busca} onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar produto..."
              className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#c840e0]/40 min-w-[200px]" />

            {[
              { val: fonte,     set: setFonte,     opts: FONTES },
              { val: categoria, set: setCategoria, opts: CATEGORIAS },
            ].map(({ val, set, opts }, i) => (
              <select key={i} value={val} onChange={(e) => set(e.target.value)}
                className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#c840e0]/40">
                {opts.map((o) => <option key={o} value={o} className="bg-[#0d0a13]">{o}</option>)}
              </select>
            ))}

            <div className="flex gap-1 p-1 bg-white/5 rounded-xl border border-white/10">
              {PERIODOS.map((p) => (
                <button key={p} onClick={() => setPeriodo(p)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    periodo === p ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-white'
                  }`}>
                  {p}
                </button>
              ))}
            </div>

            <button onClick={atualizarDados} disabled={atualizando}
              className="px-4 py-2.5 rounded-xl bg-[#c840e0]/15 border border-[#c840e0]/25 text-[#c840e0] text-sm font-medium hover:bg-[#c840e0]/25 disabled:opacity-50 transition-all ml-auto">
              {atualizando ? 'Atualizando...' : '↻ Atualizar dados'}
            </button>
          </div>

          {carregando ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white/[0.03] border border-white/5 rounded-2xl p-5 space-y-3 animate-pulse">
                  <div className="h-4 bg-white/5 rounded w-3/4" />
                  <div className="h-3 bg-white/5 rounded w-1/4" />
                  <div className="h-14 bg-white/5 rounded" />
                  <div className="grid grid-cols-2 gap-2">
                    <div className="h-8 bg-white/5 rounded" />
                    <div className="h-8 bg-white/5 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtrados.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-3xl mb-3">🔍</p>
              <p className="text-zinc-400 text-sm">Nenhum produto com esses filtros.</p>
            </div>
          ) : (
            <>
              {/* Explosão do dia */}
              {explosao && (
                <div className="bg-gradient-to-br from-[#c840e0]/20 to-purple-900/20 border border-[#c840e0]/30 rounded-2xl p-6 mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg font-bold text-[#c840e0] animate-pulse">🔥</span>
                    <span className="text-sm font-bold text-[#c840e0] uppercase tracking-widest">Explosão do dia</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold text-white mb-1">{explosao.produto_nome}</h2>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-3xl font-black text-[#c840e0]">+{explosao.crescimento_pct.toFixed(0)}%</span>
                        <span className="text-sm text-zinc-400">{explosao.vendas_hoje} vendas hoje</span>
                        <span className="text-sm text-zinc-400">
                          {explosao.preco_medio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} médio
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {explosao.url_produto && (
                        <a href={explosao.url_produto} target="_blank" rel="noopener noreferrer"
                          className="px-4 py-2 rounded-xl border border-white/20 text-white text-sm hover:bg-white/10 transition-all">
                          Ver produto ↗
                        </a>
                      )}
                      <button onClick={() => adicionarAoEstoque(explosao)}
                        className="px-4 py-2 rounded-xl bg-[#c840e0] text-white text-sm font-semibold hover:opacity-90 transition-all">
                        + Adicionar ao estoque
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtrados.map((p) => (
                  <CardProduto key={p.id} produto={p}
                    onAdicionarEstoque={adicionarAoEstoque}
                    onCalcular={irParaCalculadora} />
                ))}
              </div>
            </>
          )}
        </>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-zinc-400 mb-4">Planeje seu estoque com antecedência para os grandes eventos.</p>
          {SAZONALIDADE.map((s) => {
            const dias = diasFaltam(s.data)
            return (
              <div key={s.evento} className={`bg-gradient-to-br ${s.cor} border ${s.borda} rounded-2xl p-6`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <span className="text-4xl">{s.emoji}</span>
                    <div>
                      <h3 className="text-lg font-bold text-white">{s.evento}</h3>
                      <p className="text-sm text-zinc-400">
                        {new Date(s.data).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-3xl font-bold text-white">{dias}</p>
                    <p className="text-xs text-zinc-400">{dias === 1 ? 'dia restante' : 'dias restantes'}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-xs text-zinc-500 mb-2 uppercase tracking-wider">Produtos mais vendidos no período</p>
                  <div className="flex flex-wrap gap-2">
                    {s.produtos.map((p) => (
                      <span key={p} className="px-3 py-1 rounded-full bg-white/10 text-white text-xs border border-white/10">{p}</span>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
