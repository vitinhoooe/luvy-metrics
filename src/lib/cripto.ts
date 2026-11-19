import 'server-only'
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'

// Criptografa segredos das lojas (ex.: token do Mercado Pago) antes de gravar no banco.
// Chave: LUVY_CHAVE_CRIPTO = 32 bytes em base64 (gere com: openssl rand -base64 32).

function chave() {
  const k = Buffer.from(process.env.LUVY_CHAVE_CRIPTO ?? '', 'base64')
  if (k.length !== 32) throw new Error('LUVY_CHAVE_CRIPTO ausente ou inválida (precisa de 32 bytes em base64).')
  return k
}

/** AES-256-GCM. Formato: v1.iv.tag.dados (base64url). */
export function cifrar(texto: string) {
  const iv = randomBytes(12)
  const c = createCipheriv('aes-256-gcm', chave(), iv)
  const dados = Buffer.concat([c.update(texto, 'utf8'), c.final()])
  return ['v1', iv.toString('base64url'), c.getAuthTag().toString('base64url'), dados.toString('base64url')].join('.')
}

export function decifrar(guardado: string) {
  const [v, iv, tag, dados] = guardado.split('.')
  if (v !== 'v1' || !iv || !tag || !dados) throw new Error('Segredo em formato desconhecido.')
  const d = createDecipheriv('aes-256-gcm', chave(), Buffer.from(iv, 'base64url'))
  d.setAuthTag(Buffer.from(tag, 'base64url'))
  return Buffer.concat([d.update(Buffer.from(dados, 'base64url')), d.final()]).toString('utf8')
}

export const criptoConfigurada = () => {
  try { chave(); return true } catch { return false }
}
