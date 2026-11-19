import type { Metadata } from 'next'
import { exigirLoja } from '@/lib/sessao'
import { inicioDia, num } from '@/lib/formato'
import { Integracoes, type StatusLigada } from './Integracoes'

export const metadata: Metadata = { title: 'Integrações' }

export default async function PaginaIntegracoes() {
  const { supabase, loja } = await exigirLoja()
  const [{ data: l }, { count: vendas30 }, { count: produtos }, { count: conferidos }] = await Promise.all([
    supabase.from('lojas').select('vitrine_ativa, atendente_ativo, pix_chave, mp_ativo, mp_conta').eq('id', loja.id).maybeSingle(),
    supabase.from('vendas').select('id', { count: 'exact', head: true }).in('canal', ['balcao', 'whatsapp', 'instagram']).gte('criado_em', inicioDia(29)),
    supabase.from('produtos').select('id', { count: 'exact', head: true }).eq('ativo', true),
    supabase.from('conciliacoes').select('chave', { count: 'exact', head: true }),
  ])
  const status: StatusLigada = {
    balcao: { ativo: true, resumo: `${num(vendas30 ?? 0)} vendas registradas nos últimos 30 dias` },
    vitrine: { ativo: !!l?.vitrine_ativa, resumo: l?.vitrine_ativa ? 'No ar' : 'Fora do ar: ligue em Vitrine online' },
    mercadopago: { ativo: !!l?.mp_ativo, resumo: l?.mp_ativo ? `Conectado: ${l.mp_conta}` : 'Desconectado: conecte em Vitrine online' },
    extrato: { ativo: true, resumo: `${num(conferidos ?? 0)} lançamentos do extrato já conferidos` },
    planilha: { ativo: true, resumo: `${num(produtos ?? 0)} produtos no catálogo` },
    exportar: { ativo: true, resumo: '' },
    atendente: { ativo: !!l?.atendente_ativo, resumo: l?.atendente_ativo ? 'Atendendo na sua vitrine' : 'Desligada: ligue em Atendente IA' },
    'whatsapp-links': { ativo: !!loja.whatsapp, resumo: loja.whatsapp ? 'Pedidos chegam no WhatsApp da loja' : 'Falta o WhatsApp da loja em Minha conta' },
  }
  return (
    <>
      <div className="lv-top">
        <div><h1>Integrações</h1><p>O que conversa com o Luvy e de onde vem cada número da sua loja. Pagamento online: Mercado Pago.</p></div>
      </div>
      <Integracoes status={status} />
    </>
  )
}
