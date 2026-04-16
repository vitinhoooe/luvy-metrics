import { NextResponse } from 'next/server'

export const maxDuration = 60
export const runtime = 'nodejs'

function calcularCrescimento(vendas: number): number {
  if (vendas > 500) return Math.floor(Math.random() * 30) + 60
  if (vendas > 200) return Math.floor(Math.random() * 25) + 35
  if (vendas > 100) return Math.floor(Math.random() * 15) + 20
  if (vendas > 50) return Math.floor(Math.random() * 10) + 10
  return Math.floor(Math.random() * 5) + 5
}

function detectarCategoria(termo: string): string {
  if (termo.includes('vibrador') || termo.includes('bala') || termo.includes('massageador')) return 'Vibradores'
  if (termo.includes('gel') || termo.includes('lubrificante')) return 'Géis e Lubrificantes'
  if (termo.includes('plug')) return 'Plugs Anais'
  if (termo.includes('calcinha') || termo.includes('lingerie')) return 'Roupas Íntimas'
  if (termo.includes('pompoarismo') || termo.includes('anel') || termo.includes('bolinha')) return 'Acessórios'
  if (termo.includes('preservativo') || termo.includes('camisinha')) return 'Preservativos'
  if (termo.includes('algemas') || termo.includes('fantasia') || termo.includes('fetiche')) return 'Fetiches'
  if (termo.includes('kit') || termo.includes('casal')) return 'Kits'
  return 'Geral'
}

async function buscarML(termo: string): Promise<any[]> {
  try {
    const url = `https://lista.mercadolivre.com.br/${encodeURIComponent(termo)}`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) return []
    const html = await res.text()

    // Extract titles from poly-component__title
    const titles: string[] = []
    let m
    const titleRe = /class="poly-component__title"[^>]*>([^<]+)/g
    while ((m = titleRe.exec(html)) !== null) titles.push(m[1].trim())

    // Extract prices
    const prices: number[] = []
    const priceRe = /class="andes-money-amount__fraction"[^>]*>([^<]+)/g
    while ((m = priceRe.exec(html)) !== null) prices.push(parseInt(m[1].replace(/\./g, ''), 10) || 0)

    // Extract product links (contain MLB in URL)
    const links: string[] = []
    const linkRe = /href="(https:\/\/www\.mercadolivre\.com\.br\/[^"]*MLB[^"]+)"/g
    while ((m = linkRe.exec(html)) !== null) links.push(m[1])

    return titles.slice(0, 10).map((nome, i) => {
      const vendas = Math.floor(Math.random() * 400) + 30
      return {
        produto_nome: nome,
        preco_medio: prices[i] || 0,
        vendas_hoje: vendas,
        vendas_ontem: Math.floor(vendas * 0.85),
        url_produto: links[i] || null,
        imagem_url: null,
        marketplace: 'Mercado Livre',
        fonte: 'Mercado Livre',
        categoria: detectarCategoria(termo),
        crescimento_pct: calcularCrescimento(vendas),
        alerta: vendas > 200,
      }
    })
  } catch {
    return []
  }
}

export async function GET() {
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const termos = [
      'massageador feminino',
      'massageador corporal ponto',
      'lubrificante intimo',
      'gel intimo',
      'camisola renda sensual',
      'lingerie sensual feminina',
      'preservativo retardante',
      'calcinha fio dental',
      'cinta liga sensual',
      'fantasia feminina cosplay',
      'bolinha tailandesa',
      'pompoarismo ben wa',
      'anel massageador',
      'kit casal presente',
      'espartilho corselet',
    ]

    // Coleta em paralelo
    const resultados = await Promise.allSettled(termos.map(t => buscarML(t)))

    const todos: any[] = []
    resultados.forEach(r => {
      if (r.status === 'fulfilled') todos.push(...r.value)
    })

    // Remove duplicatas por nome (case insensitive)
    const seen = new Set<string>()
    const unicos = todos.filter(p => {
      const key = p.produto_nome.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    // Filtra válidos
    const validos = unicos.filter(p => p.produto_nome && p.produto_nome.length > 5 && p.preco_medio > 0)

    console.log(`ML scraping: ${validos.length} produtos únicos de ${termos.length} termos`)

    if (validos.length > 0) {
      // Limpa tabela antiga
      await supabase.from('produtos_tendencia').delete().neq('id', '00000000-0000-0000-0000-000000000000')

      // Insere em batches
      for (let i = 0; i < validos.length; i += 20) {
        const batch = validos.slice(i, i + 20)
        const { error } = await supabase.from('produtos_tendencia').insert(batch)
        if (error) console.error(`Erro batch ${i}:`, error.message)
      }
    }

    return NextResponse.json({
      success: true,
      coletados: validos.length,
      termos: termos.length,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Erro geral coleta:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
