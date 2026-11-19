// Status do pedido da vitrine e as mensagens prontas de WhatsApp para cada um.

export const ETAPAS = ['novo', 'pago', 'separado', 'enviado', 'entregue'] as const
export type StatusPedido = (typeof ETAPAS)[number] | 'cancelado'

export const STATUS: Record<StatusPedido, { nome: string; cliente: string; classe: string }> = {
  novo: { nome: 'Novo', cliente: 'Pedido recebido', classe: 'alerta' },
  pago: { nome: 'Pago', cliente: 'Pagamento confirmado', classe: 'ok' },
  separado: { nome: 'Separado', cliente: 'Separado e embalado', classe: 'ok' },
  enviado: { nome: 'A caminho', cliente: 'A caminho', classe: 'ok' },
  entregue: { nome: 'Entregue', cliente: 'Entregue', classe: '' },
  cancelado: { nome: 'Cancelado', cliente: 'Pedido cancelado', classe: 'erro' },
}

export const PROXIMO: Partial<Record<StatusPedido, { status: StatusPedido; acao: string }>> = {
  pago: { status: 'separado', acao: 'Marcar como separado' },
  separado: { status: 'enviado', acao: 'Saiu para entrega' },
  enviado: { status: 'entregue', acao: 'Marcar como entregue' },
}

type Dados = {
  numero: number
  cliente: string
  loja: string
  status: StatusPedido
  pagamento: string
  entrega: string
  enderecoRetirada?: string | null
  rastreio?: string | null
  link?: string
}

/** Mensagem que a lojista manda para a cliente (abre o WhatsApp com o texto pronto). */
export function mensagemCliente(d: Dados) {
  const nome = d.cliente.split(' ')[0]
  const acompanhe = d.link ? `\nAcompanhe aqui: ${d.link}` : ''
  switch (d.status) {
    case 'novo':
      return `Oi, ${nome}! Recebemos seu pedido #${d.numero} na ${d.loja} 💜 ${d.pagamento === 'pix' ? 'Assim que o Pix cair, a gente separa.' : 'Vamos combinar o pagamento?'}${acompanhe}`
    case 'pago':
      return `Oi, ${nome}! Pagamento do pedido #${d.numero} confirmado ✅ Já vamos separar tudo com carinho.${acompanhe}`
    case 'separado':
      return `Oi, ${nome}! Seu pedido #${d.numero} está separado e embalado com discrição 📦 ${d.entrega === 'retirada' ? `Pode retirar${d.enderecoRetirada ? ` em ${d.enderecoRetirada}` : ''}.` : 'Logo sai para entrega.'}${acompanhe}`
    case 'enviado':
      return `Oi, ${nome}! Seu pedido #${d.numero} está a caminho 🚚${d.rastreio ? `\nCódigo de rastreio: ${d.rastreio}` : ''}${acompanhe}`
    case 'entregue':
      return `Oi, ${nome}! Seu pedido #${d.numero} foi entregue 💜 Obrigada pela compra! Qualquer coisa, é só chamar.`
    case 'cancelado':
      return `Oi, ${nome}. Seu pedido #${d.numero} foi cancelado. Se foi engano, é só responder esta mensagem.`
  }
}

export const linkWhatsApp = (numero: string, texto: string) =>
  `https://wa.me/55${numero.replace(/\D/g, '').replace(/^55/, '')}?text=${encodeURIComponent(texto)}`

export type Prazos = { prazo_pagamento_h: number; prazo_separar_h: number; prazo_entrega_h: number }
export const PRAZOS_PADRAO: Prazos = { prazo_pagamento_h: 2, prazo_separar_h: 24, prazo_entrega_h: 72 }

const tempo = (ms: number) => {
  const min = Math.round(ms / 60000)
  if (min < 60) return `${Math.max(min, 1)} min`
  const h = Math.round(min / 60)
  return h < 48 ? `${h} h` : `${Math.round(h / 24)} dias`
}

/** Semáforo de cada pedido: está dentro do prazo da etapa em que está? */
export function calcularPrazo(
  p: { status: StatusPedido; criado_em: string; atualizado_em?: string | null },
  c: Prazos,
  agora = Date.now(),
): { atrasado: boolean; texto: string } | null {
  const horas = p.status === 'novo' ? c.prazo_pagamento_h
    : p.status === 'pago' || p.status === 'separado' ? c.prazo_separar_h
    : p.status === 'enviado' ? c.prazo_entrega_h : 0
  if (!horas) return null
  const desde = Date.parse(p.status === 'novo' ? p.criado_em : p.atualizado_em ?? p.criado_em)
  const limite = desde + horas * 3600000
  return agora > limite
    ? { atrasado: true, texto: `atrasado ${tempo(agora - limite)}` }
    : { atrasado: false, texto: `no prazo · faltam ${tempo(limite - agora)}` }
}
