'use server'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { origem } from '@/lib/origem'
import type { Estado } from '@/components/Enviar'

const emailValido = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e)

function caminhoSeguro(v: FormDataEntryValue | null) {
  const s = typeof v === 'string' ? v : ''
  return s.startsWith('/') && !s.startsWith('//') ? s : '/painel'
}

function traduzir(msg: string) {
  if (/invalid login credentials/i.test(msg)) return 'E-mail ou senha incorretos.'
  if (/email not confirmed/i.test(msg)) return 'Confirme seu e-mail antes de entrar. Procure a mensagem na sua caixa de entrada (e no spam).'
  if (/already registered|already been registered/i.test(msg)) return 'Esse e-mail já tem conta. Entre ou recupere a senha.'
  if (/rate limit|too many/i.test(msg)) return 'Muitas tentativas. Espere um minuto e tente de novo.'
  if (/password should be at least/i.test(msg)) return 'A senha precisa ter pelo menos 8 caracteres.'
  if (/same password|different from the old/i.test(msg)) return 'Use uma senha diferente da anterior.'
  return 'Não foi possível concluir. Tente de novo.'
}

export async function entrar(_: Estado, fd: FormData): Promise<Estado> {
  const email = String(fd.get('email') ?? '').trim().toLowerCase()
  const senha = String(fd.get('senha') ?? '')
  if (!emailValido(email) || !senha) return { erro: 'Informe e-mail e senha.' }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
  if (error) return { erro: traduzir(error.message) }
  redirect(caminhoSeguro(fd.get('voltar')))
}

export async function criarConta(_: Estado, fd: FormData): Promise<Estado> {
  const email = String(fd.get('email') ?? '').trim().toLowerCase()
  const senha = String(fd.get('senha') ?? '')
  if (!emailValido(email)) return { erro: 'Informe um e-mail válido.' }
  if (senha.length < 8) return { erro: 'A senha precisa ter pelo menos 8 caracteres.' }
  if (fd.get('termos') !== 'on') return { erro: 'Confirme que você tem 18 anos ou mais e aceita os termos.' }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password: senha,
    options: { emailRedirectTo: `${await origem()}/auth/callback?next=/comecar` },
  })
  if (error) return { erro: traduzir(error.message) }
  // com confirmação de e-mail ligada no Supabase, não há sessão ainda
  if (!data.session) return { ok: `Enviamos um link de confirmação para ${email}. Abra o e-mail para ativar sua conta.` }
  redirect('/comecar')
}

export async function recuperarSenha(_: Estado, fd: FormData): Promise<Estado> {
  const email = String(fd.get('email') ?? '').trim().toLowerCase()
  if (!emailValido(email)) return { erro: 'Informe um e-mail válido.' }
  const supabase = await createClient()
  await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${await origem()}/auth/callback?next=/nova-senha` })
  // mesma resposta exista ou não a conta (não revela quem é cliente)
  return { ok: 'Se esse e-mail tiver conta, você vai receber um link para criar uma senha nova.' }
}

export async function novaSenha(_: Estado, fd: FormData): Promise<Estado> {
  const senha = String(fd.get('senha') ?? '')
  if (senha.length < 8) return { erro: 'A senha precisa ter pelo menos 8 caracteres.' }
  if (senha !== String(fd.get('confirmar') ?? '')) return { erro: 'As senhas não são iguais.' }
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { erro: 'O link expirou. Peça um novo em "Esqueci minha senha".' }
  const { error } = await supabase.auth.updateUser({ password: senha })
  if (error) return { erro: traduzir(error.message) }
  redirect('/painel')
}

export async function sair() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/entrar')
}
