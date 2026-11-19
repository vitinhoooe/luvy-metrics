// Pix "copia e cola" estático (padrão BR Code do Banco Central), com valor.
// O dinheiro cai direto na chave da lojista; o Luvy não intermedia nada.

const campo = (id: string, valor: string) => `${id}${String(valor.length).padStart(2, '0')}${valor}`

const limpar = (s: string, max: number) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim().toUpperCase().slice(0, max) || 'LOJA'

function crc16(payload: string) {
  let crc = 0xffff
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8
    for (let b = 0; b < 8; b++) crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1
    crc &= 0xffff
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

export type TipoChave = 'cpf' | 'cnpj' | 'celular' | 'email' | 'aleatoria'

/** Normaliza a chave conforme o tipo escolhido pela lojista. Devolve null se estiver inválida. */
export function normalizarChave(chave: string, tipo: TipoChave): string | null {
  const c = chave.trim()
  const d = c.replace(/\D/g, '')
  if (tipo === 'email') return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(c) ? c.toLowerCase() : null
  if (tipo === 'aleatoria') return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(c) ? c.toLowerCase() : null
  if (tipo === 'cpf') return d.length === 11 ? d : null
  if (tipo === 'cnpj') return d.length === 14 ? d : null
  // celular: +55 + DDD + número
  const n = d.startsWith('55') && d.length >= 12 ? d.slice(2) : d
  return n.length === 10 || n.length === 11 ? `+55${n}` : null
}

export function pixCopiaECola({ chave, nome, cidade, valor, referencia }: { chave: string; nome: string; cidade: string; valor: number; referencia?: string }) {
  const conta = campo('00', 'br.gov.bcb.pix') + campo('01', chave.trim())
  const txid = (referencia ?? '***').replace(/[^A-Za-z0-9]/g, '').slice(0, 25) || '***'
  const semCrc =
    campo('00', '01') +
    campo('26', conta) +
    campo('52', '0000') +
    campo('53', '986') +
    campo('54', valor.toFixed(2)) +
    campo('58', 'BR') +
    campo('59', limpar(nome, 25)) +
    campo('60', limpar(cidade, 15)) +
    campo('62', campo('05', txid)) +
    '6304'
  return semCrc + crc16(semCrc)
}
