import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim()
  if (!q || q.length < 2) return NextResponse.json([])

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json([], { status: 401 })

  const { data } = await supabase
    .from('produtos_tendencia')
    .select('id, produto_nome, preco_medio')
    .ilike('produto_nome', `%${q}%`)
    .order('crescimento_pct', { ascending: false })
    .limit(6)

  return NextResponse.json(data ?? [])
}
