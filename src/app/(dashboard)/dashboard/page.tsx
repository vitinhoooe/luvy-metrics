import { createClient } from '@/lib/supabase/server'
import DashboardConteudo from './DashboardConteudo'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const hoje = new Date().toISOString().split('T')[0]
  const hora = new Date().getHours()
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'
  const dataFormatada = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  // Busca produtos em alta. Tenta primeiro os de hoje; se vazio usa os mais recentes
  let resTendencias = await supabase
    .from('produtos_tendencia')
    .select('*')
    .gt('crescimento_pct', 20)
    .gte('updated_at', hoje)
    .order('crescimento_pct', { ascending: false })
    .limit(50)

  if (!resTendencias.data?.length) {
    resTendencias = await supabase
      .from('produtos_tendencia')
      .select('*')
      .gt('crescimento_pct', 0)
      .order('crescimento_pct', { ascending: false })
      .limit(50)
  }

  const [resPerfil, resCalculos, resAlertas] = await Promise.all([
    supabase.from('perfis').select('*').eq('user_id', user.id).single(),
    supabase.from('calculos').select('lucro_unidade').eq('user_id', user.id),
    supabase
      .from('alertas_log')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', hoje),
  ])

  const lucroMedio = resCalculos.data?.length
    ? resCalculos.data.reduce((acc, c) => acc + (c.lucro_unidade ?? 0), 0) / resCalculos.data.length
    : 0

  const diasTrial = resPerfil.data?.trial_expira_em
    ? Math.max(0, Math.ceil((new Date(resPerfil.data.trial_expira_em).getTime() - Date.now()) / 86_400_000))
    : 7

  return (
    <DashboardConteudo
      saudacao={saudacao}
      nomeUsuario={resPerfil.data?.nome ?? user.email?.split('@')[0] ?? 'usuário'}
      dataFormatada={dataFormatada}
      diasTrial={diasTrial}
      produtosEmAlta={resTendencias.data?.length ?? 0}
      estoqueEvitado={resPerfil.data?.estoque_evitado_valor ?? 0}
      lucroMedio={lucroMedio}
      alertasHoje={resAlertas.count ?? 0}
      tendencias={resTendencias.data ?? []}
      userId={user.id}
    />
  )
}
