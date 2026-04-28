import { NextResponse } from 'next/server'
import { Resend } from 'resend'
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

const TOP = { nome: 'Vibrador Sugador Rose Recarregável', pct: 87, vendas: 920, preco: '129,90' }
const LISTA = [
  ['Gel Excitante Feminino Tesão de Vaca', 72, 1300, '24,90'],
  ['Lubrificante Íntimo K-Med 200g', 65, 1600, '29,90'],
  ['Calcinha Fio Dental Renda Preta', 58, 1600, '19,90'],
].map(([n, p, v, pr]) => `<li><strong>${n}</strong> — +${p}% (${v} vendas/dia · R$${pr})</li>`).join('')

const ASSUNTOS = [
  (l: string, cidade?: string) => `🔥 ${TOP.nome.split(' ').slice(0, 3).join(' ')} esgotando em ${cidade || 'sua região'} — +${TOP.pct}%`,
  (l: string) => `Dado importante para ${l || 'sua loja'} essa semana`,
  (l: string, cidade?: string) => `Seu concorrente em ${cidade || 'SP'} já sabe disso — você sabe?`,
]

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://luvymetrics.com.br'

function emailHtml(nome: string, cidade: string | undefined, prospectoId: string) {
  const pixel = `<img src="${SITE_URL}/api/track/open?id=${prospectoId}" width="1" height="1" alt="" style="display:none;border:0" />`
  return `<div style="font-family:sans-serif;max-width:580px;margin:0 auto;padding:24px;color:#111827"><div style="margin-bottom:24px"><span style="font-size:22px;font-weight:800"><span style="color:#111827">Luvy</span><span style="color:#7c3aed">Metrics</span></span></div><p style="font-size:16px;margin:0 0 16px">Olá, <strong>${nome}</strong>!</p><p style="color:#374151;line-height:1.7;margin:0 0 20px">Monitorando o mercado adulto essa semana, vi algo importante${cidade ? ' para sex shops em <strong>' + cidade + '</strong>' : ''}:</p><div style="background:#f5f3ff;border-left:4px solid #7c3aed;padding:20px;border-radius:0 8px 8px 0;margin:0 0 20px"><p style="margin:0 0 8px;font-weight:700;color:#7c3aed;font-size:16px">🔥 ${TOP.nome} subiu +${TOP.pct}% essa semana</p><p style="margin:0;color:#374151;font-size:14px">${TOP.vendas} vendas por dia · R$${TOP.preco} preço médio</p></div><p style="color:#374151;font-weight:600;margin:0 0 8px">Outros em alta:</p><ul style="color:#374151;line-height:2.2;margin:0 0 24px;padding-left:20px">${LISTA}</ul><div style="text-align:center;margin:28px 0"><a href="https://pay.cakto.com.br/wanxtpo" style="background:#7c3aed;color:#fff;padding:16px 36px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px;display:inline-block">Testar 7 dias grátis →</a><p style="color:#7c3aed;font-size:15px;font-weight:700;margin:10px 0 0">R$97/mês</p></div><p style="color:#374151;margin-top:20px">Abraços,<br><strong>Paulo</strong><br>LuvyMetrics<br><a href="https://wa.me/5521986826670" style="color:#7c3aed">WhatsApp: (21) 98682-6670</a></p>${pixel}</div>`
}

export async function GET() {
  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const resend = new Resend(process.env.RESEND_API_KEY)
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

    // ════════════════════════════════════
    // FASE 2: ENVIA 30 da fila (~30s)
    // ════════════════════════════════════
    const { data: fila } = await supabase.from('prospectos').select('*').eq('status', 'novo').not('email', 'is', null).limit(30)
    let enviados = 0, erros = 0

    for (const p of fila || []) {
      try {
        const assunto = ASSUNTOS[Math.floor(Math.random() * ASSUNTOS.length)](p.nome_loja || 'sua loja', p.cidade)
        await resend.emails.send({
          from: process.env.RESEND_FROM || 'LuvyMetrics <contato@luvymetrics.com.br>',
          to: p.email, subject: assunto,
          html: emailHtml(p.nome_loja || 'lojista', p.cidade, p.id),
        })
        await supabase.from('prospectos').update({ status: 'enviado', enviado_em: new Date().toISOString() }).eq('id', p.id)
        enviados++
        await new Promise(r => setTimeout(r, 150))
      } catch { erros++ }
    }

    const { count: filaRestante } = await supabase.from('prospectos').select('id', { count: 'exact', head: true }).eq('status', 'novo')

    console.log(`Prospecção: buscou ${buscados} lojas (+${novosSalvos} novos), enviou ${enviados} emails, fila: ${filaRestante}`)

    return NextResponse.json({
      buscados, novos_salvos: novosSalvos,
      emails_enviados: enviados, erros,
      fila_restante: filaRestante,
      total_prospectos: emailsVistos.size,
    })
  } catch (error: any) {
    console.error('Erro prospectar:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
