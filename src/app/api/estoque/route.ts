import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

async function getSupabase() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (list) => list.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
      },
    }
  )
}

// GET — lista estoque ou movimentações do usuário
export async function GET(req: NextRequest) {
  try {
    const supabase = await getSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

    const { searchParams } = new URL(req.url)

    // Se pedir movimentações
    if (searchParams.get('movimentacoes') === 'true') {
      const { data, error } = await supabase
        .from('movimentacoes_estoque')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)
      if (error) return NextResponse.json([] )
      return NextResponse.json(data || [])
    }

    const { data, error } = await supabase
      .from('estoque_usuario')
      .select('*')
      .eq('user_id', user.id)
      .eq('ativo', true)
      .order('produto_nome')

    if (error) return NextResponse.json({ erro: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ erro: 'Erro interno' }, { status: 500 })
  }
}

// POST — adiciona produto ao estoque
export async function POST(req: NextRequest) {
  try {
    const supabase = await getSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

    const body = await req.json()
    const { data, error } = await supabase
      .from('estoque_usuario')
      .insert({ ...body, user_id: user.id })
      .select()
      .single()

    if (error) return NextResponse.json({ erro: error.message }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
  } catch (e) {
    return NextResponse.json({ erro: 'Erro interno' }, { status: 500 })
  }
}

// PUT — atualiza quantidade (entrada/saída) ou dados do produto
export async function PUT(req: NextRequest) {
  try {
    const supabase = await getSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

    const body = await req.json()
    const { id, tipo, quantidade, observacao, ...campos } = body

    if (tipo && quantidade) {
      // Movimentação de estoque
      const { data: produto } = await supabase
        .from('estoque_usuario')
        .select('quantidade')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

      if (!produto) return NextResponse.json({ erro: 'Produto não encontrado' }, { status: 404 })

      const novaQtd = tipo === 'entrada'
        ? produto.quantidade + quantidade
        : Math.max(0, produto.quantidade - quantidade)

      await supabase.from('movimentacoes_estoque').insert({
        user_id: user.id, produto_id: id, tipo, quantidade, observacao,
      })

      const { data, error } = await supabase
        .from('estoque_usuario')
        .update({ quantidade: novaQtd, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) return NextResponse.json({ erro: error.message }, { status: 500 })
      return NextResponse.json(data)
    }

    // Atualização de campos do produto
    const { data, error } = await supabase
      .from('estoque_usuario')
      .update({ ...campos, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) return NextResponse.json({ erro: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ erro: 'Erro interno' }, { status: 500 })
  }
}

// DELETE — remove produto (soft delete)
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await getSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

    const { id } = await req.json()
    const { error } = await supabase
      .from('estoque_usuario')
      .update({ ativo: false })
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) return NextResponse.json({ erro: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ erro: 'Erro interno' }, { status: 500 })
  }
}
