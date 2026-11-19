-- =====================================================================
-- LuvyMetrics v2 — ENTRADA DO CLIENTE NOVO
-- 1) canal da venda: balcão, WhatsApp, Instagram (além de vitrine/ia/manual)
-- 2) histórico de vendas importado (alimenta relatórios e "o que repor",
--    sem mexer no estoque atual nem no caixa)
-- Rode DEPOIS de schema.sql e vitrine.sql. Pode rodar de novo sem quebrar.
-- =====================================================================

alter table public.vendas drop constraint if exists vendas_canal_check;
alter table public.vendas add constraint vendas_canal_check
  check (canal in ('balcao','vitrine','ia','manual','whatsapp','instagram','historico'));

alter table public.vendas add column if not exists historico_lote uuid;
create index if not exists vendas_historico_lote_idx on public.vendas (historico_lote) where historico_lote is not null;

-- cancelar venda: histórico importado não se cancela (não baixou estoque); use "desfazer importação"
create or replace function public.cancelar_venda(p_venda uuid) returns void
language plpgsql security invoker set search_path = public as $$
declare
  v_loja uuid := public.minha_loja();
  i record;
begin
  if v_loja is null or not public.pode_editar(v_loja) then raise exception 'SEM_ACESSO'; end if;
  update public.vendas set status = 'cancelada'
   where id = p_venda and loja_id = v_loja and status = 'concluida' and canal <> 'historico';
  if not found then raise exception 'VENDA_NAO_ENCONTRADA'; end if;

  for i in select * from public.venda_itens where venda_id = p_venda and produto_id is not null loop
    update public.produtos set quantidade = quantidade + i.quantidade, atualizado_em = now() where id = i.produto_id;
    insert into public.movimentos (loja_id, produto_id, tipo, quantidade, venda_id, motivo)
    values (v_loja, i.produto_id, 'cancelamento', i.quantidade, p_venda, 'Venda cancelada');
  end loop;
end $$;

-- importar histórico: linhas = [{"data":"AAAA-MM-DD","produto":"...","codigo":"...","quantidade":2,"valor":49.8}]
-- "valor" é o total da linha (quantidade x preço). Liga ao produto por código de barras/SKU ou pelo nome.
create or replace function public.importar_historico(p_linhas jsonb) returns jsonb
language plpgsql security invoker set search_path = public as $$
declare
  v_loja uuid := public.minha_loja();
  v_lote uuid := gen_random_uuid();
  v_venda uuid;
  l jsonb;
  v_data date;
  v_qtd int;
  v_valor numeric;
  v_nome text;
  v_cod text;
  v_pid uuid;
  v_pnome text;
  v_pcusto numeric;
  n_vendas int := 0;
  n_ligados int := 0;
  n_ignoradas int := 0;
begin
  if v_loja is null or not public.pode_editar(v_loja) then raise exception 'SEM_ACESSO'; end if;
  if jsonb_typeof(p_linhas) <> 'array' or jsonb_array_length(p_linhas) = 0 then raise exception 'PLANILHA_VAZIA'; end if;
  if jsonb_array_length(p_linhas) > 20000 then raise exception 'PLANILHA_GRANDE'; end if;

  for l in select * from jsonb_array_elements(p_linhas) loop
    begin
      v_data := (l->>'data')::date;
    exception when others then v_data := null; end;
    v_qtd := coalesce(nullif(l->>'quantidade','')::numeric, 1)::int;
    v_valor := nullif(l->>'valor','')::numeric;
    v_nome := nullif(trim(left(l->>'produto', 160)), '');
    v_cod := nullif(trim(left(l->>'codigo', 40)), '');

    -- linha sem data válida, sem produto, quantidade ou valor estranhos: ignora (não trava a importação)
    if v_data is null or v_data > current_date or v_data < current_date - 1100
       or v_nome is null or v_qtd is null or v_qtd <= 0 or v_qtd > 100000
       or v_valor is null or v_valor < 0 or v_valor > 10000000 then
      n_ignoradas := n_ignoradas + 1;
      continue;
    end if;

    v_pid := null; v_pnome := null; v_pcusto := null;
    if v_cod is not null then
      select id, nome, custo into v_pid, v_pnome, v_pcusto from public.produtos
       where loja_id = v_loja and (codigo_barras = v_cod or sku = v_cod) limit 1;
    end if;
    if v_pid is null then
      select id, nome, custo into v_pid, v_pnome, v_pcusto from public.produtos
       where loja_id = v_loja and lower(trim(nome)) = lower(v_nome) limit 1;
    end if;
    if v_pid is not null then n_ligados := n_ligados + 1; end if;

    insert into public.vendas (loja_id, caixa_id, canal, forma_pagamento, subtotal, desconto, total, custo_total, status, criado_em, historico_lote)
    values (v_loja, null, 'historico', 'outro', v_valor, 0, v_valor, coalesce(v_pcusto, 0) * v_qtd, 'concluida',
            (v_data + time '12:00') at time zone 'America/Sao_Paulo', v_lote)
    returning id into v_venda;

    insert into public.venda_itens (venda_id, produto_id, nome, quantidade, preco_unit, custo_unit)
    values (v_venda, v_pid, coalesce(v_pnome, v_nome), v_qtd, round(v_valor / v_qtd, 2), coalesce(v_pcusto, 0));
    n_vendas := n_vendas + 1;
  end loop;

  if n_vendas = 0 then raise exception 'NENHUMA_LINHA_VALIDA'; end if;
  return jsonb_build_object('lote', v_lote, 'vendas', n_vendas, 'ligados', n_ligados, 'sem_produto', n_vendas - n_ligados, 'ignoradas', n_ignoradas);
end $$;

create or replace function public.desfazer_historico(p_lote uuid) returns int
language plpgsql security invoker set search_path = public as $$
declare
  v_loja uuid := public.minha_loja();
  n int;
begin
  if v_loja is null or not public.pode_editar(v_loja) then raise exception 'SEM_ACESSO'; end if;
  delete from public.vendas where loja_id = v_loja and historico_lote = p_lote and canal = 'historico';
  get diagnostics n = row_count;
  return n;
end $$;

-- lotes importados (para a tela mostrar e permitir desfazer)
create or replace function public.lotes_historico() returns jsonb
language sql stable security invoker set search_path = public as $$
  select coalesce(jsonb_agg(x order by x->>'ate' desc), '[]'::jsonb) from (
    select jsonb_build_object('lote', historico_lote, 'vendas', count(*), 'total', sum(total),
                              'de', min(criado_em), 'ate', max(criado_em)) x
      from public.vendas
     where loja_id = public.minha_loja() and historico_lote is not null
     group by historico_lote
  ) t
$$;

revoke execute on function public.importar_historico(jsonb), public.desfazer_historico(uuid), public.lotes_historico() from public, anon;
grant execute on function public.importar_historico(jsonb), public.desfazer_historico(uuid), public.lotes_historico() to authenticated;
