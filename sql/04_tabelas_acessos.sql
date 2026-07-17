-- Registro de acessos de corretores/imobiliárias às tabelas públicas.
-- Rodar no SQL Editor do Supabase (idjzh). Idempotente.

create table if not exists public.tabelas_acessos (
  id            uuid primary key default gen_random_uuid(),
  corretor_nome text not null,
  creci         text,
  ip            text,
  user_agent    text,
  created_at    timestamptz not null default now()
);

create index if not exists tabelas_acessos_created_idx  on public.tabelas_acessos (created_at desc);
create index if not exists tabelas_acessos_corretor_idx on public.tabelas_acessos (lower(corretor_nome));

-- RLS: o INSERT vem da API pública via service_role (bypassa RLS). A leitura
-- (relatório da diretoria) é feita pelo admin autenticado, então liberamos
-- SELECT só para authenticated. anon não lê nem escreve diretamente.
alter table public.tabelas_acessos enable row level security;

drop policy if exists "staff lê acessos de corretores" on public.tabelas_acessos;
create policy "staff lê acessos de corretores"
  on public.tabelas_acessos for select
  to authenticated
  using (true);

grant select, insert on public.tabelas_acessos to service_role;
grant select on public.tabelas_acessos to authenticated;
