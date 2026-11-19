'use client'
import Link from 'next/link'
import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { brl, num } from '@/lib/formato'
import { promocao } from './acoes'

export type ItemGiro = {
  id: string
  nome: string
  categoria: string | null
  fornecedor: string | null
  quantidade: number
  custo: number
  preco: number
  preco_promocional: number | null
  vendidos: number
  por_dia: number
  dias_restantes: number | null
  sugestao: number
  dias_sem_vender: number
  valor_parado: number
}

type Props = { itens: ItemGiro[]; vista: 'repor' | 'parado'; diasParado: number; podeEditar: boolean; base: string; simular?: boolean }

export function Giro({ itens, vista, diasParado, podeEditar, base, simular }: Props) {
  const [sel, setSel] = useState<Set<string>>(new Set())
  const [msg, setMsg] = useState<{ ok?: string; erro?: string } | null>(null)
  const [pct, setPct] = useState(15)
  const [copiado, setCopiado] = useState(false)
  const [pendente, iniciar] = useTransition()
  const router = useRouter()

  const repor = useMemo(() => itens
    .filter((i) => i.por_dia > 0 && (i.sugestao > 0 || (i.dias_restantes ?? 999) <= 15))
    .sort((a, b) => (a.dias_restantes ?? 999) - (b.dias_restantes ?? 999)), [itens])
  const parados = useMemo(() => itens
    .filter((i) => i.quantidade > 0 && i.dias_sem_vender >= diasParado)
    .sort((a, b) => b.valor_parado - a.valor_parado), [itens, diasParado])

  const custoCompra = repor.reduce((s, i) => s + i.sugestao * Number(i.custo), 0)
  const totalParado = parados.reduce((s, i) => s + Number(i.valor_parado), 0)
  const semHistorico = !itens.some((i) => i.vendidos > 0)

  // lista de compras agrupada por fornecedor, pronta para mandar
  const listaTexto = useMemo(() => {
    const grupos = new Map<string, ItemGiro[]>()
    repor.filter((i) => i.sugestao > 0).forEach((i) => {
      const f = i.fornecedor || 'Sem fornecedor'
      grupos.set(f, [...(grupos.get(f) ?? []), i])
    })
    return [...grupos].map(([f, l]) => `*${f}*\n${l.map((i) => `• ${i.sugestao}× ${i.nome}`).join('\n')}`).join('\n\n')
  }, [repor])

  const alternar = (id: string) => setSel((x) => { const n = new Set(x); if (n.has(id)) n.delete(id); else n.add(id); return n })

  function aplicar(p: number) {
    setMsg(null)
    iniciar(async () => {
      if (simular) { setMsg({ ok: `Prévia: ${sel.size} produtos ficariam com ~${p}% de desconto na vitrine.` }); setSel(new Set()); return }
      const r = await promocao([...sel], p)
      setMsg(r)
      if (r.ok) { setSel(new Set()); router.refresh() }
    })
  }

  async function copiar() {
    try { await navigator.clipboard.writeText(`Pedido de reposição\n\n${listaTexto}`); setCopiado(true); setTimeout(() => setCopiado(false), 2500) } catch {}
  }

  const aba = (v: string, nome: string, n: number) => (
    <Link href={`${base}?v=${v}`} className={`lv-chip${vista === v ? ' on' : ''}`}>{nome}{n > 0 && <em>{n}</em>}</Link>
  )

  return (
    <>
      <div className="lv-chips lv-abas" style={{ marginBottom: 14 }}>
        {aba('repor', 'O que repor', repor.length)}
        {aba('parado', 'Dinheiro parado', parados.length)}
      </div>

      {semHistorico && (
        <p className="lv-msg info" style={{ marginBottom: 14 }}>
          As sugestões usam as suas vendas reais (balcão e vitrine). Com algumas semanas de vendas registradas, esta tela fica bem mais precisa.
        </p>
      )}
      {msg?.ok && <p className="lv-msg ok" style={{ marginBottom: 12 }}>{msg.ok}</p>}
      {msg?.erro && <p className="lv-msg erro" style={{ marginBottom: 12 }}>{msg.erro}</p>}

      {vista === 'repor' ? (
        <>
          <div className="lv-grid c3" style={{ marginBottom: 14 }}>
            <div className="lv-kpi"><span>Produtos para repor</span><strong>{repor.length}</strong><small>acabam em até 15 dias</small></div>
            <div className="lv-kpi"><span>Já esgotados vendendo</span><strong>{repor.filter((i) => i.quantidade === 0).length}</strong><small>venda perdida a cada dia</small></div>
            <div className="lv-kpi"><span>Custo da reposição</span><strong>{brl(custoCompra)}</strong><small>para 30 dias de estoque</small></div>
          </div>
          {repor.length === 0 ? (
            <div className="lv-card lv-vazio"><h3>Nada para repor agora 👌</h3><p>Nenhum produto que vende vai acabar nos próximos 15 dias.</p></div>
          ) : (
            <>
              <div className="lv-tabela-wrap">
                <table className="lv-tabela">
                  <thead><tr><th>Produto</th><th className="dir">Estoque</th><th className="dir esconde-cel">Vende por semana</th><th className="dir">Acaba em</th><th className="dir">Comprar</th><th className="dir esconde-cel">Custo</th></tr></thead>
                  <tbody>
                    {repor.map((i) => (
                      <tr key={i.id}>
                        <td><strong>{i.nome}</strong><div className="sub">{[i.fornecedor, i.categoria].filter(Boolean).join(' · ') || '—'}</div></td>
                        <td className="dir">{num(i.quantidade)}</td>
                        <td className="dir esconde-cel">{(i.por_dia * 7).toFixed(1).replace('.', ',')}</td>
                        <td className="dir">
                          {i.quantidade === 0 ? <span className="lv-semaforo vermelho">esgotado</span>
                            : <span className={`lv-semaforo ${(i.dias_restantes ?? 99) <= 7 ? 'vermelho' : 'verde'}`}>{i.dias_restantes} dias</span>}
                        </td>
                        <td className="dir"><strong>{i.sugestao > 0 ? `${i.sugestao} un.` : '—'}</strong></td>
                        <td className="dir esconde-cel">{i.sugestao > 0 ? brl(i.sugestao * Number(i.custo)) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {listaTexto && (
                <div className="lv-acoes" style={{ marginTop: 14 }}>
                  <button className="lv-btn" onClick={copiar}>{copiado ? 'Lista copiada ✓' : 'Copiar lista de compras'}</button>
                  <a className="lv-btn lv-btn-zap" href={`https://wa.me/?text=${encodeURIComponent(`Pedido de reposição\n\n${listaTexto}`)}`} target="_blank" rel="noopener noreferrer">Mandar para o fornecedor</a>
                </div>
              )}
              <p style={{ color: 'var(--dim)', fontSize: 12.5, marginTop: 10 }}>
                Conta: média vendida nos últimos 30 dias × 30 dias de cobertura − o que você já tem. É uma estimativa: ajuste se souber de uma data especial chegando.
              </p>
            </>
          )}
        </>
      ) : (
        <>
          <div className="lv-grid c3" style={{ marginBottom: 14 }}>
            <div className="lv-kpi destaque-suave"><span>Dinheiro parado</span><strong>{brl(totalParado)}</strong><small>a preço de custo</small></div>
            <div className="lv-kpi"><span>Produtos sem venda</span><strong>{parados.length}</strong><small>há {diasParado}+ dias</small></div>
            <div className="lv-kpi"><span>Unidades paradas</span><strong>{num(parados.reduce((s, i) => s + i.quantidade, 0))}</strong><small>ocupando prateleira</small></div>
          </div>
          <div className="lv-chips" style={{ marginBottom: 12 }}>
            {[30, 60, 90].map((d) => <Link key={d} href={`${base}?v=parado&d=${d}`} className={`lv-chip${diasParado === d ? ' on' : ''}`}>Sem vender há {d}+ dias</Link>)}
          </div>
          {parados.length === 0 ? (
            <div className="lv-card lv-vazio"><h3>Nenhum produto parado 🎉</h3><p>Tudo o que está em estoque vendeu nos últimos {diasParado} dias.</p></div>
          ) : (
            <div className="lv-tabela-wrap">
              <table className="lv-tabela">
                <thead><tr><th style={{ width: 36 }} /><th>Produto</th><th className="dir">Estoque</th><th className="dir esconde-cel">Sem vender</th><th className="dir">Parado (custo)</th><th className="dir">Vitrine</th></tr></thead>
                <tbody>
                  {parados.map((i) => (
                    <tr key={i.id} className={sel.has(i.id) ? 'marcada' : ''}>
                      <td>{podeEditar && <input type="checkbox" className="lv-sel" checked={sel.has(i.id)} onChange={() => alternar(i.id)} aria-label={`Selecionar ${i.nome}`} />}</td>
                      <td><strong>{i.nome}</strong><div className="sub">{i.categoria ?? '—'}</div></td>
                      <td className="dir">{num(i.quantidade)}</td>
                      <td className="dir esconde-cel">{i.dias_sem_vender} dias</td>
                      <td className="dir"><strong>{brl(i.valor_parado)}</strong></td>
                      <td className="dir">{i.preco_promocional ? <span className="lv-selo ok">de {brl(i.preco)} por {brl(i.preco_promocional)}</span> : brl(i.preco)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {sel.size > 0 && (
            <div className="lv-massa" role="region" aria-label="Promoção">
              <strong>{sel.size} selecionados</strong>
              <span style={{ fontSize: 13 }}>Promoção na vitrine:</span>
              {[10, 15, 20, 30].map((p) => (
                <button key={p} className={`lv-btn pq${pct === p ? '' : ' sec'}`} onClick={() => setPct(p)}>{p}%</button>
              ))}
              <button className="lv-btn pq" disabled={pendente} onClick={() => aplicar(pct)}>Aplicar {pct}% off</button>
              <button className="lv-btn fant pq" disabled={pendente} onClick={() => aplicar(0)}>Tirar promoção</button>
            </div>
          )}
        </>
      )}
    </>
  )
}
