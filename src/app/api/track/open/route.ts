import { createClient } from '@supabase/supabase-js'

export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get('id')

  if (id) {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
      await supabase
        .from('prospectos')
        .update({ email_aberto: true, email_aberto_em: new Date().toISOString() })
        .eq('id', id)
    } catch {}
  }

  // Retorna pixel transparente 1x1
  const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64')
  return new Response(pixel, {
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  })
}
