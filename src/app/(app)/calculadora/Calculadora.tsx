'use client'
import { useEffect, useMemo, useState, useTransition } from 'react'
import { brl, paraNumero } from '@/lib/formato'
import { aplicarPreco } from './acoes'

type Prod = { id: string; nome: string; custo: number; preco: number }
type Campos = { custo: string; embalagem: string; frete: string; taxa: string; fixa: string; imposto: string; margem: string }

// a lojista informa a taxa de cada canal; guardamos o que ela digitou neste navegador
const CANAIS = [
  { id: 'balcao', nome: 'Balcão (dinheiro / Pix)' },
  { id: 'maquininha', nome: 'Maquininha (cartão)' },
  { id: 'vitrine', nome: 'Vitrine online' },
  { id: 'mercadolivre', nome: 'Mercado Livre' },
  { id: 'shopee', nome: 'Shopee' },
]
const VAZIO: Campos = { custo: '', embalagem: '', frete: '', taxa: '', fixa: '', imposto: '', margem: '30' }
const CHAVE = 'luvy-calc-v1'

function ler(): Record<string, Partial<Campos>> {
  try { return JSON.parse(localStorage.getItem(CHAVE) ?? '{}') } catch { return {} }
}

export function Calculadora({ produtos, podeEditar }: { produtos: Prod[]; podeEditar: boolean }) {
  const [canal, setCanal] = useState('balcao')
  const [c, setC] = useState<Campos>(VAZIO)
  const [prodId, setProdId] = useState('')
  const [msg, setMsg] = useState<{ erro?: string; ok?: string } | null>(null)
  const [pendente, iniciar] = useTransition()

  // carrega taxas salvas do canal (não guarda custo do produto)
  useEffect(() => {
    const salvo = ler()[canal] ?? {}
    setC((x) => ({ ...x, taxa: salvo.taxa ?? '', fixa: salvo.fixa ?? '', imposto: salvo.imposto ?? x.imposto, margem: salvo.margem ?? x.margem }))
  }, [canal])

  function mudar(k: keyof Campos, v: string) {
    setC((x) => ({ ...x, [k]: v }))
    setMsg(null)
    if (['taxa', 'fixa', 'imposto', 'margem'].includes(k)) {
      try { const t = ler(); t[canal] = { ...(t[canal] ?? {}), [k]: v }; localStorage.setItem(CHAVE, JSON.stringify(t)) } catch {}
    }
  }

  function escolherProduto(id: string) {
    setProdId(id)
    const p = produtos.find((x) => x.id === id)
    if (p) setC((x) => ({ ...x, custo: String(p.custo).replace('.', ',') }))
  }

  const r = useMemo(() => {
    const n = (s: string) => paraNumero(s) ?? 0
    const custos = n(c.custo) + n(c.embalagem) + n(c.frete) + n(c.fixa)
    const pct = (n(c.taxa) + n(c.imposto)) / 100
    const margem = n(c.margem) / 100
    const divisor = 1 - pct - margem
    if (n(c.custo) <= 0) return null
    if (divisor <= 0.02) return { erro: 'Taxas + imposto + margem passam de 98%. Reduza a margem.' }
    const preco = Math.ceil((custos / divisor) * 100) / 100
    const descontos = preco * pct
    const lucro = preco - descontos - custos
    // menor preço terminado em ,90 que não fique abaixo do mínimo
    const sugerido = Math.round((Math.ceil(Math.round((preco + 0.1) * 100) / 100) - 0.1) * 100) / 100
    return { preco, lucro, descontos, custos, sugerido }
  }, [c])

  const produto = produtos.find((p) => p.id === prodId)

  function aplicar(valor: number) {
    if (!produto) return
    iniciar(async () => {
      const res = await aplicarPreco(produto.id, valor)
      setMsg(res)
    })
  }

  const campo = (k: keyof Campos, rotulo: string, dica?: string) => (
    <div className="lv-campo">
      <label htmlFor={k}>{rotulo}</label>
      <input id={k} className="lv-input mono" inputMode="decimal" value={c[k]} onChange={(e) => mudar(k, e.target.value)} placeholder="0" />
      {dica && <small>{dica}</small>}
    </div>
  )

  return (
    <div className="lv-grid c2" style={{ alignItems: 'start' }}>
      <div className="lv-card lv-form">
        {produtos.length > 0 && (
          <div className="lv-campo">
            <label htmlFor="prod">Produto do catálogo (opcional)</label>
            <select id="prod" value={prodId} onChange={(e) => escolherProduto(e.target.value)}>
              <option value="">— calcular sem produto —</option>
              {produtos.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
          </div>
        )}
        <div className="lv-campo">
          <span className="lv-rotulo">Onde vai vender</span>
          <div className="lv-chips">
            {CANAIS.map((x) => <button key={x.id} type="button" className={`lv-chip${canal === x.id ? ' on' : ''}`} onClick={() => setCanal(x.id)}>{x.nome}</button>)}
          </div>
        </div>
        <div className="linha">
          {campo('custo', 'Custo do produto (R$)')}
          {campo('embalagem', 'Embalagem (R$)')}
          {campo('frete', 'Frete que você paga (R$)')}
        </div>
        <div className="linha">
          {campo('taxa', 'Taxa do canal (%)', 'Confira a taxa atual no seu contrato.')}
          {campo('fixa', 'Tarifa fixa por venda (R$)')}
          {campo('imposto', 'Imposto (%)', 'Ex.: alíquota do seu Simples.')}
        </div>
        <div className="linha">{campo('margem', 'Lucro que você quer (% do preço)')}</div>
      </div>

      <div className="lv-card" aria-live="polite">
        <h2>Resultado</h2>
        {!r ? <p style={{ color: 'var(--dim)' }}>Informe o custo para calcular.</p> : 'erro' in r ? <p className="lv-msg erro">{r.erro}</p> : (
          <>
            <p style={{ color: 'var(--dim)', fontSize: 14 }}>Preço mínimo para ter o lucro que você quer</p>
            <p style={{ fontSize: 40, fontWeight: 700, letterSpacing: '-.03em' }} className="mono">{brl(r.preco)}</p>
            <div className="lv-lista" style={{ margin: '10px 0 16px' }}>
              <div><span>Custos (produto, embalagem, frete, tarifa)</span><span className="fim">− {brl(r.custos)}</span></div>
              <div><span>Taxa do canal + imposto</span><span className="fim">− {brl(r.descontos)}</span></div>
              <div><strong>Lucro por unidade</strong><span className="fim"><strong style={{ color: 'var(--ok)' }}>{brl(r.lucro)}</strong></span></div>
              <div><span>Preço “redondo” sugerido</span><span className="fim">{brl(r.sugerido)}</span></div>
            </div>
            {produto && (
              <>
                <p style={{ fontSize: 14, marginBottom: 10 }}>
                  Preço atual de <strong>{produto.nome}</strong>: {brl(produto.preco)}
                  {produto.preco > 0 && (() => {
                    const lucroAtual = produto.preco - produto.preco * ((r.descontos / r.preco) || 0) - r.custos
                    return (
                      <span style={{ display: 'block', color: lucroAtual < r.lucro ? 'var(--err)' : 'var(--ok)', fontWeight: 600, marginTop: 4 }}>
                        Hoje ele dá {brl(lucroAtual)} de lucro por unidade ({((lucroAtual / produto.preco) * 100).toFixed(0)}%).
                      </span>
                    )
                  })()}
                </p>
                <div className="lv-acoes">
                  <button className="lv-btn" disabled={!podeEditar || pendente} onClick={() => aplicar(r.preco)}>Aplicar {brl(r.preco)}</button>
                  {r.sugerido >= r.preco && <button className="lv-btn sec" disabled={!podeEditar || pendente} onClick={() => aplicar(r.sugerido)}>Aplicar {brl(r.sugerido)}</button>}
                </div>
              </>
            )}
            {msg?.erro && <p className="lv-msg erro" style={{ marginTop: 10 }}>{msg.erro}</p>}
            {msg?.ok && <p className="lv-msg ok" style={{ marginTop: 10 }}>{msg.ok}</p>}
          </>
        )}
      </div>
    </div>
  )
}
