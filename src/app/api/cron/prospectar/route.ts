import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

export const maxDuration = 55

const CIDADES = [
  'São Paulo SP', 'Rio de Janeiro RJ', 'Belo Horizonte MG', 'Salvador BA',
  'Fortaleza CE', 'Curitiba PR', 'Recife PE', 'Porto Alegre RS',
  'Goiânia GO', 'Florianópolis SC', 'Campinas SP', 'Vitória ES',
  'Natal RN', 'Santos SP', 'Niterói RJ', 'Uberlândia MG',
  'Joinville SC', 'Londrina PR', 'Maringá PR', 'São Luís MA',
  'Brasília DF', 'Manaus AM', 'Belém PA', 'Maceió AL',
  'Campo Grande MS', 'Teresina PI', 'João Pessoa PB', 'Aracaju SE',
  'Cuiabá MT', 'Ribeirão Preto SP', 'Sorocaba SP', 'Guarulhos SP',
  'São Bernardo do Campo SP', 'Osasco SP', 'Santo André SP',
  'Juiz de Fora MG', 'Feira de Santana BA', 'Ananindeua PA',
  'Aparecida de Goiânia GO', 'Serra ES',
]

const TERMOS = [
  'sex shop', 'loja lingerie sensual', 'loja produtos adultos',
  'boutique sensual erótica', 'loja íntima adulto', 'sex shop atacado',
  'lingerie sensual feminina loja', 'erotika sex shop',
]

const TOP = { nome: 'Vibrador Sugador Rose Recarregável', pct: 87, vendas: 920, preco: '129,90' }
const LISTA_HTML = [
  ['Gel Excitante Feminino Tesão de Vaca', 72, 1300, '24,90'],
  ['Lubrificante Íntimo K-Med 200g', 65, 1600, '29,90'],
  ['Calcinha Fio Dental Renda Preta', 58, 1600, '19,90'],
  ['Preservativo Retardante Jontex 12un', 54, 1800, '29,90'],
].map(([n, p, v, pr]) => `<li><strong>${n}</strong> — +${p}% (${v} vendas/dia · R$${pr})</li>`).join('')

const ASSUNTOS = [
  (loja: string, cidade: string) => `${loja} — produto subiu +87% essa semana no ML`,
  (_l: string, cidade: string) => `Dado exclusivo para sex shops em ${cidade}: o que está bombando`,
  (loja: string) => `Vi uma oportunidade para ${loja} essa semana`,
  (_l: string, cidade: string) => `Sex shops em ${cidade} estão lucrando com esse produto`,
]

function emailHtml(nome: string, cidade: string) {
  return `<div style="font-family:sans-serif;max-width:580px;margin:0 auto;padding:24px;color:#111827"><div style="margin-bottom:24px"><span style="font-size:22px;font-weight:800"><span style="color:#111827">Luvy</span><span style="color:#7c3aed">Metrics</span></span></div><p style="font-size:16px;margin:0 0 16px">Olá, <strong>${nome}</strong>!</p><p style="color:#374151;line-height:1.7;margin:0 0 20px">Monitorando o mercado adulto essa semana, vi algo importante para sex shops em <strong>${cidade}</strong>:</p><div style="background:#f5f3ff;border-left:4px solid #7c3aed;padding:20px;border-radius:0 8px 8px 0;margin:0 0 20px"><p style="margin:0 0 8px;font-weight:700;color:#7c3aed;font-size:16px">🔥 ${TOP.nome} subiu +${TOP.pct}% essa semana</p><p style="margin:0;color:#374151;font-size:14px">${TOP.vendas} vendas por dia · R$${TOP.preco} preço médio</p></div><p style="color:#374151;font-weight:600;margin:0 0 8px">Outros produtos em alta:</p><ul style="color:#374151;line-height:2.2;margin:0 0 24px;padding-left:20px">${LISTA_HTML}</ul><p style="color:#374151;line-height:1.7;margin:0 0 20px">Criamos uma plataforma que entrega esses dados <strong>todo dia</strong> para donos de sex shop — para você saber o que comprar <strong>antes de qualquer concorrente</strong>.</p><div style="text-align:center;margin:28px 0"><a href="https://pay.cakto.com.br/wanxtpo" style="background:#7c3aed;color:#fff;padding:16px 36px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px;display:inline-block">Testar 7 dias grátis →</a><p style="color:#9ca3af;font-size:13px;margin:10px 0 4px">Sem cartão · Cancele quando quiser</p><p style="color:#7c3aed;font-size:15px;font-weight:700;margin:0">Apenas R$97/mês</p></div><p style="color:#374151;line-height:1.7;border-top:1px solid #f3f4f6;padding-top:20px;font-size:14px"><strong>PS:</strong> Estamos em lançamento. As primeiras 50 lojas garantem R$97/mês para sempre — mesmo quando subir para R$297.</p><p style="color:#374151;margin-top:20px">Abraços,<br><strong>Paulo</strong><br>Fundador · LuvyMetrics<br><a href="https://wa.me/5521986826670" style="color:#7c3aed;font-size:14px">WhatsApp: (21) 98682-6670</a></p></div>`
}

export async function GET() {
  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const resend = new Resend(process.env.RESEND_API_KEY)
    const GOOGLE_KEY = process.env.GOOGLE_PLACES_API_KEY
    if (!GOOGLE_KEY) return NextResponse.json({ error: 'GOOGLE_PLACES_API_KEY missing' }, { status: 500 })

    // Pega 2 cidades por execução (rotaciona pelo horário)
    const now = new Date()
    const idx = (now.getDate() * 4 + now.getHours()) % CIDADES.length
    const cidadesHoje = [CIDADES[idx], CIDADES[(idx + 1) % CIDADES.length]]
    // Pega 2 termos por execução
    const termoIdx = now.getHours() % TERMOS.length
    const termosHoje = [TERMOS[termoIdx], TERMOS[(termoIdx + 1) % TERMOS.length]]

    let totalLojas = 0, totalEnviados = 0, totalErros = 0
    const emailsEnviados = new Set<string>()

    // Busca emails já enviados para não duplicar
    const { data: jaEnviados } = await supabase.from('prospectos').select('email').not('email', 'is', null)
    const emailsJaEnviados = new Set((jaEnviados || []).map((p: any) => p.email?.toLowerCase()))

    for (const cidade of cidadesHoje) {
      for (const termo of termosHoje) {
        try {
          const q = encodeURIComponent(`${termo} em ${cidade}`)
          const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${q}&language=pt-BR&key=${GOOGLE_KEY}`
          const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
          if (!res.ok) continue
          const data = await res.json()
          if (data.status !== 'OK') continue

          for (const place of (data.results || []).slice(0, 20)) {
            totalLojas++

            // Busca website
            let website: string | null = null
            try {
              const dUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=website&key=${GOOGLE_KEY}`
              const dRes = await fetch(dUrl, { signal: AbortSignal.timeout(4000) })
              if (dRes.ok) website = ((await dRes.json()).result?.website) || null
            } catch {}

            // Gera email do domínio
            let email: string | null = null
            if (website) {
              try {
                const domain = new URL(website).hostname.replace('www.', '')
                const blocked = ['facebook', 'instagram', 'google', 'youtube', 'twitter', 'tiktok', 'linktree', 'shopee', 'mercadolivre', 'whatsapp', 'wa.me']
                if (!blocked.some(b => domain.includes(b)) && domain.includes('.') && domain.length > 5) {
                  email = `contato@${domain}`
                }
              } catch {}
            }
            if (email && (email.includes('.png') || email.includes('.jpg') || email.includes('example') || email.includes('meu@') || email.includes('test@') || email.length < 8)) {
              email = null
            }

            // Skip se já enviou para esse email
            if (!email || emailsJaEnviados.has(email.toLowerCase()) || emailsEnviados.has(email.toLowerCase())) continue
            emailsEnviados.add(email.toLowerCase())

            // Salva e envia
            try {
              await supabase.from('prospectos').insert({
                nome_loja: place.name, cidade, email, website, place_id: place.place_id,
                status: 'enviado', enviado_em: new Date().toISOString(),
              })

              const assunto = ASSUNTOS[Math.floor(Math.random() * ASSUNTOS.length)](place.name, cidade)
              await resend.emails.send({
                from: process.env.RESEND_FROM || 'LuvyMetrics <onboarding@resend.dev>',
                to: email, subject: assunto, html: emailHtml(place.name, cidade),
              })
              totalEnviados++
              await new Promise(r => setTimeout(r, 150))
            } catch { totalErros++ }
          }
        } catch {}
      }
    }

    console.log(`Prospecção: ${cidadesHoje.join('+')} × ${termosHoje.join('+')} | Lojas: ${totalLojas} | Emails: ${totalEnviados}`)

    return NextResponse.json({
      cidades: cidadesHoje, termos: termosHoje,
      lojas_encontradas: totalLojas, emails_enviados: totalEnviados, erros: totalErros,
    })
  } catch (error: any) {
    console.error('Erro prospectar:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
