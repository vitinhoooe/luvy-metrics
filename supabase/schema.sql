-- =====================================================================
-- LuvyMetrics v2 — banco do zero (Fase 1)
-- Como usar: Supabase → SQL Editor → New query → cole tudo → Run.
-- Pode rodar de novo sem quebrar (usa "if not exists" / "or replace").
-- =====================================================================

create extension if not exists pg_trgm;

-- ---------------------------------------------------------------------
-- LOJAS: 1 por usuária (dona)
-- ---------------------------------------------------------------------
create table if not exists public.lojas (
  id          uuid primary key default gen_random_uuid(),
  dono        uuid not null unique references auth.users(id) on delete cascade,
  nome        text not null check (length(trim(nome)) between 2 and 80),
  slug        text not null unique check (slug ~ '^[a-z0-9]([a-z0-9-]{1,38}[a-z0-9])$'),
  cidade      text not null,
  uf          char(2) not null,
  categorias  text[] not null default '{}',
  whatsapp    text,
  criado_em   timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- ASSINATURAS: só o servidor (service role / webhook) altera
-- ---------------------------------------------------------------------
create table if not exists public.assinaturas (
  loja_id           uuid primary key references public.lojas(id) on delete cascade,
  plano             text not null default 'pro' check (plano in ('starter','pro','business')),
  status            text not null default 'teste' check (status in ('teste','ativo','atrasado','cancelado')),
  teste_ate         timestamptz not null default now() + interval '7 days',
  pago_ate          timestamptz,
  asaas_cliente     text,
  asaas_assinatura  text,
  atualizado_em     timestamptz not null default now()
);

-- toda loja nova já nasce com 7 dias de teste do Pro
create or replace function public.criar_assinatura_teste() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.assinaturas (loja_id) values (new.id) on conflict do nothing;
  return new;
end $$;

drop trigger if exists trg_loja_assinatura on public.lojas;
create trigger trg_loja_assinatura after insert on public.lojas
  for each row execute function public.criar_assinatura_teste();

-- ---------------------------------------------------------------------
-- PRODUTOS + ESTOQUE
-- ---------------------------------------------------------------------
create table if not exists public.importacoes (
  id            uuid primary key default gen_random_uuid(),
  loja_id       uuid not null references public.lojas(id) on delete cascade,
  arquivo       text,
  criados       int not null default 0,
  atualizados   int not null default 0,
  ignorados     int not null default 0,
  mapeamento    jsonb,
  desfeita      boolean not null default false,
  criado_em     timestamptz not null default now()
);

create table if not exists public.produtos (
  id              uuid primary key default gen_random_uuid(),
  loja_id         uuid not null references public.lojas(id) on delete cascade,
  nome            text not null check (length(trim(nome)) between 1 and 160),
  categoria       text,
  codigo_barras   text,
  sku             text,
  fornecedor      text,
  custo           numeric(12,2) not null default 0 check (custo >= 0),
  preco           numeric(12,2) not null default 0 check (preco >= 0),
  quantidade      int not null default 0 check (quantidade >= 0),
  estoque_minimo  int not null default 2 check (estoque_minimo >= 0),
  foto_url        text,
  na_vitrine      boolean not null default true,
  ativo           boolean not null default true,
  importacao_id   uuid references public.importacoes(id) on delete set null,
  criado_em       timestamptz not null default now(),
  atualizado_em   timestamptz not null default now()
);
create index if not exists produtos_loja_idx on public.produtos (loja_id) where ativo;
create index if not exists produtos_nome_trgm on public.produtos using gin (nome gin_trgm_ops);
create unique index if not exists produtos_codigo_uq on public.produtos (loja_id, codigo_barras)
  where codigo_barras is not null and ativo;

create table if not exists public.movimentos (
  id             bigint generated always as identity primary key,
  loja_id        uuid not null references public.lojas(id) on delete cascade,
  produto_id     uuid not null references public.produtos(id) on delete cascade,
  tipo           text not null check (tipo in ('entrada','saida','ajuste','venda','cancelamento','importacao')),
  quantidade     int not null,               -- positivo entra, negativo sai
  motivo         text,
  venda_id       uuid,
  importacao_id  uuid references public.importacoes(id) on delete set null,
  criado_por     uuid default auth.uid(),
  criado_em      timestamptz not null default now()
);
create index if not exists movimentos_produto_idx on public.movimentos (produto_id, criado_em desc);

-- ---------------------------------------------------------------------
-- CAIXA + VENDAS (balcão agora; vitrine e IA usam as mesmas tabelas depois)
-- ---------------------------------------------------------------------
create table if not exists public.caixas (
  id             uuid primary key default gen_random_uuid(),
  loja_id        uuid not null references public.lojas(id) on delete cascade,
  status         text not null default 'aberto' check (status in ('aberto','fechado')),
  troco_inicial  numeric(12,2) not null default 0,
  valor_contado  numeric(12,2),
  observacao     text,
  aberto_em      timestamptz not null default now(),
  fechado_em     timestamptz
);
create unique index if not exists caixa_aberto_uq on public.caixas (loja_id) where status = 'aberto';

create table if not exists public.vendas (
  id               uuid primary key default gen_random_uuid(),
  numero           bigint generated always as identity,
  loja_id          uuid not null references public.lojas(id) on delete cascade,
  caixa_id         uuid references public.caixas(id) on delete set null,
  canal            text not null default 'balcao' check (canal in ('balcao','vitrine','ia','manual')),
  forma_pagamento  text not null check (forma_pagamento in ('dinheiro','pix','debito','credito','outro')),
  subtotal         numeric(12,2) not null,
  desconto         numeric(12,2) not null default 0,
  total            numeric(12,2) not null,
  custo_total      numeric(12,2) not null default 0,
  status           text not null default 'concluida' check (status in ('concluida','cancelada')),
  criado_em        timestamptz not null default now()
);
create index if not exists vendas_loja_data_idx on public.vendas (loja_id, criado_em desc);

create table if not exists public.venda_itens (
  id          bigint generated always as identity primary key,
  venda_id    uuid not null references public.vendas(id) on delete cascade,
  produto_id  uuid references public.produtos(id) on delete set null,
  nome        text not null,
  quantidade  int not null check (quantidade > 0),
  preco_unit  numeric(12,2) not null,
  custo_unit  numeric(12,2) not null default 0
);

-- uso de IA por mês (para os limites de cada plano)
create table if not exists public.uso_ia (
  loja_id     uuid not null references public.lojas(id) on delete cascade,
  mes         date not null,
  tipo        text not null,
  quantidade  int not null default 0,
  primary key (loja_id, mes, tipo)
);

-- ---------------------------------------------------------------------
-- FUNÇÕES DE ACESSO
-- ---------------------------------------------------------------------
create or replace function public.minha_loja() returns uuid
language sql stable security definer set search_path = public as $$
  select id from public.lojas where dono = auth.uid()
$$;

-- pode editar = dona da loja E (teste no prazo OU ativo OU atrasado há no máx. 3 dias)
create or replace function public.pode_editar(p_loja uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.lojas l join public.assinaturas a on a.loja_id = l.id
    where l.id = p_loja and l.dono = auth.uid()
      and (
        (a.status = 'teste' and a.teste_ate > now())
        or a.status = 'ativo'
        or (a.status = 'atrasado' and coalesce(a.pago_ate, now()) + interval '3 days' > now())
      )
  )
$$;

-- ---------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------
alter table public.lojas        enable row level security;
alter table public.assinaturas  enable row level security;
alter table public.importacoes  enable row level security;
alter table public.produtos     enable row level security;
alter table public.movimentos   enable row level security;
alter table public.caixas       enable row level security;
alter table public.vendas       enable row level security;
alter table public.venda_itens  enable row level security;
alter table public.uso_ia       enable row level security;

do $$
declare t text;
begin
  -- limpa políticas antigas para poder rodar o script de novo
  for t in select unnest(array['lojas','assinaturas','importacoes','produtos','movimentos','caixas','vendas','venda_itens','uso_ia']) loop
    execute (select coalesce(string_agg(format('drop policy if exists %I on public.%I;', policyname, t), ''), '')
             from pg_policies where schemaname = 'public' and tablename = t);
  end loop;
end $$;

-- lojas: dona lê/cria/edita a própria
create policy lojas_ler    on public.lojas for select using (dono = auth.uid());
create policy lojas_criar  on public.lojas for insert with check (dono = auth.uid());
create policy lojas_editar on public.lojas for update using (dono = auth.uid()) with check (dono = auth.uid());

-- assinaturas: só leitura (escrita só pelo servidor com service role)
create policy assinaturas_ler on public.assinaturas for select using (loja_id = public.minha_loja());

-- tabelas da operação: lê sempre; escreve só com plano em dia
create policy importacoes_ler    on public.importacoes for select using (loja_id = public.minha_loja());
create policy importacoes_editar on public.importacoes for all using (public.pode_editar(loja_id)) with check (public.pode_editar(loja_id));

create policy produtos_ler    on public.produtos for select using (loja_id = public.minha_loja());
create policy produtos_editar on public.produtos for all using (public.pode_editar(loja_id)) with check (public.pode_editar(loja_id));

create policy movimentos_ler   on public.movimentos for select using (loja_id = public.minha_loja());
create policy movimentos_criar on public.movimentos for insert with check (public.pode_editar(loja_id));

create policy caixas_ler    on public.caixas for select using (loja_id = public.minha_loja());
create policy caixas_editar on public.caixas for all using (public.pode_editar(loja_id)) with check (public.pode_editar(loja_id));

create policy vendas_ler    on public.vendas for select using (loja_id = public.minha_loja());
create policy vendas_editar on public.vendas for all using (public.pode_editar(loja_id)) with check (public.pode_editar(loja_id));

create policy venda_itens_ler on public.venda_itens for select
  using (exists (select 1 from public.vendas v where v.id = venda_id and v.loja_id = public.minha_loja()));
create policy venda_itens_criar on public.venda_itens for insert
  with check (exists (select 1 from public.vendas v where v.id = venda_id and public.pode_editar(v.loja_id)));

create policy uso_ia_ler on public.uso_ia for select using (loja_id = public.minha_loja());

-- ---------------------------------------------------------------------
-- REGISTRAR VENDA (atômico: baixa estoque, grava itens e movimentos)
-- itens = [{"produto_id": "...", "quantidade": 2, "preco_unit": 49.9}]
-- ---------------------------------------------------------------------
create or replace function public.registrar_venda(
  p_itens jsonb, p_forma text, p_desconto numeric default 0, p_canal text default 'balcao'
) returns uuid
language plpgsql security invoker set search_path = public as $$
declare
  v_loja uuid := public.minha_loja();
  v_venda uuid;
  v_caixa uuid;
  v_sub numeric := 0;
  v_custo numeric := 0;
  it jsonb;
  p record;
  q int;
begin
  if v_loja is null or not public.pode_editar(v_loja) then
    raise exception 'SEM_ACESSO';
  end if;
  if jsonb_array_length(coalesce(p_itens, '[]')) = 0 then
    raise exception 'VENDA_VAZIA';
  end if;

  select id into v_caixa from public.caixas where loja_id = v_loja and status = 'aberto';

  insert into public.vendas (loja_id, caixa_id, canal, forma_pagamento, subtotal, desconto, total)
  values (v_loja, v_caixa, p_canal, p_forma, 0, 0, 0) returning id into v_venda;

  for it in select * from jsonb_array_elements(p_itens) loop
    q := (it->>'quantidade')::int;
    if q is null or q <= 0 then raise exception 'QUANTIDADE_INVALIDA'; end if;

    select * into p from public.produtos
      where id = (it->>'produto_id')::uuid and loja_id = v_loja and ativo
      for update;
    if not found then raise exception 'PRODUTO_NAO_ENCONTRADO'; end if;
    if p.quantidade < q then
      raise exception 'ESTOQUE_INSUFICIENTE:%', p.nome;
    end if;

    update public.produtos set quantidade = quantidade - q, atualizado_em = now() where id = p.id;

    insert into public.venda_itens (venda_id, produto_id, nome, quantidade, preco_unit, custo_unit)
    values (v_venda, p.id, p.nome, q, coalesce((it->>'preco_unit')::numeric, p.preco), p.custo);

    insert into public.movimentos (loja_id, produto_id, tipo, quantidade, venda_id, motivo)
    values (v_loja, p.id, 'venda', -q, v_venda, 'Venda');

    v_sub := v_sub + q * coalesce((it->>'preco_unit')::numeric, p.preco);
    v_custo := v_custo + q * p.custo;
  end loop;

  p_desconto := least(greatest(coalesce(p_desconto, 0), 0), v_sub);
  update public.vendas
     set subtotal = v_sub, desconto = p_desconto, total = v_sub - p_desconto, custo_total = v_custo
   where id = v_venda;

  return v_venda;
end $$;

-- cancelar venda: devolve o estoque
create or replace function public.cancelar_venda(p_venda uuid) returns void
language plpgsql security invoker set search_path = public as $$
declare
  v_loja uuid := public.minha_loja();
  i record;
begin
  if v_loja is null or not public.pode_editar(v_loja) then raise exception 'SEM_ACESSO'; end if;
  update public.vendas set status = 'cancelada'
   where id = p_venda and loja_id = v_loja and status = 'concluida';
  if not found then raise exception 'VENDA_NAO_ENCONTRADA'; end if;

  for i in select * from public.venda_itens where venda_id = p_venda and produto_id is not null loop
    update public.produtos set quantidade = quantidade + i.quantidade, atualizado_em = now() where id = i.produto_id;
    insert into public.movimentos (loja_id, produto_id, tipo, quantidade, venda_id, motivo)
    values (v_loja, i.produto_id, 'cancelamento', i.quantidade, p_venda, 'Venda cancelada');
  end loop;
end $$;

-- ajuste manual de estoque (entrada / saída / contagem)
create or replace function public.movimentar_estoque(p_produto uuid, p_qtd int, p_tipo text, p_motivo text default null)
returns int
language plpgsql security invoker set search_path = public as $$
declare
  v_loja uuid := public.minha_loja();
  v_nova int;
begin
  if v_loja is null or not public.pode_editar(v_loja) then raise exception 'SEM_ACESSO'; end if;
  if p_tipo not in ('entrada','saida','ajuste') then raise exception 'TIPO_INVALIDO'; end if;

  update public.produtos
     set quantidade = quantidade + p_qtd, atualizado_em = now()
   where id = p_produto and loja_id = v_loja
  returning quantidade into v_nova;
  if not found then raise exception 'PRODUTO_NAO_ENCONTRADO'; end if;

  insert into public.movimentos (loja_id, produto_id, tipo, quantidade, motivo)
  values (v_loja, p_produto, p_tipo, p_qtd, p_motivo);
  return v_nova;
end $$;

-- ---------------------------------------------------------------------
-- IMPORTAR PLANILHA (atômico) e DESFAZER
-- linhas = [{"nome","categoria","codigo_barras","sku","fornecedor","custo","preco","quantidade","estoque_minimo"}]
-- modo_existente = 'somar' | 'substituir' | 'pular'
-- ---------------------------------------------------------------------
create or replace function public.importar_produtos(
  p_linhas jsonb, p_modo text, p_arquivo text, p_mapeamento jsonb
) returns jsonb
language plpgsql security invoker set search_path = public as $$
declare
  v_loja uuid := public.minha_loja();
  v_imp uuid;
  l jsonb;
  ex record;
  v_novo uuid;
  c_criados int := 0; c_atual int := 0; c_ign int := 0;
  v_qtd int;
  v_cod text;
begin
  if v_loja is null or not public.pode_editar(v_loja) then raise exception 'SEM_ACESSO'; end if;
  if p_modo not in ('somar','substituir','pular') then raise exception 'MODO_INVALIDO'; end if;
  if jsonb_array_length(coalesce(p_linhas,'[]')) > 5000 then raise exception 'LIMITE_5000_LINHAS'; end if;

  insert into public.importacoes (loja_id, arquivo, mapeamento) values (v_loja, p_arquivo, p_mapeamento)
  returning id into v_imp;

  for l in select * from jsonb_array_elements(p_linhas) loop
    v_qtd := greatest(coalesce((l->>'quantidade')::int, 0), 0);
    v_cod := nullif(trim(l->>'codigo_barras'), '');

    -- procura produto existente: primeiro pelo código de barras, depois pelo nome
    select * into ex from public.produtos
     where loja_id = v_loja and ativo
       and ((v_cod is not null and codigo_barras = v_cod)
            or (v_cod is null and lower(trim(nome)) = lower(trim(l->>'nome'))))
     limit 1;

    if found then
      if p_modo = 'pular' then
        c_ign := c_ign + 1;
        continue;
      end if;
      update public.produtos set
        custo = coalesce((l->>'custo')::numeric, custo),
        preco = coalesce((l->>'preco')::numeric, preco),
        categoria = coalesce(nullif(l->>'categoria',''), categoria),
        fornecedor = coalesce(nullif(l->>'fornecedor',''), fornecedor),
        quantidade = case when p_modo = 'somar' then quantidade + v_qtd else v_qtd end,
        atualizado_em = now()
      where id = ex.id;
      insert into public.movimentos (loja_id, produto_id, tipo, quantidade, importacao_id, motivo)
      values (v_loja, ex.id, 'importacao',
              case when p_modo = 'somar' then v_qtd else v_qtd - ex.quantidade end,
              v_imp, 'Importação de planilha');
      c_atual := c_atual + 1;
    else
      insert into public.produtos (loja_id, nome, categoria, codigo_barras, sku, fornecedor, custo, preco, quantidade, estoque_minimo, importacao_id)
      values (v_loja, trim(l->>'nome'), nullif(l->>'categoria',''), v_cod, nullif(l->>'sku',''),
              nullif(l->>'fornecedor',''), coalesce((l->>'custo')::numeric, 0), coalesce((l->>'preco')::numeric, 0),
              v_qtd, coalesce((l->>'estoque_minimo')::int, 2), v_imp)
      returning id into v_novo;
      if v_qtd <> 0 then
        insert into public.movimentos (loja_id, produto_id, tipo, quantidade, importacao_id, motivo)
        values (v_loja, v_novo, 'importacao', v_qtd, v_imp, 'Importação de planilha');
      end if;
      c_criados := c_criados + 1;
    end if;
  end loop;

  update public.importacoes set criados = c_criados, atualizados = c_atual, ignorados = c_ign where id = v_imp;
  return jsonb_build_object('id', v_imp, 'criados', c_criados, 'atualizados', c_atual, 'ignorados', c_ign);
end $$;

create or replace function public.desfazer_importacao(p_imp uuid) returns void
language plpgsql security invoker set search_path = public as $$
declare
  v_loja uuid := public.minha_loja();
  m record;
begin
  if v_loja is null or not public.pode_editar(v_loja) then raise exception 'SEM_ACESSO'; end if;
  perform 1 from public.importacoes where id = p_imp and loja_id = v_loja and not desfeita;
  if not found then raise exception 'IMPORTACAO_NAO_ENCONTRADA'; end if;

  -- produtos criados por esta importação e que nunca venderam: remove
  delete from public.produtos p
   where p.importacao_id = p_imp and p.loja_id = v_loja
     and not exists (select 1 from public.venda_itens vi where vi.produto_id = p.id);

  -- produtos que já existiam (ou que já venderam): devolve a quantidade anterior
  for m in select produto_id, sum(quantidade) as q from public.movimentos
            where importacao_id = p_imp group by produto_id loop
    update public.produtos set quantidade = greatest(quantidade - m.q, 0), atualizado_em = now()
     where id = m.produto_id;
    insert into public.movimentos (loja_id, produto_id, tipo, quantidade, motivo)
    select v_loja, m.produto_id, 'ajuste', -m.q, 'Importação desfeita'
     where exists (select 1 from public.produtos where id = m.produto_id);
  end loop;

  update public.importacoes set desfeita = true where id = p_imp;
end $$;

-- conta uso de IA do mês (chamada pelo servidor)
create or replace function public.contar_uso_ia(p_tipo text) returns int
language plpgsql security definer set search_path = public as $$
declare v_loja uuid := public.minha_loja(); v int;
begin
  if v_loja is null then raise exception 'SEM_LOJA'; end if;
  insert into public.uso_ia (loja_id, mes, tipo, quantidade)
  values (v_loja, date_trunc('month', now())::date, p_tipo, 1)
  on conflict (loja_id, mes, tipo) do update set quantidade = uso_ia.quantidade + 1
  returning quantidade into v;
  return v;
end $$;

-- permissões das funções
revoke all on function public.criar_assinatura_teste() from public, anon, authenticated;
grant execute on function public.minha_loja(), public.pode_editar(uuid),
  public.registrar_venda(jsonb, text, numeric, text), public.cancelar_venda(uuid),
  public.movimentar_estoque(uuid, int, text, text),
  public.importar_produtos(jsonb, text, text, jsonb), public.desfazer_importacao(uuid),
  public.contar_uso_ia(text)
  to authenticated;
revoke execute on function public.registrar_venda(jsonb, text, numeric, text), public.cancelar_venda(uuid),
  public.movimentar_estoque(uuid, int, text, text), public.importar_produtos(jsonb, text, text, jsonb),
  public.desfazer_importacao(uuid), public.contar_uso_ia(text) from public, anon;
