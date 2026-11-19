import { previaLiberada } from '@/lib/previa'
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { atendenteDisponivel, responder, type LojaAtendente, type Mensagem, type ProdutoAtendente } from '@/lib/atendente'
import { PRODUTOS_EXEMPLO } from '../../previa/exemplo'

// Conversa do atendente IA da vitrine. Público (a cliente não tem login).
// Proteções: atendente ligado + plano com vitrine (no banco), limite de conversas por mês,
// 40 mensagens por conversa, 600 caracteres por mensagem.

const ERROS: Record<string, string> = {
  ATENDENTE_DESLIGADO: 'O atendimento online desta loja está desligado agora.',
  LIMITE_MES: 'O atendimento online está ocupado. Fale direto com a loja pelo WhatsApp.',
  CONVERSA_LONGA: 'Esta conversa ficou longa. Para continuar, fale com a loja pelo WhatsApp.',
}

type Vitrine = LojaAtendente & { fechada: boolean; produtos: ProdutoAtendente[]; atendente: LojaAtendente['atendente'] & { ativo: boolean } }

export async function POST(req: NextRequest) {
  let corpo: { slug?: string; conversa?: string | null; mensagem?: string }
  try { corpo = await req.json() } catch { return NextResponse.json({ erro: 'Mensagem inválida.' }, { status: 400 }) }
  const slug = String(corpo.slug ?? '').toLowerCase()
  const mensagem = String(corpo.mensagem ?? '').trim().slice(0, 600)
  const conversaId = /^[0-9a-f-]{36}$/i.test(String(corpo.conversa ?? '')) ? String(corpo.conversa) : null
  if (!/^[a-z0-9-]{3,40}$/.test(slug) || !mensagem) return NextResponse.json({ erro: 'Mensagem inválida.' }, { status: 400 })
  if (!atendenteDisponivel()) return NextResponse.json({ erro: 'O atendimento online não está disponível agora.' }, { status: 503 })

  // prévia (só em desenvolvimento): catálogo de exemplo, nada é gravado
  if (slug === 'previa') {
    if (!previaLiberada()) return NextResponse.json({ erro: 'Não encontrado.' }, { status: 404 })
    const loja: LojaAtendente = {
      nome: 'Amor & Cia', cidade: 'Recife', uf: 'PE', whatsapp: '81999999999', pix: true,
      entrega: { retirada: true, endereco_retirada: 'Rua do Exemplo, 100 - Boa Vista', local: true, local_taxa: 10, combinar: true },
      atendente: { nome: 'Lia', tom: 'acolhedor', info: 'Entregamos em embalagem discreta, sem o nome da loja.' },
    }
    const catalogo = PRODUTOS_EXEMPLO.map((p) => ({ id: p.id, nome: p.nome, categoria: p.categoria, preco: p.preco, disponivel: Math.min(p.quantidade, 20) }))
    const historico = Array.isArray((corpo as { historico?: Mensagem[] }).historico) ? (corpo as { historico: Mensagem[] }).historico.slice(-16) : []
    try {
      const r = await responder(loja, catalogo, historico, mensagem)
      return NextResponse.json({ conversa: null, ...r })
    } catch (e) {
      console.error('[atendente previa]', e instanceof Error ? e.message : e)
      return NextResponse.json({ erro: 'O atendimento falhou agora. Tente de novo em instantes.' }, { status: 502 })
    }
  }

  const supabase = await createClient()
  const { data: conv, error: e1 } = await supabase.rpc('abrir_conversa', { p_slug: slug, p_conversa: conversaId })
  if (e1) {
    const chave = Object.keys(ERROS).find((k) => e1.message.includes(k))
    return NextResponse.json({ erro: chave ? ERROS[chave] : 'O atendimento está indisponível agora.' }, { status: 403 })
  }
  const { id, historico } = conv as { id: string; historico: Mensagem[] }

  const { data: v } = await supabase.rpc('vitrine_publica', { p_slug: slug })
  const vit = v as Vitrine | null
  if (!vit || vit.fechada) return NextResponse.json({ erro: ERROS.ATENDENTE_DESLIGADO }, { status: 403 })
  const catalogo = vit.produtos.map((p) => ({ ...p, preco: Number(p.preco), preco_de: p.preco_de ? Number(p.preco_de) : null }))

  try {
    const r = await responder(vit, catalogo, historico, mensagem)
    await supabase.rpc('salvar_mensagens', {
      p_conversa: id, p_cliente: mensagem, p_atendente: r.texto,
      p_chamou: r.acoes.some((a) => a.tipo === 'whatsapp'), p_sacola: r.acoes.some((a) => a.tipo === 'sacola'),
    })
    return NextResponse.json({ conversa: id, ...r })
  } catch (e) {
    console.error('[atendente]', e instanceof Error ? e.message : e)
    return NextResponse.json({ conversa: id, erro: 'O atendimento falhou agora. Tente de novo em instantes ou fale com a loja.' }, { status: 502 })
  }
}
