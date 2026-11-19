'use client'
import Link from 'next/link'
import { useMemo, useRef, useState, useTransition } from 'react'
import { brl, num } from '@/lib/formato'
import { lerPlanilha } from '@/lib/planilha'
import { acharCabecalho, CAMPOS, mapearPorNome, montarLinhas, type Campo, type Mapeamento } from '@/lib/mapeamento'
import { importar, sugerirMapeamento } from './acoes'

type Planilha = { arquivo: string; cabecalhos: string[]; dados: unknown[][]; inicio: number }
type Etapa = 'arquivo' | 'mapear' | 'conferir' | 'pronto'

export function Importador({ podeEditar, simular }: { podeEditar: boolean; simular?: boolean }) {
  const [etapa, setEtapa] = useState<Etapa>('arquivo')
  const [planilha, setPlanilha] = useState<Planilha | null>(null)
  const [mapa, setMapa] = useState<Mapeamento | null>(null)
  const [fonte, setFonte] = useState<{ tipo: 'ia' | 'automatico'; obs?: string } | null>(null)
  const [modo, setModo] = useState<'somar' | 'substituir' | 'pular'>('somar')
  const [erro, setErro] = useState<string | null>(null)
  const [lendo, setLendo] = useState(false)
  const [sobre, setSobre] = useState(false)
  const [resultado, setResultado] = useState<{ criados: number; atualizados: number; ignorados: number } | null>(null)
  const [pendente, iniciar] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  async function lerArquivo(f: File) {
    setErro(null)
    if (f.size > 8 * 1024 * 1024) return setErro('Arquivo muito grande (máx. 8 MB).')
    if (!/\.(xlsx|xls|csv|ods)$/i.test(f.name)) return setErro('Envie um arquivo Excel (.xlsx, .xls), CSV ou .ods.')
    setLendo(true)
    try {
      const linhas = await lerPlanilha(f)
      if (linhas.length < 2) throw new Error('A planilha parece vazia.')
      const h = acharCabecalho(linhas)
      const largura = Math.max(...linhas.slice(h, h + 50).map((l) => l.length))
      const cabecalhos = Array.from({ length: largura }, (_, i) => String(linhas[h][i] ?? '').trim() || `Coluna ${i + 1}`)
      const dados = linhas.slice(h + 1)
      if (!dados.length) throw new Error('Não encontramos linhas de produtos abaixo do cabeçalho.')
      setPlanilha({ arquivo: f.name, cabecalhos, dados, inicio: h })

      const sug = simular
        ? { mapa: mapearPorNome(cabecalhos), fonte: 'automatico' as const, observacao: 'Prévia: no app de verdade a IA confere as colunas.', erro: undefined }
        : await sugerirMapeamento(cabecalhos, dados.slice(0, 12))
      setMapa(sug.mapa)
      setFonte({ tipo: sug.fonte, obs: sug.observacao })
      if (sug.erro) setErro(sug.erro)
      setEtapa('mapear')
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não conseguimos ler esse arquivo.')
    } finally {
      setLendo(false)
    }
  }

  const montado = useMemo(() => (planilha && mapa ? montarLinhas(planilha.dados, mapa) : null), [planilha, mapa])

  function trocar(campo: Campo, valor: string) {
    if (!mapa) return
    const novo = { ...mapa }
    const idx = valor === '' ? null : Number(valor)
    // uma coluna só pode ir para um campo
    if (idx !== null) for (const c of CAMPOS) if (novo[c.id] === idx) novo[c.id] = null
    novo[campo] = idx
    setMapa(novo)
  }

  function confirmar() {
    if (!montado || !planilha || !mapa) return
    setErro(null)
    iniciar(async () => {
      const r = simular
        ? { resultado: { id: '', criados: montado.ok.length, atualizados: 0, ignorados: 0 } }
        : await importar(montado.ok, modo, planilha.arquivo, mapa)
      if ('erro' in r && r.erro) return setErro(r.erro)
      if ('resultado' in r && r.resultado) {
        setResultado(r.resultado)
        setEtapa('pronto')
      }
    })
  }

  function recomecar() {
    setEtapa('arquivo'); setPlanilha(null); setMapa(null); setFonte(null); setResultado(null); setErro(null)
  }

  const exemplo = (i: number | null) => {
    if (i === null || !planilha) return ''
    return planilha.dados.slice(0, 40).map((l) => l[i]).filter((v) => v !== null && String(v).trim() !== '').slice(0, 3).join(' · ')
  }

  return (
    <>
      <div className="lv-passos">
        {(['arquivo', 'mapear', 'conferir', 'pronto'] as Etapa[]).map((e, i) => (
          <span key={e} className={etapa === e ? 'on' : ''}>{i + 1}. {{ arquivo: 'Arquivo', mapear: 'Colunas', conferir: 'Conferir', pronto: 'Pronto' }[e]}</span>
        ))}
      </div>

      {erro && <p className="lv-msg erro" role="alert" style={{ marginBottom: 14 }}>{erro}</p>}

      {etapa === 'arquivo' && (
        <div
          className={`lv-drop${sobre ? ' sobre' : ''}`}
          role="button"
          tabIndex={0}
          aria-disabled={!podeEditar}
          onClick={() => podeEditar && inputRef.current?.click()}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && podeEditar && inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setSobre(true) }}
          onDragLeave={() => setSobre(false)}
          onDrop={(e) => { e.preventDefault(); setSobre(false); const f = e.dataTransfer.files[0]; if (f && podeEditar) lerArquivo(f) }}
        >
          <input ref={inputRef} type="file" hidden accept=".xlsx,.xls,.csv,.ods" onChange={(e) => { const f = e.target.files?.[0]; if (f) lerArquivo(f); e.target.value = '' }} />
          <h3>{lendo ? 'Lendo sua planilha e entendendo as colunas…' : 'Arraste sua planilha aqui'}</h3>
          <p>{lendo ? 'Isso leva alguns segundos.' : 'ou clique para escolher · Excel (.xlsx, .xls), CSV ou .ods'}</p>
          {!podeEditar && <p style={{ marginTop: 10, color: 'var(--err)' }}>Escolha um plano para importar.</p>}
        </div>
      )}

      {etapa === 'mapear' && planilha && mapa && montado && (
        <div className="lv-grid" style={{ maxWidth: 820 }}>
          <div className="lv-card">
            <h2>
              Confira as colunas
              <small>{fonte?.tipo === 'ia' ? '✨ sugerido pela IA' : 'sugerido pelos nomes das colunas'}</small>
            </h2>
            <p style={{ color: 'var(--dim)', fontSize: 14, marginBottom: 14 }}>
              {planilha.arquivo} · {num(planilha.dados.length)} linhas. Ajuste se alguma estiver errada. O que não estiver na planilha fica em branco.
            </p>
            {fonte?.obs && <p className="lv-msg info" style={{ marginBottom: 12 }}>{fonte.obs}</p>}
            <div className="lv-mapa">
              {CAMPOS.map((c) => (
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
          </div>
          <div className="lv-acoes">
            <button className="lv-btn" disabled={mapa.nome === null || montado.ok.length === 0} onClick={() => setEtapa('conferir')}>Continuar</button>
            <button className="lv-btn fant" onClick={recomecar}>Trocar arquivo</button>
          </div>
        </div>
      )}

      {etapa === 'conferir' && planilha && montado && (
        <div className="lv-grid">
          <div className="lv-grid c3">
            <div className="lv-kpi"><span>Prontos para importar</span><strong>{num(montado.ok.length)}</strong><small>{montado.juntadas ? `${montado.juntadas} linhas repetidas foram somadas` : 'produtos'}</small></div>
            <div className="lv-kpi"><span>Com problema (serão pulados)</span><strong style={{ color: montado.problemas.length ? 'var(--warn)' : undefined }}>{num(montado.problemas.length)}</strong><small>veja a lista abaixo</small></div>
            <div className="lv-kpi"><span>Unidades no total</span><strong>{num(montado.ok.reduce((s, l) => s + l.quantidade, 0))}</strong><small>a custo: {brl(montado.ok.reduce((s, l) => s + (l.custo ?? 0) * l.quantidade, 0))}</small></div>
          </div>

          <div className="lv-card">
            <h2>Se o produto já existir no Luvy</h2>
            <div className="lv-chips">
              {([['somar', 'Somar a quantidade (chegou mercadoria)'], ['substituir', 'Substituir pela quantidade da planilha'], ['pular', 'Não mexer']] as const).map(([m, n]) => (
                <button key={m} type="button" className={`lv-chip${modo === m ? ' on' : ''}`} onClick={() => setModo(m)}>{n}</button>
              ))}
            </div>
            <p style={{ color: 'var(--dim)', fontSize: 13, marginTop: 10 }}>Reconhecemos pelo código de barras ou, sem ele, pelo nome igual. Custo e preço da planilha atualizam o cadastro.</p>
          </div>

          <div className="lv-tabela-wrap">
            <table className="lv-tabela">
              <thead><tr><th>Produto</th><th className="esconde-cel">Categoria</th><th className="dir">Qtd</th><th className="dir">Custo</th><th className="dir">Preço</th></tr></thead>
              <tbody>
                {montado.ok.slice(0, 50).map((l, i) => (
                  <tr key={i}>
                    <td><strong>{l.nome}</strong><div className="sub">{[l.codigo_barras, l.sku, l.fornecedor].filter(Boolean).join(' · ')}</div></td>
                    <td className="esconde-cel">{l.categoria ?? '—'}</td>
                    <td className="dir">{l.quantidade}</td>
                    <td className="dir">{l.custo === null ? '—' : brl(l.custo)}</td>
                    <td className="dir">{l.preco === null ? <span className="lv-selo alerta">sem preço</span> : brl(l.preco)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {montado.ok.length > 50 && <p style={{ padding: 12, color: 'var(--dim)', fontSize: 13 }}>Mostrando 50 de {num(montado.ok.length)}.</p>}
          </div>

          {montado.problemas.length > 0 && (
            <details className="lv-card">
              <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Ver {montado.problemas.length} linhas com problema</summary>
              <div className="lv-lista" style={{ marginTop: 10 }}>
                {montado.problemas.slice(0, 100).map((p) => <div key={p.linha}><span>Linha {p.linha + planilha.inicio + 1} da planilha</span><span className="fim" style={{ color: 'var(--dim)' }}>{p.motivo}</span></div>)}
              </div>
            </details>
          )}

          <div className="lv-acoes">
            <button className="lv-btn grande" disabled={pendente || montado.ok.length === 0} onClick={confirmar}>
              {pendente ? 'Importando…' : `Importar ${num(montado.ok.length)} produtos`}
            </button>
            <button className="lv-btn fant" onClick={() => setEtapa('mapear')} disabled={pendente}>Voltar às colunas</button>
          </div>
        </div>
      )}

      {etapa === 'pronto' && resultado && (
        <div className="lv-card" style={{ maxWidth: 620 }}>
          <h2>Importação concluída ✓</h2>
          <div className="lv-lista" style={{ marginBottom: 16 }}>
            <div><span>Produtos novos</span><span className="fim"><strong>{num(resultado.criados)}</strong></span></div>
            <div><span>Produtos atualizados</span><span className="fim"><strong>{num(resultado.atualizados)}</strong></span></div>
            <div><span>Não alterados (já existiam)</span><span className="fim">{num(resultado.ignorados)}</span></div>
          </div>
          <div className="lv-acoes">
            <Link href="/produtos" className="lv-btn">Ver meus produtos</Link>
            <button className="lv-btn sec" onClick={recomecar}>Importar outra planilha</button>
          </div>
          <p style={{ color: 'var(--dim)', fontSize: 13, marginTop: 12 }}>Algo saiu errado? Use “Desfazer” no histórico abaixo.</p>
        </div>
      )}
    </>
  )
}
