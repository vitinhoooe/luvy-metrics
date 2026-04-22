import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const maxDuration = 55

// Busca sex shops no Google e extrai emails dos sites
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const pagina = parseInt(searchParams.get('pagina') || '1')

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  // Termos variados para maximizar resultados
  const BUSCAS = [
    'sex shop online Brasil email contato',
    'loja sex shop atacado contato email',
    'sex shop distribuidora email',
    'boutique sensual loja virtual contato',
    'sex shop loja erotica email',
    'sex shop whatsapp contato site',
    'distribuidora produtos adultos email',
    'atacado sex shop fornecedor contato',
    'sex shop delivery contato email',
    'loja intima sensual contato',
  ]

  const busca = BUSCAS[(pagina - 1) % BUSCAS.length]
  const GOOGLE_KEY = process.env.GOOGLE_PLACES_API_KEY
  const GOOGLE_CX = process.env.GOOGLE_SEARCH_ENGINE_ID

  let encontrados = 0, salvos = 0, emails = 0

  // Busca emails já existentes
  const { data: existentes } = await supabase.from('prospectos').select('email').not('email', 'is', null)
  const emailsExistentes = new Set((existentes || []).map((p: any) => p.email?.toLowerCase()))

  // MÉTODO 1: Google Custom Search (se disponível)
  if (GOOGLE_KEY && GOOGLE_CX) {
    try {
      const start = ((pagina - 1) % 10) * 10 + 1
      const url = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_KEY}&cx=${GOOGLE_CX}&q=${encodeURIComponent(busca)}&num=10&start=${start}`
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
      if (res.ok) {
        const data = await res.json()
        for (const item of data.items || []) {
          encontrados++
          const link = item.link
          if (!link) continue

          // Tenta extrair email do snippet
          let email: string | null = null
          const snippetMatch = item.snippet?.match(/[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}/g)
          if (snippetMatch) {
            const lixo = ['example', 'teste', '.png', '.jpg', 'sentry', 'wix', 'noreply']
            email = snippetMatch.find((e: string) => !lixo.some(l => e.includes(l))) || null
          }

          // Se não achou no snippet, tenta acessar o site
          if (!email && link.includes('.com')) {
            try {
              const sRes = await fetch(link, { signal: AbortSignal.timeout(3000), headers: { 'User-Agent': 'Mozilla/5.0' } })
              if (sRes.ok) {
                const html = await sRes.text()
                const matches = html.match(/[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}/g)
                if (matches) {
                  const lixo = ['example', 'teste', '.png', '.jpg', 'sentry', 'wix', 'noreply', 'no-reply', 'nuvem', '2x.']
                  email = matches.find((e: string) => !lixo.some(l => e.toLowerCase().includes(l)) && e.length >= 8 && e.length <= 60) || null
                }
              }
            } catch {}
          }

          // Fallback: email do domínio
          if (!email) {
            try {
              const domain = new URL(link).hostname.replace('www.', '')
              const blocked = ['facebook', 'instagram', 'google', 'youtube', 'twitter', 'tiktok', 'shopee', 'mercadolivre', 'amazon', 'olx', 'whatsapp']
              if (!blocked.some(b => domain.includes(b)) && domain.includes('.') && domain.length > 5) {
                email = `contato@${domain}`
              }
            } catch {}
          }

          if (!email || emailsExistentes.has(email.toLowerCase())) continue
          emailsExistentes.add(email.toLowerCase())

          const nome = item.title?.replace(/- .*$/, '').replace(/\|.*$/, '').trim() || 'Sex Shop'

          await supabase.from('prospectos').insert({
            nome_loja: nome, email, website: link,
            cidade: 'Brasil', status: 'novo',
          })
          salvos++
          emails++
        }
      }
    } catch {}
  }

  // MÉTODO 2: Google Places com termos variados em cidades aleatórias
  if (GOOGLE_KEY) {
    const cidadesExtra = [
      'Piracicaba SP', 'Bauru SP', 'São José dos Campos SP', 'Jundiaí SP',
      'Pelotas RS', 'Caxias do Sul RS', 'Blumenau SC', 'Chapecó SC',
      'Cascavel PR', 'Ponta Grossa PR', 'Montes Claros MG', 'Governador Valadares MG',
      'Petrolina PE', 'Caruaru PE', 'Mossoró RN', 'Imperatriz MA',
      'Macaé RJ', 'Volta Redonda RJ', 'Campos dos Goytacazes RJ',
      'Anápolis GO', 'Rio Branco AC', 'Porto Velho RO', 'Palmas TO', 'Boa Vista RR',
    ]
    const termosPlaces = ['sex shop', 'loja lingerie', 'boutique sensual', 'loja adulto']
    const cidadeIdx = ((pagina - 1) * 2) % cidadesExtra.length
    const cidades = cidadesExtra.slice(cidadeIdx, cidadeIdx + 2)

    for (const cidade of cidades) {
      for (const termo of termosPlaces.slice(0, 2)) {
        try {
          const q = encodeURIComponent(`${termo} em ${cidade}`)
          const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${q}&language=pt-BR&key=${GOOGLE_KEY}`
          const res = await fetch(url, { signal: AbortSignal.timeout(6000) })
          if (!res.ok) continue
          const data = await res.json()
          if (data.status !== 'OK') continue

          for (const place of (data.results || []).slice(0, 10)) {
            encontrados++
            let website: string | null = null
            try {
              const dRes = await fetch(`https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=website&key=${GOOGLE_KEY}`, { signal: AbortSignal.timeout(3000) })
              if (dRes.ok) website = ((await dRes.json()).result?.website) || null
            } catch {}

            let email: string | null = null
            if (website) {
              // Tenta scraping rápido
              try {
                const sRes = await fetch(website, { signal: AbortSignal.timeout(2000), headers: { 'User-Agent': 'Mozilla/5.0' } })
                if (sRes.ok) {
                  const html = await sRes.text()
                  const m = html.match(/[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}/g)
                  if (m) {
                    const lixo = ['example', 'teste', '.png', '.jpg', 'sentry', 'wix', 'noreply', 'nuvem', '2x.']
                    email = m.find((e: string) => !lixo.some(l => e.toLowerCase().includes(l)) && e.length >= 8) || null
                  }
                }
              } catch {}
              // Fallback
              if (!email) {
                try {
                  const domain = new URL(website).hostname.replace('www.', '')
                  const blocked = ['facebook', 'instagram', 'google', 'youtube', 'twitter', 'tiktok', 'whatsapp']
                  if (!blocked.some(b => domain.includes(b)) && domain.includes('.')) email = `contato@${domain}`
                } catch {}
              }
            }

            if (!email || emailsExistentes.has(email.toLowerCase())) continue
            emailsExistentes.add(email.toLowerCase())

            const { data: existing } = await supabase.from('prospectos').select('id').eq('place_id', place.place_id).maybeSingle()
            if (existing) continue

            await supabase.from('prospectos').insert({
              nome_loja: place.name, email, website, cidade,
              place_id: place.place_id, status: 'novo',
            })
            salvos++
            emails++
          }
        } catch {}
      }
    }
  }

  return NextResponse.json({
    busca, pagina,
    encontrados, salvos, emails_novos: emails,
    total_na_base: emailsExistentes.size,
  })
}
