export const UFS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'] as const

export const CATEGORIAS = [
  'Vibradores', 'Lubrificantes', 'Cosméticos sensuais', 'Óleos de massagem', 'Lingerie', 'Fantasias',
  'Preservativos', 'Plugs e anal', 'Acessórios BDSM', 'Jogos e brincadeiras', 'Masculino', 'Kits e presentes',
] as const

export const FORMAS_PAGAMENTO = [
  { id: 'pix', nome: 'Pix' },
  { id: 'dinheiro', nome: 'Dinheiro' },
  { id: 'debito', nome: 'Débito' },
  { id: 'credito', nome: 'Crédito' },
  { id: 'outro', nome: 'Outro' },
] as const
export type FormaPagamento = (typeof FORMAS_PAGAMENTO)[number]['id']

// onde a venda aconteceu (o PDV registra balcão, WhatsApp e Instagram; vitrine e histórico entram sozinhos)
export const CANAIS_PDV = [
  { id: 'balcao', nome: 'Balcão' },
  { id: 'whatsapp', nome: 'WhatsApp' },
  { id: 'instagram', nome: 'Instagram' },
] as const
export const NOME_CANAL: Record<string, string> = {
  balcao: 'Balcão', vitrine: 'Vitrine', ia: 'Atendente IA', manual: 'Manual', whatsapp: 'WhatsApp', instagram: 'Instagram', historico: 'Histórico',
}
