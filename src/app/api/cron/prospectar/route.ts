import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const maxDuration = 55

const TODAS_CIDADES = [
  'São Paulo SP','Rio de Janeiro RJ','Belo Horizonte MG','Salvador BA','Fortaleza CE','Curitiba PR','Recife PE','Porto Alegre RS',
  'Goiânia GO','Florianópolis SC','Campinas SP','Vitória ES','Natal RN','Santos SP','Niterói RJ','Uberlândia MG',
  'Joinville SC','Londrina PR','Maringá PR','São Luís MA','Brasília DF','Manaus AM','Belém PA','Maceió AL',
  'Campo Grande MS','Teresina PI','João Pessoa PB','Aracaju SE','Cuiabá MT','Ribeirão Preto SP',
  'Piracicaba SP','Bauru SP','São José dos Campos SP','Jundiaí SP','Taubaté SP','Franca SP','Marília SP',
  'Pelotas RS','Caxias do Sul RS','Santa Maria RS','Passo Fundo RS','Novo Hamburgo RS',
  'Blumenau SC','Chapecó SC','Criciúma SC','Itajaí SC','Balneário Camboriú SC',
  'Cascavel PR','Ponta Grossa PR','Foz do Iguaçu PR',
  'Montes Claros MG','Governador Valadares MG','Uberaba MG','Ipatinga MG',
  'Petrolina PE','Caruaru PE','Mossoró RN',
  'Macaé RJ','Volta Redonda RJ','Campos dos Goytacazes RJ','Petrópolis RJ',
  'Anápolis GO','Rio Verde GO','Rio Branco AC','Porto Velho RO','Palmas TO',
  'Vitória da Conquista BA','Feira de Santana BA','Sobral CE','Juazeiro do Norte CE',
  'Marabá PA','Santarém PA','Dourados MS','Rondonópolis MT','Sinop MT',
  'Araraquara SP','São Carlos SP','Presidente Prudente SP','Sorocaba SP','Guarulhos SP',
]

export async function GET(req: Request) {
  const auth = req.headers.get('authorization')
  if (auth !== 'Bearer ' + process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const GOOGLE_KEY = process.env.GOOGLE_PLACES_API_KEY

    // Emails já existentes
    const { data: existentes } = await supabase.from('prospectos').select('email,place_id').not('email', 'is', null)
    const emailsVistos = new Set((existentes || []).map((p: any) => p.email?.toLowerCase()))
    const placesVistos = new Set((existentes || []).filter((p: any) => p.place_id).map((p: any) => p.place_id))

    // ════════════════════════════════════
    // FASE 1: BUSCA 2 cidades novas (~15s)
    // ════════════════════════════════════
    let buscados = 0, novosSalvos = 0
    if (GOOGLE_KEY) {
      // Descobre quais cidades já foram cobertas
      const { data: cidadesData } = await supabase.from('prospectos').select('cidade')
      const cidadesCobertas = new Set((cidadesData || []).map((c: any) => c.cidade))
      const cidadesNovas = TODAS_CIDADES.filter(c => !cidadesCobertas.has(c)).slice(0, 2)
      const cidadesParaBuscar = cidadesNovas.length > 0 ? cidadesNovas : TODAS_CIDADES.slice(0, 2)

      for (const cidade of cidadesParaBuscar) {
        try {
          const q = encodeURIComponent(`sex shop em ${cidade}`)
          const res = await fetch(`https://maps.googleapis.com/maps/api/place/textsearch/json?query=${q}&language=pt-BR&key=${GOOGLE_KEY}`, { signal: AbortSignal.timeout(6000) })
          if (!res.ok) continue
          const data = await res.json()
          if (data.status !== 'OK') continue

          for (const place of (data.results || []).slice(0, 8)) {
            if (placesVistos.has(place.place_id)) continue
            placesVistos.add(place.place_id)
            buscados++

            let website: string | null = null
            try {
              const dRes = await fetch(`https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=website&key=${GOOGLE_KEY}`, { signal: AbortSignal.timeout(3000) })
              if (dRes.ok) website = ((await dRes.json()).result?.website) || null
            } catch {}

            let email: string | null = null
            if (website) {
              const domain = (() => { try { return new URL(website).hostname.replace('www.', '') } catch { return '' } })()
              const blocked = ['facebook','instagram','google','youtube','twitter','tiktok','linktree','shopee','mercadolivre','whatsapp','wa.me']
              if (!blocked.some(b => domain.includes(b)) && domain.includes('.') && domain.length > 5) {
                try {
                  const r = await fetch(website, { signal: AbortSignal.timeout(2000), headers: { 'User-Agent': 'Mozilla/5.0' } })
                  if (r.ok) {
                    const html = await r.text()
                    const lixo = ['example','teste','.png','.jpg','sentry','wix','noreply','nuvem','2x.']
                    const m = (html.match(/[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}/g) || []).find((e: string) => !lixo.some(l => e.toLowerCase().includes(l)) && e.length >= 8 && e.length <= 60)
                    if (m) email = m.toLowerCase()
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
            novosSalvos++
          }
        } catch {}
      }
    }

    // Envio de emails é responsabilidade de /api/cron/enviar
    const { count: filaRestante } = await supabase.from('prospectos').select('id', { count: 'exact', head: true }).eq('status', 'novo')

    console.log(`Prospecção: buscou ${buscados} lojas (+${novosSalvos} novos), fila pra enviar: ${filaRestante}`)

    return NextResponse.json({
      buscados, novos_salvos: novosSalvos,
      fila_restante: filaRestante,
      total_prospectos: emailsVistos.size,
    })
  } catch (error: any) {
    console.error('Erro prospectar:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
