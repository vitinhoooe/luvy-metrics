'use server'
import { revalidatePath } from 'next/cache'
import { exigirEdicao, mensagemErro } from '@/lib/sessao'
import type { LinhaHist } from '@/lib/historico'

const ERROS: Record<string, string> = {
  PLANILHA_VAZIA: 'Nenhuma linha para importar.',
  PLANILHA_GRANDE: 'Máximo de 20 mil linhas por vez. Divida o arquivo por período.',
  NENHUMA_LINHA_VALIDA: 'Nenhuma linha válida: confira as colunas de data, produto e valor.',
}

export async function importarHistorico(linhas: LinhaHist[]) {
  try {
    const { supabase } = await exigirEdicao('catalogo')
    const limpas = (Array.isArray(linhas) ? linhas : []).slice(0, 20000).map((l) => ({
      data: String(l.data).slice(0, 10), produto: String(l.produto).slice(0, 160), codigo: l.codigo ? String(l.codigo).slice(0, 40) : null,
      quantidade: Math.round(Number(l.quantidade)), valor: Math.round(Number(l.valor) * 100) / 100,
    }))
    const { data, error } = await supabase.rpc('importar_historico', { p_linhas: limpas })
    if (error) {
      const k = Object.keys(ERROS).find((x) => error.message.includes(x))
      return { erro: k ? ERROS[k] : mensagemErro(error) }
    }
    revalidatePath('/vendas')
    revalidatePath('/painel')
    revalidatePath('/repor')
    return { ok: true as const, ...(data as { vendas: number; ligados: number; sem_produto: number; ignoradas: number }) }
  } catch (e) {
    return { erro: mensagemErro(e) }
  }
}

export async function desfazerHistorico(fd: FormData) {
  const { supabase } = await exigirEdicao('catalogo')
  const lote = String(fd.get('lote') ?? '')
  if (!/^[0-9a-f-]{36}$/i.test(lote)) return
  await supabase.rpc('desfazer_historico', { p_lote: lote })
  revalidatePath('/vendas')
  revalidatePath('/vendas/importar')
  revalidatePath('/painel')
  revalidatePath('/repor')
}
