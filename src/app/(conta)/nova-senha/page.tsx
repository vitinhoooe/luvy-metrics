import type { Metadata } from 'next'
import { FormNovaSenha } from '../formularios'

export const metadata: Metadata = { title: 'Nova senha' }

export default function NovaSenha() {
  return (
    <>
      <h1>Crie uma senha nova</h1>
      <p>Depois de salvar, você entra direto no painel.</p>
      <FormNovaSenha />
    </>
  )
}
