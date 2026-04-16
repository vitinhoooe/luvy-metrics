import { NextResponse } from 'next/server'

export const maxDuration = 60

const CIDADES = [
  'São Paulo SP','Rio de Janeiro RJ','Belo Horizonte MG','Salvador BA',
  'Fortaleza CE','Curitiba PR','Manaus AM','Recife PE',
  'Porto Alegre RS','Goiânia GO','Belém PA','Florianópolis SC',
  'Maceió AL','Natal RN','Campo Grande MS','Teresina PI',
  'João Pessoa PB','Aracaju SE','Vitória ES','Campinas SP',
  'Santos SP','Ribeirão Preto SP','Sorocaba SP','Guarulhos SP',
  'Niterói RJ','Contagem MG','Uberlândia MG','Joinville SC',
  'Londrina PR','Maringá PR','São Luís MA','Cuiabá MT',
]

const TERMOS = ['sex shop', 'loja lingerie sensual', 'loja adultos eróticos', 'boutique sensual']

type Prospecto = {
  place_id: string; nome: string; endereco: string; telefone?: string | null
  website?: string | null; google_maps_url?: string | null; email?: string | null
  rating: number; total_avaliacoes: number; cidade: string
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const cidadeParam = searchParams.get('cidade')
    const apiKey = process.env.GOOGLE_PLACES_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'GOOGLE_PLACES_API_KEY não configurada' }, { status: 500 })

    const cidades = cidadeParam ? [cidadeParam] : CIDADES
    const termos = cidadeParam ? TERMOS : ['sex shop'] // Se busca todas, usa só 1 termo p/ economizar API
    const todos: Prospecto[] = []
    const seen = new Set<string>()

    // Busca em batches de 5 cidades em paralelo
    for (let i = 0; i < cidades.length; i += 5) {
      const batch = cidades.slice(i, i + 5)
      const batchResults = await Promise.allSettled(
        batch.flatMap(cidade =>
          termos.map(async termo => {
            try {
              const q = encodeURIComponent(`${termo} em ${cidade}`)
              const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${q}&language=pt-BR&region=br&key=${apiKey}`
              const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
              if (!res.ok) return []
              const data = await res.json()
              if (data.status !== 'OK') return []

              const places = (data.results || []).slice(0, 10)
              const prospectos: Prospecto[] = []

              for (const place of places) {
                if (seen.has(place.place_id)) continue
                seen.add(place.place_id)

                // Busca detalhes
                let telefone: string | null = null, website: string | null = null, gmapUrl: string | null = null
                try {
                  const dUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=formatted_phone_number,website,url&key=${apiKey}`
                  const dRes = await fetch(dUrl, { signal: AbortSignal.timeout(5000) })
                  if (dRes.ok) {
                    const dData = await dRes.json()
                    const d = dData.result || {}
                    telefone = d.formatted_phone_number || null
                    website = d.website || null
                    gmapUrl = d.url || null
                  }
                } catch {}

                // Tenta extrair email do website
                let email: string | null = null
                if (website) {
                  try {
                    const siteRes = await fetch(website, { signal: AbortSignal.timeout(3000), headers: { 'User-Agent': 'Mozilla/5.0' } })
                    if (siteRes.ok) {
                      const html = await siteRes.text()
                      const emailMatch = html.match(/[\w.+-]+@[\w.-]+\.\w{2,}/g)
                      if (emailMatch) {
                        const valid = emailMatch.find(e => !e.includes('example') && !e.includes('sentry') && !e.includes('wixpress'))
                        if (valid) email = valid
                      }
                    }
                  } catch {}
                  // Tenta /contato
                  if (!email) {
                    try {
                      const cRes = await fetch(website.replace(/\/$/, '') + '/contato', { signal: AbortSignal.timeout(3000), headers: { 'User-Agent': 'Mozilla/5.0' } })
                      if (cRes.ok) {
                        const html = await cRes.text()
                        const m = html.match(/[\w.+-]+@[\w.-]+\.\w{2,}/g)
                        if (m) { const v = m.find(e => !e.includes('example')); if (v) email = v }
                      }
                    } catch {}
                  }
                }

                prospectos.push({
                  place_id: place.place_id, nome: place.name,
                  endereco: place.formatted_address, telefone, website, google_maps_url: gmapUrl, email,
                  rating: place.rating || 0, total_avaliacoes: place.user_ratings_total || 0, cidade,
                })
              }
              return prospectos
            } catch { return [] }
          })
        )
      )

      batchResults.forEach(r => {
        if (r.status === 'fulfilled') todos.push(...(r.value as Prospecto[]))
      })
    }

    return NextResponse.json({
      total: todos.length,
      com_email: todos.filter(p => p.email).length,
      com_telefone: todos.filter(p => p.telefone).length,
      com_website: todos.filter(p => p.website).length,
      prospectos: todos,
    })
  } catch (error: any) {
    console.error('Erro prospecção:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
