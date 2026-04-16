import { NextResponse } from 'next/server'

export const maxDuration = 30

// Busca sex shops via Google Places API (Text Search)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const cidade = searchParams.get('cidade') || 'São Paulo'
    const raio = searchParams.get('raio') || '50000' // metros

    const apiKey = process.env.GOOGLE_PLACES_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'GOOGLE_PLACES_API_KEY não configurada' }, { status: 500 })
    }

    const query = encodeURIComponent(`sex shop em ${cidade}`)
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&language=pt-BR&region=br&key=${apiKey}`

    const res = await fetch(url, { signal: AbortSignal.timeout(10000) })
    if (!res.ok) {
      return NextResponse.json({ error: 'Erro na API do Google Places' }, { status: 502 })
    }

    const data = await res.json()

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('Google Places error:', data.status, data.error_message)
      return NextResponse.json({ error: data.error_message || data.status }, { status: 502 })
    }

    const resultados = (data.results || []).map((place: any) => ({
      place_id: place.place_id,
      nome: place.name,
      endereco: place.formatted_address,
      rating: place.rating || 0,
      total_avaliacoes: place.user_ratings_total || 0,
      aberto: place.opening_hours?.open_now ?? null,
      lat: place.geometry?.location?.lat,
      lng: place.geometry?.location?.lng,
    }))

    // Para cada resultado, busca detalhes (telefone, site, etc)
    const detalhados = await Promise.allSettled(
      resultados.slice(0, 20).map(async (r: any) => {
        try {
          const detailUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${r.place_id}&fields=name,formatted_phone_number,website,url,formatted_address,rating,user_ratings_total&language=pt-BR&key=${apiKey}`
          const detailRes = await fetch(detailUrl, { signal: AbortSignal.timeout(5000) })
          if (!detailRes.ok) return r
          const detailData = await detailRes.json()
          const d = detailData.result || {}
          return {
            ...r,
            telefone: d.formatted_phone_number || null,
            website: d.website || null,
            google_maps_url: d.url || null,
          }
        } catch {
          return r
        }
      })
    )

    const prospectos = detalhados
      .filter(r => r.status === 'fulfilled')
      .map(r => (r as PromiseFulfilledResult<any>).value)

    return NextResponse.json({
      cidade,
      total: prospectos.length,
      prospectos,
    })
  } catch (error: any) {
    console.error('Erro prospecção:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
