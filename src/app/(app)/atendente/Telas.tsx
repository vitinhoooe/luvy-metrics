'use client'
import { useActionState, useState } from 'react'
import { Enviar, Mensagem, type Estado } from '@/components/Enviar'
import { dataHora } from '@/lib/formato'
import { salvarAtendente } from './acoes'

export type ConfigAtendente = { atendente_ativo: boolean; atendente_nome: string; atendente_tom: string; atendente_info: string | null }

export function FormAtendente({ c, podeEditar, simular }: { c: ConfigAtendente; podeEditar: boolean; simular?: boolean }) {
  const simulado = async (): Promise<Estado> => ({ ok: 'Prévia: nada foi salvo.' })
  const [estado, acao] = useActionState<Estado, FormData>(simular ? simulado : salvarAtendente, null)
  const [ativo, setAtivo] = useState(c.atendente_ativo)
  const [nome, setNome] = useState(c.atendente_nome)
  return (
    <form action={acao} className="lv-card lv-form">
      <fieldset disabled={!podeEditar} style={{ border: 0, display: 'grid', gap: 14 }}>
        <label className={`lv-interruptor${ativo ? ' on' : ''}`}>
          <input type="checkbox" name="atendente_ativo" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} />
          <span className="trilho"><i /></span>
          <span><strong>{ativo ? `${nome || 'Lia'} está atendendo` : 'Atendente desligado'}</strong><small>{ativo ? 'Aparece o botão "Tirar dúvida" na sua vitrine, 24 horas.' : 'Ligue para responder clientes de madrugada.'}</small></span>
        </label>
        <div className="linha">
          <div className="lv-campo">
            <label htmlFor="atendente_nome">Nome da atendente</label>
            <input id="atendente_nome" name="atendente_nome" className="lv-input" maxLength={20} value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <div className="lv-campo">
            <label htmlFor="atendente_tom">Jeito de falar</label>
            <select id="atendente_tom" name="atendente_tom" defaultValue={c.atendente_tom}>
              <option value="acolhedor">Acolhedor e próximo</option>
              <option value="divertido">Leve e bem-humorado</option>
              <option value="elegante">Elegante e direto</option>
            </select>
          </div>
        </div>
        <div className="lv-campo">
          <label htmlFor="atendente_info">O que ela precisa saber da sua loja</label>
          <textarea id="atendente_info" name="atendente_info" rows={6} maxLength={1500} defaultValue={c.atendente_info ?? ''}
            placeholder={'Ex.: Horário: seg a sáb, 10h às 20h.\nTrocas em até 7 dias com o lacre intacto.\nFrete grátis para Boa Vista e Graças.\nEnvio em embalagem sem identificação.'} />
          <small>Horário, trocas, bairros atendidos, perguntas frequentes. Ela responde só com o que estiver aqui e no seu catálogo.</small>
        </div>
        <Mensagem estado={estado} />
        <div><Enviar>Salvar atendente</Enviar></div>
      </fieldset>
    </form>
  )
}

export type Conversa = {
  id: string
  mensagens: number
  chamou_loja: boolean
  sugeriu_sacola: boolean
  atualizada_em: string
  conversa_mensagens: { papel: 'cliente' | 'atendente'; texto: string; id: number }[]
}

export function ListaConversas({ conversas }: { conversas: Conversa[] }) {
  const [aberta, setAberta] = useState<string | null>(conversas[0]?.id ?? null)
  if (!conversas.length) {
    return <div className="lv-card lv-vazio"><h3>Nenhuma conversa ainda</h3><p>Quando uma cliente falar com a atendente na vitrine, a conversa aparece aqui.</p></div>
  }
  const atual = conversas.find((c) => c.id === aberta)
  return (
    <div className="lv-conversas">
      <ul className="lv-conversas-lista">
        {conversas.map((c) => {
          const primeira = [...c.conversa_mensagens].sort((a, b) => a.id - b.id).find((m) => m.papel === 'cliente')
          return (
            <li key={c.id}>
              <button className={aberta === c.id ? 'on' : ''} onClick={() => setAberta(c.id)}>
                <strong>{primeira?.texto.slice(0, 60) ?? 'Conversa'}</strong>
                <small>{dataHora(c.atualizada_em)} · {Math.ceil(c.mensagens / 2)} {Math.ceil(c.mensagens / 2) === 1 ? 'pergunta' : 'perguntas'}</small>
                <span className="tags">
                  {c.sugeriu_sacola && <span className="lv-selo ok">indicou produto</span>}
                  {c.chamou_loja && <span className="lv-selo alerta">pediu a loja</span>}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
      <div className="lv-conversa">
        {atual ? [...atual.conversa_mensagens].sort((a, b) => a.id - b.id).map((m) => (
          <p key={m.id} className={m.papel}>{m.texto}</p>
        )) : <p className="lv-vazio">Escolha uma conversa.</p>}
      </div>
    </div>
  )
}
