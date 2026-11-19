import 'server-only'
import sharp from 'sharp'
import { randomBytes } from 'node:crypto'
import { createServiceClient } from '@/lib/supabase/service'

// Imagens da vitrine (logo, capa e fotos de produto). Pasta pública "vitrine" no Supabase Storage.
// Toda imagem é reprocessada aqui: gira pela foto do celular, reduz e vira WebP (leve e sem metadados de GPS).

const PASTA = 'vitrine'
export type TipoImagem = 'logo' | 'capa' | 'produto'

const TAMANHO: Record<TipoImagem, { w: number; h: number; fit: 'inside' | 'cover' }> = {
  logo: { w: 480, h: 480, fit: 'inside' },
  capa: { w: 1920, h: 900, fit: 'cover' },
  produto: { w: 1200, h: 1500, fit: 'inside' },
}
const ACEITOS = ['image/jpeg', 'image/png', 'image/webp']
export const LIMITE_BYTES = 4 * 1024 * 1024

export async function salvarImagem(lojaId: string, tipo: TipoImagem, arquivo: File) {
  if (!ACEITOS.includes(arquivo.type)) throw new Error('FORMATO')
  if (arquivo.size > LIMITE_BYTES) throw new Error('GRANDE')
  const t = TAMANHO[tipo]
  const buffer = await sharp(Buffer.from(await arquivo.arrayBuffer()), { failOn: 'error' })
    .rotate()
    .resize({ width: t.w, height: t.h, fit: t.fit, withoutEnlargement: true })
    .webp({ quality: tipo === 'logo' ? 90 : 82 })
    .toBuffer()
  const caminho = `${lojaId}/${tipo}-${Date.now().toString(36)}-${randomBytes(4).toString('hex')}.webp`
  const s = createServiceClient()
  const { error } = await s.storage.from(PASTA).upload(caminho, buffer, { contentType: 'image/webp', cacheControl: '31536000', upsert: false })
  if (error) throw error
  return s.storage.from(PASTA).getPublicUrl(caminho).data.publicUrl
}

/** Apaga do Storage uma imagem desta loja (só se o endereço for da pasta da loja). */
export async function apagarImagem(lojaId: string, url: string | null | undefined) {
  if (!url) return
  const m = url.match(new RegExp(`/${PASTA}/(${lojaId}/[\\w.-]+\\.webp)$`))
  if (!m) return
  await createServiceClient().storage.from(PASTA).remove([m[1]])
}

export const erroImagem = (e: unknown) => {
  const m = e instanceof Error ? e.message : ''
  if (m === 'FORMATO') return 'Envie uma foto em JPG, PNG ou WebP.'
  if (m === 'GRANDE') return 'A foto é grande demais. Tente outra ou tire um print dela.'
  if (/unsupported image format|Input buffer/i.test(m)) return 'Não conseguimos abrir essa imagem. Tente outra.'
  return 'Não foi possível salvar a imagem agora. Tente de novo.'
}
