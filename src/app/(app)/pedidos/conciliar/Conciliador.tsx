'use client'
import Link from 'next/link'
import { useRef, useState, useTransition } from 'react'
import { brl, data as dataBr, num } from '@/lib/formato'
import { lerExtrato, type Lancamento } from '@/lib/extrato'
import { conciliar, type ResultadoConciliacao } from './acoes'

type PedidoAberto = { numero: number; cliente: string; valor_pix: number }

/** Arrasta o extrato → acha os Pix recebidos → confirma os pedidos de valor igual. `exemplo`: prévia sem banco. */
export function Conciliador({ podeEditar, exemplo, voltar = '/pedidos' }: { podeEditar: boolean; exemplo?: PedidoAberto[]; voltar?: string }) {
  const [arquivo, setArquivo] = useState<string | null>(null)
  const [lanc, setLanc] = useState<Lancamento[] | null>(null)
  const [res, setRes] = useState<ResultadoConciliacao | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [sobre, setSobre] = useState(false)
  const [pendente, iniciar] = useTransition()
  const input = useRef<HTMLInputElement>(null)

  async function ler(f: File) {
    setErro(null); setRes(null)
    if (f.size > 5 * 1024 * 1024) return setErro('Arquivo grande demais (máx. 5 MB).')
    const buf = await f.arrayBuffer()
    // bancos usam UTF-8 ou Latin-1; tenta os dois
    let texto = new TextDecoder('utf-8').decode(buf)
    if (texto.includes('�')) texto = new TextDecoder('windows-1252').decode(buf)
    const l = lerExtrato(f.name, texto)
    setArquivo(f.name)
    setLanc(l)
    if (!l.length) setErro('Não achamos entradas de dinheiro nesse arquivo. Exporte o extrato em OFX (ou CSV) pelo app ou site do banco.')
  }

  function usarExemplo() {
    if (!exemplo) return
    setArquivo('extrato-exemplo.ofx')
    setErro(null); setRes(null)
    setLanc([
      ...exemplo.slice(0, -1).map((p, i) => ({ chave: `ex${i}`, valor: p.valor_pix, data: new Date().toISOString().slice(0, 10), descricao: `PIX RECEBIDO ${p.cliente.toUpperCase()}` })),
      { chave: 'exX', valor: 63.4, data: new Date().toISOString().slice(0, 10), descricao: 'PIX RECEBIDO SEM PEDIDO' },
    ])
  }

  function conferir() {
    if (!lanc?.length) return
    iniciar(async () => {
      if (exemplo) {
        const ok = exemplo.filter((p) => lanc.some((l) => Math.abs(l.valor - p.valor_pix) < 0.001))
        const sem = lanc.filter((l) => !exemplo.some((p) => Math.abs(l.valor - p.valor_pix) < 0.001))
        setRes({ confirmados: ok.map((p) => ({ numero: p.numero, cliente: p.cliente, valor: p.valor_pix })), sem_pedido: sem.map((l) => ({ valor: l.valor, data: l.data, descricao: l.descricao })), repetidos: 0, falhas: [], pendentes: exemplo.length - ok.length })
        return
      }
      const r = await conciliar(lanc)
      if (r.erro) return setErro(r.erro)
      if (r.resultado) setRes(r.resultado)
    })
  }

  const total = lanc?.reduce((s, l) => s + l.valor, 0) ?? 0

  return (
    <div className="lv-grid" style={{ maxWidth: 860 }}>
      {!res && (
        <div
          className={`lv-drop${sobre ? ' sobre' : ''}`}
          role="button" tabIndex={0}
          onClick={() => podeEditar && input.current?.click()}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && input.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setSobre(true) }}
          onDragLeave={() => setSobre(false)}
          onDrop={(e) => { e.preventDefault(); setSobre(false); const f = e.dataTransfer.files[0]; if (f && podeEditar) ler(f) }}
        >
          <input ref={input} type="file" hidden accept=".ofx,.csv,.txt" onChange={(e) => { const f = e.target.files?.[0]; if (f) ler(f); e.target.value = '' }} />
          <h3>{arquivo ? arquivo : 'Arraste o extrato do banco aqui'}</h3>
          <p>{lanc ? `${num(lanc.length)} entradas de dinheiro encontradas · ${brl(total)}` : 'OFX (recomendado) ou CSV · exporte pelo app ou site do seu banco'}</p>
          {exemplo && !lanc && <button type="button" className="lv-btn sec pq" style={{ marginTop: 14 }} onClick={(e) => { e.stopPropagation(); usarExemplo() }}>Usar um extrato de exemplo</button>}
        </div>
      )}

      {erro && <p className="lv-msg erro" role="alert">{erro}</p>}

      {lanc && lanc.length > 0 && !res && (
        <div className="lv-acoes">
          <button className="lv-btn grande" disabled={pendente || !podeEditar} onClick={conferir}>
            {pendente ? 'Conferindo…' : `Conferir ${num(lanc.length)} pagamentos`}
          </button>
          <button className="lv-btn fant" onClick={() => { setLanc(null); setArquivo(null) }}>Trocar arquivo</button>
        </div>
      )}

      {res && (
        <>
          <div className="lv-grid c3">
            <div className="lv-kpi lv-kpi-ok"><span>Pedidos confirmados agora</span><strong>{res.confirmados.length}</strong><small>estoque baixado e venda registrada</small></div>
            <div className="lv-kpi"><span>Pix sem pedido</span><strong>{res.sem_pedido.length}</strong><small>outras entradas (confira)</small></div>
            <div className="lv-kpi"><span>Pedidos ainda sem pagamento</span><strong>{res.pendentes}</strong><small>{res.repetidos ? `${res.repetidos} lançamentos já conferidos antes` : 'aguardando o Pix'}</small></div>
          </div>
          {res.confirmados.length > 0 && (
            <div className="lv-card">
              <h2>Confirmados ✓</h2>
              <div className="lv-lista">
                {res.confirmados.map((c) => <div key={c.numero}><span>#{c.numero} · {c.cliente}</span><span className="fim">{brl(c.valor)}</span></div>)}
              </div>
            </div>
          )}
          {res.falhas.length > 0 && (
            <div className="lv-card">
              <h2>Pagos, mas precisam de você</h2>
              <div className="lv-lista">
                {res.falhas.map((f) => <div key={f.numero}><span>#{f.numero}</span><span className="fim" style={{ color: 'var(--err)' }}>{f.motivo.includes('ESTOQUE') ? 'estoque insuficiente' : 'não deu para confirmar'}</span></div>)}
              </div>
            </div>
          )}
          {res.sem_pedido.length > 0 && (
            <details className="lv-card">
              <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Ver {res.sem_pedido.length} Pix que não bateram com nenhum pedido</summary>
              <div className="lv-lista" style={{ marginTop: 10 }}>
                {res.sem_pedido.map((s, i) => <div key={i}><span>{s.data ? dataBr(s.data + 'T12:00:00') : ''} · {s.descricao || 'sem descrição'}</span><span className="fim">{brl(s.valor)}</span></div>)}
              </div>
              <p style={{ color: 'var(--dim)', fontSize: 13, marginTop: 8 }}>Pode ser venda do balcão, transferência ou Pix pago com valor diferente. Confirme à mão, se for pedido.</p>
            </details>
          )}
          <div className="lv-acoes">
            <Link href={voltar} className="lv-btn">Ver pedidos</Link>
            <button className="lv-btn sec" onClick={() => { setRes(null); setLanc(null); setArquivo(null) }}>Conferir outro extrato</button>
          </div>
        </>
      )}
    </div>
  )
}
