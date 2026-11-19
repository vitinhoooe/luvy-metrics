import 'server-only'
import { headers } from 'next/headers'

/** Endereço do site para links de e-mail (confirmação, recuperar senha). */
export async function origem() {
  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host')
  if (host) {
    const proto = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https')
    return `${proto}://${host}`
  }
  return process.env.NEXT_PUBLIC_SITE_URL ?? 'https://luvymetrics.com.br'
}
