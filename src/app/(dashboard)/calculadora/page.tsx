'use client'

import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'

const TX = '#f0ebff'
const MT = '#8b7fa0'
const AC = '#c840e0'
const GR = '#34d399'
const BD = 'rgba(200,64,224,0.18)'
const CARD_BG = 'rgba(255,255,255,0.04)'
const BTN = '#9333ea'

const CARD: React.CSSProperties = { background: CARD_BG, border: `1px solid ${BD}`, borderRadius: 12 }
const INP: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)', border: `1px solid ${BD}`,
  borderRadius: 8, padding: '10px 12px', color: TX,
  fontSize: 14, width: '100%', outline: 'none',
}

const PRESETS = [
  { label: 'Shopee', valor: 'shopee', taxa: 14 },
  { label: 'Mercado Livre', valor: 'ml', taxa: 12 },
  { label: 'Instagram/WhatsApp', valor: 'instagram', taxa: 0 },
  { label: 'Loja física', valor: 'fisico', taxa: 0 },
]

type Calculo = {
  id: string; produto_nome: string; custo: number; marketplace: string
  margem_pct: number; preco_ideal: number; lucro_unidade: number; created_at: string
}
type Produto = { id: string; produto_nome: string; preco_medio: number }

function fmt(v: number) { return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }

function Label({ children }: { children: React.ReactNode }) {
  return <label style={{ display: 'block', fontSize: 11, color: MT, fontWeight: 500, letterSpacing: '0.4px', marginBottom: 6 }}>{children}</label>
}

export default function CalculadoraPage() {
  const [nome, setNome] = useState('')
  const [custo, setCusto] = useState(0)
  const [margem, setMargem] = useState(40)
  const [taxa, setTaxa] = useState(14)
  const [imposto, setImposto] = useState(0)
  const [outrasTaxas, setOutrasTaxas] = useState(0)
  const [mpLabel, setMpLabel] = useState('shopee')
  const [historico, setHistorico] = useState<Calculo[]>([])
  const [salvando, setSalvando] = useState(false)
  const [busca, setBusca] = useState('')
  const [sugestoes, setSugestoes] = useState<Produto[]>([])
  const buscaRef = useRef<HTMLDivElement>(null)

  const totalTaxas = (taxa + imposto + outrasTaxas + margem) / 100
  const precoIdeal = totalTaxas < 1 && custo > 0 ? custo / (1 - totalTaxas) : 0
  const taxaVal = precoIdeal * (taxa / 100)
  const impostoVal = precoIdeal * (imposto / 100)
  const outrasTaxasVal = precoIdeal * (outrasTaxas / 100)
  const margemVal = precoIdeal * (margem / 100)
  const lucro = margemVal
  const margemReal = precoIdeal > 0 ? ((precoIdeal - custo) / precoIdeal * 100) : 0

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
    try { const res = await fetch('/api/calculadora'); if (res.ok) setHistorico((await res.json()).slice(0, 5)) } catch {}
  }

  function selecionarProduto(p: Produto) {
    setNome(p.produto_nome)
    setCusto(Number((p.preco_medio * 0.4).toFixed(2)))
    setBusca(''); setSugestoes([])
    toast.success(`Custo estimado em 40% do preço médio (${fmt(p.preco_medio)})`)
  }

  function selecionarPreset(preset: typeof PRESETS[0]) {
    setTaxa(preset.taxa)
    setMpLabel(preset.valor)
  }

  function usarCalculo(c: Calculo) {
    setNome(c.produto_nome)
    setCusto(c.custo)
    setMargem(c.margem_pct)
    const preset = PRESETS.find(p => p.valor === c.marketplace)
    if (preset) { setTaxa(preset.taxa); setMpLabel(preset.valor) }
    toast.success('Valores carregados')
  }

  async function salvar() {
    if (!nome.trim()) { toast.error('Informe o nome do produto'); return }
    if (custo <= 0) { toast.error('Informe um custo válido'); return }
    setSalvando(true)
    try {
      const res = await fetch('/api/calculadora', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          produto_nome: nome, custo, marketplace: mpLabel,
          taxa_marketplace: taxa / 100, margem_pct: margem,
          simples_nacional: imposto > 0, preco_ideal: precoIdeal, lucro_unidade: lucro,
        }),
      })
      if (res.ok) { toast.success('Cálculo salvo!'); buscarHistorico() }
      else toast.error('Erro ao salvar')
    } catch { toast.error('Erro interno') }
    setSalvando(false)
  }

  return (
    <>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: TX, letterSpacing: '-0.5px', marginBottom: 4 }}>Calculadora de Lucro</h1>
        <p style={{ fontSize: 14, color: MT }}>Calcule o preço ideal com taxas e margem em tempo real</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>

        {/* Formulário */}
        <div style={{ ...CARD, padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>

          <div ref={buscaRef} style={{ position: 'relative' }}>
            <Label>Buscar produto em tendências</Label>
            <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Digite para preencher automaticamente..." style={INP} />
            {sugestoes.length > 0 && (
              <div style={{ position: 'absolute', zIndex: 20, top: '100%', marginTop: 4, width: '100%', borderRadius: 12, overflow: 'hidden', background: '#0a0812', border: `1px solid ${BD}`, boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
                {sugestoes.map(p => (
                  <button key={p.id} onClick={() => selecionarProduto(p)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', textAlign: 'left', borderBottom: `1px solid ${BD}`, background: 'transparent', color: TX, fontSize: 14, cursor: 'pointer', border: 'none', fontFamily: 'inherit' }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.produto_nome}</span>
                    <span style={{ fontSize: 12, color: AC, fontWeight: 600, flexShrink: 0, marginLeft: 8 }}>{fmt(p.preco_medio)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div><Label>Nome do produto</Label><input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Vibrador Silicone USB Pro" style={INP} /></div>
          <div><Label>Custo do fornecedor (R$)</Label><input type="number" value={custo || ''} onChange={e => setCusto(Number(e.target.value))} placeholder="0,00" step={0.01} min={0} style={INP} /></div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <Label>Margem desejada (%)</Label>
              <input type="number" value={margem} onChange={e => setMargem(Number(e.target.value))} min={0} max={90}
                style={{ ...INP, width: 70, textAlign: 'center', padding: '4px 8px', fontWeight: 700, color: AC }} />
            </div>
            <input type="range" min={5} max={80} value={margem} onChange={e => setMargem(Number(e.target.value))} style={{ width: '100%', cursor: 'pointer' }} />
          </div>

          <div>
            <Label>Marketplace (clique para preencher taxa)</Label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
              {PRESETS.map(p => (
                <button key={p.valor} onClick={() => selecionarPreset(p)}
                  style={{
                    padding: '6px 14px', borderRadius: 100, fontSize: 12, fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'inherit', border: 'none',
                    background: mpLabel === p.valor ? 'rgba(147,51,234,0.2)' : 'rgba(255,255,255,0.05)',
                    color: mpLabel === p.valor ? AC : MT,
                    outline: mpLabel === p.valor ? '1px solid rgba(147,51,234,0.4)' : 'none',
                  }}>
                  {p.label} {p.taxa}%
                </button>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              <div>
                <label style={{ fontSize: 10, color: MT, fontWeight: 500 }}>Taxa marketplace (%)</label>
                <input type="number" value={taxa} onChange={e => setTaxa(Number(e.target.value))} min={0} max={50} step={0.1} style={{ ...INP, marginTop: 4 }} />
              </div>
              <div>
                <label style={{ fontSize: 10, color: MT, fontWeight: 500 }}>Imposto (%)</label>
                <input type="number" value={imposto} onChange={e => setImposto(Number(e.target.value))} min={0} max={30} step={0.1} style={{ ...INP, marginTop: 4 }} />
              </div>
              <div>
                <label style={{ fontSize: 10, color: MT, fontWeight: 500 }}>Outras taxas (%)</label>
                <input type="number" value={outrasTaxas} onChange={e => setOutrasTaxas(Number(e.target.value))} min={0} max={30} step={0.1} style={{ ...INP, marginTop: 4 }} />
              </div>
            </div>
          </div>
        </div>

        {/* Resultado */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ ...CARD, padding: 24, background: 'rgba(147,51,234,0.08)', borderColor: 'rgba(147,51,234,0.25)' }}>
            <p style={{ marginBottom: 20, fontWeight: 600, fontSize: 11, color: AC, letterSpacing: '0.5px' }}>RESULTADO EM TEMPO REAL</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
              {[
                { label: 'Custo do produto', val: fmt(custo) },
                { label: `Taxa marketplace ${taxa}%`, val: fmt(taxaVal) },
                ...(imposto > 0 ? [{ label: `Imposto ${imposto}%`, val: fmt(impostoVal) }] : []),
                ...(outrasTaxas > 0 ? [{ label: `Outras taxas ${outrasTaxas}%`, val: fmt(outrasTaxasVal) }] : []),
                { label: `Sua margem ${margem}%`, val: fmt(margemVal) },
              ].map(({ label, val }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 10, borderBottom: '1px solid rgba(147,51,234,0.12)' }}>
                  <span style={{ fontSize: 13, color: MT }}>{label}</span>
                  <span style={{ fontSize: 13, color: TX, fontWeight: 500 }}>{val}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 12, background: 'rgba(147,51,234,0.12)', border: '1px solid rgba(147,51,234,0.3)' }}>
                <span style={{ fontWeight: 600, color: TX }}>Preço ideal</span>
                <span style={{ fontSize: 22, fontWeight: 700, color: AC }}>{precoIdeal > 0 ? fmt(precoIdeal) : '—'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 12, background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)' }}>
                <span style={{ fontWeight: 600, color: TX }}>Lucro líquido</span>
                <span style={{ fontSize: 22, fontWeight: 700, color: GR }}>{lucro > 0 ? fmt(lucro) : '—'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 12, background: CARD_BG, border: `1px solid ${BD}` }}>
                <span style={{ fontWeight: 600, color: TX }}>Margem real</span>
                <span style={{ fontSize: 22, fontWeight: 700, color: TX }}>{margemReal > 0 ? margemReal.toFixed(1) + '%' : '—'}</span>
              </div>
            </div>
          </div>

          <button onClick={salvar} disabled={salvando}
            style={{ padding: 12, borderRadius: 8, fontSize: 14, fontWeight: 600, color: '#fff', background: BTN, border: 'none', cursor: 'pointer', opacity: salvando ? 0.5 : 1 }}>
            {salvando ? 'Salvando...' : 'Salvar cálculo'}
          </button>
        </div>
      </div>

      {historico.length > 0 && (
        <div style={{ ...CARD, overflow: 'hidden' }}>
          <div style={{ padding: '16px 24px', borderBottom: `1px solid ${BD}` }}>
            <p style={{ fontWeight: 600, color: TX }}>Últimos cálculos salvos</p>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(147,51,234,0.06)', borderBottom: `1px solid ${BD}` }}>
                  {['Produto', 'Custo', 'Margem', 'Marketplace', 'Preço ideal', 'Lucro', ''].map(col => (
                    <th key={col} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 11, color: MT, fontWeight: 500 }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {historico.map(c => (
                  <tr key={c.id} style={{ borderTop: `1px solid ${BD}` }}>
                    <td style={{ padding: '12px 16px', fontWeight: 500, color: TX }}>{c.produto_nome}</td>
                    <td style={{ padding: '12px 16px', color: MT }}>{fmt(c.custo)}</td>
                    <td style={{ padding: '12px 16px', color: MT }}>{c.margem_pct}%</td>
                    <td style={{ padding: '12px 16px', color: MT, textTransform: 'capitalize' }}>{c.marketplace}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 500, color: AC }}>{fmt(c.preco_ideal)}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 500, color: GR }}>{fmt(c.lucro_unidade)}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <button onClick={() => usarCalculo(c)}
                        style={{ padding: '4px 12px', borderRadius: 6, fontSize: 11, background: CARD_BG, color: MT, border: `1px solid ${BD}`, cursor: 'pointer' }}>
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
