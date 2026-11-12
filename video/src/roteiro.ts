/**
 * Roteiro do vídeo "Tudo numa tela só" (LuvyMetrics).
 * Cada cena tem a fala da narração. A duração de cada cena vem do áudio gerado
 * (src/voz.json, escrito por generate-voiceover.ts); sem áudio, vale `segundos`.
 * Números que aparecem na tela são dados de exemplo.
 */
export type Cena = { id: string; fala: string; segundos: number }

export const CENAS: Cena[] = [
  { id: 'abas', segundos: 4, fala: 'Quantas abas você abre antes de fazer um pedido?' },
  { id: 'caos', segundos: 8, fala: 'Planilha de estoque, Mercado Livre, Shopee, a calculadora do celular, o caderno… e no fim, você ainda compra no chute.' },
  { id: 'umaTela', segundos: 4, fala: 'E se tudo isso estivesse numa tela só?' },
  { id: 'ranking', segundos: 6, fala: 'No LuvyMetrics, você abre e já vê o que está vendendo na sua cidade esta semana.' },
  { id: 'preco', segundos: 6, fala: 'O preço ideal sai calculado, com custo, frete e a taxa de cada canal.' },
  { id: 'compara', segundos: 5, fala: 'Seu preço aparece do lado do Mercado Livre e da Shopee.' },
  { id: 'alerta', segundos: 6, fala: 'E quando um produto começa a parar, você fica sabendo antes de comprar mais.' },
  { id: 'cta', segundos: 7, fala: 'Menos tempo em planilha. Mais tempo vendendo. Teste grátis por sete dias, sem cartão.' },
]

export const FPS = 30
/** respiro depois de cada fala, em segundos */
export const RESPIRO = 0.7
/** sobreposição das transições, em quadros */
export const TRANSICAO = 24
