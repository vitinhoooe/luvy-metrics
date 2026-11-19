'use client'
import { useActionState, useEffect, useState } from 'react'
import { Enviar, Mensagem, type Estado } from '@/components/Enviar'
import { brl, data } from '@/lib/formato'
import { linkWhatsApp } from '@/lib/pedidos'
import { telefoneBonito } from '@/lib/fornecedores'
import { excluirFornecedor, salvarFornecedor } from './acoes'

export type MeuFornecedor = {
  id: string; nome: string; contato: string | null; whatsapp: string | null; email: string | null; site: string | null
  cidade: string | null; prazo_dias: number | null; pedido_minimo: number | null; pagamento: string | null
  nota: number | null; obs: string | null; ultimo_pedido: string | null; diretorio_id: string | null
}
/** O que os produtos da loja dizem de cada fornecedor (ligação pelo nome em produtos.fornecedor). */
export type ResumoFornecedor = { nome: string; produtos: number; valor: number; repor: number }

const chave = (s: string) => s.trim().toLowerCase()

/** Agrupa produtos ativos pelo nome do fornecedor. */
export function resumirProdutos(produtos: { fornecedor: string | null; quantidade: number; custo: number; estoque_minimo: number }[]) {
  const m = new Map<string, ResumoFornecedor>()
  for (const p of produtos) {
    if (!p.fornecedor?.trim()) continue
    const k = chave(p.fornecedor)
    const r = m.get(k) ?? { nome: p.fornecedor.trim(), produtos: 0, valor: 0, repor: 0 }
    r.produtos++
    r.valor += Math.max(0, p.quantidade) * Number(p.custo)
    if (p.quantidade <= p.estoque_minimo) r.repor++
    m.set(k, r)
  }
  return [...m.values()]
}

const VAZIO: Omit<MeuFornecedor, 'id'> & { id: string } = {
  id: '', nome: '', contato: null, whatsapp: null, email: null, site: null, cidade: null, prazo_dias: null,
  pedido_minimo: null, pagamento: null, nota: null, obs: null, ultimo_pedido: null, diretorio_id: null,
}

export function MeusFornecedores({ fornecedores, resumo, loja, simular }: { fornecedores: MeuFornecedor[]; resumo: ResumoFornecedor[]; loja: string; simular?: boolean }) {
  const [editando, setEditando] = useState<MeuFornecedor | null>(null)
  const porNome = new Map(resumo.map((r) => [chave(r.nome), r]))
  const cadastrados = new Set(fornecedores.map((f) => chave(f.nome)))
  const semCadastro = resumo.filter((r) => !cadastrados.has(chave(r.nome))).sort((a, b) => b.produtos - a.produtos)
  const lista = [...fornecedores].sort((a, b) => (porNome.get(chave(b.nome))?.repor ?? 0) - (porNome.get(chave(a.nome))?.repor ?? 0) || a.nome.localeCompare(b.nome))
  const totalRepor = fornecedores.reduce((s, f) => s + (porNome.get(chave(f.nome))?.repor ?? 0), 0)
  const prazos = fornecedores.filter((f) => f.prazo_dias != null).map((f) => f.prazo_dias!)

  const msg = (f: MeuFornecedor) => {
    const r = porNome.get(chave(f.nome))
    return `Olá${f.contato ? `, ${f.contato.split(' ')[0]}` : ''}! Aqui é da ${loja}.${r?.repor ? ` Preciso repor ${r.repor} ${r.repor === 1 ? 'item' : 'itens'} com vocês.` : ''} Pode me mandar a tabela atualizada e o prazo de entrega?`
  }

  return (
    <>
      <div className="lv-grid c4" style={{ marginBottom: 14 }}>
        <div className="lv-kpi"><span>Meus fornecedores</span><strong>{fornecedores.length}</strong><small>cadastrados</small></div>
        <div className="lv-kpi"><span>Itens para repor</span><strong>{totalRepor}</strong><small>no estoque mínimo ou abaixo</small></div>
        <div className="lv-kpi"><span>Prazo médio de entrega</span><strong>{prazos.length ? `${Math.round(prazos.reduce((a, b) => a + b, 0) / prazos.length)} dias` : '—'}</strong><small>pelo que você anotou</small></div>
        <div className="lv-kpi"><span>Sem cadastro</span><strong>{semCadastro.length}</strong><small>nomes que estão nos produtos</small></div>
      </div>

      <div className="lv-forn-filtros">
        <p style={{ margin: 0, color: 'var(--dim)', fontSize: 13.5 }}>Os produtos se ligam ao fornecedor pelo nome escrito no campo “Fornecedor” do produto.</p>
        <button type="button" className="lv-btn" onClick={() => setEditando({ ...VAZIO })}>+ Novo fornecedor</button>
      </div>

      {semCadastro.length > 0 && (
        <div className="lv-forn-sem">
          <strong>Estão nos seus produtos, mas sem contato salvo:</strong>
          {semCadastro.map((r) => (
            <button key={r.nome} type="button" className="lv-chip" onClick={() => setEditando({ ...VAZIO, nome: r.nome })}>
              {r.nome}<em>{r.produtos}</em>
            </button>
          ))}
        </div>
      )}

      {editando && <FormFornecedor f={editando} simular={simular} fechar={() => setEditando(null)} />}

      {lista.length === 0 ? (
        <div className="lv-card lv-vazio">
          <h3>Nenhum fornecedor ainda</h3>
          <p>Cadastre de quem você compra para ter contato, prazo e pedido mínimo num lugar só, ou salve um do diretório.</p>
        </div>
      ) : (
        <div className="lv-forn-grade">
          {lista.map((f) => {
            const r = porNome.get(chave(f.nome))
            return (
              <article key={f.id} className="lv-card lv-forn">
                <header>
                  <div>
                    <h3>{f.nome}</h3>
                    <span className="lugar">{[f.contato, f.cidade].filter(Boolean).join(' · ') || 'Sem cidade'}</span>
                  </div>
                  {f.nota ? <span className="lv-forn-nota" aria-label={`Nota ${f.nota} de 5`}>{'★'.repeat(f.nota)}<i>{'★'.repeat(5 - f.nota)}</i></span> : <span className="lv-selo">sem nota</span>}
                </header>
                {r ? (
                  <div className="lv-forn-uso">
                    <span><b>{r.produtos}</b> produtos</span>
                    <span><b>{brl(r.valor)}</b> em estoque</span>
                    <span className={r.repor ? 'alerta' : ''}><b>{r.repor}</b> para repor</span>
                  </div>
                ) : <p className="obs" style={{ color: 'var(--dim)' }}>Nenhum produto com esse nome de fornecedor.</p>}
                <dl>
                  {f.prazo_dias != null && <><dt>Entrega</dt><dd>{f.prazo_dias} dias</dd></>}
                  {f.pedido_minimo != null && <><dt>Pedido mínimo</dt><dd>{brl(f.pedido_minimo)}</dd></>}
                  {f.pagamento && <><dt>Pagamento</dt><dd>{f.pagamento}</dd></>}
                  {f.ultimo_pedido && <><dt>Último pedido</dt><dd>{data(f.ultimo_pedido + 'T12:00:00')}</dd></>}
                  {f.whatsapp && <><dt>WhatsApp</dt><dd>{telefoneBonito(f.whatsapp)}</dd></>}
                  {f.email && <><dt>E-mail</dt><dd>{f.email}</dd></>}
                </dl>
                {f.obs && <p className="cond">{f.obs}</p>}
                <div className="acoes">
                  {f.whatsapp && <a className="lv-btn lv-btn-zap pq" href={linkWhatsApp(f.whatsapp, msg(f))} target="_blank" rel="noopener noreferrer">{r?.repor ? 'Pedir reposição' : 'WhatsApp'}</a>}
                  <button type="button" className="lv-btn sec pq" onClick={() => setEditando(f)}>Editar</button>
                  {!simular && (
                    <form action={excluirFornecedor} onSubmit={(e) => { if (!confirm(`Excluir ${f.nome}? Os produtos continuam com o nome do fornecedor.`)) e.preventDefault() }}>
                      <input type="hidden" name="id" value={f.id} />
                      <button type="submit" className="lv-btn sec pq">Excluir</button>
                    </form>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}
    </>
  )
}

const simulado = async (): Promise<Estado> => ({ ok: 'Prévia: nada foi gravado.' })

function FormFornecedor({ f, simular, fechar }: { f: MeuFornecedor; simular?: boolean; fechar: () => void }) {
  const [estado, acao] = useActionState<Estado, FormData>(simular ? simulado : salvarFornecedor, null)
  useEffect(() => { if (estado?.ok && !simular) fechar() }, [estado, simular, fechar])
  return (
    <form action={acao} className="lv-card lv-forn-form" key={f.id || f.nome}>
      <h3>{f.id ? `Editar ${f.nome}` : 'Novo fornecedor'}</h3>
      <input type="hidden" name="id" value={f.id} />
      <div className="lv-forn-campos">
        <label>Nome<input name="nome" className="lv-input" defaultValue={f.nome} maxLength={80} required placeholder="Igual ao campo Fornecedor dos produtos" /></label>
        <label>Pessoa de contato<input name="contato" className="lv-input" defaultValue={f.contato ?? ''} maxLength={80} /></label>
        <label>WhatsApp<input name="whatsapp" className="lv-input" defaultValue={f.whatsapp ?? ''} inputMode="tel" placeholder="(81) 99999-9999" /></label>
        <label>E-mail<input name="email" type="email" className="lv-input" defaultValue={f.email ?? ''} maxLength={120} /></label>
        <label>Cidade<input name="cidade" className="lv-input" defaultValue={f.cidade ?? ''} maxLength={80} /></label>
        <label>Site<input name="site" className="lv-input" defaultValue={f.site ?? ''} maxLength={200} /></label>
        <label>Prazo de entrega (dias)<input name="prazo_dias" className="lv-input" defaultValue={f.prazo_dias ?? ''} inputMode="numeric" /></label>
        <label>Pedido mínimo (R$)<input name="pedido_minimo" className="lv-input" defaultValue={f.pedido_minimo ?? ''} inputMode="decimal" /></label>
        <label>Pagamento<input name="pagamento" className="lv-input" defaultValue={f.pagamento ?? ''} maxLength={120} placeholder="Ex.: Pix 5% off, boleto 30 dias" /></label>
        <label>Último pedido<input name="ultimo_pedido" type="date" className="lv-input" defaultValue={f.ultimo_pedido ?? ''} /></label>
        <label>Sua nota
          <select name="nota" defaultValue={f.nota ?? ''}>
            <option value="">Sem nota</option>
            {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{'★'.repeat(n)} ({n})</option>)}
          </select>
        </label>
        <label className="largo">Anotações<textarea name="obs" rows={2} defaultValue={f.obs ?? ''} maxLength={1000} placeholder="Ex.: atrasa em dezembro, manda brinde acima de R$ 800" /></label>
      </div>
      <Mensagem estado={estado} />
      <div className="acoes">
        <Enviar>Salvar</Enviar>
        <button type="button" className="lv-btn sec" onClick={fechar}>Cancelar</button>
      </div>
    </form>
  )
}
