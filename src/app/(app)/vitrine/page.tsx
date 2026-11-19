import Link from 'next/link'
import type { Metadata } from 'next'
import { exigirLoja } from '@/lib/sessao'
import { pode } from '@/lib/planos'
import { origem } from '@/lib/origem'
import { FormVitrine, type ConfigVitrine } from './FormVitrine'
import { Compartilhar } from './Compartilhar'
import { MercadoPago } from './MercadoPago'
import { MarcaVitrine } from './MarcaVitrine'

export const metadata: Metadata = { title: 'Vitrine online' }

export default async function PaginaVitrine() {
  const { supabase, loja, assinatura, podeEditar } = await exigirLoja()
  const liberada = pode(assinatura, 'vitrine')

  if (!liberada) {
    return (
      <>
        <div className="lv-top"><div><h1>Vitrine online</h1><p>Sua loja na internet, ligada ao mesmo estoque do balcão.</p></div></div>
        <div className="lv-card" style={{ maxWidth: 620 }}>
          <p style={{ marginBottom: 14 }}>A vitrine faz parte do plano <strong>Pro</strong>: site próprio sem comissão, pedidos com Pix direto na sua conta e estoque atualizado sozinho.</p>
          <Link href="/planos" className="lv-btn">Ver o plano Pro</Link>
        </div>
      </>
    )
  }

  const [{ data: cfg }, { count: naVitrine }] = await Promise.all([
    supabase.from('lojas').select('vitrine_ativa, vitrine_cor, vitrine_descricao, vitrine_instagram, vitrine_horario, vitrine_sobre, vitrine_logo, vitrine_capa, entrega_brasil, frete_regioes, frete_gratis_acima, prazo_retirada, prazo_local, mp_ativo, mp_conta, mp_descritor, pix_chave, pix_nome, entrega_retirada, endereco_retirada, entrega_local, entrega_local_taxa, entrega_combinar, prazo_pagamento_h, prazo_separar_h, prazo_entrega_h, cancelar_apos_h').eq('id', loja.id).single(),
    supabase.from('produtos').select('id', { count: 'exact', head: true }).eq('ativo', true).eq('na_vitrine', true).gt('preco', 0),
  ])
  const c = { ...(cfg as ConfigVitrine), entrega_local_taxa: Number(cfg?.entrega_local_taxa ?? 0), frete_gratis_acima: cfg?.frete_gratis_acima != null ? Number(cfg.frete_gratis_acima) : null }
  const link = `${await origem()}/loja/${loja.slug}`

  return (
    <>
      <div className="lv-top">
        <div><h1>Vitrine online</h1><p>{naVitrine ?? 0} produtos aparecem na vitrine · <Link href="/produtos" style={{ textDecoration: 'underline' }}>escolher quais</Link></p></div>
      </div>
      <Compartilhar link={link} nomeLoja={loja.nome} />
      {!loja.whatsapp && (
        <div className="lv-aviso alerta" style={{ marginBottom: 14 }}>
          <span><strong>Cadastre o WhatsApp da loja.</strong> Sem ele, a cliente não consegue mandar o pedido para você no WhatsApp.</span>
          <Link href="/conta" className="lv-btn sec pq">Cadastrar</Link>
        </div>
      )}
      <MarcaVitrine logo={cfg?.vitrine_logo ?? null} capa={cfg?.vitrine_capa ?? null} nomeLoja={loja.nome} podeEditar={podeEditar} />
      <MercadoPago conectado={!!cfg?.mp_ativo} conta={cfg?.mp_conta ?? null} descritor={cfg?.mp_descritor ?? null} podeEditar={podeEditar} />
      <FormVitrine c={c} nomeLoja={loja.nome} podeEditar={podeEditar} />
    </>
  )
}
