'use client'
import Link from 'next/link'
import { useActionState, useState } from 'react'
import { Enviar, Mensagem } from '@/components/Enviar'
import { createClient } from '@/lib/supabase/client'
import { criarConta, entrar, novaSenha, recuperarSenha } from './acoes'

export function FormEntrar({ voltar, erroLink }: { voltar?: string; erroLink?: boolean }) {
  const [estado, acao] = useActionState(entrar, erroLink ? { erro: 'O link expirou ou já foi usado. Entre com sua senha ou peça um novo.' } : null)
  return (
    <form action={acao} className="lv-form">
      <input type="hidden" name="voltar" value={voltar ?? ''} />
      <div className="lv-campo">
        <label htmlFor="email">E-mail</label>
        <input id="email" name="email" type="email" className="lv-input" autoComplete="email" required />
      </div>
      <div className="lv-campo">
        <span className="lv-rotulo-linha"><label htmlFor="senha">Senha</label><Link href="/recuperar-senha">Esqueceu a senha?</Link></span>
        <CampoSenha id="senha" name="senha" autoComplete="current-password" />
      </div>
      <Mensagem estado={estado} />
      <Enviar className="lv-btn grande cheio" enviando="Entrando…">Entrar</Enviar>
      <BotaoGoogle proximo={voltar || '/painel'} />
    </form>
  )
}

export function FormCriar() {
  const [estado, acao] = useActionState(criarConta, null)
  if (estado?.ok) return <p className="lv-msg ok" role="status">{estado.ok}</p>
  return (
    <form action={acao} className="lv-form">
      <div className="lv-campo">
        <label htmlFor="email">E-mail</label>
        <input id="email" name="email" type="email" className="lv-input" autoComplete="email" required />
      </div>
      <div className="lv-campo">
        <label htmlFor="senha">Crie uma senha</label>
        <CampoSenha id="senha" name="senha" autoComplete="new-password" forca />
      </div>
      <label className="lv-check">
        <input type="checkbox" name="termos" required />
        <span>Tenho 18 anos ou mais e aceito os termos de uso.</span>
      </label>
      <Mensagem estado={estado} />
      <Enviar className="lv-btn grande cheio" enviando="Criando conta…">Começar teste grátis</Enviar>
      <BotaoGoogle proximo="/comecar" />
    </form>
  )
}

export function FormRecuperar() {
  const [estado, acao] = useActionState(recuperarSenha, null)
  return (
    <form action={acao} className="lv-form">
      <div className="lv-campo">
        <label htmlFor="email">E-mail da conta</label>
        <input id="email" name="email" type="email" className="lv-input" autoComplete="email" required />
      </div>
      <Mensagem estado={estado} />
      <Enviar className="lv-btn grande cheio" enviando="Enviando…">Enviar link</Enviar>
    </form>
  )
}

export function FormNovaSenha() {
  const [estado, acao] = useActionState(novaSenha, null)
  return (
    <form action={acao} className="lv-form">
      <div className="lv-campo">
        <label htmlFor="senha">Senha nova</label>
        <CampoSenha id="senha" name="senha" autoComplete="new-password" forca />
      </div>
      <div className="lv-campo">
        <label htmlFor="confirmar">Repita a senha</label>
        <CampoSenha id="confirmar" name="confirmar" autoComplete="new-password" />
      </div>
      <Mensagem estado={estado} />
      <Enviar className="lv-btn grande cheio">Salvar senha</Enviar>
    </form>
  )
}

function CampoSenha({ id, name, autoComplete, forca }: { id: string; name: string; autoComplete: string; forca?: boolean }) {
  const [ver, setVer] = useState(false)
  const [valor, setValor] = useState('')
  const n = !valor ? 0 : valor.length < 8 ? 1 : /[0-9\W_]/.test(valor) && valor.length >= 10 ? 3 : 2
  const dica = ['Pelo menos 8 caracteres.', 'Curta demais: use 8 ou mais.', 'Boa. Com números fica mais forte.', 'Senha forte.'][n]
  return (
    <>
      <div className="lv-senha">
        <input
          id={id}
          name={name}
          type={ver ? 'text' : 'password'}
          className="lv-input"
          autoComplete={autoComplete}
          minLength={autoComplete === 'new-password' ? 8 : undefined}
          required
          value={valor}
          onChange={(e) => setValor(e.target.value)}
        />
        <button type="button" onClick={() => setVer((v) => !v)} aria-pressed={ver} aria-controls={id}>
          {ver ? 'Ocultar' : 'Mostrar'}
        </button>
      </div>
      {forca && (
        <>
          <div className="lv-forca" data-n={n} aria-hidden><i /><i /><i /></div>
          <small aria-live="polite">{dica}</small>
        </>
      )}
    </>
  )
}

/** Entrar com o Google (precisa estar ligado no Supabase: Authentication → Providers → Google). */
function BotaoGoogle({ proximo }: { proximo: string }) {
  const [erro, setErro] = useState<string | null>(null)
  const [indo, setIndo] = useState(false)
  async function ir() {
    setErro(null); setIndo(true)
    const { error } = await createClient().auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(proximo)}` },
    })
    if (error) { setErro('O login com Google ainda não está ativado. Use e-mail e senha.'); setIndo(false) }
  }
  return (
    <>
      <div className="lv-ou" aria-hidden><span>ou</span></div>
      <button type="button" className="lv-btn-google" onClick={ir} disabled={indo}>
        <svg viewBox="0 0 48 48" aria-hidden><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>
        {indo ? 'Abrindo o Google…' : 'Continuar com o Google'}
      </button>
      {erro && <p className="lv-msg info" role="status">{erro}</p>}
    </>
  )
}
