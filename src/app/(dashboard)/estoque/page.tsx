'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import type { EstoqueItem } from '@/types'

const TX  = '#f0ebff'
const MT  = '#8b7fa0'
const AC  = '#c840e0'
const GR  = '#34d399'
const RD  = '#ef4444'
const GL  = '#fbbf24'
const BD  = 'rgba(200,64,224,0.18)'
const CARD_BG = 'rgba(255,255,255,0.04)'
const BTN_PRI = '#9333ea'

const CARD: React.CSSProperties = { background: CARD_BG, border: `1px solid ${BD}`, borderRadius: 12 }
const INP: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)', border: `1px solid ${BD}`,
  borderRadius: 8, padding: '9px 12px', color: TX,
  fontSize: 14, width: '100%', outline: 'none',
}

const CATEGORIAS    = ['Vibradores', 'Géis', 'Plugs', 'Roupas íntimas', 'Acessórios', 'Preservativos', 'Outros']
const MOTIVOS_SAIDA = ['Venda', 'Avaria', 'Outros']

function statusItem(i: EstoqueItem): 'ok' | 'baixo' | 'zerado' {
  if (i.quantidade === 0) return 'zerado'
  if (i.quantidade <= i.quantidade_minima) return 'baixo'
  return 'ok'
}

const STATUS_STYLE: Record<string, React.CSSProperties> = {
  ok:     { background: 'rgba(52,211,153,0.12)',  color: GR, border: '1px solid rgba(52,211,153,0.25)', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600 },
  baixo:  { background: 'rgba(251,191,36,0.12)',  color: GL, border: '1px solid rgba(251,191,36,0.25)', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600 },
  zerado: { background: 'rgba(239,68,68,0.12)',   color: RD, border: '1px solid rgba(239,68,68,0.25)', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600 },
}
const STATUS_LABEL = { ok: '● OK', baixo: '● Baixo', zerado: '● Zerado' }

function fmt(v: number) { return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }

function Label({ children }: { children: React.ReactNode }) {
  return <label style={{ display: 'block', fontSize: 11, color: MT, fontWeight: 500, marginBottom: 4 }}>{children}</label>
}

// ─── Modal produto ───────────────────────────────────────────────
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
      const res = await fetch('/api/estoque', {
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
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ ...CARD, padding: 24, width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <p style={{ fontWeight: 600, color: TX }}>{item ? 'Editar produto' : 'Adicionar produto'}</p>
          <button onClick={onFechar} style={{ color: MT, fontSize: 18, lineHeight: 1, background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div><Label>Nome do produto *</Label><input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Vibrador Silicone USB" style={INP} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><Label>Quantidade atual</Label><input type="number" value={qtd} onChange={e => setQtd(Number(e.target.value))} min={0} style={INP} /></div>
            <div><Label>Quantidade mínima</Label><input type="number" value={qtdMin} onChange={e => setQtdMin(Number(e.target.value))} min={1} style={INP} /></div>
          </div>
          <div><Label>Categoria</Label><select value={cat} onChange={e => setCat(e.target.value)} style={INP}><option value="">Selecione...</option>{CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
          <div><Label>Preço de custo (R$)</Label><input type="number" value={custo || ''} onChange={e => setCusto(Number(e.target.value))} step={0.01} min={0} style={INP} /></div>
          <div style={{ padding: 12, borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: `1px solid ${BD}` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: autoPreco ? 8 : 0 }}>
              <div>
                <p style={{ fontSize: 13, color: TX, fontWeight: 500 }}>Calcular preço automaticamente</p>
                <p style={{ fontSize: 11, color: MT, marginTop: 2 }}>Taxa ML 12% + margem</p>
              </div>
              <button onClick={() => setAutoPreco(!autoPreco)} style={{ width: 40, height: 22, borderRadius: 11, display: 'flex', alignItems: 'center', padding: '0 2px', background: autoPreco ? AC : 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer' }}>
                <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'transform 0.15s', transform: autoPreco ? 'translateX(18px)' : 'translateX(0)' }} />
              </button>
            </div>
            {autoPreco && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: MT }}>Margem desejada</span>
                  <span style={{ fontSize: 12, color: AC, fontWeight: 600 }}>{margem}%</span>
                </div>
                <input type="range" min={10} max={80} value={margem} onChange={e => setMargem(Number(e.target.value))} style={{ width: '100%' }} />
              </div>
            )}
          </div>
          <div><Label>Preço de venda (R$)</Label><input type="number" value={venda || ''} onChange={e => setVenda(Number(e.target.value))} step={0.01} min={0} disabled={autoPreco} style={{ ...INP, opacity: autoPreco ? 0.6 : 1 }} /></div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
          <button onClick={onFechar} style={{ flex: 1, padding: '10px', borderRadius: 8, fontSize: 14, border: `1px solid ${BD}`, color: MT, background: 'transparent', cursor: 'pointer' }}>Cancelar</button>
          <button onClick={salvar} disabled={saving} style={{ flex: 1, padding: '10px', borderRadius: 8, fontSize: 14, fontWeight: 600, color: '#fff', background: BTN_PRI, border: 'none', cursor: 'pointer', opacity: saving ? 0.5 : 1 }}>{saving ? 'Salvando...' : 'Salvar'}</button>
        </div>
      </div>
    </div>
  )
}

// ─── Modal movimentação ──────────────────────────────────────────
function ModalMov({ item, tipo, onFechar, onSalvar }: {
  item: EstoqueItem; tipo: 'entrada' | 'saida'; onFechar: () => void; onSalvar: () => void
}) {
  const [qtd, setQtd] = useState(1)
  const [obs, setObs] = useState('')
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
        body: JSON.stringify({ id: item.id, tipo, quantidade: qtd, observacao: !isEntrada ? `${motivo}: ${obs}`.trim() : obs }),
      })
      if (res.ok) { toast.success(isEntrada ? `+${qtd} unidades adicionadas!` : `${qtd} unidades registradas como saída!`); onSalvar() }
      else toast.error('Erro ao registrar movimentação')
    } catch { toast.error('Erro interno') }
    setSaving(false)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ ...CARD, padding: 24, width: '100%', maxWidth: 360 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <p style={{ fontWeight: 600, color: TX }}>{isEntrada ? '+ Entrada de estoque' : '− Saída de estoque'}</p>
          <button onClick={onFechar} style={{ color: MT, fontSize: 18, lineHeight: 1, background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
        </div>
        <p style={{ fontSize: 14, color: MT, marginBottom: 16, padding: '8px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: `1px solid ${BD}` }}>{item.produto_nome}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div><Label>Quantidade</Label><input type="number" value={qtd} onChange={e => setQtd(Number(e.target.value))} min={1} style={INP} /></div>
          {!isEntrada && <div><Label>Motivo</Label><select value={motivo} onChange={e => setMotivo(e.target.value)} style={INP}>{MOTIVOS_SAIDA.map(m => <option key={m}>{m}</option>)}</select></div>}
          <div><Label>Observação (opcional)</Label><input value={obs} onChange={e => setObs(e.target.value)} placeholder={isEntrada ? 'Ex: Compra fornecedor X' : 'Detalhes adicionais'} style={INP} /></div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
          <button onClick={onFechar} style={{ flex: 1, padding: '10px', borderRadius: 8, fontSize: 14, border: `1px solid ${BD}`, color: MT, background: 'transparent', cursor: 'pointer' }}>Cancelar</button>
          <button onClick={salvar} disabled={saving} style={{ flex: 1, padding: '10px', borderRadius: 8, fontSize: 14, fontWeight: 600, color: '#fff', background: isEntrada ? GR : RD, border: 'none', cursor: 'pointer', opacity: saving ? 0.5 : 1 }}>{saving ? 'Salvando...' : 'Confirmar'}</button>
        </div>
      </div>
    </div>
  )
}

// ─── Página principal ────────────────────────────────────────────
export default function EstoquePage() {
  const [itens, setItens] = useState<EstoqueItem[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<'add' | 'edit' | null>(null)
  const [itemEdit, setItemEdit] = useState<EstoqueItem | null>(null)
  const [mov, setMov] = useState<{ item: EstoqueItem; tipo: 'entrada' | 'saida' } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const buscar = useCallback(async () => {
    setLoading(true)
    try { const res = await fetch('/api/estoque'); if (res.ok) setItens(await res.json()) }
    catch { toast.error('Erro ao carregar estoque') }
    setLoading(false)
  }, [])

  useEffect(() => { buscar() }, [buscar])

  async function remover(id: string) {
    if (!confirm('Remover este produto do estoque?')) return
    try {
      const res = await fetch('/api/estoque', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
      if (res.ok) { toast.success('Produto removido'); buscar() } else toast.error('Erro ao remover')
    } catch { toast.error('Erro interno') }
  }

  // ─── CSV Export ────────────────────────────────────────────────
  function exportarCSV() {
    const cab = ['Nome', 'Quantidade', 'Qtd Mínima', 'Preço Custo', 'Preço Venda', 'Margem', 'Categoria', 'Status']
    const rows = itens.map(i => [
      `"${i.produto_nome}"`, i.quantidade, i.quantidade_minima,
      i.preco_custo?.toFixed(2) ?? '0', i.preco_venda?.toFixed(2) ?? '0',
      i.preco_custo > 0 ? (((i.preco_venda - i.preco_custo) / i.preco_venda) * 100).toFixed(1) + '%' : '—',
      i.categoria || '', statusItem(i),
    ])
    const csv = [cab, ...rows].map(r => r.join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }))
    a.download = `estoque_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
  }

  // ─── CSV Template ──────────────────────────────────────────────
  function baixarTemplate() {
    const csv = `Nome,Quantidade,Qtd Mínima,Preço Custo,Preço Venda,Categoria\n"Vibrador Silicone USB",10,5,45.00,89.90,Vibradores\n"Gel Lubrificante 100ml",25,10,8.50,19.90,Géis`
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }))
    a.download = 'template_estoque.csv'
    a.click()
  }

  // ─── CSV Import ────────────────────────────────────────────────
  async function importarCSV(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
    if (lines.length < 2) { toast.error('CSV vazio ou sem dados'); return }

    const header = lines[0].toLowerCase()
    if (!header.includes('nome')) { toast.error('CSV inválido — cabeçalho deve conter "Nome"'); return }

    let importados = 0
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].match(/(".*?"|[^,]+)/g)?.map(c => c.replace(/^"|"$/g, '').trim()) || []
      if (cols.length < 4) continue
      const body = {
        produto_nome: cols[0],
        quantidade: parseInt(cols[1]) || 0,
        quantidade_minima: parseInt(cols[2]) || 5,
        preco_custo: parseFloat(cols[3]) || 0,
        preco_venda: parseFloat(cols[4]) || 0,
        categoria: cols[5] || '',
      }
      try {
        const res = await fetch('/api/estoque', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (res.ok) importados++
      } catch {}
    }
    toast.success(`${importados} produtos importados!`)
    buscar()
    if (fileRef.current) fileRef.current.value = ''
  }

  const totalProdutos = itens.length
  const baixos = itens.filter(i => statusItem(i) !== 'ok').length
  const valorTotal = itens.reduce((a, i) => a + (i.preco_custo ?? 0) * i.quantidade, 0)

  return (
    <>
      {/* Cabeçalho */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: TX, letterSpacing: '-0.5px', marginBottom: 4 }}>Gestão de Estoque</h1>
          <p style={{ fontSize: 14, color: MT }}>Controle suas entradas e saídas em tempo real</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={baixarTemplate} style={{ padding: '8px 16px', borderRadius: 8, fontSize: 13, border: `1px solid ${BD}`, color: MT, background: 'transparent', cursor: 'pointer' }}>
            📋 Template CSV
          </button>
          <label style={{ padding: '8px 16px', borderRadius: 8, fontSize: 13, border: `1px solid ${BD}`, color: MT, background: 'transparent', cursor: 'pointer' }}>
            📥 Importar CSV
            <input ref={fileRef} type="file" accept=".csv" onChange={importarCSV} style={{ display: 'none' }} />
          </label>
          <button onClick={exportarCSV} style={{ padding: '8px 16px', borderRadius: 8, fontSize: 13, border: `1px solid ${BD}`, color: MT, background: 'transparent', cursor: 'pointer' }}>
            📤 Exportar CSV
          </button>
          <button onClick={() => setModal('add')} style={{ padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#fff', background: BTN_PRI, border: 'none', cursor: 'pointer' }}>
            + Adicionar produto
          </button>
        </div>
      </div>

      {/* Cards resumo — grid 3 colunas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total de produtos', valor: totalProdutos.toString(), cor: TX, alerta: false },
          { label: 'Estoque baixo / zerado', valor: baixos.toString(), cor: RD, alerta: baixos > 0 },
          { label: 'Valor total em estoque', valor: fmt(valorTotal), cor: GR, alerta: false },
        ].map(c => (
          <div key={c.label} style={{
            ...CARD, padding: '20px 24px',
            ...(c.alerta ? { background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.25)' } : {}),
          }}>
            <p style={{ fontSize: 11, color: MT, fontWeight: 500, marginBottom: 8 }}>{c.label}</p>
            <p style={{ fontSize: 24, fontWeight: 800, color: c.cor }}>{c.valor}</p>
          </div>
        ))}
      </div>

      {/* Tabela */}
      <div style={{ ...CARD, overflow: 'hidden' }}>
        <div style={{ padding: '16px 24px', borderBottom: `1px solid ${BD}` }}>
          <p style={{ fontWeight: 600, color: TX }}>Produtos em estoque</p>
        </div>

        {loading ? (
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ display: 'flex', gap: 12 }}>
                <div style={{ height: 20, borderRadius: 4, flex: 1, background: 'rgba(255,255,255,0.06)' }} />
                <div style={{ height: 20, borderRadius: 4, width: 60, background: 'rgba(255,255,255,0.06)' }} />
                <div style={{ height: 20, borderRadius: 4, width: 60, background: 'rgba(255,255,255,0.06)' }} />
                <div style={{ height: 20, borderRadius: 4, width: 80, background: 'rgba(255,255,255,0.06)' }} />
              </div>
            ))}
          </div>
        ) : itens.length === 0 ? (
          <div style={{ padding: '60px 0', textAlign: 'center' }}>
            <p style={{ fontSize: 40, marginBottom: 12 }}>📦</p>
            <p style={{ color: MT, fontSize: 14, marginBottom: 16 }}>Nenhum produto cadastrado ainda.</p>
            <button onClick={() => setModal('add')} style={{ padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500, background: 'rgba(200,64,224,0.12)', color: AC, border: `1px solid ${BD}`, cursor: 'pointer' }}>
              Adicionar primeiro produto
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(147,51,234,0.06)', borderBottom: `1px solid ${BD}` }}>
                  {['Produto', 'Qtd atual', 'Qtd mínima', 'Custo', 'Venda', 'Margem', 'Status', 'Ações'].map(col => (
                    <th key={col} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 11, color: MT, fontWeight: 500 }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {itens.map(item => {
                  const st = statusItem(item)
                  const margem = item.preco_venda > 0 && item.preco_custo > 0
                    ? (((item.preco_venda - item.preco_custo) / item.preco_venda) * 100).toFixed(0) + '%'
                    : '—'
                  return (
                    <tr key={item.id} style={{ borderTop: `1px solid ${BD}` }}>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontWeight: 500, color: TX, cursor: 'pointer' }} onClick={() => { setItemEdit(item); setModal('edit') }}>
                          {item.produto_nome}
                        </span>
                        {item.categoria && <p style={{ fontSize: 11, color: MT, marginTop: 2 }}>{item.categoria}</p>}
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: st === 'zerado' ? RD : st === 'baixo' ? GL : TX }}>{item.quantidade}</td>
                      <td style={{ padding: '12px 16px', color: MT }}>{item.quantidade_minima}</td>
                      <td style={{ padding: '12px 16px', color: MT }}>{item.preco_custo ? fmt(item.preco_custo) : '—'}</td>
                      <td style={{ padding: '12px 16px', color: TX }}>{item.preco_venda ? fmt(item.preco_venda) : '—'}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 500, color: GR }}>{margem}</td>
                      <td style={{ padding: '12px 16px' }}><span style={STATUS_STYLE[st]}>{STATUS_LABEL[st]}</span></td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <button onClick={() => setMov({ item, tipo: 'entrada' })} style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 500, background: 'rgba(52,211,153,0.12)', color: GR, border: '1px solid rgba(52,211,153,0.25)', cursor: 'pointer' }}>+ Entrada</button>
                          <button onClick={() => setMov({ item, tipo: 'saida' })} style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 500, background: 'rgba(239,68,68,0.12)', color: RD, border: '1px solid rgba(239,68,68,0.25)', cursor: 'pointer' }}>− Saída</button>
                          <button onClick={() => { setItemEdit(item); setModal('edit') }} title="Editar" style={{ padding: 4, background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>✏️</button>
                          <button onClick={() => remover(item.id)} title="Remover" style={{ padding: 4, background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>🗑️</button>
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
