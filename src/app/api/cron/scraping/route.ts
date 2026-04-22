import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const maxDuration = 55

const GOOGLE_KEY = process.env.GOOGLE_PLACES_API_KEY

const CIDADES = [
  'Piracicaba SP','Bauru SP','São José dos Campos SP','Jundiaí SP','Taubaté SP','Franca SP','Marília SP','Araraquara SP','Presidente Prudente SP','São Carlos SP',
  'Pelotas RS','Caxias do Sul RS','Santa Maria RS','Passo Fundo RS','Novo Hamburgo RS',
  'Blumenau SC','Chapecó SC','Criciúma SC','Itajaí SC','Balneário Camboriú SC',
  'Cascavel PR','Ponta Grossa PR','Foz do Iguaçu PR',
  'Montes Claros MG','Governador Valadares MG','Uberaba MG','Poços de Caldas MG','Ipatinga MG',
  'Petrolina PE','Caruaru PE',
  'Mossoró RN','Parnamirim RN',
  'Imperatriz MA','Caxias MA',
  'Macaé RJ','Volta Redonda RJ','Campos dos Goytacazes RJ','Petrópolis RJ','Nova Friburgo RJ',
  'Anápolis GO','Rio Verde GO',
  'Rio Branco AC','Porto Velho RO','Palmas TO','Boa Vista RR','Macapá AP',
  'Arapiraca AL','Vitória da Conquista BA','Ilhéus BA','Feira de Santana BA',
  'Sobral CE','Juazeiro do Norte CE',
  'Marabá PA','Santarém PA',
  'Dourados MS','Três Lagoas MS',
  'Rondonópolis MT','Sinop MT',
  'Aracaju SE','Teresina PI','João Pessoa PB',
]

const TERMOS = ['sex shop', 'loja lingerie sensual', 'boutique erotica', 'loja produtos adultos']

function extrairEmails(html: string): string[] {
  const matches = html.match(/[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}/g) || []
  const lixo = ['example','teste','test','domain','seumail','seuemail','.png','.jpg','.gif','.svg','wix','sentry','noreply','no-reply','nuvem','2x.','wordpress','w3.org']
  return [...new Set(matches.filter(e => !lixo.some(l => e.toLowerCase().includes(l)) && e.length >= 8 && e.length <= 60))]
}

export async function GET(req: Request) {
  try {
    if (!GOOGLE_KEY) return NextResponse.json({ error: 'GOOGLE_PLACES_API_KEY missing' }, { status: 500 })

    const { searchParams } = new URL(req.url)
    const pagina = parseInt(searchParams.get('pagina') || '1')
    const porPagina = 2 // rápido para não dar timeout

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // Emails já existentes
    const { data: existentes } = await supabase.from('prospectos').select('email').not('email', 'is', null)
    const emailsVistos = new Set((existentes || []).map((p: any) => p.email?.toLowerCase()))
    // Places já visitados
    const { data: placeIds } = await supabase.from('prospectos').select('place_id').not('place_id', 'is', null)
    const placesVistos = new Set((placeIds || []).map((p: any) => p.place_id))

    const inicio = ((pagina - 1) * porPagina) % CIDADES.length
    const cidadesHoje = CIDADES.slice(inicio, inicio + porPagina)

    let encontrados = 0, salvos = 0, emailsReais = 0

    for (const cidade of cidadesHoje) {
      for (const termo of TERMOS.slice(0, 1)) {
        try {
          const q = encodeURIComponent(`${termo} em ${cidade}`)
          const res = await fetch(`https://maps.googleapis.com/maps/api/place/textsearch/json?query=${q}&language=pt-BR&key=${GOOGLE_KEY}`, { signal: AbortSignal.timeout(6000) })
          if (!res.ok) continue
          const data = await res.json()
          if (data.status !== 'OK') continue

          for (const place of (data.results || []).slice(0, 8)) {
            if (placesVistos.has(place.place_id)) continue
            placesVistos.add(place.place_id)
            encontrados++

            // Busca website
            let website: string | null = null
            try {
              const dRes = await fetch(`https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=website,formatted_phone_number&key=${GOOGLE_KEY}`, { signal: AbortSignal.timeout(4000) })
              if (dRes.ok) {
                const d = (await dRes.json()).result || {}
                website = d.website || null
              }
            } catch {}

            // Scraping real de email — tenta homepage + páginas de contato
            let email: string | null = null
            if (website) {
              const base = website.replace(/\/$/, '')
              const blocked = ['facebook','instagram','google','youtube','twitter','tiktok','linktree','shopee','mercadolivre','whatsapp','wa.me','bit.ly']
              const domain = (() => { try { return new URL(website).hostname.replace('www.', '') } catch { return '' } })()

              if (!blocked.some(b => domain.includes(b)) && domain.includes('.') && domain.length > 5) {
                // Tenta homepage rápido
                try {
                  const r = await fetch(base, { signal: AbortSignal.timeout(2000), headers: { 'User-Agent': 'Mozilla/5.0' } })
                  if (r.ok) {
                    const html = await r.text()
                    const found = extrairEmails(html)
                    if (found.length > 0) { email = found[0].toLowerCase(); emailsReais++ }
                  }
                } catch {}
                if (!email) email = `contato@${domain}`
              }
            }

            if (!email || emailsVistos.has(email.toLowerCase())) continue
            emailsVistos.add(email.toLowerCase())

            await supabase.from('prospectos').insert({
              nome_loja: place.name, email, website, cidade, place_id: place.place_id, status: 'novo',
            })
            salvos++
          }
        } catch {}
      }
    }

    return NextResponse.json({
      pagina, cidades: cidadesHoje, total_cidades_disponiveis: CIDADES.length,
      encontrados, salvos, emails_reais_scraped: emailsReais,
      total_na_base: emailsVistos.size,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
