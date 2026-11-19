// Catálogo do que conversa com o Luvy hoje. A única integração externa é o Mercado Pago.
// Regra: nunca mostrar como "conectado" algo que não existe. "Quero essa" só registra o pedido.

export type EstadoIntegracao = 'ligada' | 'chegando' | 'planejada'
export type GrupoIntegracao = 'pagamento' | 'canais' | 'dados' | 'atendimento'

export type Integracao = {
  id: string
  nome: string
  grupo: GrupoIntegracao
  estado: EstadoIntegracao
  oQueFaz: string
  dados: string          // o que entra no Luvy com ela
  pergunta?: string      // pedimos um detalhe ao marcar "Quero essa"
  href?: string          // onde configurar (as ligadas)
}

export const GRUPOS: Record<GrupoIntegracao, string> = {
  pagamento: 'Pagamentos',
  canais: 'Onde você vende',
  dados: 'Planilhas e banco',
  atendimento: 'Atendimento',
}

export const INTEGRACOES: Integracao[] = [
  // ---------- ligadas: funcionam hoje ----------
  { id: 'balcao', nome: 'Balcão (PDV)', grupo: 'canais', estado: 'ligada', href: '/vender',
    oQueFaz: 'Cada venda no balcão, no WhatsApp ou no Instagram baixa o estoque na hora.',
    dados: 'Produto, quantidade, canal e forma de pagamento (Pix, dinheiro, débito ou crédito).' },
  { id: 'vitrine', nome: 'Vitrine online (seu site)', grupo: 'canais', estado: 'ligada', href: '/vitrine',
    oQueFaz: 'A cliente compra no seu site e o pedido cai direto em Pedidos.',
    dados: 'Pedido, cliente, entrega e o valor do Pix com centavos únicos.' },
  { id: 'mercadopago', nome: 'Mercado Pago', grupo: 'pagamento', estado: 'ligada', href: '/vitrine#mercadopago',
    oQueFaz: 'A cliente paga com Pix ou cartão na sua vitrine e o pedido vira “pago” sozinho. O dinheiro cai direto na sua conta.',
    dados: 'Pagamento aprovado, valor e forma (Pix, crédito ou débito).' },
  { id: 'extrato', nome: 'Extrato do banco (OFX ou CSV)', grupo: 'pagamento', estado: 'ligada', href: '/pedidos/conciliar',
    oQueFaz: 'Sobe o extrato e o Luvy confirma de uma vez os pedidos pagos por Pix.',
    dados: 'Entradas de Pix: valor, data e quem pagou.' },
  { id: 'planilha', nome: 'Planilhas (Excel e CSV)', grupo: 'dados', estado: 'ligada', href: '/produtos/importar',
    oQueFaz: 'Traz seus produtos e as vendas antigas do sistema que você usava.',
    dados: 'Produtos, estoque, custo, preço e o histórico de vendas.' },
  { id: 'exportar', nome: 'Baixar meus dados', grupo: 'dados', estado: 'ligada', href: '/conta',
    oQueFaz: 'Leva seus produtos, vendas e clientes em planilha quando quiser.',
    dados: 'Sai do Luvy em CSV, que abre no Excel.' },
  { id: 'atendente', nome: 'Atendente IA na vitrine', grupo: 'atendimento', estado: 'ligada', href: '/atendente',
    oQueFaz: 'Responde dúvidas de produto 24 h no seu site, só com o que tem em estoque.',
    dados: 'Conversas e os produtos que ela indicou.' },
  { id: 'whatsapp-links', nome: 'WhatsApp (um toque)', grupo: 'atendimento', estado: 'ligada', href: '/pedidos',
    oQueFaz: 'O pedido do site chega no seu WhatsApp e você avisa a cliente com uma mensagem pronta.',
    dados: 'Nenhum dado sai do Luvy sozinho: você aperta “enviar” no seu WhatsApp.' },

]

export const ROTULO_ESTADO: Record<EstadoIntegracao, string> = { ligada: 'Funcionando', chegando: 'Na fila', planejada: 'Em estudo' }
