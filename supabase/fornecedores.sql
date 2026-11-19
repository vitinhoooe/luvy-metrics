-- =====================================================================
-- LuvyMetrics v2 — MEUS FORNECEDORES (CRM da lojista)
-- Rode DEPOIS do schema.sql e do vitrine.sql. Pode rodar de novo sem quebrar.
-- Liga com os produtos pelo nome do fornecedor (produtos.fornecedor), sem migração.
-- =====================================================================

create table if not exists public.fornecedores (
  id             uuid primary key default gen_random_uuid(),
  loja_id        uuid not null references public.lojas(id) on delete cascade,
  nome           text not null check (char_length(nome) between 1 and 80),
  contato        text check (char_length(contato) <= 80),           -- nome da pessoa/vendedor
  whatsapp       text check (whatsapp ~ '^[0-9]{10,11}$'),
  email          text check (char_length(email) <= 120),
  site           text check (char_length(site) <= 200),
  cidade         text check (char_length(cidade) <= 80),
  prazo_dias     int  check (prazo_dias between 0 and 120),           -- entrega média
  pedido_minimo  numeric(12,2) check (pedido_minimo >= 0),
  pagamento      text check (char_length(pagamento) <= 120),         -- ex.: "Pix à vista 5%, boleto 30 dias"
  nota           int  check (nota between 1 and 5),
  obs            text check (char_length(obs) <= 1000),
  diretorio_id   text,                                               -- veio do diretório do Luvy (id em src/lib/fornecedores.ts)
  ultimo_pedido  date,
  criado_em      timestamptz not null default now(),
  atualizado_em  timestamptz not null default now()
);

create unique index if not exists fornecedores_loja_nome_uq on public.fornecedores (loja_id, lower(nome));

alter table public.fornecedores enable row level security;
drop policy if exists fornecedores_ler on public.fornecedores;
drop policy if exists fornecedores_editar on public.fornecedores;
create policy fornecedores_ler    on public.fornecedores for select using (loja_id = public.minha_loja());
create policy fornecedores_editar on public.fornecedores for all using (public.pode_editar(loja_id)) with check (public.pode_editar(loja_id));

revoke all on public.fornecedores from anon;
grant select, insert, update, delete on public.fornecedores to authenticated;
