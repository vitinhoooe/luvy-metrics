'use server'
import { revalidatePath } from 'next/cache'
import { exigirEdicao, mensagemErro } from '@/lib/sessao'
import { mapearComIA } from '@/lib/ia'
import { LIMITES } from '@/lib/planos'
import { mapearPorNome, type LinhaImport, type Mapeamento } from '@/lib/mapeamento'

export async function sugerirMapeamento(cabecalhos: string[], amostra: unknown[][]): Promise<{
  mapa: Mapeamento
  fonte: 'ia' | 'automatico'
  observacao?: string
  erro?: string
}> {
  const automatico = mapearPorNome(cabecalhos)
  try {
    const { supabase, assinatura } = await exigirEdicao('importar')
    const cab = cabecalhos.slice(0, 60).map((h) => String(h ?? '').slice(0, 80))
    const am = amostra.slice(0, 12).map((l) => (Array.isArray(l) ? l.slice(0, 60) : []))

    // limite mensal de mapeamentos com IA por plano
    const { data: usados, error } = await supabase.rpc('contar_uso_ia', { p_tipo: 'importacao' })
    if (error || (usados ?? 0) > LIMITES[assinatura.plano].importacoesIA) {
      return { mapa: automatico, fonte: 'automatico' }
    }
    const ia = await mapearComIA(cab, am)
    if (ia) return { mapa: ia.mapa, fonte: 'ia', observacao: ia.observacao }
    return { mapa: automatico, fonte: 'automatico' }
  } catch (e) {
    return { mapa: automatico, fonte: 'automatico', erro: mensagemErro(e) }
  }
}

export async function importar(linhas: LinhaImport[], modo: 'somar' | 'substituir' | 'pular', arquivo: string, mapa: Mapeamento) {
  try {
    const { supabase } = await exigirEdicao('importar')
    if (!Array.isArray(linhas) || linhas.length === 0) return { erro: 'Nenhuma linha válida para importar.' }
    if (linhas.length > 5000) return { erro: 'A planilha passa de 5.000 produtos. Divida em partes.' }
    if (!['somar', 'substituir', 'pular'].includes(modo)) return { erro: 'Escolha o que fazer com produtos repetidos.' }

    const { data, error } = await supabase.rpc('importar_produtos', {
      p_linhas: linhas,
      p_modo: modo,
      p_arquivo: String(arquivo).slice(0, 120),
      p_mapeamento: mapa,
    })
    if (error) return { erro: mensagemErro(error) }
    revalidatePath('/produtos')
    revalidatePath('/painel')
    return { resultado: data as { id: string; criados: number; atualizados: number; ignorados: number } }
  } catch (e) {
    return { erro: mensagemErro(e) }
  }
}

export async function desfazer(fd: FormData) {
  const { supabase } = await exigirEdicao('importar')
  await supabase.rpc('desfazer_importacao', { p_imp: String(fd.get('id') ?? '') })
  revalidatePath('/produtos')
  revalidatePath('/produtos/importar')
}
