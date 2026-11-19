import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { exigirLoja } from '@/lib/sessao'
import { pode, type Recurso } from '@/lib/planos'

export const metadata: Metadata = { title: 'Em breve' }

const INFO: Record<string, { titulo: string; texto: string; recurso: Recurso; itens: string[] }> = {
  vitrine: {
    titulo: 'Vitrine online',
    texto: 'Sua loja na internet usando o mesmo estoque do balcão. Vendeu no balcão, a vitrine atualiza sozinha.',
    recurso: 'vitrine',
    itens: ['Página com seu logo, cores e catálogo', 'Aviso de maioridade (18+) na entrada', 'Pedido por Pix ou direto no seu WhatsApp', 'Esgotado aparece na hora'],
  },
  atendente: {
    titulo: 'Atendente IA 24h',
    texto: 'Responde suas clientes na vitrine a qualquer hora, consultando seu catálogo e seu estoque de verdade.',
    recurso: 'atendenteIA',
    itens: ['Só fala de produtos que você tem', 'Monta o pedido com a cliente', 'Passa a conversa para você com um clique', 'Se apresenta como atendente virtual'],
  },
  radar: {
    titulo: 'Radar de tendências',
    texto: 'O que está sendo mais procurado e vendido, com a fonte e a data de cada dado.',
    recurso: 'radar',
    itens: ['Interesse de busca por estado', 'Mais vendidos do nicho no Mercado Livre', 'Seus próprios campeões de venda', 'Sem número inventado: sem dado, mostramos “coletando”'],
  },
}

export default async function EmBreve({ params }: { params: Promise<{ recurso: string }> }) {
  const { assinatura } = await exigirLoja()
  const { recurso } = await params
  const i = INFO[recurso]
  if (!i) notFound()
  const incluso = pode(assinatura, i.recurso)
  return (
    <>
      <div className="lv-top"><div><h1>{i.titulo} <span className="lv-selo escuro">chegando</span></h1><p>{i.texto}</p></div></div>
      <div className="lv-card" style={{ maxWidth: 640 }}>
        <ul style={{ listStyle: 'none', display: 'grid', gap: 10 }}>
          {i.itens.map((x) => <li key={x}>✓ {x}</li>)}
        </ul>
        <p className="lv-msg info" style={{ marginTop: 16 }}>
          {incluso ? 'Já está incluído no seu plano. Avisaremos assim que for liberado.' : 'Disponível a partir do plano Pro.'}
        </p>
        {!incluso && <Link href="/planos" className="lv-btn" style={{ marginTop: 12 }}>Ver planos</Link>}
      </div>
    </>
  )
}
