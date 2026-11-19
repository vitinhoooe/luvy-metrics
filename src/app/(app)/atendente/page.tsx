import Link from 'next/link'
import type { Metadata } from 'next'
import { exigirLoja } from '@/lib/sessao'
import { LIMITES, pode } from '@/lib/planos'
import { inicioMes, num } from '@/lib/formato'
import { FormAtendente, ListaConversas, type ConfigAtendente, type Conversa } from './Telas'

export const metadata: Metadata = { title: 'Atendente IA' }

export default async function Atendente() {
  const { supabase, loja, assinatura, podeEditar } = await exigirLoja()
  if (!pode(assinatura, 'atendenteIA')) {
    return (
      <>
        <div className="lv-top"><div><h1>Atendente IA</h1><p>Responde suas clientes na vitrine 24 horas, só com o que existe no seu estoque.</p></div></div>
        <div className="lv-card" style={{ maxWidth: 620 }}>
          <p style={{ marginBottom: 14 }}>O atendente IA faz parte do plano <strong>Pro</strong>.</p>
          <Link href="/planos" className="lv-btn">Ver o plano Pro</Link>
        </div>
      </>
    )
  }

  const [{ data: cfg }, { data: conversas }, { count: noMes }] = await Promise.all([
    supabase.from('lojas').select('atendente_ativo, atendente_nome, atendente_tom, atendente_info, vitrine_ativa').eq('id', loja.id).single(),
    supabase.from('conversas').select('id, mensagens, chamou_loja, sugeriu_sacola, atualizada_em, conversa_mensagens(id, papel, texto)').order('atualizada_em', { ascending: false }).limit(50),
    supabase.from('conversas').select('id', { count: 'exact', head: true }).gte('criada_em', inicioMes()),
  ])
  const lista = (conversas ?? []) as Conversa[]
  const limite = LIMITES[assinatura.plano].atendente
  const indicou = lista.filter((c) => c.sugeriu_sacola).length

  return (
    <>
      <div className="lv-top">
        <div><h1>Atendente IA</h1><p>Responde suas clientes na vitrine 24 horas, só com o que existe no seu catálogo e estoque.</p></div>
      </div>
      {cfg && !cfg.vitrine_ativa && (
        <div className="lv-aviso alerta" style={{ marginBottom: 14 }}>
          <span><strong>Sua vitrine está desligada.</strong> O atendente só aparece com a vitrine no ar.</span>
          <Link href="/vitrine" className="lv-btn sec pq">Ligar vitrine</Link>
        </div>
      )}
      <div className="lv-grid c3" style={{ marginBottom: 14 }}>
        <div className="lv-kpi"><span>Conversas neste mês</span><strong>{num(noMes ?? 0)}</strong><small>de {num(limite)} do seu plano</small></div>
        <div className="lv-kpi"><span>Indicou produtos</span><strong>{indicou}</strong><small>nas últimas {lista.length} conversas</small></div>
        <div className="lv-kpi"><span>Passou para você</span><strong>{lista.filter((c) => c.chamou_loja).length}</strong><small>pediram a loja no WhatsApp</small></div>
      </div>
      <div className="lv-grid c2" style={{ alignItems: 'start' }}>
        <FormAtendente c={cfg as ConfigAtendente} podeEditar={podeEditar} />
        <div className="lv-card">
          <h2>Conversas recentes</h2>
          <ListaConversas conversas={lista} />
        </div>
      </div>
      <p style={{ color: 'var(--dim)', fontSize: 12.5, marginTop: 12 }}>
        A atendente se apresenta como virtual (IA), não inventa produto nem preço e passa para você no WhatsApp quando é pedido já feito, troca ou reclamação.
      </p>
    </>
  )
}
