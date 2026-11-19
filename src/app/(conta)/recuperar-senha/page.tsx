import Link from 'next/link'
import type { Metadata } from 'next'
import { FormRecuperar } from '../formularios'

export const metadata: Metadata = { title: 'Recuperar senha' }

export default function RecuperarSenha() {
  return (
    <>
      <h1>Esqueci minha senha</h1>
      <p>Enviamos um link para você criar uma senha nova.</p>
      <FormRecuperar />
      <p className="lv-conta-rodape"><Link href="/entrar">Voltar para entrar</Link></p>
    </>
  )
}
