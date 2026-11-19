import Link from 'next/link'
import { FormAtendente, ListaConversas, type Conversa } from '../../(app)/atendente/Telas'

const h = (horas: number) => new Date(Date.now() - horas * 3600000).toISOString()
const CONVERSAS: Conversa[] = [
  {
    id: 'c1', mensagens: 6, chamou_loja: false, sugeriu_sacola: true, atualizada_em: h(0.2),
    conversa_mensagens: [
      { id: 1, papel: 'cliente', texto: 'Oi, quero um presente pro meu namorado, algo até 100 reais' },
      { id: 2, papel: 'atendente', texto: 'Que ideia boa! 💜 Até R$ 100 tenho o Vibrador bullet recarregável (R$ 89,90) e o Jogo de dados eróticos (R$ 19,90), que fica divertido para os dois. Quer que eu separe algum?' },
      { id: 3, papel: 'cliente', texto: 'o jogo de dados e um gel' },
      { id: 4, papel: 'atendente', texto: 'Perfeito! Separei o Jogo de dados eróticos e o Gel beijável morango 30ml (R$ 24,90). É só tocar em "Adicionar à sacola".' },
      { id: 5, papel: 'cliente', texto: 'a embalagem é discreta?' },
      { id: 6, papel: 'atendente', texto: 'Sim! A embalagem não identifica o conteúdo nem a loja.' },
    ],
  },
  {
    id: 'c2', mensagens: 4, chamou_loja: true, sugeriu_sacola: false, atualizada_em: h(3),
    conversa_mensagens: [
      { id: 7, papel: 'cliente', texto: 'meu pedido 41 já saiu?' },
      { id: 8, papel: 'atendente', texto: 'Para ver o andamento do pedido #41, o melhor é falar direto com a loja. Toque no botão abaixo que a mensagem já vai pronta.' },
      { id: 9, papel: 'cliente', texto: 'ok obrigada' },
      { id: 10, papel: 'atendente', texto: 'Por nada! Qualquer coisa, é só chamar 💜' },
    ],
  },
  {
    id: 'c3', mensagens: 2, chamou_loja: false, sugeriu_sacola: false, atualizada_em: h(9),
    conversa_mensagens: [
      { id: 11, papel: 'cliente', texto: 'vocês entregam em olinda?' },
      { id: 12, papel: 'atendente', texto: 'A entrega na cidade é para Recife (R$ 10). Para Olinda, dá para retirar na loja ou combinar o envio pelo WhatsApp da loja.' },
    ],
  },
]

export default function PreviaAtendente() {
  return (
    <>
      <div className="lv-top"><div><h1>Atendente IA</h1><p>Responde suas clientes na vitrine 24 horas · conversas de exemplo · <Link href="/previa-loja" target="_blank" style={{ textDecoration: 'underline' }}>testar na vitrine</Link></p></div></div>
      <div className="lv-grid c3" style={{ marginBottom: 14 }}>
        <div className="lv-kpi"><span>Conversas neste mês</span><strong>87</strong><small>de 1.500 do seu plano</small></div>
        <div className="lv-kpi"><span>Indicou produtos</span><strong>1</strong><small>nas últimas 3 conversas</small></div>
        <div className="lv-kpi"><span>Passou para você</span><strong>1</strong><small>pediram a loja no WhatsApp</small></div>
      </div>
      <div className="lv-grid c2" style={{ alignItems: 'start' }}>
        <FormAtendente simular podeEditar c={{ atendente_ativo: true, atendente_nome: 'Lia', atendente_tom: 'acolhedor', atendente_info: 'Horário: seg a sáb, 10h às 20h.\nTrocas em até 7 dias com o lacre intacto.\nEnvio em embalagem sem identificação.' }} />
        <div className="lv-card"><h2>Conversas recentes</h2><ListaConversas conversas={CONVERSAS} /></div>
      </div>
    </>
  )
}
