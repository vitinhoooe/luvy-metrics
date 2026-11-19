'use client'
import { useRef, useState, useTransition } from 'react'
import { reduzirImagem } from '@/lib/reduzir-imagem'

/** Botão de escolher foto (celular abre câmera ou galeria). Reduz no aparelho antes de enviar. */
export function EnviarImagem({ aoEnviar, rotulo = 'Adicionar foto', varias, desativado, max = 1800, className = 'lv-btn sec pq' }: {
  aoEnviar: (arquivo: File) => Promise<string | null | undefined> // devolve mensagem de erro, se houver
  rotulo?: string
  varias?: boolean
  desativado?: boolean
  max?: number
  className?: string
}) {
  const input = useRef<HTMLInputElement>(null)
  const [pendente, iniciar] = useTransition()
  const [erro, setErro] = useState<string | null>(null)
  const [progresso, setProgresso] = useState('')

  function escolher(lista: FileList | null) {
    if (!lista?.length) return
    setErro(null)
    const arquivos = Array.from(lista)
    iniciar(async () => {
      for (let i = 0; i < arquivos.length; i++) {
        setProgresso(arquivos.length > 1 ? ` ${i + 1}/${arquivos.length}` : '')
        const e = await aoEnviar(await reduzirImagem(arquivos[i], max))
        if (e) { setErro(e); break }
      }
      setProgresso('')
    })
  }

  return (
    <span className="lv-enviar-img">
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" multiple={varias} hidden
        onChange={(e) => { escolher(e.target.files); e.target.value = '' }} />
      <button type="button" className={className} disabled={desativado || pendente} onClick={() => input.current?.click()}>
        {pendente ? `Enviando${progresso}…` : rotulo}
      </button>
      {erro && <small className="lv-enviar-erro" role="alert">{erro}</small>}
    </span>
  )
}
