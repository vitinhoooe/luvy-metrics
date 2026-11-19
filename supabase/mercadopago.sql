-- =====================================================================
-- LuvyMetrics v2 — MERCADO PAGO NA VITRINE + VITRINE COMPLETA
-- A lojista conecta a PRÓPRIA conta do Mercado Pago. O dinheiro cai direto
-- na conta dela; o Luvy só cria a cobrança e recebe o aviso de pago.
-- Rode DEPOIS de schema.sql e vitrine.sql. Pode rodar de novo sem quebrar.
-- =====================================================================

-- ---------- vitrine: mais cores e mais informações ----------
alter table public.lojas drop constraint if exists lojas_vitrine_cor_chk;
alter table public.lojas add constraint lojas_vitrine_cor_chk
  check (vitrine_cor in ('rosa','vinho','violeta','noite','nude','esmeralda','coral','oceano'));
alter table public.lojas add column if not exists vitrine_instagram text check (vitrine_instagram ~ '^[A-Za-z0-9._]{1,30}$');
alter table public.lojas add column if not exists vitrine_horario   text check (char_length(vitrine_horario) <= 80);
alter table public.lojas add column if not exists vitrine_sobre     text check (char_length(vitrine_sobre) <= 400);

-- ---------- Mercado Pago: estado visível da conexão ----------
alter table public.lojas add column if not exists mp_ativo     boolean not null default false;
alter table public.lojas add column if not exists mp_conta     text;   -- apelido da conta conectada (só para mostrar)
alter table public.lojas add column if not exists mp_descritor text check (mp_descritor ~ '^[A-Za-z0-9 ]{1,13}$'); -- nome na fatura do cartão

-- o token fica numa tabela que NINGUÉM lê pelo app: RLS ligado e sem políticas.
-- só o servidor (service role) grava e lê, e o token vai criptografado.
create table if not exists public.loja_segredos (
  loja_id        uuid primary key references public.lojas(id) on delete cascade,
  mp_token       text not null,
  mp_usuario     text,
  atualizado_em  timestamptz not null default now()
);
alter table public.loja_segredos enable row level security;
revoke all on public.loja_segredos from public, anon, authenticated;

-- ---------- pedidos pagos pelo Mercado Pago ----------
alter table public.pedidos drop constraint if exists pedidos_pagamento_check;
alter table public.pedidos add constraint pedidos_pagamento_check check (pagamento in ('pix','combinar','mercadopago'));
alter table public.pedidos add column if not exists mp_link      text;   -- página de pagamento do Mercado Pago
alter table public.pedidos add column if not exists mp_pagamento text;   -- id do pagamento aprovado
alter table public.pedidos add column if not exists pago_por     text;   -- como a cliente pagou de fato: pix, credito, debito, outro

-- ---------- vitrine pública: inclui Mercado Pago e os campos novos ----------
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
    'atendente', jsonb_build_object('ativo', l.atendente_ativo, 'nome', l.atendente_nome, 'tom', l.atendente_tom, 'info', l.atendente_info),
    'pix', l.pix_chave is not null and length(l.pix_chave) > 0,
    'mercadopago', l.mp_ativo,
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

-- ---------- criar pedido: aceita "mercadopago" quando a loja conectou ----------
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
  if p_pagamento not in ('pix','combinar','mercadopago') then raise exception 'PAGAMENTO_INVALIDO'; end if;
  if p_pagamento = 'pix' and coalesce(l.pix_chave, '') = '' then raise exception 'PAGAMENTO_INVALIDO'; end if;
  if p_pagamento = 'mercadopago' and not l.mp_ativo then raise exception 'PAGAMENTO_INVALIDO'; end if;

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

-- ---------- pedido visto pela cliente: link do Mercado Pago enquanto não pagou ----------
create or replace function public.pedido_publico(p_token uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'numero', pe.numero, 'status', pe.status, 'total', pe.total, 'subtotal', pe.subtotal, 'frete', pe.frete,
    'entrega', pe.entrega, 'pagamento', pe.pagamento, 'cliente', pe.cliente_nome, 'criado_em', pe.criado_em,
    'rastreio', pe.codigo_rastreio, 'valor_pix', pe.valor_pix,
    'mp_link', case when pe.status = 'novo' then pe.mp_link end, 'pago_por', pe.pago_por,
    'loja', jsonb_build_object('nome', l.nome, 'slug', l.slug, 'cidade', l.cidade, 'cor', l.vitrine_cor, 'whatsapp', l.whatsapp,
                               'pix_chave', l.pix_chave, 'pix_nome', coalesce(l.pix_nome, l.nome), 'endereco_retirada', l.endereco_retirada),
    'itens', (select jsonb_agg(jsonb_build_object('nome', i.nome, 'quantidade', i.quantidade, 'preco', i.preco_unit)) from public.pedido_itens i where i.pedido_id = pe.id),
    'eventos', (select jsonb_agg(jsonb_build_object('status', e.status, 'em', e.criado_em) order by e.criado_em) from public.pedido_eventos e where e.pedido_id = pe.id)
  )
  from public.pedidos pe join public.lojas l on l.id = pe.loja_id
  where pe.token = p_token
$$;
grant execute on function public.pedido_publico(uuid) to anon, authenticated;

-- ---------- confirmação automática (chamada só pelo servidor, depois de consultar o Mercado Pago) ----------
-- Idempotente: se o pedido já foi pago, não faz nada. Baixa o estoque e registra a venda "vitrine".
create or replace function public.confirmar_pedido_mp(p_token uuid, p_pagamento text, p_valor numeric, p_forma text) returns text
language plpgsql security definer set search_path = public as $$
declare pe record; i record; v_venda uuid; v_custo numeric := 0; v_pid uuid; v_cu numeric;
begin
  select * into pe from public.pedidos where token = p_token for update;
  if not found then return 'PEDIDO_NAO_ENCONTRADO'; end if;
  if pe.status <> 'novo' then return 'JA_CONFIRMADO'; end if;
  if pe.pagamento <> 'mercadopago' then return 'NAO_E_MERCADOPAGO'; end if;
  if p_valor + 0.009 < pe.total then return 'VALOR_MENOR'; end if;

  insert into public.vendas (loja_id, caixa_id, canal, forma_pagamento, subtotal, desconto, total, custo_total)
  values (pe.loja_id, null, 'vitrine', case when p_forma in ('pix','credito','debito') then p_forma else 'outro' end, pe.total, 0, pe.total, 0)
  returning id into v_venda;

  for i in select * from public.pedido_itens where pedido_id = pe.id loop
    v_pid := null; v_cu := 0;
    select id, custo into v_pid, v_cu from public.produtos where id = i.produto_id and loja_id = pe.loja_id for update;
    if v_pid is not null then
      -- já está pago: baixa mesmo que alguém tenha vendido no balcão no meio do caminho (nunca abaixo de zero)
      update public.produtos set quantidade = greatest(quantidade - i.quantidade, 0), atualizado_em = now() where id = v_pid;
      insert into public.movimentos (loja_id, produto_id, tipo, quantidade, venda_id, motivo)
      values (pe.loja_id, v_pid, 'venda', -i.quantidade, v_venda, 'Pedido da vitrine pago no Mercado Pago');
    end if;
    insert into public.venda_itens (venda_id, produto_id, nome, quantidade, preco_unit, custo_unit)
    values (v_venda, i.produto_id, i.nome, i.quantidade, i.preco_unit, coalesce(v_cu, 0));
    v_custo := v_custo + i.quantidade * coalesce(v_cu, 0);
  end loop;
  update public.vendas set custo_total = v_custo where id = v_venda;

  update public.pedidos set status = 'pago', venda_id = v_venda, mp_pagamento = left(p_pagamento, 40),
    pago_por = case when p_forma in ('pix','credito','debito') then p_forma else 'outro' end, atualizado_em = now()
  where id = pe.id;
  return 'CONFIRMADO';
end $$;
revoke execute on function public.confirmar_pedido_mp(uuid, text, numeric, text) from public, anon, authenticated;
grant execute on function public.confirmar_pedido_mp(uuid, text, numeric, text) to service_role;
