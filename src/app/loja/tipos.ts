import type { FreteRegioes } from '@/lib/frete'

export type CorVitrine = 'rosa' | 'vinho' | 'violeta' | 'noite' | 'nude' | 'esmeralda' | 'coral' | 'oceano'

export const CORES: Record<CorVitrine, { nome: string; a: string; b: string }> = {
  rosa: { nome: 'Rosa Luvy', a: '#ff6fa3', b: '#a23a8e' },
  vinho: { nome: 'Vinho', a: '#d0487a', b: '#4f1a4b' },
  violeta: { nome: 'Violeta', a: '#a17bff', b: '#5e2f88' },
  noite: { nome: 'Noite', a: '#5b4862', b: '#17121a' },
  nude: { nome: 'Nude', a: '#d9a89a', b: '#8a5a52' },
  esmeralda: { nome: 'Esmeralda', a: '#3fb68b', b: '#0f4c3a' },
  coral: { nome: 'Coral', a: '#ff8a6b', b: '#c2414b' },
  oceano: { nome: 'Oceano', a: '#4fa3e0', b: '#1d3b78' },
}

export type ProdutoVitrine = { id: string; nome: string; categoria: string | null; preco: number; preco_de?: number | null; disponivel: number; foto: string | null; fotos?: string[]; descricao?: string | null; destaque?: boolean }

export type LojaVitrine = {
  fechada: false
  nome: string
  slug: string
  cidade: string
  uf: string
  cor: CorVitrine
  descricao: string | null
  whatsapp: string | null
  pix: boolean
  mercadopago?: boolean
  instagram?: string | null
  horario?: string | null
  sobre?: string | null
  logo?: string | null
  capa?: string | null
  entrega: {
    retirada: boolean; endereco_retirada: string | null; prazo_retirada?: string | null
    local: boolean; local_taxa: number; prazo_local?: string | null
    combinar: boolean
    brasil?: boolean; regioes?: FreteRegioes; gratis_acima?: number | null
  }
  produtos: ProdutoVitrine[]
  atendente?: { ativo: boolean; nome: string; tom?: string; info?: string | null }
}

export type PedidoPublico = {
  numero: number
  status: string
  total: number
  subtotal: number
  frete: number
  entrega: 'retirada' | 'local' | 'combinar' | 'brasil'
  pagamento: 'pix' | 'combinar' | 'mercadopago'
  cliente: string
  criado_em: string
  loja: { nome: string; slug: string; cidade: string; cor: CorVitrine; whatsapp: string | null; pix_chave: string | null; pix_nome: string; endereco_retirada: string | null }
  itens: { nome: string; quantidade: number; preco: number }[]
  rastreio?: string | null
  valor_pix?: number | null
  mp_link?: string | null
  pago_por?: string | null
  eventos?: { status: string; em: string }[] | null
}
