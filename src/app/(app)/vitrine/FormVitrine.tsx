'use client'
import { useActionState, useState } from 'react'
import { Enviar, Mensagem, type Estado } from '@/components/Enviar'
import { CORES, type CorVitrine } from '../../loja/tipos'
import { salvarVitrine } from './acoes'
import { REGIOES, type FreteRegioes } from '@/lib/frete'

export type ConfigVitrine = {
  vitrine_ativa: boolean
  vitrine_cor: CorVitrine
  vitrine_descricao: string | null
  pix_chave: string | null
  pix_nome: string | null
  entrega_retirada: boolean
  endereco_retirada: string | null
  entrega_local: boolean
  entrega_local_taxa: number
  entrega_combinar: boolean
  prazo_pagamento_h?: number
  prazo_separar_h?: number
  prazo_entrega_h?: number
  cancelar_apos_h?: number
  vitrine_instagram?: string | null
  vitrine_horario?: string | null
  vitrine_sobre?: string | null
  entrega_brasil?: boolean
  frete_regioes?: FreteRegioes
  frete_gratis_acima?: number | null
  prazo_retirada?: string | null
  prazo_local?: string | null
}

const tipoDaChave = (c: string | null) =>
  !c ? 'celular' : c.includes('@') ? 'email' : c.startsWith('+') ? 'celular' : c.includes('-') ? 'aleatoria' : c.length === 14 ? 'cnpj' : 'cpf'

export function FormVitrine({ c, nomeLoja, podeEditar, simular }: { c: ConfigVitrine; nomeLoja: string; podeEditar: boolean; simular?: boolean }) {
  const simulado = async (): Promise<Estado> => ({ ok: 'Prévia: nada foi salvo.' })
  const [estado, acao] = useActionState<Estado, FormData>(simular ? simulado : salvarVitrine, null)
  const [cor, setCor] = useState<CorVitrine>(c.vitrine_cor)
  const [ativa, setAtiva] = useState(c.vitrine_ativa)
  const [local, setLocal] = useState(c.entrega_local)
  const [retirada, setRetirada] = useState(c.entrega_retirada)
  const [desc, setDesc] = useState(c.vitrine_descricao ?? '')
  const [brasil, setBrasil] = useState(!!c.entrega_brasil)
  const g = CORES[cor]

  return (
    <form action={acao} className="lv-grid c2" style={{ alignItems: 'start' }}>
      <fieldset disabled={!podeEditar} className="lv-card lv-form" style={{ border: '1px solid #efe6f0' }}>
        <label className={`lv-interruptor${ativa ? ' on' : ''}`}>
          <input type="checkbox" name="vitrine_ativa" checked={ativa} onChange={(e) => setAtiva(e.target.checked)} />
          <span className="trilho"><i /></span>
          <span><strong>{ativa ? 'Vitrine no ar' : 'Vitrine desligada'}</strong><small>{ativa ? 'Clientes podem ver e fazer pedidos.' : 'Ninguém vê a loja até você ligar.'}</small></span>
        </label>

        <div className="lv-campo">
          <span className="lv-rotulo">Cor da loja</span>
          <div className="lv-cores">
            {(Object.keys(CORES) as CorVitrine[]).map((k) => (
              <label key={k} className={`lv-cor${cor === k ? ' on' : ''}`} title={CORES[k].nome}>
                <input type="radio" name="cor" value={k} checked={cor === k} onChange={() => setCor(k)} />
                <i style={{ background: `linear-gradient(135deg, ${CORES[k].a}, ${CORES[k].b})` }} />
                <span>{CORES[k].nome}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="lv-campo">
          <label htmlFor="vitrine_descricao">Frase de boas-vindas</label>
          <input id="vitrine_descricao" name="vitrine_descricao" className="lv-input" maxLength={140} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Ex.: Bem-estar íntimo com discrição e carinho." />
        </div>

        <div className="linha">
          <div className="lv-campo">
            <label htmlFor="vitrine_instagram">Instagram da loja</label>
            <input id="vitrine_instagram" name="vitrine_instagram" className="lv-input" maxLength={31} defaultValue={c.vitrine_instagram ?? ''} placeholder="@sualoja" />
          </div>
          <div className="lv-campo" style={{ gridColumn: 'span 2' }}>
            <label htmlFor="vitrine_horario">Horário de atendimento</label>
            <input id="vitrine_horario" name="vitrine_horario" className="lv-input" maxLength={80} defaultValue={c.vitrine_horario ?? ''} placeholder="Ex.: Seg a sáb, 9h às 19h" />
          </div>
        </div>
        <div className="lv-campo">
          <label htmlFor="vitrine_sobre">Sobre a loja (aparece no rodapé da vitrine)</label>
          <textarea id="vitrine_sobre" name="vitrine_sobre" rows={2} maxLength={400} defaultValue={c.vitrine_sobre ?? ''} placeholder="Ex.: Loja de bem-estar íntimo em Recife desde 2019. Atendimento acolhedor e entrega discreta." />
        </div>

        <h2 style={{ marginTop: 6 }}>Pix pela sua chave (o dinheiro cai direto na sua conta)</h2>
        <div className="linha">
          <div className="lv-campo">
            <label htmlFor="pix_tipo">Tipo da chave</label>
            <select id="pix_tipo" name="pix_tipo" defaultValue={tipoDaChave(c.pix_chave)}>
              <option value="celular">Celular</option><option value="cpf">CPF</option><option value="cnpj">CNPJ</option><option value="email">E-mail</option><option value="aleatoria">Aleatória</option>
            </select>
          </div>
          <div className="lv-campo" style={{ gridColumn: 'span 2' }}>
            <label htmlFor="pix_chave">Chave Pix</label>
            <input id="pix_chave" name="pix_chave" className="lv-input" defaultValue={c.pix_chave ?? ''} placeholder="Deixe vazio para não aceitar Pix" />
          </div>
        </div>
        <div className="lv-campo">
          <label htmlFor="pix_nome">Nome que aparece no Pix</label>
          <input id="pix_nome" name="pix_nome" className="lv-input" maxLength={25} defaultValue={c.pix_nome ?? nomeLoja} />
          <small>Use o nome do titular da conta, como está no banco.</small>
        </div>

        <h2 style={{ marginTop: 6 }}>Entrega</h2>
        <label className="lv-check"><input type="checkbox" name="entrega_retirada" checked={retirada} onChange={(e) => setRetirada(e.target.checked)} />Retirada na loja</label>
        {retirada && (
          <div className="linha">
            <input name="endereco_retirada" className="lv-input" maxLength={160} defaultValue={c.endereco_retirada ?? ''} placeholder="Endereço para retirada (aparece depois do pedido)" style={{ gridColumn: 'span 2' }} />
            <input name="prazo_retirada" className="lv-input" maxLength={60} defaultValue={c.prazo_retirada ?? ''} placeholder="Prazo: ex. pronto em 2 horas" />
          </div>
        )}
        <label className="lv-check"><input type="checkbox" name="entrega_local" checked={local} onChange={(e) => setLocal(e.target.checked)} />Entrega na minha cidade</label>
        {local && (
          <div className="lv-campo" style={{ maxWidth: 220 }}>
            <label htmlFor="entrega_local_taxa">Taxa de entrega (R$)</label>
            <input id="entrega_local_taxa" name="entrega_local_taxa" className="lv-input mono" inputMode="decimal" defaultValue={String(c.entrega_local_taxa ?? 0).replace('.', ',')} />
          </div>
        )}
        {local && <input name="prazo_local" className="lv-input" maxLength={60} defaultValue={c.prazo_local ?? ''} placeholder="Prazo na cidade: ex. no mesmo dia" style={{ maxWidth: 360 }} />}
        <label className="lv-check"><input type="checkbox" name="entrega_brasil" checked={brasil} onChange={(e) => setBrasil(e.target.checked)} />Envio para todo o Brasil (frete por região, calculado pelo CEP)</label>
        {brasil && (
          <div className="lv-frete">
            <div className="lv-frete-cab"><span>Região</span><span>Frete (R$)</span><span>Prazo</span></div>
            {REGIOES.map((r) => (
              <div key={r.id} className="lv-frete-linha">
                <span><strong>{r.nome}</strong><small>{r.ufs}</small></span>
                <input name={`frete_${r.id}`} className="lv-input mono" inputMode="decimal" placeholder="não envio" defaultValue={c.frete_regioes?.[r.id]?.valor != null ? String(c.frete_regioes[r.id]!.valor).replace('.', ',') : ''} />
                <input name={`prazo_${r.id}`} className="lv-input" maxLength={40} placeholder="ex. 5 a 8 dias úteis" defaultValue={c.frete_regioes?.[r.id]?.prazo ?? ''} />
              </div>
            ))}
            <small>Deixe o frete vazio nas regiões para onde você não envia. A cliente vê o valor na hora, ao digitar o CEP.</small>
          </div>
        )}
        {(local || brasil) && (
          <div className="lv-campo" style={{ maxWidth: 360 }}>
            <label htmlFor="frete_gratis_acima">Frete grátis acima de (R$)</label>
            <input id="frete_gratis_acima" name="frete_gratis_acima" className="lv-input mono" inputMode="decimal" placeholder="vazio = sem frete grátis" defaultValue={c.frete_gratis_acima ? String(c.frete_gratis_acima).replace('.', ',') : ''} />
            <small>Vale para entrega na cidade e para o Brasil. A sacola mostra quanto falta.</small>
          </div>
        )}
        <label className="lv-check"><input type="checkbox" name="entrega_combinar" defaultChecked={c.entrega_combinar} />Envio combinado (Correios, transportadora)</label>

        <h2 style={{ marginTop: 6 }}>Prazos dos pedidos</h2>
        <p style={{ color: 'var(--dim)', fontSize: 13, marginTop: -6 }}>Passou do prazo, o pedido fica vermelho na lista de pedidos.</p>
        <div className="linha">
          <div className="lv-campo"><label htmlFor="prazo_pagamento_h">Pagar em até (horas)</label><input id="prazo_pagamento_h" name="prazo_pagamento_h" className="lv-input mono" inputMode="numeric" defaultValue={c.prazo_pagamento_h ?? 2} /></div>
          <div className="lv-campo"><label htmlFor="prazo_separar_h">Separar em até (horas)</label><input id="prazo_separar_h" name="prazo_separar_h" className="lv-input mono" inputMode="numeric" defaultValue={c.prazo_separar_h ?? 24} /></div>
          <div className="lv-campo"><label htmlFor="prazo_entrega_h">Entregar em até (horas)</label><input id="prazo_entrega_h" name="prazo_entrega_h" className="lv-input mono" inputMode="numeric" defaultValue={c.prazo_entrega_h ?? 72} /></div>
        </div>
        <div className="lv-campo" style={{ maxWidth: 360 }}>
          <label htmlFor="cancelar_apos_h">Cancelar sozinho se não pagar em (horas)</label>
          <input id="cancelar_apos_h" name="cancelar_apos_h" className="lv-input mono" inputMode="numeric" defaultValue={c.cancelar_apos_h ?? 24} />
          <small>Use 0 para nunca cancelar sozinho. O estoque não é afetado: ele só baixa quando o pedido é pago.</small>
        </div>

        <Mensagem estado={estado} />
        <div><Enviar>Salvar vitrine</Enviar></div>
      </fieldset>

      <div className="lv-mini-vitrine" style={{ '--va': g.a, '--vb': g.b } as React.CSSProperties} aria-hidden>
        <div className="mv-topo"><span className="mv-mono">{nomeLoja.slice(0, 2).toUpperCase()}</span><strong>{nomeLoja}</strong><span className="mv-sacola">Sacola</span></div>
        <h3>{desc || `Boas-vindas à ${nomeLoja}`}</h3>
        <div className="mv-grade">
          {['Gel morango', 'Óleo de massagem', 'Vibrador bullet', 'Body de renda'].map((n) => (
            <div key={n}><i /><b>{n}</b><span>Adicionar</span></div>
          ))}
        </div>
        <p>Assim fica sua vitrine (prévia)</p>
      </div>
    </form>
  )
}
