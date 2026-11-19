// No navegador: reduz a foto antes de enviar (foto de celular passa fácil de 5 MB).
// Mantém a orientação da câmera e devolve um JPEG de até `max` px no lado maior.
export async function reduzirImagem(arquivo: File, max = 1800, qualidade = 0.86): Promise<File> {
  if (!arquivo.type.startsWith('image/')) return arquivo
  try {
    const bmp = await createImageBitmap(arquivo, { imageOrientation: 'from-image' })
    const escala = Math.min(1, max / Math.max(bmp.width, bmp.height))
    const w = Math.round(bmp.width * escala), h = Math.round(bmp.height * escala)
    const canvas = document.createElement('canvas')
    canvas.width = w; canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return arquivo
    ctx.fillStyle = '#ffffff' // PNG transparente vira fundo branco
    ctx.fillRect(0, 0, w, h)
    ctx.drawImage(bmp, 0, 0, w, h)
    bmp.close()
    const blob = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, 'image/jpeg', qualidade))
    return blob ? new File([blob], arquivo.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' }) : arquivo
  } catch {
    return arquivo
  }
}
