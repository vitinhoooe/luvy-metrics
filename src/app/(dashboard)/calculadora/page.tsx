'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'

const MARKETPLACES = [
  { label: 'Shopee',          valor: 'shopee',   taxa: 0.14 },
  { label: 'Mercado Livre',   valor: 'ml',       taxa: 0.12 },
  { label: 'Outro / Físico',  valor: 'outro',    taxa: 0    },
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

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function CalculadoraPage() {
  const [nomeProduto, setNomeProduto] = useState('')
  const [custo, setCusto] = useState<number>(0)
  const [margem, setMargem] = useState<number>(40)
  const [marketplace, setMarketplace] = useState('shopee')
  const [simplesNacional, setSimplesNacional] = useState(false)
  const [historico, setHistorico] = useState<Calculo[]>([])
  const [salvando, setSalvando] = useState(false)

  const taxaMp = MARKETPLACES.find((m) => m.valor === marketplace)?.taxa ?? 0
  const taxaImposto = simplesNacional ? 0.06 : 0
  const totalTaxas = taxaMp + taxaImposto
  const precoIdeal = totalTaxas + margem / 100 >= 1 ? 0 : custo / (1 - totalTaxas - margem / 100)
  const valorTaxaMp = precoIdeal * taxaMp
  const valorImposto = precoIdeal * taxaImposto
  const valorMargem = precoIdeal * (margem / 100)
  const lucroLiquido = valorMargem

  useEffect(() => { buscarHistorico() }, [])

  async function buscarHistorico() {
    const res = await fetch('/api/calculadora')
    if (res.ok) setHistorico(await res.json())
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
    if (res.ok) {
      toast.success('Cálculo salvo!')
      buscarHistorico()
    } else {
      toast.error('Erro ao salvar cálculo')
    }
    setSalvando(false)
  }

  async function adicionarAoEstoque() {
    if (!nomeProduto.trim() || custo <= 0) {
      toast.error('Preencha o nome e custo antes de adicionar ao estoque')
      return
    }
    const res = await fetch('/api/estoque', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        produto_nome: nomeProduto,
        quantidade: 0,
        quantidade_minima: 5,
        preco_custo: custo,
        preco_venda: precoIdeal,
        categoria: '',
      }),
    })
    if (res.ok) toast.success('Produto adicionado ao estoque!')
    else toast.error('Erro ao adicionar ao estoque')
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Calculadora de Lucro</h1>
        <p className="text-zinc-400 text-sm mt-0.5">Calcule o preço ideal com taxas e margem em tempo real</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inputs */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 space-y-5">
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
              type="range"
              min={0}
              max={100}
              value={margem}
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

          <label className="flex items-center gap-3 cursor-pointer select-none group">
            <div
              onClick={() => setSimplesNacional(!simplesNacional)}
              className={`w-11 h-6 rounded-full border-2 transition-all flex items-center px-0.5 ${
                simplesNacional
                  ? 'bg-[#c840e0] border-[#c840e0]'
                  : 'bg-white/5 border-white/20'
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
                { label: 'Custo do produto',       valor: fmt(custo),          destaque: false },
                { label: `Taxa ${MARKETPLACES.find(m => m.valor === marketplace)?.label ?? ''} (${(taxaMp * 100).toFixed(0)}%)`, valor: fmt(valorTaxaMp), destaque: false },
                { label: `Impostos Simples (6%)`,  valor: fmt(valorImposto),   destaque: false, ocultar: !simplesNacional },
                { label: `Sua margem (${margem}%)`, valor: fmt(valorMargem),   destaque: false },
              ]
                .filter((l) => !l.ocultar)
                .map((linha) => (
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
