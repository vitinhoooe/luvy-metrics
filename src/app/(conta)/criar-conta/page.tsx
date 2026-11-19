import Link from 'next/link'
import type { Metadata } from 'next'
import { FormCriar } from '../formularios'

export const metadata: Metadata = { title: 'Criar conta' }

export default function CriarConta() {
  return (
    <>
      <h1>Teste grátis por 7 dias</h1>
      <p>Tudo do plano Pro liberado. Sem cartão de crédito.</p>
      <FormCriar />
      <p className="lv-conta-rodape">Já tem conta? <Link href="/entrar">Entrar</Link></p>
    </>
  )
}
