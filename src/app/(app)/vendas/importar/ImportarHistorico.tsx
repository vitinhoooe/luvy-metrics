'use client'
import Link from 'next/link'
import { useMemo, useRef, useState, useTransition } from 'react'
import { brl, data as dataBr, num } from '@/lib/formato'
import { acharCabecalho } from '@/lib/mapeamento'
import { lerPlanilha } from '@/lib/planilha'
import { CAMPOS_HIST, mapearHistorico, montarHistorico, type CampoHist, type MapaHist } from '@/lib/historico'
import { importarHistorico } from './acoes'

type Planilha = { arquivo: string; cabecalhos: string[]; dados: unknown[][] }
type Resultado = { vendas: number; ligados: number; sem_produto: number; ignoradas: number }

export function ImportarHistorico({ podeEditar, simular }: { podeEditar: boolean; simular?: boolean }) {
  const [planilha, setPlanilha] = useState<Planilha | null>(null)
  const [mapa, setMapa] = useState<MapaHist | null>(null)
  const [unitario, setUnitario] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [lendo, setLendo] = useState(false)
  const [sobre, setSobre] = useState(false)
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const [pendente, iniciar] = useTransition()
  const input = useRef<HTMLInputElement>(null)

  async function ler(f: File) {
    setErro(null)
    if (f.size > 8 * 1024 * 1024) return setErro('Arquivo muito grande (máx. 8 MB). Divida por período.')
    if (!/\.(xlsx|xls|csv|ods)$/i.test(f.name)) return setErro('Envie um arquivo Excel (.xlsx, .xls), CSV ou .ods.')
    setLendo(true)
    try {
      const linhas = await lerPlanilha(f, { datas: true })
      if (linhas.length < 2) throw new Error('A planilha parece vazia.')
      const h = acharCabecalho(linhas)
      const largura = Math.max(...linhas.slice(h, h + 50).map((l) => l.length))
      const cabecalhos = Array.from({ length: largura }, (_, i) => String(linhas[h][i] ?? '').trim() || `Coluna ${i + 1}`)
      const m = mapearHistorico(cabecalhos)
      setPlanilha({ arquivo: f.name, cabecalhos, dados: linhas.slice(h + 1) })
      setMapa(m)
      setUnitario(m.valor != null && /unit|unidade|\bun\b|preco/i.test(cabecalhos[m.valor].normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()) && !/total/i.test(cabecalhos[m.valor]))
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não conseguimos ler esse arquivo.')
    } finally {
      setLendo(false)
    }
  }

  const montado = useMemo(() => (planilha && mapa ? montarHistorico(planilha.dados, mapa, unitario) : null), [planilha, mapa, unitario])
  const periodo = useMemo(() => {
    if (!montado?.boas.length) return null
    const ds = montado.boas.map((l) => l.data).sort()
    return { de: ds[0], ate: ds[ds.length - 1] }
  }, [montado])

  function trocar(c: CampoHist, v: string) {
    if (!mapa) return
    setMapa({ ...mapa, [c]: v === '' ? null : Number(v) })
  }

  function importar() {
    if (!montado) return
    setErro(null)
    iniciar(async () => {
      if (simular) {
        const ligados = Math.round(montado.boas.length * 0.8)
        setResultado({ vendas: montado.boas.length, ligados, sem_produto: montado.boas.length - ligados, ignoradas: 0 })
        return
      }
      const r = await importarHistorico(montado.boas)
      if ('erro' in r && r.erro) return setErro(r.erro)
      if ('ok' in r) setResultado(r)
    })
  }

  const exemplo = (i: number | null) => (i == null || !planilha ? '' : planilha.dados.slice(0, 3).map((l) => { const v = l[i]; return v instanceof Date ? dataBr(v.toISOString()) : String(v ?? '') }).filter(Boolean).join(' · ').slice(0, 60))
  const base = simular ? '/previa' : ''

  if (resultado) {
    return (
      <div className="lv-card lv-hist-ok" style={{ maxWidth: 720 }}>
        <h2>Histórico importado {simular && <small>prévia: nada foi gravado</small>}</h2>
        <div className="lv-grid c3" style={{ margin: '12px 0' }}>
          <div className="lv-kpi"><span>Vendas antigas</span><strong>{num(resultado.vendas)}</strong><small>entraram nos relatórios</small></div>
          <div className="lv-kpi"><span>Ligadas a produtos</span><strong>{num(resultado.ligados)}</strong><small>contam no “O que repor”</small></div>
          <div className="lv-kpi"><span>Sem produto igual</span><strong>{num(resultado.sem_produto)}</strong><small>contam só no faturamento</small></div>
        </div>
        {resultado.sem_produto > 0 && <p style={{ color: 'var(--dim)', fontSize: 13.5 }}>Para ligar as que sobraram, cadastre os produtos com o mesmo nome ou código e importe de novo depois de desfazer esta importação.</p>}
        <div className="lv-acoes" style={{ marginTop: 12 }}>
          <Link href={`${base}/repor`} className="lv-btn">Ver o que repor</Link>
          <Link href={`${base}/vendas`} className="lv-btn sec">Ver vendas</Link>
        </div>
      </div>
    )
  }

  return (
    <>
      {erro && <p className="lv-msg erro" role="alert" style={{ marginBottom: 14 }}>{erro}</p>}

      {!planilha ? (
        <>
          <div
            className={`lv-drop${sobre ? ' sobre' : ''}`} role="button" tabIndex={0} aria-disabled={!podeEditar}
            onClick={() => podeEditar && input.current?.click()}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && podeEditar && input.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setSobre(true) }} onDragLeave={() => setSobre(false)}
            onDrop={(e) => { e.preventDefault(); setSobre(false); const f = e.dataTransfer.files[0]; if (f && podeEditar) ler(f) }}
          >
            <input ref={input} type="file" hidden accept=".xlsx,.xls,.csv,.ods" onChange={(e) => { const f = e.target.files?.[0]; if (f) ler(f); e.target.value = '' }} />
            <h3>{lendo ? 'Lendo suas vendas…' : 'Arraste o relatório de vendas aqui'}</h3>
            <p>{lendo ? 'Isso leva alguns segundos.' : 'Excel ou CSV do sistema antigo, da maquininha ou a sua planilha · uma linha por produto vendido'}</p>
            {!podeEditar && <p style={{ marginTop: 10, color: 'var(--err)' }}>Escolha um plano para importar.</p>}
          </div>
          <div className="lv-card" style={{ marginTop: 14, maxWidth: 820 }}>
            <h2>Para que serve</h2>
            <ul className="lv-hist-lista">
              <li>O <b>“O que repor”</b> e o <b>“Dinheiro parado”</b> funcionam desde o primeiro dia, com o seu giro real.</li>
              <li>Os gráficos de vendas e lucro já mostram os meses anteriores.</li>
              <li><b>Não mexe no estoque atual nem no caixa</b>: são vendas que já aconteceram. Dá para desfazer.</li>
            </ul>
            <p style={{ color: 'var(--dim)', fontSize: 13 }}>Precisa ter pelo menos: data, produto e valor. Quantidade e código ajudam. Até 3 anos para trás.</p>
          </div>
        </>
      ) : mapa && montado && (
        <div className="lv-grid" style={{ maxWidth: 860 }}>
          <div className="lv-card">
            <h2>Confira as colunas <small>sugerido pelos nomes das colunas</small></h2>
            <p style={{ color: 'var(--dim)', fontSize: 14, marginBottom: 14 }}>{planilha.arquivo} · {num(planilha.dados.length)} linhas.</p>
            <div className="lv-mapa">
              {CAMPOS_HIST.map((c) => (
                <div key={c.id} className="lv-mapa-linha">
                  <div className="col">{c.nome}{'obrigatorio' in c && ' *'}<span className="ex">{exemplo(mapa[c.id]) || '—'}</span></div>
                  <span aria-hidden>←</span>
                  <select aria-label={`Coluna para ${c.nome}`} value={mapa[c.id] ?? ''} onChange={(e) => trocar(c.id, e.target.value)}>
                    <option value="">(não tenho)</option>
                    {planilha.cabecalhos.map((h, i) => <option key={i} value={i}>{h}</option>)}
                  </select>
                </div>
              ))}
            </div>
            <div className="lv-chips" style={{ marginTop: 14 }}>
              <span style={{ fontSize: 13.5, fontWeight: 600, marginRight: 6 }}>A coluna de valor é:</span>
              <button type="button" className={`lv-chip${!unitario ? ' on' : ''}`} onClick={() => setUnitario(false)}>o total da linha</button>
              <button type="button" className={`lv-chip${unitario ? ' on' : ''}`} onClick={() => setUnitario(true)}>o preço de 1 unidade</button>
            </div>
          </div>

          <div className="lv-grid c3">
            <div className="lv-kpi"><span>Linhas prontas</span><strong>{num(montado.boas.length)}</strong><small>{montado.ruins ? `${num(montado.ruins)} sem data, produto ou valor serão puladas` : 'todas válidas'}</small></div>
            <div className="lv-kpi"><span>Faturamento no arquivo</span><strong>{brl(montado.boas.reduce((s, l) => s + l.valor, 0))}</strong><small>{num(montado.boas.reduce((s, l) => s + l.quantidade, 0))} unidades</small></div>
            <div className="lv-kpi"><span>Período</span><strong style={{ fontSize: 17 }}>{periodo ? `${dataBr(periodo.de + 'T12:00:00')} a ${dataBr(periodo.ate + 'T12:00:00')}` : '—'}</strong><small>pelas datas da planilha</small></div>
          </div>

          {montado.boas.length > 0 && (
            <div className="lv-tabela-wrap">
              <table className="lv-tabela">
                <thead><tr><th>Data</th><th>Produto</th><th className="dir">Qtd</th><th className="dir">Valor</th></tr></thead>
                <tbody>
                  {montado.boas.slice(0, 8).map((l, i) => (
                    <tr key={i}><td>{dataBr(l.data + 'T12:00:00')}</td><td><strong>{l.produto}</strong>{l.codigo && <div className="sub">{l.codigo}</div>}</td><td className="dir">{l.quantidade}</td><td className="dir">{brl(l.valor)}</td></tr>
                  ))}
                </tbody>
              </table>
              {montado.boas.length > 8 && <p style={{ padding: 12, color: 'var(--dim)', fontSize: 13 }}>Mostrando 8 de {num(montado.boas.length)}.</p>}
            </div>
          )}

          <div className="lv-acoes">
            <button className="lv-btn grande" disabled={pendente || !podeEditar || montado.boas.length === 0 || mapa.data == null || mapa.produto == null || mapa.valor == null} onClick={importar}>
              {pendente ? 'Importando…' : `Importar ${num(montado.boas.length)} vendas antigas`}
            </button>
            <button className="lv-btn fant" onClick={() => { setPlanilha(null); setMapa(null); setErro(null) }}>Trocar arquivo</button>
          </div>
        </div>
      )}
    </>
  )
}
