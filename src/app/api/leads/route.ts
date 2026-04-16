import { createServiceClient } from '@/lib/supabase/service'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { nome, whatsapp, nome_loja, faturamento_mensal } = await req.json()

    if (!nome?.trim() || !whatsapp?.trim()) {
      return NextResponse.json({ error: 'Nome e WhatsApp obrigatórios' }, { status: 400 })
    }

    // Usa service client para inserir sem auth (lead ainda não tem conta)
    const supabase = createServiceClient()

    const { error } = await supabase.from('leads').insert({
      nome: nome.trim(),
      whatsapp: whatsapp.replace(/\D/g, ''),
      nome_loja: nome_loja?.trim() ?? null,
      faturamento_mensal: faturamento_mensal ?? null,
      origem: 'landing',
      created_at: new Date().toISOString(),
    })

    if (error) {
      console.error('Erro ao salvar lead:', error)
      return NextResponse.json({ error: 'Falha ao salvar' }, { status: 500 })
    }

    console.log('Lead capturado:', nome, whatsapp)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Erro ao processar lead:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
