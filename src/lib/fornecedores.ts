// Diretório de fornecedores do nicho.
// REGRA: só contato comercial publicado pela própria empresa (site oficial), com fonte e data.
// Nada de "melhor" ou "recomendado": o Luvy não tem parceria nem verificou esses fornecedores.
// Para incluir um novo: conferir no site oficial, preencher fonte e conferido_em.

export type TipoFornecedor = 'distribuidora' | 'fabricante'

export type Fornecedor = {
  id: string
  nome: string
  tipo: TipoFornecedor
  cidade: string | null
  uf: string | null
  whatsapp: string | null // só dígitos com DDD
  telefone: string | null
  email: string | null
  site: string
  cnpj: string | null
  vende: string
  condicoes: string | null
  obs: string | null
  fonte: string
  conferido_em: string // AAAA-MM
}

export const DIRETORIO_CONFERIDO = 'novembro de 2026'

export const FORNECEDORES: Fornecedor[] = [
  {
    id: 'cupido', nome: 'Cupido Distribuidora', tipo: 'distribuidora', cidade: 'Goiânia', uf: 'GO',
    whatsapp: '62991150766', telefone: '6232898319', email: null, site: 'https://www.cupidodistribuidora.com.br',
    cnpj: '14.578.067/0001-12',
    vende: 'Atacado de produtos eróticos: vibradores, próteses, lingerie, lubrificantes e cosméticos.',
    condicoes: 'Atende lojistas e revendedores. Pedido mínimo não publicado no site.',
    obs: null, fonte: 'https://www.cupidodistribuidora.com.br', conferido_em: '2026-11',
  },
  {
    id: 'sex-distribuidora', nome: 'Sex Distribuidora', tipo: 'distribuidora', cidade: 'Montes Claros', uf: 'MG',
    whatsapp: '38998633214', telefone: null, email: null, site: 'https://www.sexdistribuidora.com.br',
    cnpj: null,
    vende: 'Atacado para revenda de produtos de sex shop.',
    condicoes: 'Pedido mínimo de R$ 300 com frete grátis, segundo o site. Atendimento seg. a sex. 9h–18h, sáb. 9h–13h.',
    obs: null, fonte: 'https://www.sexdistribuidora.com.br', conferido_em: '2026-11',
  },
  {
    id: 'miess', nome: 'Miess Sex Shop', tipo: 'distribuidora', cidade: 'São Paulo', uf: 'SP',
    whatsapp: '1151073323', telefone: '1148106810', email: null, site: 'https://www.miess.com.br',
    cnpj: null,
    vende: 'Loja online com seção de kits em atacado (Hot Flowers, La Pimienta, Sexy Fantasy).',
    condicoes: 'Kits de 3 a 10 unidades no site. Condições de revenda não publicadas.',
    obs: 'No Reclame Aqui, a reclamação mais comum é atraso na entrega.',
    fonte: 'https://www.miess.com.br/kits-em-atacado', conferido_em: '2026-11',
  },
  {
    id: 'intt', nome: 'Intt (Loja Intt)', tipo: 'fabricante', cidade: 'São Paulo', uf: 'SP',
    whatsapp: null, telefone: '1150266969', email: null, site: 'https://www.lojaintt.com.br',
    cnpj: '58.095.717/0001-44',
    vende: 'Fábrica de cosméticos sensuais e produtos eróticos (lubrificantes, vibradores líquidos, óleos, géis).',
    condicoes: 'Cadastro para loja com CNPJ ou revendedora sem CNPJ. 5% à vista no atacado em algumas linhas.',
    obs: null, fonte: 'https://www.lojaintt.com.br/pagina/seja-uma-revendedora', conferido_em: '2026-11',
  },
  {
    id: 'hot-flowers', nome: 'Hot Flowers', tipo: 'fabricante', cidade: null, uf: null,
    whatsapp: '19971287871', telefone: null, email: 'comercial@hotflowers.com.br', site: 'https://www.hotflowers.com.br',
    cnpj: null,
    vende: 'Marca de cosméticos sensuais (géis, lubrificantes, óleos).',
    condicoes: 'O site tem um “Espaço Revendedor”. Condições não publicadas.',
    obs: null, fonte: 'https://www.hotflowers.com.br', conferido_em: '2026-11',
  },
]

export const telefoneBonito = (n: string) =>
  n.length === 11 ? `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}` : `(${n.slice(0, 2)}) ${n.slice(2, 6)}-${n.slice(6)}`

export const MENSAGEM_FORNECEDOR = (loja: string) =>
  `Olá! Sou da ${loja}, uma loja de produtos íntimos, e encontrei o contato de vocês no site. Queria saber as condições para lojista: tabela de preços, pedido mínimo, formas de pagamento e prazo de entrega. Obrigada!`
