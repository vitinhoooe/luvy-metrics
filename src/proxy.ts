import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// áreas que exigem login (o resto — landing, login, vitrine pública — é aberto)
const PROTEGIDAS = ['/painel', '/produtos', '/vender', '/caixa', '/vendas', '/calculadora', '/planos', '/conta', '/comecar', '/vitrine', '/pedidos', '/repor', '/clientes', '/fornecedores', '/atendente', '/integracoes']
// páginas de entrada: quem já está logado vai para o painel
const SO_DESLOGADO = ['/entrar', '/criar-conta']

export async function proxy(request: NextRequest) {
  let resposta = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(lista) {
          lista.forEach(({ name, value }) => request.cookies.set(name, value))
          resposta = NextResponse.next({ request })
          lista.forEach(({ name, value, options }) => resposta.cookies.set(name, value, options))
        },
      },
    },
  )

  // renova a sessão em toda navegação
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const caminho = request.nextUrl.pathname
  const protegida = PROTEGIDAS.some((p) => caminho === p || caminho.startsWith(p + '/'))

  if (protegida && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/entrar'
    url.search = ''
    if (caminho !== '/painel') url.searchParams.set('voltar', caminho)
    return NextResponse.redirect(url)
  }
  if (user && SO_DESLOGADO.includes(caminho)) {
    const url = request.nextUrl.clone()
    url.pathname = '/painel'
    url.search = ''
    return NextResponse.redirect(url)
  }
  return resposta
}

export const config = {
  matcher: [
    // arquivos estáticos (imagens, vídeo e áudio da landing) e a API não passam aqui
    '/((?!_next/static|_next/image|api/|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|webm|mp3|wav|vtt|ico)$).*)',
  ],
}
