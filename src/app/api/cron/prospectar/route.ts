import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

export const maxDuration = 60

const CIDADES = [
  'São Paulo SP', 'Rio de Janeiro RJ', 'Belo Horizonte MG', 'Salvador BA',
  'Fortaleza CE', 'Curitiba PR', 'Recife PE', 'Porto Alegre RS',
  'Goiânia GO', 'Florianópolis SC', 'Campinas SP', 'Vitória ES',
  'Natal RN', 'Santos SP', 'Niterói RJ', 'Uberlândia MG',
  'Joinville SC', 'Londrina PR', 'Maringá PR', 'São Luís MA',
]

const TOP_PRODUTOS = [
  { nome: 'Vibrador Sugador Rose Recarregável', pct: 87, vendas: 920, preco: '129,90' },
  { nome: 'Gel Excitante Feminino Tesão de Vaca', pct: 72, vendas: 1300, preco: '24,90' },
  { nome: 'Lubrificante Íntimo K-Med 200g', pct: 65, vendas: 1600, preco: '29,90' },
  { nome: 'Calcinha Fio Dental Renda Preta', pct: 58, vendas: 1600, preco: '19,90' },
]

const ASSUNTOS = [
  (loja: string) => `${loja || 'Sua loja'} — Vibrador Sugador Rose subiu +87% essa semana`,
  (_l: string, cidade: string) => `Dado exclusivo para sex shops em ${cidade}: o que está bombando`,
  (loja: string) => `Vi uma oportunidade para ${loja || 'sua loja'} essa semana`,
]

export async function GET() {
  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const resend = new Resend(process.env.RESEND_API_KEY)
    const GOOGLE_KEY = process.env.GOOGLE_PLACES_API_KEY

    // 1 cidade por execução (rápido, sem timeout)
    const hoje = new Date().getDate()
    const cidadesHoje = [CIDADES[hoje % CIDADES.length]]

    let totalLojas = 0
    let totalComEmail = 0
    let totalEnviados = 0
    let totalErros = 0

    for (const cidade of cidadesHoje) {
      if (!GOOGLE_KEY) break

      // Busca sex shops via Google Places
      try {
        const q = encodeURIComponent(`sex shop em ${cidade}`)
        const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${q}&language=pt-BR&key=${GOOGLE_KEY}`
        const res = await fetch(url, { signal: AbortSignal.timeout(10000) })
        if (!res.ok) continue
        const data = await res.json()
        if (data.status !== 'OK') continue

        const places = (data.results || []).slice(0, 10)
        totalLojas += places.length

        for (const place of places) {
          // Busca detalhes (telefone, website)
          let website: string | null = null, telefone: string | null = null
          try {
            const dUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=website,formatted_phone_number&key=${GOOGLE_KEY}`
            const dRes = await fetch(dUrl, { signal: AbortSignal.timeout(5000) })
            if (dRes.ok) {
              const d = (await dRes.json()).result || {}
              website = d.website || null
              telefone = d.formatted_phone_number || null
            }
          } catch {}

          // Gera email provável a partir do domínio do site
          let email: string | null = null
          if (website) {
            try {
              const domain = new URL(website).hostname.replace('www.', '')
              if (!domain.includes('facebook') && !domain.includes('instagram') && !domain.includes('google')) {
                email = `contato@${domain}`
              }
            } catch {}
          }

          // Salva prospecto no banco
          const { data: existing } = await supabase.from('prospectos').select('id').eq('place_id', place.place_id).maybeSingle()
          if (!existing) {
            await supabase.from('prospectos').insert({
              nome_loja: place.name,
              cidade,
              email,
              telefone,
              website,
              place_id: place.place_id,
              status: email ? 'novo' : 'sem_email',
            })
          }

          // Envia email se tem
          if (email && !existing) {
            try {
              const assunto = ASSUNTOS[Math.floor(Math.random() * ASSUNTOS.length)](place.name, cidade)
              const lista = TOP_PRODUTOS.map(p => `<li><strong>${p.nome}</strong> — +${p.pct}% (${p.vendas} vendas/dia · R$${p.preco})</li>`).join('')
              const top = TOP_PRODUTOS[0]

              await resend.emails.send({
                from: process.env.RESEND_FROM || 'LuvyMetrics <onboarding@resend.dev>',
                to: email,
                subject: assunto,
                html: `<div style="font-family:sans-serif;max-width:580px;margin:0 auto;padding:24px;color:#111827"><div style="margin-bottom:24px"><span style="font-size:22px;font-weight:800"><span style="color:#111827">Luvy</span><span style="color:#7c3aed">Metrics</span></span></div><p style="font-size:16px;margin:0 0 16px">Olá, <strong>${place.name}</strong>!</p><p style="color:#374151;line-height:1.7;margin:0 0 20px">Monitorando o mercado adulto essa semana, vi algo importante para sex shops em <strong>${cidade}</strong>:</p><div style="background:#f5f3ff;border-left:4px solid #7c3aed;padding:20px;border-radius:0 8px 8px 0;margin:0 0 20px"><p style="margin:0 0 8px;font-weight:700;color:#7c3aed;font-size:16px">🔥 ${top.nome} subiu +${top.pct}% essa semana</p><p style="margin:0;color:#374151;font-size:14px">${top.vendas} vendas por dia · R$${top.preco} preço médio</p></div><p style="color:#374151;font-weight:600;margin:0 0 8px">Outros produtos em alta:</p><ul style="color:#374151;line-height:2.2;margin:0 0 24px;padding-left:20px">${lista}</ul><div style="text-align:center;margin:28px 0"><a href="https://pay.cakto.com.br/wanxtpo" style="background:#7c3aed;color:#fff;padding:16px 36px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px;display:inline-block">Testar 7 dias grátis →</a><p style="color:#7c3aed;font-size:15px;font-weight:700;margin:10px 0 0">Apenas R$97/mês</p></div><p style="color:#374151;margin-top:20px">Abraços,<br><strong>Paulo</strong><br>Fundador · LuvyMetrics<br><a href="https://wa.me/5521986826670" style="color:#7c3aed;font-size:14px">WhatsApp: (21) 98682-6670</a></p></div>`,
              })

              await supabase.from('prospectos').update({ status: 'enviado', enviado_em: new Date().toISOString() }).eq('place_id', place.place_id)
              totalEnviados++
              totalComEmail++
              await new Promise(r => setTimeout(r, 200))
            } catch { totalErros++ }
          }
        }
      } catch {}
    }

    console.log(`Prospecção: ${cidadesHoje.join(', ')} | Lojas: ${totalLojas} | Emails: ${totalEnviados} | Erros: ${totalErros}`)

    return NextResponse.json({
      cidades: cidadesHoje,
      lojas_encontradas: totalLojas,
      com_email: totalComEmail,
      emails_enviados: totalEnviados,
      erros: totalErros,
    })
  } catch (error: any) {
    console.error('Erro cron prospectar:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
