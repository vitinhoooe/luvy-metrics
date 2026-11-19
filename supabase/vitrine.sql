-- =====================================================================
-- LuvyMetrics v2 — VITRINE ONLINE (Fase 3)
-- Rode DEPOIS do schema.sql. Pode rodar de novo sem quebrar.
-- =====================================================================

-- preço promocional (só na vitrine). Vazio = sem promoção.
alter table public.produtos add column if not exists preco_promocional numeric(12,2);
do $$ begin
  alter table public.produtos add constraint produtos_promo_chk check (preco_promocional is null or (preco_promocional > 0 and preco_promocional < preco));
exception when duplicate_object then null; end $$;

-- configurações do atendente IA
alter table public.lojas add column if not exists atendente_ativo boolean not null default false;
alter table public.lojas add column if not exists atendente_nome  text not null default 'Lia';
alter table public.lojas add column if not exists atendente_tom   text not null default 'acolhedor';
alter table public.lojas add column if not exists atendente_info  text;

-- configurações da vitrine, na própria loja
alter table public.lojas add column if not exists vitrine_ativa      boolean not null default false;
alter table public.lojas add column if not exists vitrine_cor        text not null default 'rosa';
alter table public.lojas add column if not exists vitrine_descricao  text;
alter table public.lojas add column if not exists pix_chave          text;
alter table public.lojas add column if not exists pix_nome           text;
alter table public.lojas add column if not exists entrega_retirada   boolean not null default true;
alter table public.lojas add column if not exists endereco_retirada  text;
alter table public.lojas add column if not exists entrega_local      boolean not null default false;
alter table public.lojas add column if not exists entrega_local_taxa numeric(10,2) not null default 0;
alter table public.lojas add column if not exists entrega_combinar   boolean not null default true;

do $$ begin
  alter table public.lojas add constraint lojas_vitrine_cor_chk check (vitrine_cor in ('rosa','vinho','violeta','noite'));
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------
-- PEDIDOS da vitrine (a cliente final cria; a lojista confirma)
-- ---------------------------------------------------------------------
create table if not exists public.pedidos (
  id               uuid primary key default gen_random_uuid(),
  token            uuid not null unique default gen_random_uuid(),  -- link público do pedido para a cliente
  numero           bigint generated always as identity,
  loja_id          uuid not null references public.lojas(id) on delete cascade,
  cliente_nome     text not null check (length(trim(cliente_nome)) between 2 and 80),
  cliente_whatsapp text not null check (cliente_whatsapp ~ '^[0-9]{10,13}$'),
  entrega          text not null check (entrega in ('retirada','local','combinar')),
  endereco         text,
  observacao       text,
  pagamento        text not null check (pagamento in ('pix','combinar')),
  subtotal         numeric(12,2) not null,
  frete            numeric(12,2) not null default 0,
  total            numeric(12,2) not null,
  status           text not null default 'novo' check (status in ('novo','pago','separado','enviado','entregue','cancelado')),
  venda_id         uuid references public.vendas(id) on delete set null,
  criado_em        timestamptz not null default now(),
  atualizado_em    timestamptz not null default now()
);
create index if not exists pedidos_loja_idx on public.pedidos (loja_id, criado_em desc);

-- (operação em escala) valor do Pix com centavos de identificação e prazos
alter table public.pedidos add column if not exists valor_pix numeric(12,2);
create unique index if not exists pedidos_pix_aberto_uq on public.pedidos (loja_id, valor_pix) where status = 'novo' and valor_pix is not null;

-- menor desconto (1 a 99 centavos) que deixa o valor único entre os pedidos ainda não pagos da loja
create or replace function public.proximo_valor_pix(p_loja uuid, p_total numeric) returns numeric
language plpgsql volatile security definer set search_path = public as $$
declare c int; v numeric;
begin
  for c in 1..99 loop
    v := p_total - c / 100.0;
    exit when v <= 0;
    if not exists (select 1 from public.pedidos where loja_id = p_loja and status = 'novo' and valor_pix = v) then
      return v;
    end if;
  end loop;
  return null; -- sem centavo livre: o pedido fica para confirmar à mão
end $$;
revoke execute on function public.proximo_valor_pix(uuid, numeric) from public, anon, authenticated;

create table if not exists public.pedido_itens (
  id          bigint generated always as identity primary key,
  pedido_id   uuid not null references public.pedidos(id) on delete cascade,
  produto_id  uuid references public.produtos(id) on delete set null,
  nome        text not null,
  quantidade  int not null check (quantidade > 0),
  preco_unit  numeric(12,2) not null
);

alter table public.pedidos      enable row level security;
alter table public.pedido_itens enable row level security;
drop policy if exists pedidos_ler on public.pedidos;
drop policy if exists pedidos_editar on public.pedidos;
drop policy if exists pedido_itens_ler on public.pedido_itens;
create policy pedidos_ler    on public.pedidos for select using (loja_id = public.minha_loja());
create policy pedidos_editar on public.pedidos for update using (public.pode_editar(loja_id)) with check (public.pode_editar(loja_id));
create policy pedido_itens_ler on public.pedido_itens for select
  using (exists (select 1 from public.pedidos p where p.id = pedido_id and p.loja_id = public.minha_loja()));
-- inserir pedido: só pela função criar_pedido (abaixo)

-- a loja pode ter vitrine? (plano com vitrine e em dia)
create or replace function public.vitrine_liberada(p_loja uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.assinaturas a
    where a.loja_id = p_loja and a.plano in ('pro','business')
      and ((a.status = 'teste' and a.teste_ate > now()) or a.status = 'ativo'
           or (a.status = 'atrasado' and coalesce(a.pago_ate, now()) + interval '3 days' > now()))
  )
$$;

-- ---------------------------------------------------------------------
-- LEITURA PÚBLICA: dados da vitrine (sem custo, sem dados internos)
-- ---------------------------------------------------------------------
create or replace function public.vitrine_publica(p_slug text) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare l record;
begin
  select * into l from public.lojas where slug = lower(p_slug);
  if not found then return null; end if;
  if not l.vitrine_ativa or not public.vitrine_liberada(l.id) then
    return jsonb_build_object('fechada', true, 'nome', l.nome);
  end if;
  return jsonb_build_object(
    'fechada', false,
    'nome', l.nome, 'slug', l.slug, 'cidade', l.cidade, 'uf', l.uf,
    'cor', l.vitrine_cor, 'descricao', l.vitrine_descricao, 'whatsapp', l.whatsapp,
    'atendente', jsonb_build_object('ativo', l.atendente_ativo, 'nome', l.atendente_nome, 'tom', l.atendente_tom, 'info', l.atendente_info),
    'pix', l.pix_chave is not null and length(l.pix_chave) > 0,
    'entrega', jsonb_build_object(
      'retirada', l.entrega_retirada, 'endereco_retirada', l.endereco_retirada,
      'local', l.entrega_local, 'local_taxa', l.entrega_local_taxa, 'combinar', l.entrega_combinar),
    'produtos', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', p.id, 'nome', p.nome, 'categoria', p.categoria,
        'preco', coalesce(p.preco_promocional, p.preco), 'preco_de', case when p.preco_promocional is not null then p.preco end,
        'disponivel', least(p.quantidade, 20), 'foto', p.foto_url) order by p.categoria nulls last, p.nome)
      from public.produtos p
      where p.loja_id = l.id and p.ativo and p.na_vitrine and p.preco > 0
    ), '[]'::jsonb)
  );
end $$;

-- ---------------------------------------------------------------------
-- CRIAR PEDIDO (chamado pela vitrine pública)
-- O preço vem SEMPRE do banco. Não baixa estoque aqui: só confere.
-- O estoque baixa quando a lojista confirma o pagamento.
-- ---------------------------------------------------------------------
create or replace function public.criar_pedido(
  p_slug text, p_itens jsonb, p_nome text, p_whatsapp text,
  p_entrega text, p_endereco text, p_pagamento text, p_obs text
) returns jsonb
language plpgsql volatile security definer set search_path = public as $$
declare
  l record; it jsonb; p record; q int;
  v_ped uuid; v_tok uuid; v_num bigint;
  v_sub numeric := 0; v_frete numeric := 0;
  v_zap text := regexp_replace(coalesce(p_whatsapp, ''), '\D', '', 'g');
begin
  select * into l from public.lojas where slug = lower(p_slug);
  if not found or not l.vitrine_ativa or not public.vitrine_liberada(l.id) then raise exception 'LOJA_FECHADA'; end if;
  if jsonb_typeof(p_itens) <> 'array' or jsonb_array_length(p_itens) not between 1 and 30 then raise exception 'CARRINHO_INVALIDO'; end if;
  if p_entrega not in ('retirada','local','combinar') then raise exception 'ENTREGA_INVALIDA'; end if;
  if (p_entrega = 'retirada' and not l.entrega_retirada) or (p_entrega = 'local' and not l.entrega_local)
     or (p_entrega = 'combinar' and not l.entrega_combinar) then raise exception 'ENTREGA_INVALIDA'; end if;
  if p_entrega = 'local' and length(trim(coalesce(p_endereco, ''))) < 8 then raise exception 'ENDERECO_OBRIGATORIO'; end if;
  if p_pagamento not in ('pix','combinar') then raise exception 'PAGAMENTO_INVALIDO'; end if;
  if p_pagamento = 'pix' and coalesce(l.pix_chave, '') = '' then raise exception 'PAGAMENTO_INVALIDO'; end if;

  -- freio contra abuso: no máximo 5 pedidos do mesmo número em 10 minutos
  if (select count(*) from public.pedidos where loja_id = l.id and cliente_whatsapp = v_zap and criado_em > now() - interval '10 minutes') >= 5 then
    raise exception 'MUITOS_PEDIDOS';
  end if;

  if p_entrega = 'local' then v_frete := l.entrega_local_taxa; end if;

  insert into public.pedidos (loja_id, cliente_nome, cliente_whatsapp, entrega, endereco, observacao, pagamento, subtotal, frete, total)
  values (l.id, trim(p_nome), v_zap, p_entrega, nullif(trim(coalesce(p_endereco, '')), ''), nullif(left(trim(coalesce(p_obs, '')), 300), ''), p_pagamento, 0, v_frete, 0)
  returning id, token, numero into v_ped, v_tok, v_num;

  for it in select * from jsonb_array_elements(p_itens) loop
    q := (it->>'quantidade')::int;
    if q is null or q < 1 or q > 20 then raise exception 'QUANTIDADE_INVALIDA'; end if;
    select * into p from public.produtos
      where id = (it->>'produto_id')::uuid and loja_id = l.id and ativo and na_vitrine and preco > 0;
    if not found then raise exception 'PRODUTO_INDISPONIVEL'; end if;
    if p.quantidade < q then raise exception 'ESTOQUE_INSUFICIENTE:%', p.nome; end if;
    insert into public.pedido_itens (pedido_id, produto_id, nome, quantidade, preco_unit) values (v_ped, p.id, p.nome, q, coalesce(p.preco_promocional, p.preco));
    v_sub := v_sub + q * coalesce(p.preco_promocional, p.preco);
  end loop;

  update public.pedidos set subtotal = v_sub, total = v_sub + v_frete,
    valor_pix = case when p_pagamento = 'pix' then public.proximo_valor_pix(l.id, v_sub + v_frete) end
  where id = v_ped;
  return jsonb_build_object('token', v_tok, 'numero', v_num, 'total', v_sub + v_frete);
end $$;

-- pedido visto pela cliente (pelo link com token)
create or replace function public.pedido_publico(p_token uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'numero', pe.numero, 'status', pe.status, 'total', pe.total, 'subtotal', pe.subtotal, 'frete', pe.frete,
    'entrega', pe.entrega, 'pagamento', pe.pagamento, 'cliente', pe.cliente_nome, 'criado_em', pe.criado_em,
    'loja', jsonb_build_object('nome', l.nome, 'slug', l.slug, 'cidade', l.cidade, 'cor', l.vitrine_cor, 'whatsapp', l.whatsapp,
                               'pix_chave', l.pix_chave, 'pix_nome', coalesce(l.pix_nome, l.nome), 'endereco_retirada', l.endereco_retirada),
    'itens', (select jsonb_agg(jsonb_build_object('nome', i.nome, 'quantidade', i.quantidade, 'preco', i.preco_unit)) from public.pedido_itens i where i.pedido_id = pe.id)
  )
  from public.pedidos pe join public.lojas l on l.id = pe.loja_id
  where pe.token = p_token
$$;

-- ---------------------------------------------------------------------
-- LOJISTA: confirmar pagamento (baixa estoque e vira venda "vitrine")
-- ---------------------------------------------------------------------
create or replace function public.confirmar_pedido(p_pedido uuid) returns uuid
language plpgsql security invoker set search_path = public as $$
declare pe record; v_venda uuid;
begin
  select * into pe from public.pedidos where id = p_pedido and loja_id = public.minha_loja() for update;
  if not found then raise exception 'PEDIDO_NAO_ENCONTRADO'; end if;
  if pe.status <> 'novo' then raise exception 'PEDIDO_JA_CONFIRMADO'; end if;

  v_venda := public.registrar_venda(
    (select jsonb_agg(jsonb_build_object('produto_id', produto_id, 'quantidade', quantidade, 'preco_unit', preco_unit))
       from public.pedido_itens where pedido_id = pe.id and produto_id is not null),
    case when pe.pagamento = 'pix' then 'pix' else 'outro' end, 0, 'vitrine');

  update public.pedidos set status = 'pago', venda_id = v_venda, atualizado_em = now() where id = pe.id;
  return v_venda;
end $$;

create or replace function public.cancelar_pedido(p_pedido uuid) returns void
language plpgsql security invoker set search_path = public as $$
declare pe record;
begin
  select * into pe from public.pedidos where id = p_pedido and loja_id = public.minha_loja() for update;
  if not found then raise exception 'PEDIDO_NAO_ENCONTRADO'; end if;
  if pe.status = 'cancelado' then return; end if;
  if pe.venda_id is not null then perform public.cancelar_venda(pe.venda_id); end if;  -- devolve o estoque
  update public.pedidos set status = 'cancelado', atualizado_em = now() where id = pe.id;
end $$;

grant execute on function public.vitrine_publica(text), public.pedido_publico(uuid),
  public.criar_pedido(text, jsonb, text, text, text, text, text, text) to anon, authenticated;
-- funções novas nascem executáveis por PUBLIC: tira de todos e libera só para quem deve
revoke execute on function public.confirmar_pedido(uuid), public.cancelar_pedido(uuid), public.vitrine_liberada(uuid) from public, anon;
grant execute on function public.confirmar_pedido(uuid), public.cancelar_pedido(uuid) to authenticated;

-- =====================================================================
-- ACOMPANHAMENTO DO PEDIDO: histórico de status e rastreio
-- =====================================================================
alter table public.pedidos add column if not exists codigo_rastreio text;

create table if not exists public.pedido_eventos (
  id         bigint generated always as identity primary key,
  pedido_id  uuid not null references public.pedidos(id) on delete cascade,
  status     text not null,
  criado_em  timestamptz not null default now()
);
create index if not exists pedido_eventos_idx on public.pedido_eventos (pedido_id, criado_em);
alter table public.pedido_eventos enable row level security;
drop policy if exists pedido_eventos_ler on public.pedido_eventos;
create policy pedido_eventos_ler on public.pedido_eventos for select
  using (exists (select 1 from public.pedidos p where p.id = pedido_id and p.loja_id = public.minha_loja()));

-- registra cada mudança de status automaticamente (inclusive a criação)
create or replace function public.registrar_evento_pedido() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    insert into public.pedido_eventos (pedido_id, status) values (new.id, new.status);
  end if;
  return new;
end $$;
drop trigger if exists trg_pedido_evento on public.pedidos;
create trigger trg_pedido_evento after insert or update of status on public.pedidos
  for each row execute function public.registrar_evento_pedido();
revoke execute on function public.registrar_evento_pedido() from public, anon, authenticated;

-- pedido visto pela cliente: agora com histórico e rastreio
create or replace function public.pedido_publico(p_token uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'numero', pe.numero, 'status', pe.status, 'total', pe.total, 'subtotal', pe.subtotal, 'frete', pe.frete,
    'entrega', pe.entrega, 'pagamento', pe.pagamento, 'cliente', pe.cliente_nome, 'criado_em', pe.criado_em,
    'rastreio', pe.codigo_rastreio, 'valor_pix', pe.valor_pix,
    'loja', jsonb_build_object('nome', l.nome, 'slug', l.slug, 'cidade', l.cidade, 'cor', l.vitrine_cor, 'whatsapp', l.whatsapp,
                               'pix_chave', l.pix_chave, 'pix_nome', coalesce(l.pix_nome, l.nome), 'endereco_retirada', l.endereco_retirada),
    'itens', (select jsonb_agg(jsonb_build_object('nome', i.nome, 'quantidade', i.quantidade, 'preco', i.preco_unit)) from public.pedido_itens i where i.pedido_id = pe.id),
    'eventos', (select jsonb_agg(jsonb_build_object('status', e.status, 'em', e.criado_em) order by e.criado_em) from public.pedido_eventos e where e.pedido_id = pe.id)
  )
  from public.pedidos pe join public.lojas l on l.id = pe.loja_id
  where pe.token = p_token
$$;
grant execute on function public.pedido_publico(uuid) to anon, authenticated;


-- =====================================================================
-- OPERAÇÃO EM ESCALA: prazos, cancelamento automático e conciliação
-- =====================================================================
alter table public.lojas add column if not exists prazo_pagamento_h int not null default 2;
alter table public.lojas add column if not exists prazo_separar_h   int not null default 24;
alter table public.lojas add column if not exists prazo_entrega_h   int not null default 72;
alter table public.lojas add column if not exists cancelar_apos_h   int not null default 24;

-- cancela os pedidos não pagos depois do prazo (chamado ao abrir a tela de pedidos)
create or replace function public.expirar_pedidos() returns int
language plpgsql security invoker set search_path = public as $$
declare v_loja uuid := public.minha_loja(); n int;
begin
  if v_loja is null or not public.pode_editar(v_loja) then return 0; end if;
  update public.pedidos pe set status = 'cancelado', atualizado_em = now()
   from public.lojas l
   where l.id = pe.loja_id and pe.loja_id = v_loja and pe.status = 'novo'
     and l.cancelar_apos_h > 0 and pe.criado_em < now() - make_interval(hours => l.cancelar_apos_h);
  get diagnostics n = row_count;
  return n;
end $$;

-- lançamentos do extrato já usados (para não confirmar duas vezes)
create table if not exists public.conciliacoes (
  id         bigint generated always as identity primary key,
  loja_id    uuid not null references public.lojas(id) on delete cascade,
  chave      text not null,            -- id do lançamento no banco (FITID) ou data+valor+descrição
  valor      numeric(12,2) not null,
  data       date,
  pedido_id  uuid references public.pedidos(id) on delete set null,
  criado_em  timestamptz not null default now(),
  unique (loja_id, chave)
);
alter table public.conciliacoes enable row level security;
drop policy if exists conciliacoes_ler on public.conciliacoes;
create policy conciliacoes_ler on public.conciliacoes for select using (loja_id = public.minha_loja());
drop policy if exists conciliacoes_criar on public.conciliacoes;
create policy conciliacoes_criar on public.conciliacoes for insert with check (public.pode_editar(loja_id));

-- recebe os créditos do extrato e confirma os pedidos cujo valor do Pix bate exatamente
-- lancamentos = [{"chave":"...","valor":124.67,"data":"2026-11-16","descricao":"PIX RECEBIDO ..."}]
create or replace function public.conciliar_pix(p_lancamentos jsonb) returns jsonb
language plpgsql security invoker set search_path = public as $$
declare
  v_loja uuid := public.minha_loja();
  l jsonb; pe record; v numeric; k text;
  confirmados jsonb := '[]'; sem_pedido jsonb := '[]'; repetidos int := 0; falhas jsonb := '[]';
begin
  if v_loja is null or not public.pode_editar(v_loja) then raise exception 'SEM_ACESSO'; end if;
  if jsonb_array_length(coalesce(p_lancamentos, '[]')) > 3000 then raise exception 'EXTRATO_GRANDE'; end if;

  for l in select * from jsonb_array_elements(p_lancamentos) loop
    v := round((l->>'valor')::numeric, 2);
    k := left(coalesce(l->>'chave', ''), 120);
    continue when v is null or v <= 0 or k = '';
    if exists (select 1 from public.conciliacoes where loja_id = v_loja and chave = k) then
      repetidos := repetidos + 1; continue;
    end if;

    select * into pe from public.pedidos
     where loja_id = v_loja and status = 'novo' and pagamento = 'pix' and valor_pix = v
     order by criado_em limit 1;

    if found then
      begin
        perform public.confirmar_pedido(pe.id);
        insert into public.conciliacoes (loja_id, chave, valor, data, pedido_id) values (v_loja, k, v, (l->>'data')::date, pe.id);
        confirmados := confirmados || jsonb_build_object('numero', pe.numero, 'cliente', pe.cliente_nome, 'valor', v);
      exception when others then
        falhas := falhas || jsonb_build_object('numero', pe.numero, 'motivo', sqlerrm);
      end;
    else
      sem_pedido := sem_pedido || jsonb_build_object('valor', v, 'data', l->>'data', 'descricao', left(coalesce(l->>'descricao', ''), 80));
    end if;
  end loop;

  return jsonb_build_object('confirmados', confirmados, 'sem_pedido', sem_pedido, 'repetidos', repetidos, 'falhas', falhas,
    'pendentes', (select count(*) from public.pedidos where loja_id = v_loja and status = 'novo'));
end $$;

revoke execute on function public.expirar_pedidos(), public.conciliar_pix(jsonb) from public, anon;
grant execute on function public.expirar_pedidos(), public.conciliar_pix(jsonb) to authenticated;


-- =====================================================================
-- INTELIGÊNCIA DO ESTOQUE: o que repor e o que está parado
-- Usa só as vendas da própria loja (balcão + vitrine), nada inventado.
-- =====================================================================
create or replace function public.giro_estoque(p_dias int default 30, p_cobertura int default 30) returns jsonb
language sql stable security invoker set search_path = public as $$
  with vendido as (
    select vi.produto_id,
           sum(vi.quantidade) filter (where v.criado_em >= now() - make_interval(days => p_dias)) as qtd_periodo,
           max(v.criado_em) as ultima_venda
      from public.venda_itens vi join public.vendas v on v.id = vi.venda_id
     where v.loja_id = public.minha_loja() and v.status = 'concluida'
     group by vi.produto_id
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', p.id, 'nome', p.nome, 'categoria', p.categoria, 'fornecedor', p.fornecedor,
    'quantidade', p.quantidade, 'custo', p.custo, 'preco', p.preco, 'preco_promocional', p.preco_promocional,
    'vendidos', coalesce(vd.qtd_periodo, 0),
    'por_dia', round(coalesce(vd.qtd_periodo, 0)::numeric / p_dias, 3),
    'dias_restantes', case when coalesce(vd.qtd_periodo, 0) > 0 then floor(p.quantidade / (vd.qtd_periodo::numeric / p_dias)) end,
    'sugestao', greatest(ceil(coalesce(vd.qtd_periodo, 0)::numeric / p_dias * p_cobertura) - p.quantidade, 0),
    'ultima_venda', vd.ultima_venda,
    'dias_sem_vender', floor(extract(epoch from now() - coalesce(vd.ultima_venda, p.criado_em)) / 86400),
    'valor_parado', p.custo * p.quantidade
  ) order by p.nome), '[]'::jsonb)
  from public.produtos p left join vendido vd on vd.produto_id = p.id
  where p.loja_id = public.minha_loja() and p.ativo
$$;
revoke execute on function public.giro_estoque(int, int) from public, anon;
grant execute on function public.giro_estoque(int, int) to authenticated;


-- =====================================================================
-- ATENDENTE IA: conversas da vitrine, com limite por plano
-- =====================================================================
create table if not exists public.conversas (
  id            uuid primary key default gen_random_uuid(),   -- fica só no navegador da cliente
  loja_id       uuid not null references public.lojas(id) on delete cascade,
  mensagens     int not null default 0,
  chamou_loja   boolean not null default false,
  sugeriu_sacola boolean not null default false,
  criada_em     timestamptz not null default now(),
  atualizada_em timestamptz not null default now()
);
create index if not exists conversas_loja_idx on public.conversas (loja_id, atualizada_em desc);

create table if not exists public.conversa_mensagens (
  id          bigint generated always as identity primary key,
  conversa_id uuid not null references public.conversas(id) on delete cascade,
  papel       text not null check (papel in ('cliente','atendente')),
  texto       text not null,
  criado_em   timestamptz not null default now()
);
create index if not exists conversa_mensagens_idx on public.conversa_mensagens (conversa_id, id);

alter table public.conversas enable row level security;
alter table public.conversa_mensagens enable row level security;
drop policy if exists conversas_ler on public.conversas;
drop policy if exists conversa_mensagens_ler on public.conversa_mensagens;
create policy conversas_ler on public.conversas for select using (loja_id = public.minha_loja());
create policy conversa_mensagens_ler on public.conversa_mensagens for select
  using (exists (select 1 from public.conversas c where c.id = conversa_id and c.loja_id = public.minha_loja()));

-- abre (ou continua) uma conversa. Confere plano, atendente ligado e o limite do mês.
create or replace function public.abrir_conversa(p_slug text, p_conversa uuid) returns jsonb
language plpgsql volatile security definer set search_path = public as $$
declare l record; a record; v_id uuid; v_limite int; v_usadas int; v_msgs int;
begin
  select * into l from public.lojas where slug = lower(p_slug);
  if not found or not l.vitrine_ativa or not l.atendente_ativo or not public.vitrine_liberada(l.id) then
    raise exception 'ATENDENTE_DESLIGADO';
  end if;

  if p_conversa is not null then
    select id, mensagens into v_id, v_msgs from public.conversas where id = p_conversa and loja_id = l.id;
    if found then
      if v_msgs >= 40 then raise exception 'CONVERSA_LONGA'; end if;
      return jsonb_build_object('id', v_id, 'nova', false,
        'historico', coalesce((select jsonb_agg(jsonb_build_object('papel', papel, 'texto', texto) order by id)
                               from (select * from public.conversa_mensagens where conversa_id = v_id order by id desc limit 20) m), '[]'::jsonb));
    end if;
  end if;

  select * into a from public.assinaturas where loja_id = l.id;
  v_limite := case a.plano when 'business' then 4000 when 'pro' then 1500 else 0 end;
  select count(*) into v_usadas from public.conversas where loja_id = l.id and criada_em >= date_trunc('month', now());
  if v_usadas >= v_limite then raise exception 'LIMITE_MES'; end if;

  insert into public.conversas (loja_id) values (l.id) returning id into v_id;
  return jsonb_build_object('id', v_id, 'nova', true, 'historico', '[]'::jsonb);
end $$;

-- guarda a pergunta e a resposta
create or replace function public.salvar_mensagens(p_conversa uuid, p_cliente text, p_atendente text, p_chamou boolean, p_sacola boolean) returns void
language plpgsql volatile security definer set search_path = public as $$
begin
  perform 1 from public.conversas where id = p_conversa and mensagens < 40;
  if not found then raise exception 'CONVERSA_NAO_ENCONTRADA'; end if;
  insert into public.conversa_mensagens (conversa_id, papel, texto) values
    (p_conversa, 'cliente', left(coalesce(p_cliente, ''), 600)),
    (p_conversa, 'atendente', left(coalesce(p_atendente, ''), 4000));
  update public.conversas set mensagens = mensagens + 2, atualizada_em = now(),
    chamou_loja = chamou_loja or coalesce(p_chamou, false), sugeriu_sacola = sugeriu_sacola or coalesce(p_sacola, false)
   where id = p_conversa;
end $$;

revoke execute on function public.abrir_conversa(text, uuid), public.salvar_mensagens(uuid, text, text, boolean, boolean) from public;
grant execute on function public.abrir_conversa(text, uuid), public.salvar_mensagens(uuid, text, text, boolean, boolean) to anon, authenticated;
