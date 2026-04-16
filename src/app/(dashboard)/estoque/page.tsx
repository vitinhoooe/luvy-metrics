'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import type { EstoqueItem } from '@/types'

// ─── Cores ────────────────────────────────────────────────────────
const TX  = '#f5f0ff'
const MT  = '#9d8faa'
const MT2 = '#6d6079'
const AC  = '#c840e0'
const GR  = '#34d399'
const RD  = '#ef4444'
const GL  = '#fbbf24'
const BD  = 'rgba(200,64,224,0.15)'

const CARD: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: `1px solid ${BD}`,
  borderRadius: 12,
}
const INP: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)', border: `1px solid ${BD}`,
  borderRadius: 8, padding: '9px 12px', color: TX,
  fontSize: 14, width: '100%', outline: 'none',
}

const CATEGORIAS   = ['Vibradores', 'Géis', 'Plugs', 'Roupas íntimas', 'Acessórios', 'Preservativos', 'Outros']
const MOTIVOS_SAIDA = ['Venda', 'Avaria', 'Outros']

function statusItem(i: EstoqueItem): 'ok' | 'baixo' | 'zerado' {
  if (i.quantidade === 0) return 'zerado'
  if (i.quantidade <= i.quantidade_minima) return 'baixo'
  return 'ok'
}

const STATUS_STYLE: Record<string, React.CSSProperties> = {
  ok:     { background: 'rgba(52,211,153,0.12)',  color: GR, border: '1px solid rgba(52,211,153,0.25)'  },
  baixo:  { background: 'rgba(251,191,36,0.12)',  color: GL, border: '1px solid rgba(251,191,36,0.25)'  },
  zerado: { background: 'rgba(239,68,68,0.12)',   color: RD, border: '1px solid rgba(239,68,68,0.25)'   },
}
const STATUS_LABEL = { ok: '● OK', baixo: '● Baixo', zerado: '● Zerado' }

function fmt(v: number) { return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block mb-1" style={{ fontSize: 11, color: MT, fontWeight: 500 }}>{children}</label>
}

// ─── Modal produto (adicionar / editar) ───────────────────────────
function ModalProduto({ item, onFechar, onSalvar }: {
  item?: EstoqueItem; onFechar: () => void; onSalvar: () => void
}) {
  const [nome,      setNome]      = useState(item?.produto_nome ?? '')
  const [qtd,       setQtd]       = useState(item?.quantidade ?? 0)
  const [qtdMin,    setQtdMin]    = useState(item?.quantidade_minima ?? 5)
  const [custo,     setCusto]     = useState(item?.preco_custo ?? 0)
  const [venda,     setVenda]     = useState(item?.preco_venda ?? 0)
  const [cat,       setCat]       = useState(item?.categoria ?? '')
  const [autoPreco, setAutoPreco] = useState(false)
  const [margem,    setMargem]    = useState(40)
  const [saving,    setSaving]    = useState(false)

  useEffect(() => {
    if (!autoPreco || custo <= 0) return
    const tot = 0.12 + margem / 100
    if (tot < 1) setVenda(Number((custo / (1 - tot)).toFixed(2)))
  }, [autoPreco, custo, margem])

  async function salvar() {
    if (!nome.trim()) { toast.error('Informe o nome do produto'); return }
    setSaving(true)
    try {
      const body = { produto_nome: nome, quantidade: qtd, quantidade_minima: qtdMin, preco_custo: custo, preco_venda: venda, categoria: cat }
      const res  = await fetch('/api/estoque', {
        method: item ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item ? { id: item.id, ...body } : body),
      })
      if (res.ok) { toast.success(item ? 'Produto atualizado!' : 'Produto adicionado!'); onSalvar() }
      else toast.error('Erro ao salvar produto')
    } catch { toast.error('Erro interno') }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div style={{ ...CARD, padding: 24, width: '100%', maxWidth: 480 }} className="shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <p className="font-semibold" style={{ color: TX }}>{item ? 'Editar produto' : 'Adicionar produto'}</p>
          <button onClick={onFechar} style={{ color: MT, fontSize: 18, lineHeight: 1 }}
            className="hover:text-white transition-colors">✕</button>
        </div>

        <div className="space-y-4">
          <div>
            <Label>Nome do produto *</Label>
            <input value={nome} onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Vibrador Silicone USB" style={INP} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Quantidade atual</Label>
              <input type="number" value={qtd} onChange={(e) => setQtd(Number(e.target.value))} min={0} style={INP} />
            </div>
            <div>
              <Label>Quantidade mínima</Label>
              <input type="number" value={qtdMin} onChange={(e) => setQtdMin(Number(e.target.value))} min={1} style={INP} />
            </div>
          </div>

          <div>
            <Label>Categoria</Label>
            <select value={cat} onChange={(e) => setCat(e.target.value)} style={INP}>
              <option value="">Selecione...</option>
              {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <Label>Preço de custo (R$)</Label>
            <input type="number" value={custo || ''} onChange={(e) => setCusto(Number(e.target.value))} step={0.01} min={0} style={INP} />
          </div>

          {/* Toggle preço automático */}
          <div className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${BD}` }}>
            <div className="flex items-center justify-between mb-2">
              <div>
                <p style={{ fontSize: 13, color: TX, fontWeight: 500 }}>Calcular preço automaticamente</p>
                <p style={{ fontSize: 11, color: MT, marginTop: 2 }}>Taxa ML 12% + margem sobre o custo</p>
              </div>
              <button onClick={() => setAutoPreco(!autoPreco)}
                className="w-10 h-5 rounded-full flex items-center px-0.5 transition-colors flex-shrink-0"
                style={{ background: autoPreco ? AC : 'rgba(255,255,255,0.1)' }}>
                <div className="w-3.5 h-3.5 rounded-full bg-white transition-transform"
                  style={{ transform: autoPreco ? 'translateX(18px)' : 'translateX(0)' }} />
              </button>
            </div>
            {autoPreco && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span style={{ fontSize: 11, color: MT }}>Margem desejada</span>
                  <span style={{ fontSize: 12, color: AC, fontWeight: 600 }}>{margem}%</span>
                </div>
                <input type="range" min={10} max={80} value={margem}
                  onChange={(e) => setMargem(Number(e.target.value))}
                  className="w-full" />
              </div>
            )}
          </div>

          <div>
            <Label>Preço de venda (R$)</Label>
            <input type="number" value={venda || ''} onChange={(e) => setVenda(Number(e.target.value))}
              step={0.01} min={0} disabled={autoPreco}
              style={{ ...INP, opacity: autoPreco ? 0.6 : 1 }} />
          </div>
        </div>

        <div className="flex gap-2 mt-5">
          <button onClick={onFechar} className="flex-1 py-2.5 rounded-lg text-sm transition-colors"
            style={{ border: `1px solid ${BD}`, color: MT }}>Cancelar</button>
          <button onClick={salvar} disabled={saving}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: AC }}>{saving ? 'Salvando...' : 'Salvar'}</button>
        </div>
      </div>
    </div>
  )
}

// ─── Modal movimentação ───────────────────────────────────────────
function ModalMov({ item, tipo, onFechar, onSalvar }: {
  item: EstoqueItem; tipo: 'entrada' | 'saida'; onFechar: () => void; onSalvar: () => void
}) {
  const [qtd,    setQtd]    = useState(1)
  const [obs,    setObs]    = useState('')
  const [motivo, setMotivo] = useState('Venda')
  const [saving, setSaving] = useState(false)

  const isEntrada = tipo === 'entrada'

  async function salvar() {
    if (qtd <= 0) { toast.error('Informe uma quantidade válida'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/estoque', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: item.id, tipo, quantidade: qtd,
          observacao: !isEntrada ? `${motivo}: ${obs}`.trim() : obs,
        }),
      })
      if (res.ok) {
        toast.success(isEntrada ? `+${qtd} unidades adicionadas!` : `${qtd} unidades registradas como saída!`)
        onSalvar()
      } else {
        toast.error('Erro ao registrar movimentação')
      }
    } catch { toast.error('Erro interno') }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div style={{ ...CARD, padding: 24, width: '100%', maxWidth: 360 }} className="shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <p className="font-semibold" style={{ color: TX }}>
            {isEntrada ? '+ Entrada de estoque' : '− Saída de estoque'}
          </p>
          <button onClick={onFechar} style={{ color: MT, fontSize: 18, lineHeight: 1 }}>✕</button>
        </div>

        <p className="text-sm mb-4 px-3 py-2 rounded-lg"
          style={{ color: MT, background: 'rgba(255,255,255,0.04)', border: `1px solid ${BD}` }}>
          {item.produto_nome}
        </p>

        <div className="space-y-3">
          <div>
            <Label>Quantidade</Label>
            <input type="number" value={qtd} onChange={(e) => setQtd(Number(e.target.value))} min={1} style={INP} />
          </div>
          {!isEntrada && (
            <div>
              <Label>Motivo</Label>
              <select value={motivo} onChange={(e) => setMotivo(e.target.value)} style={INP}>
                {MOTIVOS_SAIDA.map((m) => <option key={m}>{m}</option>)}
              </select>
            </div>
          )}
          <div>
            <Label>Observação (opcional)</Label>
            <input value={obs} onChange={(e) => setObs(e.target.value)}
              placeholder={isEntrada ? 'Ex: Compra fornecedor X' : 'Detalhes adicionais'}
              style={INP} />
          </div>
        </div>

        <div className="flex gap-2 mt-5">
          <button onClick={onFechar} className="flex-1 py-2.5 rounded-lg text-sm"
            style={{ border: `1px solid ${BD}`, color: MT }}>Cancelar</button>
          <button onClick={salvar} disabled={saving}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: isEntrada ? GR : RD }}>
            {saving ? 'Salvando...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────
export default function EstoquePage() {
  const [itens,    setItens]    = useState<EstoqueItem[]>([])
  const [loading,  setLoading]  = useState(true)
  const [modal,    setModal]    = useState<'add' | 'edit' | null>(null)
  const [itemEdit, setItemEdit] = useState<EstoqueItem | null>(null)
  const [mov,      setMov]      = useState<{ item: EstoqueItem; tipo: 'entrada' | 'saida' } | null>(null)

  const buscar = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/estoque')
      if (res.ok) setItens(await res.json())
    } catch { toast.error('Erro ao carregar estoque') }
    setLoading(false)
  }, [])

  useEffect(() => { buscar() }, [buscar])

  async function remover(id: string) {
    if (!confirm('Remover este produto do estoque?')) return
    try {
      const res = await fetch('/api/estoque', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (res.ok) { toast.success('Produto removido'); buscar() }
      else toast.error('Erro ao remover')
    } catch { toast.error('Erro interno') }
  }

  function exportarCSV() {
    const cab  = ['Produto', 'Qtd', 'Qtd mínima', 'Custo', 'Venda', 'Margem', 'Categoria', 'Status']
    const rows = itens.map((i) => [
      i.produto_nome, i.quantidade, i.quantidade_minima,
      i.preco_custo, i.preco_venda,
      i.preco_custo > 0 ? (((i.preco_venda - i.preco_custo) / i.preco_venda) * 100).toFixed(1) + '%' : '—',
      i.categoria, statusItem(i),
    ])
    const csv = [cab, ...rows].map((r) => r.join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
    const a   = document.createElement('a')
    a.href = url; a.download = 'estoque.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const totalProdutos = itens.length
  const baixos        = itens.filter((i) => statusItem(i) !== 'ok').length
  const valorTotal    = itens.reduce((a, i) => a + (i.preco_custo ?? 0) * i.quantidade, 0)

  return (
    <>
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: TX }}>Gestão de Estoque</h1>
          <p style={{ fontSize: 13, color: MT, marginTop: 4 }}>Controle suas entradas e saídas em tempo real</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportarCSV}
            className="px-4 py-2 rounded-lg text-sm transition-colors"
            style={{ border: `1px solid ${BD}`, color: MT }}
            onMouseEnter={(e) => { e.currentTarget.style.color = TX }}
            onMouseLeave={(e) => { e.currentTarget.style.color = MT }}>
            Exportar CSV
          </button>
          <button onClick={() => setModal('add')}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
            style={{ background: AC }}>
            + Adicionar produto
          </button>
        </div>
      </div>

      {/* Cards resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total de produtos',      valor: totalProdutos.toString(), cor: TX,  alerta: false },
          { label: 'Estoque baixo / zerado', valor: baixos.toString(),        cor: RD,  alerta: baixos > 0 },
          { label: 'Valor total em estoque', valor: fmt(valorTotal),          cor: GR,  alerta: false },
        ].map((c) => (
          <div key={c.label} style={{
            ...CARD,
            padding: '20px 24px',
            ...(c.alerta ? { background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.25)' } : {}),
          }}>
            <p style={{ fontSize: 11, color: MT, fontWeight: 500 }}>{c.label}</p>
            <p className="mt-2 font-bold" style={{ fontSize: 24, color: c.cor }}>{c.valor}</p>
          </div>
        ))}
      </div>

      {/* Tabela */}
      <div style={{ ...CARD, overflow: 'hidden' }}>
        <div className="px-6 py-4" style={{ borderBottom: `1px solid ${BD}` }}>
          <p className="font-semibold" style={{ color: TX }}>Produtos em estoque</p>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <div className="h-5 rounded animate-pulse flex-1" style={{ background: 'rgba(255,255,255,0.06)' }} />
                <div className="h-5 rounded animate-pulse w-16" style={{ background: 'rgba(255,255,255,0.06)' }} />
                <div className="h-5 rounded animate-pulse w-16" style={{ background: 'rgba(255,255,255,0.06)' }} />
                <div className="h-5 rounded animate-pulse w-24" style={{ background: 'rgba(255,255,255,0.06)' }} />
              </div>
            ))}
          </div>
        ) : itens.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-4xl mb-3">📦</p>
            <p style={{ color: MT, fontSize: 14 }}>Nenhum produto cadastrado ainda.</p>
            <button onClick={() => setModal('add')} className="mt-4 px-4 py-2 rounded-lg text-sm font-medium"
              style={{ background: 'rgba(200,64,224,0.12)', color: AC, border: `1px solid ${BD}` }}>
              Adicionar primeiro produto
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full" style={{ fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: `1px solid ${BD}` }}>
                  {['Produto', 'Qtd atual', 'Qtd mínima', 'Custo', 'Venda', 'Margem', 'Status', 'Ações'].map((col) => (
                    <th key={col} className="text-left px-5 py-3"
                      style={{ fontSize: 11, color: MT, fontWeight: 500 }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {itens.map((item) => {
                  const st     = statusItem(item)
                  const margem = item.preco_venda > 0 && item.preco_custo > 0
                    ? (((item.preco_venda - item.preco_custo) / item.preco_venda) * 100).toFixed(0) + '%'
                    : '—'
                  return (
                    <tr key={item.id} style={{ borderTop: `1px solid ${BD}` }}>
                      <td className="px-5 py-3">
                        <button onClick={() => { setItemEdit(item); setModal('edit') }}
                          className="font-medium text-left hover:underline"
                          style={{ color: TX }}>
                          {item.produto_nome}
                        </button>
                        {item.categoria && (
                          <p style={{ fontSize: 11, color: MT2, marginTop: 1 }}>{item.categoria}</p>
                        )}
                      </td>
                      <td className="px-5 py-3 font-semibold" style={{
                        color: st === 'zerado' ? RD : st === 'baixo' ? GL : TX,
                      }}>{item.quantidade}</td>
                      <td className="px-5 py-3" style={{ color: MT }}>{item.quantidade_minima}</td>
                      <td className="px-5 py-3" style={{ color: MT }}>{item.preco_custo ? fmt(item.preco_custo) : '—'}</td>
                      <td className="px-5 py-3" style={{ color: TX }}>{item.preco_venda ? fmt(item.preco_venda) : '—'}</td>
                      <td className="px-5 py-3 font-medium" style={{ color: GR }}>{margem}</td>
                      <td className="px-5 py-3">
                        <span className="px-2 py-0.5 rounded-md text-xs font-medium" style={STATUS_STYLE[st]}>
                          {STATUS_LABEL[st]}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => setMov({ item, tipo: 'entrada' })}
                            className="px-2.5 py-1 rounded-lg text-xs font-medium"
                            style={{ background: 'rgba(52,211,153,0.12)', color: GR, border: '1px solid rgba(52,211,153,0.25)' }}>
                            + Entrada
                          </button>
                          <button onClick={() => setMov({ item, tipo: 'saida' })}
                            className="px-2.5 py-1 rounded-lg text-xs font-medium"
                            style={{ background: 'rgba(239,68,68,0.12)', color: RD, border: '1px solid rgba(239,68,68,0.25)' }}>
                            − Saída
                          </button>
                          <button onClick={() => { setItemEdit(item); setModal('edit') }}
                            className="p-1.5 rounded-lg transition-colors" title="Editar"
                            style={{ color: MT }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = TX)}
                            onMouseLeave={(e) => (e.currentTarget.style.color = MT)}>
                            ✏️
                          </button>
                          <button onClick={() => remover(item.id)}
                            className="p-1.5 rounded-lg transition-colors" title="Remover"
                            style={{ color: MT }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = RD)}
                            onMouseLeave={(e) => (e.currentTarget.style.color = MT)}>
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modais */}
      {modal && (
        <ModalProduto
          item={modal === 'edit' ? (itemEdit ?? undefined) : undefined}
          onFechar={() => { setModal(null); setItemEdit(null) }}
          onSalvar={() => { setModal(null); setItemEdit(null); buscar() }}
        />
      )}
      {mov && (
        <ModalMov item={mov.item} tipo={mov.tipo}
          onFechar={() => setMov(null)}
          onSalvar={() => { setMov(null); buscar() }} />
      )}
    </>
  )
}
