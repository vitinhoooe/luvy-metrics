'use client'

import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'

// ─── Cores ────────────────────────────────────────────────────────
const TX  = '#f5f0ff'
const MT  = '#9d8faa'
const MT2 = '#6d6079'
const AC  = '#c840e0'
const GR  = '#34d399'
const BD  = 'rgba(200,64,224,0.15)'
const CARD: React.CSSProperties = { background: 'rgba(255,255,255,0.03)', border: `1px solid ${BD}`, borderRadius: 12 }
const INP: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)', border: `1px solid ${BD}`,
  borderRadius: 8, padding: '10px 12px', color: TX,
  fontSize: 14, width: '100%', outline: 'none',
}

const MPS = [
  { label: 'Shopee',             valor: 'shopee',    taxa: 0.14 },
  { label: 'Mercado Livre',      valor: 'ml',        taxa: 0.12 },
  { label: 'Instagram/WhatsApp', valor: 'instagram', taxa: 0    },
  { label: 'Loja física',        valor: 'fisico',    taxa: 0    },
]

type Calculo = {
  id: string; produto_nome: string; custo: number; marketplace: string
  margem_pct: number; preco_ideal: number; lucro_unidade: number; created_at: string
}
type Produto = { id: string; produto_nome: string; preco_medio: number }

function fmt(v: number) { return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }

function calcular(custo: number, taxa: number, margem: number, simples: boolean) {
  const imp = simples ? 0.06 : 0
  const tot = taxa + imp + margem / 100
  if (tot >= 1 || custo <= 0) return { preco: 0, lucro: 0 }
  const preco = custo / (1 - tot)
  return { preco, lucro: preco * (margem / 100) }
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block mb-1.5" style={{ fontSize: 11, color: MT, fontWeight: 500, letterSpacing: '0.4px' }}>
      {children}
    </label>
  )
}

export default function CalculadoraPage() {
  const [nome,      setNome]      = useState('')
  const [custo,     setCusto]     = useState(0)
  const [margem,    setMargem]    = useState(40)
  const [mp,        setMp]        = useState('shopee')
  const [simples,   setSimples]   = useState(false)
  const [historico, setHistorico] = useState<Calculo[]>([])
  const [salvando,  setSalvando]  = useState(false)
  const [busca,     setBusca]     = useState('')
  const [sugestoes, setSugestoes] = useState<Produto[]>([])
  const buscaRef = useRef<HTMLDivElement>(null)

  const taxa  = MPS.find((m) => m.valor === mp)?.taxa ?? 0
  const mpLabel = MPS.find((m) => m.valor === mp)?.label ?? ''
  const { preco, lucro } = calcular(custo, taxa, margem, simples)
  const taxaVal = preco * taxa
  const impVal  = preco * (simples ? 0.06 : 0)
  const margemVal = preco * (margem / 100)

  useEffect(() => { buscarHistorico() }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (buscaRef.current && !buscaRef.current.contains(e.target as Node)) setSugestoes([])
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (!busca.trim()) { setSugestoes([]); return }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/tendencias/buscar?q=${encodeURIComponent(busca)}`)
        if (res.ok) setSugestoes(await res.json())
      } catch {}
    }, 300)
    return () => clearTimeout(t)
  }, [busca])

  async function buscarHistorico() {
    try {
      const res = await fetch('/api/calculadora')
      if (res.ok) setHistorico((await res.json()).slice(0, 5))
    } catch {}
  }

  function selecionarProduto(p: Produto) {
    setNome(p.produto_nome)
    setCusto(Number((p.preco_medio * 0.4).toFixed(2)))
    setBusca(''); setSugestoes([])
    toast.success(`Custo estimado em 40% do preço médio (${fmt(p.preco_medio)})`)
  }

  function usarCalculo(c: Calculo) {
    setNome(c.produto_nome)
    setCusto(c.custo)
    setMargem(c.margem_pct)
    setMp(c.marketplace)
    toast.success('Valores carregados')
  }

  async function salvar() {
    if (!nome.trim()) { toast.error('Informe o nome do produto'); return }
    if (custo <= 0)   { toast.error('Informe um custo válido'); return }
    setSalvando(true)
    try {
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
    } catch { toast.error('Erro interno') }
    setSalvando(false)
  }

  async function irParaEstoque() {
    if (!nome.trim() || custo <= 0) { toast.error('Preencha nome e custo primeiro'); return }
    try {
      const res = await fetch('/api/estoque', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ produto_nome: nome, quantidade: 0, quantidade_minima: 5, preco_custo: custo, preco_venda: preco, categoria: '' }),
      })
      if (res.ok) toast.success('Produto adicionado ao estoque!')
      else toast.error('Erro ao adicionar ao estoque')
    } catch { toast.error('Erro interno') }
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: TX }}>Calculadora de Lucro</h1>
        <p style={{ fontSize: 13, color: MT, marginTop: 4 }}>Calcule o preço ideal com taxas e margem em tempo real</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

        {/* Formulário */}
        <div style={{ ...CARD, padding: 24 }} className="space-y-5">

          {/* Busca produto */}
          <div ref={buscaRef} className="relative">
            <Label>Buscar produto em tendências</Label>
            <input value={busca} onChange={(e) => setBusca(e.target.value)}
              placeholder="Digite para preencher automaticamente..." style={INP} />
            {sugestoes.length > 0 && (
              <div className="absolute z-20 top-full mt-1 w-full rounded-xl overflow-hidden shadow-2xl"
                style={{ background: '#0d0a14', border: `1px solid ${BD}` }}>
                {sugestoes.map((p) => (
                  <button key={p.id} onClick={() => selecionarProduto(p)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors"
                    style={{ borderBottom: `1px solid ${BD}` }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                    <span className="text-sm truncate" style={{ color: TX }}>{p.produto_nome}</span>
                    <span className="text-xs ml-2 flex-shrink-0 font-medium" style={{ color: AC }}>{fmt(p.preco_medio)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <Label>Nome do produto</Label>
            <input value={nome} onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Vibrador Silicone USB Pro" style={INP} />
          </div>

          <div>
            <Label>Custo do fornecedor (R$)</Label>
            <input type="number" value={custo || ''} onChange={(e) => setCusto(Number(e.target.value))}
              placeholder="0,00" step={0.01} min={0} style={INP} />
          </div>

          {/* Slider margem */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label style={{ fontSize: 11, color: MT, fontWeight: 500, letterSpacing: '0.4px' }}>Margem desejada</label>
              <span className="font-bold" style={{ fontSize: 14, color: AC }}>{margem}%</span>
            </div>
            <input type="range" min={10} max={80} value={margem}
              onChange={(e) => setMargem(Number(e.target.value))}
              className="w-full" style={{ cursor: 'pointer' }} />
            <div className="flex justify-between mt-1" style={{ fontSize: 11, color: MT2 }}>
              <span>10%</span><span>25%</span><span>40%</span><span>60%</span><span>80%</span>
            </div>
          </div>

          <div>
            <Label>Marketplace</Label>
            <select value={mp} onChange={(e) => setMp(e.target.value)} style={INP}>
              {MPS.map((m) => (
                <option key={m.valor} value={m.valor}>
                  {m.label}{m.taxa > 0 ? ` — taxa ${(m.taxa * 100).toFixed(0)}%` : ' — sem taxa'}
                </option>
              ))}
            </select>
          </div>

          {/* Toggle Simples Nacional */}
          <div className="flex items-center justify-between">
            <div>
              <p style={{ fontSize: 14, color: TX, fontWeight: 500 }}>Simples Nacional</p>
              <p style={{ fontSize: 12, color: MT, marginTop: 2 }}>Adiciona 6% de imposto</p>
            </div>
            <button onClick={() => setSimples(!simples)}
              className="w-11 h-6 rounded-full flex items-center px-0.5 transition-colors"
              style={{ background: simples ? AC : 'rgba(255,255,255,0.1)' }}>
              <div className="w-4 h-4 rounded-full bg-white transition-transform"
                style={{ transform: simples ? 'translateX(20px)' : 'translateX(0)' }} />
            </button>
          </div>
        </div>

        {/* Resultado */}
        <div className="space-y-4">
          <div style={{ ...CARD, padding: 24, background: 'rgba(200,64,224,0.08)', borderColor: 'rgba(200,64,224,0.25)' }}>
            <p className="mb-5 font-semibold" style={{ fontSize: 11, color: AC, letterSpacing: '0.5px' }}>RESULTADO EM TEMPO REAL</p>

            <div className="space-y-3 mb-5">
              {[
                { label: 'Custo do produto',                     val: fmt(custo)     },
                { label: `Taxa ${mpLabel} (${(taxa * 100).toFixed(0)}%)`, val: fmt(taxaVal)   },
                ...(simples ? [{ label: 'Simples Nacional (6%)', val: fmt(impVal) }] : []),
                { label: `Sua margem (${margem}%)`,              val: fmt(margemVal) },
              ].map(({ label, val }) => (
                <div key={label} className="flex items-center justify-between py-2"
                  style={{ borderBottom: '1px solid rgba(200,64,224,0.12)' }}>
                  <span style={{ fontSize: 13, color: MT }}>{label}</span>
                  <span style={{ fontSize: 13, color: TX, fontWeight: 500 }}>{val}</span>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 rounded-xl"
                style={{ background: 'rgba(200,64,224,0.12)', border: `1px solid rgba(200,64,224,0.3)` }}>
                <span style={{ fontWeight: 600, color: TX }}>Preço ideal</span>
                <span style={{ fontSize: 22, fontWeight: 700, color: AC }}>{preco > 0 ? fmt(preco) : '—'}</span>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl"
                style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)' }}>
                <span style={{ fontWeight: 600, color: TX }}>Lucro líquido</span>
                <span style={{ fontSize: 22, fontWeight: 700, color: GR }}>{lucro > 0 ? fmt(lucro) : '—'}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={salvar} disabled={salvando}
              className="flex-1 py-3 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: AC }}>
              {salvando ? 'Salvando...' : 'Salvar cálculo'}
            </button>
            <button onClick={irParaEstoque}
              className="flex-1 py-3 rounded-lg text-sm font-medium transition-colors"
              style={{ border: `1px solid ${BD}`, color: MT }}
              onMouseEnter={(e) => { e.currentTarget.style.color = TX }}
              onMouseLeave={(e) => { e.currentTarget.style.color = MT }}>
              + Adicionar ao estoque
            </button>
          </div>
        </div>
      </div>

      {/* Histórico */}
      {historico.length > 0 && (
        <div style={{ ...CARD, overflow: 'hidden' }}>
          <div className="px-6 py-4" style={{ borderBottom: `1px solid ${BD}` }}>
            <p className="font-semibold" style={{ color: TX }}>Últimos cálculos salvos</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full" style={{ fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: `1px solid ${BD}` }}>
                  {['Produto', 'Custo', 'Margem', 'Marketplace', 'Preço ideal', 'Lucro', ''].map((col) => (
                    <th key={col} className="text-left px-5 py-3"
                      style={{ fontSize: 11, color: MT, fontWeight: 500 }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {historico.map((c) => (
                  <tr key={c.id} style={{ borderTop: `1px solid ${BD}` }}>
                    <td className="px-5 py-3 font-medium" style={{ color: TX }}>{c.produto_nome}</td>
                    <td className="px-5 py-3" style={{ color: MT }}>{fmt(c.custo)}</td>
                    <td className="px-5 py-3" style={{ color: MT }}>{c.margem_pct}%</td>
                    <td className="px-5 py-3 capitalize" style={{ color: MT }}>{c.marketplace}</td>
                    <td className="px-5 py-3 font-medium" style={{ color: AC }}>{fmt(c.preco_ideal)}</td>
                    <td className="px-5 py-3 font-medium" style={{ color: GR }}>{fmt(c.lucro_unidade)}</td>
                    <td className="px-5 py-3">
                      <button onClick={() => usarCalculo(c)}
                        className="px-3 py-1 rounded-lg text-xs transition-colors"
                        style={{ background: 'rgba(255,255,255,0.04)', color: MT, border: `1px solid ${BD}` }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = TX }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = MT }}>
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
