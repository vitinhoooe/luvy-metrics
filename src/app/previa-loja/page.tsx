// PRÉVIA da vitrine pública (só em desenvolvimento): dados de exemplo, nada é gravado.
// As fotos são ilustrações de exemplo (public/exemplo), marcadas como tal.
import { previaLiberada } from '@/lib/previa'
import { notFound } from 'next/navigation'
import { Vitrine } from '../loja/Vitrine'
import { CORES, type CorVitrine, type LojaVitrine } from '../loja/tipos'
import { PRODUTOS_EXEMPLO } from '../previa/exemplo'
import '../loja/vitrine.css'

const EXTRAS: Record<string, { fotos?: string[]; descricao?: string; destaque?: boolean }> = {
  '1': { fotos: ['/exemplo/gel-1.webp', '/exemplo/gel-2.webp'], destaque: true, descricao: 'Gel beijável sabor morango, 30 ml.\nEsquenta levemente ao contato e não mancha. Base d’água, fácil de limpar.' },
  '2': { fotos: ['/exemplo/oleo-1.webp'], descricao: 'Óleo de massagem com aroma de ylang-ylang. Desliza bem e deixa a pele macia.' },
  '3': { fotos: ['/exemplo/vibra-1.webp'], destaque: true, descricao: 'Vibrador bullet recarregável por USB, 10 modos de vibração, à prova d’água. Silencioso e discreto.' },
  '5': { fotos: ['/exemplo/lubri-1.webp'], descricao: 'Lubrificante íntimo à base d’água, 60 g. Neutro, sem cheiro e compatível com preservativos.' },
}

export default async function PreviaLoja({ searchParams }: { searchParams: Promise<{ cor?: string; capa?: string }> }) {
  if (!previaLiberada()) notFound()
  const { cor, capa } = await searchParams
  const loja: LojaVitrine = {
    fechada: false, nome: 'Amor & Cia', slug: 'previa', cidade: 'Recife', uf: 'PE',
    cor: (Object.keys(CORES).includes(cor ?? '') ? cor : 'rosa') as CorVitrine,
    descricao: 'Bem-estar íntimo com discrição e carinho.', whatsapp: '81999999999', pix: true, mercadopago: true,
    instagram: 'amorecia.recife', horario: 'Seg a sáb, 9h às 19h', sobre: 'Loja de bem-estar íntimo em Recife desde 2019. Atendimento acolhedor e entrega discreta.',
    logo: '/exemplo/logo.webp',
    capa: capa === '1' ? '/exemplo/oleo-1.webp' : null,
    atendente: { ativo: true, nome: 'Lia' },
    entrega: {
      retirada: true, endereco_retirada: 'Rua do Exemplo, 100 - Boa Vista', prazo_retirada: 'Pronto em 2 horas',
      local: true, local_taxa: 10, prazo_local: 'No mesmo dia',
      combinar: false,
      brasil: true, gratis_acima: 199,
      regioes: { NE: { valor: 15, prazo: '3 a 6 dias úteis' }, SE: { valor: 22, prazo: '5 a 8 dias úteis' }, S: { valor: 26, prazo: '6 a 9 dias úteis' }, CO: { valor: 24, prazo: '6 a 9 dias úteis' }, N: { valor: 30, prazo: '8 a 12 dias úteis' } },
    },
    produtos: PRODUTOS_EXEMPLO.map((p) => {
      const x = EXTRAS[p.id] ?? {}
      return {
        id: p.id, nome: p.nome, categoria: p.categoria,
        preco: ['6', '8'].includes(p.id) ? Math.round(p.preco * 0.85 * 10) / 10 - 0.01 : p.preco,
        preco_de: ['6', '8'].includes(p.id) ? p.preco : null,
        disponivel: Math.min(p.quantidade, 20), foto: x.fotos?.[0] ?? null, fotos: x.fotos ?? [], descricao: x.descricao ?? null, destaque: !!x.destaque,
      }
    }).sort((a, b) => Number(b.destaque) - Number(a.destaque)),
  }
  return <Vitrine loja={loja} simular />
}
