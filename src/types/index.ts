export type ProdutoTendencia = {
  id: string
  nome?: string
  produto_nome: string
  fonte: string
  categoria: string
  crescimento_pct: number
  vendas_hoje: number
  vendas_ontem: number
  preco_medio: number
  alerta: boolean
  url_produto?: string | null
  imagem_url?: string | null
  marketplace?: string | null
  updated_at: string
  created_at: string
}

export type EstoqueItem = {
  id: string
  user_id: string
  produto_nome: string
  quantidade: number
  quantidade_minima: number
  preco_custo: number
  preco_venda: number
  categoria: string
  ativo: boolean
  created_at: string
  updated_at: string
}

export type Movimentacao = {
  id: string
  user_id: string
  produto_id: string
  tipo: 'entrada' | 'saida'
  quantidade: number
  observacao: string
  created_at: string
}

export type Calculo = {
  id: string
  user_id: string
  produto_nome: string
  custo: number
  marketplace: string
  taxa_marketplace: number
  margem_pct: number
  simples_nacional: boolean
  preco_ideal: number
  lucro_unidade: number
  created_at: string
}

export type Perfil = {
  id: string
  user_id: string
  nome: string
  nome_loja: string
  whatsapp: string
  faturamento: string
  trial_expira_em: string
  estoque_evitado_valor: number
  alertas_diarios: boolean
  alertas_oportunidade: boolean
  relatorio_dominical: boolean
  alertas_estoque: boolean
  qtd_minima_padrao: number
  categoria_padrao: string
  alerta_ao_zerar: boolean
  onboarding_completo: boolean
  created_at: string
  updated_at: string
}

export type Notificacao = {
  id: string
  user_id: string
  titulo: string
  mensagem: string
  tipo: 'tendencia' | 'estoque' | 'trial'
  lida: boolean
  created_at: string
}

export type MensagemBot = {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}
