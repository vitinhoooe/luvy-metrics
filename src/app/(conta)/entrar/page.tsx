import Link from 'next/link'
import type { Metadata } from 'next'
import { FormEntrar } from '../formularios'

export const metadata: Metadata = { title: 'Entrar' }

export default async function Entrar({ searchParams }: { searchParams: Promise<{ voltar?: string; erro?: string }> }) {
  const { voltar, erro } = await searchParams
  return (
    <>
      <h1>Entrar</h1>
      <p>Que bom te ver de novo.</p>
      <FormEntrar voltar={voltar} erroLink={erro === 'link'} />
      <p className="lv-conta-rodape">Ainda não tem conta? <Link href="/criar-conta">Teste grátis por 7 dias</Link></p>
    </>
  )
}
