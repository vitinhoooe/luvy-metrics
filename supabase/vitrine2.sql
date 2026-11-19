-- =====================================================================
-- LuvyMetrics v2 — VITRINE PERSONALIZÁVEL + ENTREGA PARA O BRASIL TODO
-- Logo, foto de capa, fotos e descrição dos produtos, destaques,
-- prazos de entrega e frete por região (com frete grátis acima de um valor).
-- Rode DEPOIS de mercadopago.sql. Pode rodar de novo sem quebrar.
-- =====================================================================

-- ---------- produtos: fotos, descrição e destaque ----------
alter table public.produtos add column if not exists descricao text check (char_length(descricao) <= 1000);
alter table public.produtos add column if not exists fotos     jsonb not null default '[]'::jsonb;
alter table public.produtos add column if not exists destaque  boolean not null default false;
do $$ begin
  alter table public.produtos add constraint produtos_fotos_chk check (jsonb_typeof(fotos) = 'array' and jsonb_array_length(fotos) <= 4);
exception when duplicate_object then null; end $$;

-- ---------- loja: identidade visual e entrega ----------
alter table public.lojas add column if not exists vitrine_logo       text;
alter table public.lojas add column if not exists vitrine_capa       text;
alter table public.lojas add column if not exists entrega_brasil     boolean not null default false;
-- {"N":{"valor":30,"prazo":"8 a 12 dias úteis"}, "NE":..., "CO":..., "SE":..., "S":...}  (região sem valor = não atende)
alter table public.lojas add column if not exists frete_regioes      jsonb not null default '{}'::jsonb;
alter table public.lojas add column if not exists frete_gratis_acima numeric(10,2) check (frete_gratis_acima is null or frete_gratis_acima > 0);
alter table public.lojas add column if not exists prazo_retirada     text check (char_length(prazo_retirada) <= 60);
alter table public.lojas add column if not exists prazo_local        text check (char_length(prazo_local) <= 60);

-- ---------- pedido: CEP e estado de destino ----------
alter table public.pedidos drop constraint if exists pedidos_entrega_check;
alter table public.pedidos add constraint pedidos_entrega_check check (entrega in ('retirada','local','combinar','brasil'));
alter table public.pedidos add column if not exists cep text check (cep ~ '^[0-9]{8}$');
alter table public.pedidos add column if not exists uf  text;

-- ---------- imagens: pasta pública "vitrine" (só o servidor grava) ----------
do $$ begin
  if exists (select 1 from information_schema.schemata where schema_name = 'storage') then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values ('vitrine', 'vitrine', true, 3145728, array['image/webp'])
    on conflict (id) do nothing;
  end if;
end $$;

-- ---------- CEP → estado → região (faixas oficiais de CEP) ----------
create or replace function public.cep_uf(p_cep text) returns text
language sql immutable set search_path = public as $$
  select case
    when n between 1000000 and 19999999 then 'SP'
    when n between 20000000 and 28999999 then 'RJ'
    when n between 29000000 and 29999999 then 'ES'
    when n between 30000000 and 39999999 then 'MG'
    when n between 40000000 and 48999999 then 'BA'
    when n between 49000000 and 49999999 then 'SE'
    when n between 50000000 and 56999999 then 'PE'
    when n between 57000000 and 57999999 then 'AL'
    when n between 58000000 and 58999999 then 'PB'
    when n between 59000000 and 59999999 then 'RN'
    when n between 60000000 and 63999999 then 'CE'
    when n between 64000000 and 64999999 then 'PI'
    when n between 65000000 and 65999999 then 'MA'
    when n between 66000000 and 68899999 then 'PA'
    when n between 68900000 and 68999999 then 'AP'
    when n between 69000000 and 69299999 then 'AM'
    when n between 69300000 and 69399999 then 'RR'
    when n between 69400000 and 69899999 then 'AM'
    when n between 69900000 and 69999999 then 'AC'
    when n between 70000000 and 72799999 then 'DF'
    when n between 72800000 and 72999999 then 'GO'
    when n between 73000000 and 73699999 then 'DF'
    when n between 73700000 and 76799999 then 'GO'
    when n between 76800000 and 76999999 then 'RO'
    when n between 77000000 and 77999999 then 'TO'
    when n between 78000000 and 78899999 then 'MT'
    when n between 79000000 and 79999999 then 'MS'
    when n between 80000000 and 87999999 then 'PR'
    when n between 88000000 and 89999999 then 'SC'
    when n between 90000000 and 99999999 then 'RS'
  end
  from (select case when p_cep ~ '^[0-9]{8}$' then p_cep::int end as n) c
$$;

create or replace function public.uf_regiao(p_uf text) returns text
language sql immutable set search_path = public as $$
  select case
    when p_uf in ('AC','AP','AM','PA','RO','RR','TO') then 'N'
    when p_uf in ('AL','BA','CE','MA','PB','PE','PI','RN','SE') then 'NE'
    when p_uf in ('DF','GO','MT','MS') then 'CO'
    when p_uf in ('ES','MG','RJ','SP') then 'SE'
    when p_uf in ('PR','RS','SC') then 'S'
  end
$$;
grant execute on function public.cep_uf(text), public.uf_regiao(text) to anon, authenticated;

-- ---------- vitrine pública: tudo que a vitrine mostra ----------
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
    'instagram', l.vitrine_instagram, 'horario', l.vitrine_horario, 'sobre', l.vitrine_sobre,
    'logo', l.vitrine_logo, 'capa', l.vitrine_capa,
    'atendente', jsonb_build_object('ativo', l.atendente_ativo, 'nome', l.atendente_nome, 'tom', l.atendente_tom, 'info', l.atendente_info),
    'pix', l.pix_chave is not null and length(l.pix_chave) > 0,
    'mercadopago', l.mp_ativo,
    'entrega', jsonb_build_object(
      'retirada', l.entrega_retirada, 'endereco_retirada', l.endereco_retirada, 'prazo_retirada', l.prazo_retirada,
      'local', l.entrega_local, 'local_taxa', l.entrega_local_taxa, 'prazo_local', l.prazo_local,
      'combinar', l.entrega_combinar,
      'brasil', l.entrega_brasil, 'regioes', l.frete_regioes, 'gratis_acima', l.frete_gratis_acima),
    'produtos', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', p.id, 'nome', p.nome, 'categoria', p.categoria, 'descricao', p.descricao,
        'preco', coalesce(p.preco_promocional, p.preco), 'preco_de', case when p.preco_promocional is not null then p.preco end,
        'disponivel', least(p.quantidade, 20), 'foto', coalesce(p.fotos->>0, p.foto_url), 'fotos', p.fotos, 'destaque', p.destaque)
        order by p.destaque desc, p.categoria nulls last, p.nome)
      from public.produtos p
      where p.loja_id = l.id and p.ativo and p.na_vitrine and p.preco > 0
    ), '[]'::jsonb)
  );
end $$;

-- ---------- criar pedido: entrega "brasil" com frete pela região do CEP ----------
drop function if exists public.criar_pedido(text, jsonb, text, text, text, text, text, text);
create or replace function public.criar_pedido(
  p_slug text, p_itens jsonb, p_nome text, p_whatsapp text,
  p_entrega text, p_endereco text, p_pagamento text, p_obs text, p_cep text default null
) returns jsonb
language plpgsql volatile security definer set search_path = public as $$
declare
  l record; it jsonb; p record; q int;
  v_ped uuid; v_tok uuid; v_num bigint;
  v_sub numeric := 0; v_frete numeric := 0;
  v_zap text := regexp_replace(coalesce(p_whatsapp, ''), '\D', '', 'g');
  v_cep text := nullif(regexp_replace(coalesce(p_cep, ''), '\D', '', 'g'), '');
  v_uf text; v_reg jsonb;
begin
  select * into l from public.lojas where slug = lower(p_slug);
  if not found or not l.vitrine_ativa or not public.vitrine_liberada(l.id) then raise exception 'LOJA_FECHADA'; end if;
  if jsonb_typeof(p_itens) <> 'array' or jsonb_array_length(p_itens) not between 1 and 30 then raise exception 'CARRINHO_INVALIDO'; end if;
  if p_entrega not in ('retirada','local','combinar','brasil') then raise exception 'ENTREGA_INVALIDA'; end if;
  if (p_entrega = 'retirada' and not l.entrega_retirada) or (p_entrega = 'local' and not l.entrega_local)
     or (p_entrega = 'combinar' and not l.entrega_combinar) or (p_entrega = 'brasil' and not l.entrega_brasil) then raise exception 'ENTREGA_INVALIDA'; end if;
  if p_entrega in ('local','brasil') and length(trim(coalesce(p_endereco, ''))) < 8 then raise exception 'ENDERECO_OBRIGATORIO'; end if;
  if p_entrega = 'brasil' then
    v_uf := public.cep_uf(v_cep);
    if v_uf is null then raise exception 'CEP_INVALIDO'; end if;
    v_reg := l.frete_regioes -> public.uf_regiao(v_uf);
    if v_reg is null or jsonb_typeof(v_reg -> 'valor') <> 'number' then raise exception 'REGIAO_NAO_ATENDIDA'; end if;
  end if;
  if p_pagamento not in ('pix','combinar','mercadopago') then raise exception 'PAGAMENTO_INVALIDO'; end if;
  if p_pagamento = 'pix' and coalesce(l.pix_chave, '') = '' then raise exception 'PAGAMENTO_INVALIDO'; end if;
  if p_pagamento = 'mercadopago' and not l.mp_ativo then raise exception 'PAGAMENTO_INVALIDO'; end if;

  if (select count(*) from public.pedidos where loja_id = l.id and cliente_whatsapp = v_zap and criado_em > now() - interval '10 minutes') >= 5 then
    raise exception 'MUITOS_PEDIDOS';
  end if;

  insert into public.pedidos (loja_id, cliente_nome, cliente_whatsapp, entrega, endereco, observacao, pagamento, subtotal, frete, total, cep, uf)
  values (l.id, trim(p_nome), v_zap, p_entrega, nullif(trim(coalesce(p_endereco, '')), ''), nullif(left(trim(coalesce(p_obs, '')), 300), ''), p_pagamento, 0, 0, 0,
          case when p_entrega = 'brasil' then v_cep end, v_uf)
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

  -- frete depois do subtotal (por causa do frete grátis)
  if p_entrega = 'local' then v_frete := l.entrega_local_taxa;
  elsif p_entrega = 'brasil' then v_frete := (v_reg ->> 'valor')::numeric;
  end if;
  if p_entrega in ('local','brasil') and l.frete_gratis_acima is not null and v_sub >= l.frete_gratis_acima then v_frete := 0; end if;
  v_frete := greatest(coalesce(v_frete, 0), 0);

  update public.pedidos set subtotal = v_sub, frete = v_frete, total = v_sub + v_frete,
    valor_pix = case when p_pagamento = 'pix' then public.proximo_valor_pix(l.id, v_sub + v_frete) end
  where id = v_ped;
  return jsonb_build_object('token', v_tok, 'numero', v_num, 'total', v_sub + v_frete, 'frete', v_frete);
end $$;
grant execute on function public.criar_pedido(text, jsonb, text, text, text, text, text, text, text) to anon, authenticated;
