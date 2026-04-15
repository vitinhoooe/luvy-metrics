'use client'

import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'

const MARKETPLACES = [
  { label: 'Shopee',         valor: 'shopee', taxa: 0.14, cor: '#f97316', bg: 'bg-orange-500/10', border: 'border-orange-500/20', text: 'text-orange-400' },
  { label: 'Mercado Livre',  valor: 'ml',     taxa: 0.12, cor: '#eab308', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', text: 'text-yellow-400' },
  { label: 'Físico / Outro', valor: 'outro',  taxa: 0,    cor: '#22c55e', bg: 'bg-green-500/10',  border: 'border-green-500/20',  text: 'text-green-400' },
]

type Calculo = {
  id: string
  produto_nome: string
  custo: number
  marketplace: string
  margem_pct: number
  simples_nacional: boolean
  preco_ideal: number
  lucro_unidade: number
  created_at: string
}

type ProdutoTendencia = {
  id: string
  produto_nome: string
  preco_medio: number
}

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function calcular(custo: number, taxa: number, margem: number, simples: boolean) {
  const taxaImposto = simples ? 0.06 : 0
  const total = taxa + taxaImposto + margem / 100
  if (total >= 1) return { preco: 0, lucro: 0, margem: 0 }
  const preco = custo / (1 - total)
  const lucro = preco * (margem / 100)
  const margemReal = custo > 0 ? (lucro / preco) * 100 : 0
  return { preco, lucro, margem: margemReal }
}

export default function CalculadoraPage() {
  const [nomeProduto, setNomeProduto]     = useState('')
  const [custo, setCusto]                 = useState<number>(0)
  const [margem, setMargem]               = useState<number>(40)
  const [marketplace, setMarketplace]     = useState('shopee')
  const [simplesNacional, setSimplesNacional] = useState(false)
  const [historico, setHistorico]         = useState<Calculo[]>([])
  const [salvando, setSalvando]           = useState(false)
  // Busca produto
  const [busca, setBusca]                 = useState('')
  const [resultados, setResultados]       = useState<ProdutoTendencia[]>([])
  const [buscando, setBuscando]           = useState(false)
  const buscaRef                          = useRef<HTMLDivElement>(null)
  // Volume
  const [volume, setVolume]               = useState<number>(30)

  const mp = MARKETPLACES.find((m) => m.valor === marketplace)!
  const taxaMp = mp.taxa
  const { preco: precoIdeal, lucro: lucroLiquido } = calcular(custo, taxaMp, margem, simplesNacional)
  const valorTaxaMp  = precoIdeal * taxaMp
  const valorImposto = precoIdeal * (simplesNacional ? 0.06 : 0)
  const valorMargem  = precoIdeal * (margem / 100)

  // Simulador volume
  const faturamento   = precoIdeal * volume
  const lucroMensal   = lucroLiquido * volume
  const investimento  = custo * volume
  const roi           = investimento > 0 ? (lucroMensal / investimento) * 100 : 0

  useEffect(() => { buscarHistorico() }, [])

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (buscaRef.current && !buscaRef.current.contains(e.target as Node)) setResultados([])
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Busca em produtos_tendencia com debounce
  useEffect(() => {
    if (!busca.trim()) { setResultados([]); return }
    const timer = setTimeout(async () => {
      setBuscando(true)
      try {
        const res = await fetch(`/api/tendencias/buscar?q=${encodeURIComponent(busca)}`)
        if (res.ok) setResultados(await res.json())
      } finally {
        setBuscando(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [busca])

  async function buscarHistorico() {
    const res = await fetch('/api/calculadora')
    if (res.ok) setHistorico(await res.json())
  }

  function selecionarProduto(p: ProdutoTendencia) {
    setNomeProduto(p.produto_nome)
    setCusto(Number((p.preco_medio * 0.4).toFixed(2))) // estima custo = 40% do preço médio
    setBusca('')
    setResultados([])
    toast.success(`Preço médio ${fmt(p.preco_medio)} — custo estimado em 40%`)
  }

  async function salvarCalculo() {
    if (!nomeProduto.trim()) { toast.error('Informe o nome do produto'); return }
    if (custo <= 0) { toast.error('Informe um custo válido'); return }
    setSalvando(true)
    const res = await fetch('/api/calculadora', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        produto_nome: nomeProduto,
        custo,
        marketplace,
        taxa_marketplace: taxaMp,
        margem_pct: margem,
        simples_nacional: simplesNacional,
        preco_ideal: precoIdeal,
        lucro_unidade: lucroLiquido,
      }),
    })
    if (res.ok) { toast.success('Cálculo salvo!'); buscarHistorico() }
    else toast.error('Erro ao salvar cálculo')
    setSalvando(false)
  }

  async function adicionarAoEstoque() {
    if (!nomeProduto.trim() || custo <= 0) {
      toast.error('Preencha o nome e custo antes de adicionar ao estoque'); return
    }
    const res = await fetch('/api/estoque', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ produto_nome: nomeProduto, quantidade: 0, quantidade_minima: 5, preco_custo: custo, preco_venda: precoIdeal, categoria: '' }),
    })
    if (res.ok) toast.success('Produto adicionado ao estoque!')
    else toast.error('Erro ao adicionar ao estoque')
  }

  // Comparativo de todos os marketplaces
  const comparativo = MARKETPLACES.map((m) => {
    const r = calcular(custo, m.taxa, margem, simplesNacional)
    return { ...m, ...r }
  })
  const melhor = comparativo.reduce((a, b) => (b.lucro > a.lucro ? b : a))

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Calculadora de Lucro</h1>
        <p className="text-zinc-400 text-sm mt-0.5">Calcule o preço ideal com taxas e margem em tempo real</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inputs */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 space-y-5">

          {/* Buscar produto */}
          <div ref={buscaRef} className="relative">
            <label className="block text-xs text-zinc-400 mb-1.5">Buscar produto em tendências</label>
            <div className="relative">
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Digite para buscar e preencher automaticamente..."
                className="w-full px-4 py-3 pr-10 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#c840e0]/40"
              />
              {buscando && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-[#c840e0]/30 border-t-[#c840e0] rounded-full animate-spin" />
                </div>
              )}
            </div>
            {resultados.length > 0 && (
              <div className="absolute z-20 top-full mt-1 w-full bg-[#0d0a13] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                {resultados.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => selecionarProduto(p)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors text-left"
                  >
                    <span className="text-sm text-white truncate">{p.produto_nome}</span>
                    <span className="text-xs text-[#c840e0] font-medium ml-2 flex-shrink-0">{fmt(p.preco_medio)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-1.5">Nome do produto</label>
            <input
              value={nomeProduto}
              onChange={(e) => setNomeProduto(e.target.value)}
              placeholder="Ex: Vibrador Silicone USB Pro"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#c840e0]/40"
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-1.5">Custo do fornecedor (R$)</label>
            <input
              type="number"
              value={custo || ''}
              onChange={(e) => setCusto(Number(e.target.value))}
              placeholder="0,00"
              step={0.01}
              min={0}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#c840e0]/40"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-zinc-400">Margem desejada</label>
              <span className="text-sm font-bold text-[#c840e0]">{margem}%</span>
            </div>
            <input
              type="range" min={0} max={100} value={margem}
              onChange={(e) => setMargem(Number(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer accent-[#c840e0]"
            />
            <div className="flex justify-between text-xs text-zinc-600 mt-1">
              <span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
            </div>
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-1.5">Marketplace</label>
            <select
              value={marketplace}
              onChange={(e) => setMarketplace(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#c840e0]/40"
            >
              {MARKETPLACES.map((m) => (
                <option key={m.valor} value={m.valor} className="bg-[#0d0a13]">
                  {m.label} {m.taxa > 0 ? `— taxa ${(m.taxa * 100).toFixed(0)}%` : '— sem taxa'}
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div
              onClick={() => setSimplesNacional(!simplesNacional)}
              className={`w-11 h-6 rounded-full border-2 transition-all flex items-center px-0.5 ${
                simplesNacional ? 'bg-[#c840e0] border-[#c840e0]' : 'bg-white/5 border-white/20'
              }`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${simplesNacional ? 'translate-x-5' : 'translate-x-0'}`} />
            </div>
            <div>
              <p className="text-sm text-white font-medium">Simples Nacional</p>
              <p className="text-xs text-zinc-500">Adiciona 6% de imposto</p>
            </div>
          </label>
        </div>

        {/* Resultado */}
        <div className="space-y-4">
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-zinc-400 mb-4 uppercase tracking-wider">Resultado</h2>
            <div className="space-y-3">
              {[
                { label: 'Custo do produto',              valor: fmt(custo) },
                { label: `Taxa ${mp.label} (${(taxaMp * 100).toFixed(0)}%)`, valor: fmt(valorTaxaMp) },
                ...(simplesNacional ? [{ label: 'Impostos Simples (6%)', valor: fmt(valorImposto) }] : []),
                { label: `Sua margem (${margem}%)`,       valor: fmt(valorMargem) },
              ].map((linha) => (
                <div key={linha.label} className="flex items-center justify-between py-2 border-b border-white/5">
                  <span className="text-sm text-zinc-400">{linha.label}</span>
                  <span className="text-sm text-white font-medium">{linha.valor}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between p-4 rounded-xl bg-[#c840e0]/10 border border-[#c840e0]/20">
                <span className="text-sm font-semibold text-white">Preço ideal</span>
                <span className="text-xl font-bold text-[#c840e0]">{precoIdeal > 0 ? fmt(precoIdeal) : '—'}</span>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                <span className="text-sm font-semibold text-white">Lucro líquido</span>
                <span className="text-xl font-bold text-green-400">{lucroLiquido > 0 ? fmt(lucroLiquido) : '—'}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={salvarCalculo}
              disabled={salvando}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-[#c840e0] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all"
            >
              {salvando ? 'Salvando...' : 'Salvar cálculo'}
            </button>
            <button
              onClick={adicionarAoEstoque}
              className="flex-1 py-3 rounded-xl border border-white/10 text-zinc-300 text-sm hover:bg-white/5 hover:text-white transition-all"
            >
              + Adicionar ao estoque
            </button>
          </div>
        </div>
      </div>

      {/* Comparar Marketplaces */}
      {custo > 0 && (
        <div className="mt-6 bg-white/[0.03] border border-white/10 rounded-2xl p-6">
          <h2 className="text-base font-semibold text-white mb-1">Comparar Marketplaces</h2>
          <p className="text-xs text-zinc-500 mb-4">Mesmo produto, mesma margem — qual canal rende mais?</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {comparativo.map((m) => {
              const isMelhor = m.valor === melhor.valor
              return (
                <div
                  key={m.valor}
                  className={`relative rounded-xl p-4 border transition-all ${
                    isMelhor
                      ? 'bg-green-500/10 border-green-500/30 ring-1 ring-green-500/20'
                      : 'bg-white/[0.02] border-white/5'
                  }`}
                >
                  {isMelhor && (
                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                      MAIS LUCRATIVO
                    </span>
                  )}
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`w-2 h-2 rounded-full`} style={{ background: m.cor }} />
                    <span className="text-sm font-semibold text-white">{m.label}</span>
                    <span className="ml-auto text-xs text-zinc-500">{(m.taxa * 100).toFixed(0)}% taxa</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-500">Preço ideal</span>
                      <span className="text-white font-medium">{m.preco > 0 ? fmt(m.preco) : '—'}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-500">Lucro unit.</span>
                      <span className={`font-semibold ${isMelhor ? 'text-green-400' : 'text-zinc-300'}`}>
                        {m.lucro > 0 ? fmt(m.lucro) : '—'}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-500">Margem real</span>
                      <span className="text-zinc-400">{m.margem > 0 ? m.margem.toFixed(1) + '%' : '—'}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Simulador de Volume */}
      {custo > 0 && (
        <div className="mt-6 bg-white/[0.03] border border-white/10 rounded-2xl p-6">
          <h2 className="text-base font-semibold text-white mb-1">Simulador de Volume</h2>
          <p className="text-xs text-zinc-500 mb-4">Quantas unidades você vende por mês?</p>

          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-zinc-400">Unidades por mês</span>
              <span className="text-lg font-bold text-[#c840e0]">{volume} un.</span>
            </div>
            <input
              type="range" min={1} max={500} value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer accent-[#c840e0]"
            />
            <div className="flex justify-between text-xs text-zinc-600 mt-1">
              <span>1</span><span>125</span><span>250</span><span>375</span><span>500</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Faturamento mensal', valor: fmt(faturamento), cor: 'text-white',       bg: 'bg-white/5' },
              { label: 'Lucro mensal',       valor: fmt(lucroMensal),  cor: 'text-green-400',  bg: 'bg-green-500/5' },
              { label: 'Invest. fornecedor', valor: fmt(investimento), cor: 'text-yellow-400', bg: 'bg-yellow-500/5' },
              { label: 'ROI mensal',         valor: roi.toFixed(0) + '%', cor: roi >= 30 ? 'text-[#c840e0]' : 'text-zinc-400', bg: roi >= 30 ? 'bg-[#c840e0]/5' : 'bg-white/5' },
            ].map((card) => (
              <div key={card.label} className={`${card.bg} rounded-xl p-4 text-center`}>
                <p className="text-xs text-zinc-500 mb-1">{card.label}</p>
                <p className={`text-lg font-bold ${card.cor}`}>{card.valor}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Histórico */}
      {historico.length > 0 && (
        <div className="mt-6 bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5">
            <h2 className="text-base font-semibold text-white">Últimos cálculos</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  {['Produto', 'Custo', 'Margem', 'Marketplace', 'Preço ideal', 'Lucro'].map((c) => (
                    <th key={c} className="text-left text-xs text-zinc-500 font-medium px-6 py-3">{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {historico.map((c) => (
                  <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 text-white font-medium">{c.produto_nome}</td>
                    <td className="px-6 py-4 text-zinc-300">{fmt(c.custo)}</td>
                    <td className="px-6 py-4 text-zinc-300">{c.margem_pct}%</td>
                    <td className="px-6 py-4 text-zinc-400 capitalize">{c.marketplace}</td>
                    <td className="px-6 py-4 text-[#c840e0] font-semibold">{fmt(c.preco_ideal)}</td>
                    <td className="px-6 py-4 text-green-400 font-semibold">{fmt(c.lucro_unidade)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  )
}
