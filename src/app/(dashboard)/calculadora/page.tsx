'use client'

import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'

const MPS = [
  { label: 'Shopee',               valor: 'shopee',    taxa: 0.14 },
  { label: 'Mercado Livre',         valor: 'ml',        taxa: 0.12 },
  { label: 'Instagram / WhatsApp', valor: 'instagram', taxa: 0    },
  { label: 'Loja física',           valor: 'fisico',    taxa: 0    },
]

type Calculo = {
  id: string; produto_nome: string; custo: number; marketplace: string
  margem_pct: number; preco_ideal: number; lucro_unidade: number; created_at: string
}
type Produto = { id: string; produto_nome: string; preco_medio: number }

function fmt(v: number) { return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }
function calc(custo: number, taxa: number, margem: number, simples: boolean) {
  const imp = simples ? 0.06 : 0
  const tot = taxa + imp + margem / 100
  if (tot >= 1 || custo <= 0) return { preco: 0, lucro: 0 }
  const preco = custo / (1 - tot)
  return { preco, lucro: preco * (margem / 100) }
}

function InputField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block mb-1.5" style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 500, letterSpacing: '0.4px' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)',
  borderRadius: 8, padding: '10px 12px', color: 'var(--text)',
  fontSize: 14, width: '100%', outline: 'none',
}

export default function CalculadoraPage() {
  const [nome,     setNome]     = useState('')
  const [custo,    setCusto]    = useState<number>(0)
  const [margem,   setMargem]   = useState(40)
  const [mp,       setMp]       = useState('shopee')
  const [simples,  setSimples]  = useState(false)
  const [historico, setHistorico] = useState<Calculo[]>([])
  const [salvando,  setSalvando]  = useState(false)
  const [busca,     setBusca]     = useState('')
  const [sugestoes, setSugestoes] = useState<Produto[]>([])
  const buscaRef = useRef<HTMLDivElement>(null)

  const taxa  = MPS.find((m) => m.valor === mp)?.taxa ?? 0
  const { preco, lucro } = calc(custo, taxa, margem, simples)
  const taxaMpVal  = preco * taxa
  const taxaImpVal = preco * (simples ? 0.06 : 0)
  const margemVal  = preco * (margem / 100)

  useEffect(() => { buscarHistorico() }, [])

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (buscaRef.current && !buscaRef.current.contains(e.target as Node)) setSugestoes([])
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (!busca.trim()) { setSugestoes([]); return }
    const t = setTimeout(async () => {
      const res = await fetch(`/api/tendencias/buscar?q=${encodeURIComponent(busca)}`)
      if (res.ok) setSugestoes(await res.json())
    }, 300)
    return () => clearTimeout(t)
  }, [busca])

  async function buscarHistorico() {
    const res = await fetch('/api/calculadora')
    if (res.ok) setHistorico((await res.json()).slice(0, 5))
  }

  function usarCalculo(c: Calculo) {
    setNome(c.produto_nome)
    setCusto(c.custo)
    setMargem(c.margem_pct)
    setMp(c.marketplace)
    toast.success('Valores carregados')
  }

  function selecionarProduto(p: Produto) {
    setNome(p.produto_nome)
    setCusto(Number((p.preco_medio * 0.4).toFixed(2)))
    setBusca(''); setSugestoes([])
    toast.success(`Custo estimado em 40% do preço médio (${fmt(p.preco_medio)})`)
  }

  async function salvar() {
    if (!nome.trim()) { toast.error('Informe o nome do produto'); return }
    if (custo <= 0)   { toast.error('Informe um custo válido'); return }
    setSalvando(true)
    const res = await fetch('/api/calculadora', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        produto_nome: nome, custo, marketplace: mp, taxa_marketplace: taxa,
        margem_pct: margem, simples_nacional: simples, preco_ideal: preco, lucro_unidade: lucro,
      }),
    })
    if (res.ok) { toast.success('Cálculo salvo!'); buscarHistorico() }
    else toast.error('Erro ao salvar')
    setSalvando(false)
  }

  async function irParaEstoque() {
    if (!nome.trim() || custo <= 0) { toast.error('Preencha nome e custo primeiro'); return }
    const res = await fetch('/api/estoque', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ produto_nome: nome, quantidade: 0, quantidade_minima: 5, preco_custo: custo, preco_venda: preco, categoria: '' }),
    })
    if (res.ok) toast.success('Produto adicionado ao estoque!')
    else toast.error('Erro ao adicionar ao estoque')
  }

  const mpLabel = MPS.find((m) => m.valor === mp)?.label ?? ''

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Calculadora de Lucro</h1>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
          Calcule o preço ideal com taxas e margem em tempo real
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Formulário */}
        <div className="p-6 rounded-xl space-y-5" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>

          {/* Buscar produto */}
          <div ref={buscaRef} className="relative">
            <InputField label="Buscar produto em tendências">
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Digite para preencher automaticamente..."
                style={inputStyle}
              />
            </InputField>
            {sugestoes.length > 0 && (
              <div className="absolute z-20 top-full mt-1 w-full rounded-xl overflow-hidden shadow-2xl"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                {sugestoes.map((p) => (
                  <button key={p.id} onClick={() => selecionarProduto(p)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors"
                    style={{ borderBottom: '1px solid var(--border)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                    <span className="text-sm truncate" style={{ color: 'var(--text)' }}>{p.produto_nome}</span>
                    <span className="text-xs ml-2 flex-shrink-0 font-medium" style={{ color: 'var(--accent)' }}>{fmt(p.preco_medio)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <InputField label="Nome do produto">
            <input value={nome} onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Vibrador Silicone USB Pro" style={inputStyle} />
          </InputField>

          <InputField label="Custo do fornecedor (R$)">
            <input type="number" value={custo || ''} onChange={(e) => setCusto(Number(e.target.value))}
              placeholder="0,00" step={0.01} min={0} style={inputStyle} />
          </InputField>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 500, letterSpacing: '0.4px' }}>
                Margem desejada
              </label>
              <span className="font-bold" style={{ fontSize: 14, color: 'var(--accent)' }}>{margem}%</span>
            </div>
            <input type="range" min={10} max={80} value={margem} onChange={(e) => setMargem(Number(e.target.value))}
              className="w-full" style={{ height: 4, cursor: 'pointer' }} />
            <div className="flex justify-between mt-1" style={{ fontSize: 11, color: 'var(--muted2)' }}>
              <span>10%</span><span>25%</span><span>40%</span><span>60%</span><span>80%</span>
            </div>
          </div>

          <InputField label="Marketplace">
            <select value={mp} onChange={(e) => setMp(e.target.value)} style={inputStyle}>
              {MPS.map((m) => (
                <option key={m.valor} value={m.valor}>
                  {m.label} {m.taxa > 0 ? `— taxa ${(m.taxa * 100).toFixed(0)}%` : '— sem taxa'}
                </option>
              ))}
            </select>
          </InputField>

          {/* Toggle Simples Nacional */}
          <div className="flex items-center justify-between">
            <div>
              <p style={{ fontSize: 14, color: 'var(--text)', fontWeight: 500 }}>Simples Nacional</p>
              <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>Adiciona 6% de imposto</p>
            </div>
            <button onClick={() => setSimples(!simples)}
              className="w-11 h-6 rounded-full flex items-center px-0.5 transition-colors flex-shrink-0"
              style={{ background: simples ? 'var(--accent)' : 'rgba(255,255,255,0.1)', border: '2px solid transparent' }}>
              <div className="w-4 h-4 rounded-full bg-white transition-transform"
                style={{ transform: simples ? 'translateX(20px)' : 'translateX(0)' }} />
            </button>
          </div>
        </div>

        {/* Resultado */}
        <div className="space-y-4">
          <div className="p-6 rounded-xl" style={{ background: 'var(--accent-soft)', border: '1px solid rgba(124,92,252,0.2)' }}>
            <p className="mb-4 font-semibold" style={{ fontSize: 11, color: 'var(--accent)', letterSpacing: '0.5px' }}>
              RESULTADO
            </p>
            <div className="space-y-3">
              {[
                { label: 'Custo do produto',             val: fmt(custo) },
                { label: `Taxa ${mpLabel} (${(taxa * 100).toFixed(0)}%)`, val: fmt(taxaMpVal) },
                ...(simples ? [{ label: 'Imposto Simples Nacional (6%)', val: fmt(taxaImpVal) }] : []),
                { label: `Sua margem (${margem}%)`,      val: fmt(margemVal) },
              ].map(({ label, val }) => (
                <div key={label} className="flex items-center justify-between py-2"
                  style={{ borderBottom: '1px solid rgba(124,92,252,0.1)' }}>
                  <span style={{ fontSize: 13, color: 'var(--muted)' }}>{label}</span>
                  <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{val}</span>
                </div>
              ))}
            </div>

            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between p-4 rounded-lg"
                style={{ background: 'rgba(124,92,252,0.15)', border: '1px solid rgba(124,92,252,0.3)' }}>
                <span style={{ fontWeight: 600, color: 'var(--text)' }}>Preço ideal</span>
                <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--accent)' }}>
                  {preco > 0 ? fmt(preco) : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg"
                style={{ background: 'var(--green-soft)', border: '1px solid rgba(34,197,94,0.2)' }}>
                <span style={{ fontWeight: 600, color: 'var(--text)' }}>Lucro líquido</span>
                <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--green)' }}>
                  {lucro > 0 ? fmt(lucro) : '—'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={salvar} disabled={salvando}
              className="flex-1 py-3 rounded-lg text-sm font-semibold text-white transition-opacity disabled:opacity-50"
              style={{ background: 'var(--accent)' }}>
              {salvando ? 'Salvando...' : 'Salvar este cálculo'}
            </button>
            <button onClick={irParaEstoque}
              className="flex-1 py-3 rounded-lg text-sm font-medium transition-colors"
              style={{ border: '1px solid var(--border)', color: 'var(--muted)' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.borderColor = 'var(--border-hover)' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--muted)'; e.currentTarget.style.borderColor = 'var(--border)' }}>
              + Adicionar ao estoque
            </button>
          </div>
        </div>
      </div>

      {/* Histórico */}
      {historico.length > 0 && (
        <div className="rounded-xl overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <p className="font-semibold" style={{ color: 'var(--text)' }}>Últimos cálculos salvos</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full" style={{ fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border)' }}>
                  {['Produto', 'Custo', 'Margem', 'Marketplace', 'Preço ideal', 'Lucro', ''].map((col) => (
                    <th key={col} className="text-left px-5 py-3"
                      style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 500 }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {historico.map((c) => (
                  <tr key={c.id} style={{ borderTop: '1px solid var(--border)' }}>
                    <td className="px-5 py-3 font-medium" style={{ color: 'var(--text)' }}>{c.produto_nome}</td>
                    <td className="px-5 py-3" style={{ color: 'var(--muted)' }}>{fmt(c.custo)}</td>
                    <td className="px-5 py-3" style={{ color: 'var(--muted)' }}>{c.margem_pct}%</td>
                    <td className="px-5 py-3 capitalize" style={{ color: 'var(--muted)' }}>{c.marketplace}</td>
                    <td className="px-5 py-3 font-medium" style={{ color: 'var(--accent)' }}>{fmt(c.preco_ideal)}</td>
                    <td className="px-5 py-3 font-medium" style={{ color: 'var(--green)' }}>{fmt(c.lucro_unidade)}</td>
                    <td className="px-5 py-3">
                      <button onClick={() => usarCalculo(c)}
                        className="px-3 py-1 rounded-lg text-xs transition-colors"
                        style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--muted)', border: '1px solid var(--border)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.borderColor = 'var(--border-hover)' }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--muted)'; e.currentTarget.style.borderColor = 'var(--border)' }}>
                        Usar novamente
                      </button>
                    </td>
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
