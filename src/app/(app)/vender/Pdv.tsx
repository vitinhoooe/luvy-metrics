'use client'
import Link from 'next/link'
import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { brl, paraNumero } from '@/lib/formato'
import { CANAIS_PDV, FORMAS_PAGAMENTO } from '@/lib/constantes'
import { finalizarVenda } from './acoes'

export type ProdPdv = { id: string; nome: string; preco: number; quantidade: number; codigo_barras: string | null; categoria: string | null }
type Linha = { p: ProdPdv; qtd: number }

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export function Pdv({ produtos, caixaAberto, podeEditar, simular }: { produtos: ProdPdv[]; caixaAberto: boolean; podeEditar: boolean; simular?: boolean }) {
  const [busca, setBusca] = useState('')
  const [carrinho, setCarrinho] = useState<Linha[]>([])
  const [forma, setForma] = useState<string>('pix')
  const [canal, setCanal] = useState<string>('balcao')
  const [desconto, setDesconto] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [feito, setFeito] = useState<{ numero: number; total: number } | null>(null)
  const [pendente, iniciar] = useTransition()
  const buscaRef = useRef<HTMLInputElement>(null)
  const [estoque, setEstoque] = useState(() => new Map(produtos.map((p) => [p.id, p.quantidade])))
  const [pulo, setPulo] = useState(0)
  const [comemora, setComemora] = useState<{ numero: number; total: number } | null>(null)
  const numeroSimulado = useRef(128)

  useEffect(() => { buscaRef.current?.focus() }, [])

  const resultados = useMemo(() => {
    const t = norm(busca.trim())
    const lista = t ? produtos.filter((p) => norm(p.nome).includes(t) || p.codigo_barras === busca.trim() || norm(p.categoria ?? '').includes(t)) : produtos
    return lista.slice(0, 40)
  }, [busca, produtos])

  const noCarrinho = (id: string) => carrinho.find((l) => l.p.id === id)?.qtd ?? 0
  const disponivel = (p: ProdPdv) => (estoque.get(p.id) ?? 0) - noCarrinho(p.id)

  function adicionar(p: ProdPdv) {
    setFeito(null); setErro(null)
    if (disponivel(p) <= 0) return setErro(`Sem estoque de ${p.nome}.`)
    setCarrinho((c) => {
      const ja = c.find((l) => l.p.id === p.id)
      return ja ? c.map((l) => (l.p.id === p.id ? { ...l, qtd: l.qtd + 1 } : l)) : [...c, { p, qtd: 1 }]
    })
    setPulo((n) => n + 1)
  }
  function mudarQtd(id: string, delta: number) {
    setCarrinho((c) => c.flatMap((l) => {
      if (l.p.id !== id) return [l]
      const q = l.qtd + delta
      if (q <= 0) return []
      if (delta > 0 && (estoque.get(id) ?? 0) < q) { setErro(`Só há ${estoque.get(id)} de ${l.p.nome}.`); return [l] }
      return [{ ...l, qtd: q }]
    }))
  }

  // leitor de código de barras: digita o código + Enter
  function aoEnter(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Enter') return
    e.preventDefault()
    const t = busca.trim()
    const porCodigo = produtos.find((p) => p.codigo_barras && p.codigo_barras === t)
    const alvo = porCodigo ?? (resultados.length === 1 ? resultados[0] : null)
    if (alvo) { adicionar(alvo); setBusca('') }
  }

  const subtotal = carrinho.reduce((s, l) => s + l.qtd * Number(l.p.preco), 0)
  const desc = Math.min(Math.max(paraNumero(desconto) ?? 0, 0), subtotal)
  const total = subtotal - desc

  function finalizar() {
    setErro(null)
    iniciar(async () => {
      const r = simular
        ? { ok: true as const, id: '', numero: ++numeroSimulado.current, total }
        : await finalizarVenda(carrinho.map((l) => ({ produto_id: l.p.id, quantidade: l.qtd, preco_unit: Number(l.p.preco) })), forma, desc, canal)
      if ('erro' in r && r.erro) return setErro(r.erro)
      if ('ok' in r) {
        setEstoque((m) => { const n = new Map(m); carrinho.forEach((l) => n.set(l.p.id, (n.get(l.p.id) ?? 0) - l.qtd)); return n })
        setFeito({ numero: r.numero ?? 0, total: r.total ?? 0 })
        setComemora({ numero: r.numero ?? 0, total: r.total ?? 0 })
        window.setTimeout(() => setComemora(null), 1500)
        setCarrinho([]); setDesconto(''); setBusca('')
        buscaRef.current?.focus()
      }
    })
  }

  if (!produtos.length) {
    return (
      <div className="lv-card lv-vazio">
        <h3>Cadastre produtos para vender</h3>
        <p>O balcão usa o mesmo estoque do catálogo.</p>
        <div className="lv-acoes"><Link href="/produtos/importar" className="lv-btn">Importar planilha</Link><Link href="/produtos/novo" className="lv-btn sec">Cadastrar produto</Link></div>
      </div>
    )
  }

  return (
    <div className="lv-pdv">
      {comemora && (
        <div className="lv-feito-fundo" role="status" aria-live="polite">
          <div className="lv-feito">
            <div className="lv-feito-check">
              <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path pathLength={1} d="M5 12.5l4.5 4.5L19 7.5" /></svg>
            </div>
            <strong>Venda #{comemora.numero} registrada</strong>
            <span>{brl(comemora.total)} · estoque atualizado</span>
          </div>
        </div>
      )}
      <div>
        {!caixaAberto && (
          <div className="lv-aviso" style={{ marginBottom: 12 }}>
            <span>O caixa está fechado. Dá para vender assim mesmo, mas abrir o caixa ajuda a conferir o dinheiro no fim do dia.</span>
            <Link href="/caixa" className="lv-btn sec pq">Abrir caixa</Link>
          </div>
        )}
        <div className="lv-pdv-busca">
          <input
            ref={buscaRef}
            className="lv-input grande"
            placeholder="Buscar produto ou passar o código de barras"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            onKeyDown={aoEnter}
            aria-label="Buscar produto"
            disabled={!podeEditar}
          />
        </div>
        <div className="lv-pdv-res">
          {resultados.map((p) => {
            const d = disponivel(p)
            return (
              <button key={p.id} type="button" className={`lv-prod${noCarrinho(p.id) ? ' sel' : ''}`} onClick={() => adicionar(p)} disabled={!podeEditar || d <= 0}>
                {noCarrinho(p.id) > 0 && <em className="lv-prod-qtd" aria-label={`${noCarrinho(p.id)} na venda`}>{noCarrinho(p.id)}</em>}
                <strong>{p.nome}</strong>
                <span>{d <= 0 ? 'Sem estoque' : `${d} em estoque`}</span>
                <b>{Number(p.preco) > 0 ? brl(p.preco) : 'sem preço'}</b>
              </button>
            )
          })}
        </div>
        {busca && resultados.length === 0 && <p style={{ color: 'var(--dim)', marginTop: 12 }}>Nenhum produto encontrado.</p>}
      </div>

      <aside className="lv-card lv-carrinho" aria-label="Venda atual">
        <h2>Venda atual <small>{carrinho.reduce((s, l) => s + l.qtd, 0)} itens</small></h2>
        {feito && <p className="lv-msg ok" style={{ marginBottom: 10 }}>Venda #{feito.numero} registrada · {brl(feito.total)}</p>}
        {carrinho.length === 0 ? (
          <p style={{ color: 'var(--dim)', fontSize: 14, padding: '8px 0 14px' }}>Toque nos produtos para adicionar.</p>
        ) : (
          carrinho.map((l) => (
            <div key={l.p.id} className="lv-item">
              <strong>{l.p.nome}</strong>
              <span className="mono" style={{ textAlign: 'right' }}>{brl(l.qtd * Number(l.p.preco))}</span>
              <span className="lv-qtd">
                <button type="button" onClick={() => mudarQtd(l.p.id, -1)} aria-label="Menos">−</button>
                <span>{l.qtd}</span>
                <button type="button" onClick={() => mudarQtd(l.p.id, 1)} aria-label="Mais">+</button>
              </span>
              <span style={{ color: 'var(--dim)', fontSize: 13, textAlign: 'right' }}>{brl(l.p.preco)} un.</span>
            </div>
          ))
        )}
        <div className="lv-campo" style={{ marginTop: 12 }}>
          <label htmlFor="desconto">Desconto (R$)</label>
          <input id="desconto" className="lv-input mono" inputMode="decimal" value={desconto} onChange={(e) => setDesconto(e.target.value)} placeholder="0,00" />
        </div>
        <div className="lv-total pulo" key={pulo}><span>Total</span><strong>{brl(total)}</strong></div>
        <div className="lv-canal" role="radiogroup" aria-label="Onde vendeu">
          <span>Onde vendeu</span>
          {CANAIS_PDV.map((c) => (
            <button key={c.id} type="button" role="radio" aria-checked={canal === c.id} className={canal === c.id ? 'on' : ''} onClick={() => setCanal(c.id)}>{c.nome}</button>
          ))}
        </div>
        <div className="lv-pagto" role="radiogroup" aria-label="Forma de pagamento">
          {FORMAS_PAGAMENTO.map((f) => (
            <button key={f.id} type="button" role="radio" aria-checked={forma === f.id} className={`lv-chip${forma === f.id ? ' on' : ''}`} onClick={() => setForma(f.id)}>{f.nome}</button>
          ))}
        </div>
        {erro && <p className="lv-msg erro" role="alert" style={{ marginBottom: 10 }}>{erro}</p>}
        <button className="lv-btn grande cheio" disabled={!podeEditar || pendente || carrinho.length === 0} onClick={finalizar}>
          {pendente ? 'Registrando…' : `Finalizar venda · ${brl(total)}`}
        </button>
        {carrinho.length > 0 && <button className="lv-btn fant cheio" style={{ marginTop: 6 }} onClick={() => setCarrinho([])} disabled={pendente}>Limpar</button>}
      </aside>
    </div>
  )
}
