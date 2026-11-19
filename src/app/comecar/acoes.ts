'use server'
import { redirect } from 'next/navigation'
import { contexto, mensagemErro } from '@/lib/sessao'
import { slugify } from '@/lib/formato'
import { CATEGORIAS, UFS } from '@/lib/constantes'
import type { Estado } from '@/components/Enviar'

export async function criarLoja(_: Estado, fd: FormData): Promise<Estado> {
  const { supabase, user, loja } = await contexto()
  if (!user) redirect('/entrar')
  if (loja) redirect('/painel')

  const nome = String(fd.get('nome') ?? '').trim()
  const cidade = String(fd.get('cidade') ?? '').trim()
  const uf = String(fd.get('uf') ?? '').toUpperCase()
  const whatsapp = String(fd.get('whatsapp') ?? '').replace(/\D/g, '') || null
  const categorias = fd.getAll('categorias').map(String).filter((c) => (CATEGORIAS as readonly string[]).includes(c))

  if (nome.length < 2) return { erro: 'Informe o nome da loja.' }
  if (cidade.length < 2) return { erro: 'Informe a cidade.' }
  if (!(UFS as readonly string[]).includes(uf)) return { erro: 'Escolha o estado.' }
  if (whatsapp && (whatsapp.length < 10 || whatsapp.length > 13)) return { erro: 'WhatsApp inválido. Use DDD + número.' }

  let base = slugify(nome)
  if (base.length < 3) base = `loja-${base || 'nova'}`
  // tenta o endereço; se já existir, acrescenta um número
  for (let i = 0; i < 6; i++) {
    const slug = i === 0 ? base : `${base.slice(0, 36)}-${Math.floor(100 + Math.random() * 900)}`
    const { error } = await supabase.from('lojas').insert({ dono: user.id, nome, slug, cidade, uf, categorias, whatsapp })
    if (!error) redirect('/painel?bemvinda=1')
    if (!error.message.includes('lojas_slug_key')) return { erro: mensagemErro(error) }
  }
  return { erro: 'Não conseguimos criar o endereço da loja. Tente outro nome.' }
}
