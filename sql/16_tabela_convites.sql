-- Links de convite para tabelas "Só diretoria" (21/11/2026).
-- A diretoria gera um link por corretor; quem abre o link passa a ver aquela
-- tabela (lista, detalhe, PDF e proposta). Pode expirar e ser revogado.
-- Leitura/escrita só pelo servidor (service role); a diretoria lista pela API.
-- Idempotente. Aplicar no Supabase (idjzh) → SQL Editor.

create table if not exists public.tabela_convites (
  id               uuid primary key default gen_random_uuid(),
  empreendimento_id uuid not null references public.empreendimentos(id) on delete cascade,
  token            text not null unique,
  rotulo           text,                 -- ex.: nome do corretor/imobiliária
  criado_por       uuid,
  criado_em        timestamptz not null default now(),
  expira_em        timestamptz,
  revogado_em      timestamptz,
  acessos          integer not null default 0,
  ultimo_acesso    timestamptz
);
create index if not exists tabela_convites_emp_idx on public.tabela_convites(empreendimento_id);

alter table public.tabela_convites enable row level security;
revoke all on public.tabela_convites from anon, authenticated;
-- Sem policies: só a service role (servidor do Tabelas) lê e grava.
