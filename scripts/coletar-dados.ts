/**
 * Script de coleta de dados do Mercado Livre
 * Execute localmente: npx ts-node scripts/coletar-dados.ts
 * Em produção: chamado pelo cron /api/cron/coletar
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY   = process.env.SUPABASE_SERVICE_ROLE_KEY!
const CATEGORIAS_ML = ['MLB5726', 'MLB1648']

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

async function coletar() {
  console.log('🔍 Iniciando coleta de dados do Mercado Livre...')
  let totalColetados = 0
  let totalAlertas   = 0

  for (const categoria of CATEGORIAS_ML) {
    console.log(`  Coletando categoria: ${categoria}`)
    const url = `https://api.mercadolibre.com/sites/MLB/search?category=${categoria}&sort=sold_quantity_desc&limit=50`

    const res  = await fetch(url)
    const json = await res.json()
    const produtos = json.results ?? []

    for (const produto of produtos) {
      const nome   = produto.title as string
      const preco  = produto.price  as number
      const vendas = (produto.sold_quantity ?? 0) as number

      const { data: existente } = await supabase
        .from('produtos_tendencia')
        .select('id, vendas_hoje, vendas_ontem')
        .ilike('produto_nome', nome)
        .single()

      if (existente) {
        const crescimento = existente.vendas_ontem > 0
          ? ((vendas - existente.vendas_ontem) / existente.vendas_ontem) * 100
          : 0
        const alerta = crescimento > 30

        await supabase
          .from('produtos_tendencia')
          .update({ vendas_ontem: existente.vendas_hoje, vendas_hoje: vendas, preco_medio: preco, crescimento_pct: crescimento, alerta, updated_at: new Date().toISOString() })
          .eq('id', existente.id)

        if (alerta) { totalAlertas++; console.log(`  🔥 ALERTA: ${nome} +${crescimento.toFixed(0)}%`) }
      } else {
        await supabase.from('produtos_tendencia').insert({
          produto_nome: nome, fonte: 'Mercado Livre',
          categoria: categoria === 'MLB1648' ? 'Adultos' : 'Saúde e Beleza',
          vendas_hoje: vendas, vendas_ontem: vendas, preco_medio: preco, crescimento_pct: 0, alerta: false,
        })
      }
      totalColetados++
    }
  }

  console.log(`✅ Coleta concluída: ${totalColetados} produtos | ${totalAlertas} alertas`)
}

coletar().catch(console.error)
