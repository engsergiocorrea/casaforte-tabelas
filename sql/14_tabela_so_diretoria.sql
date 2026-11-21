-- Tabela de vendas "Só diretoria" (21/11/2026).
-- Cada empreendimento tem visibilidade:
--   'publica'   → corretores veem (como sempre foi)
--   'diretoria' → invisível para corretores/anon; só abre para quem está logado
--                 com papel de diretoria (admin_geral). Mesmas funções: unidades,
--                 PDF, proposta.
-- Idempotente. Aplicar no Supabase (idjzh) → SQL Editor.

alter table public.empreendimentos
  add column if not exists visibilidade text not null default 'publica';

do $$ begin
  alter table public.empreendimentos
    add constraint empreendimentos_visibilidade_check check (visibilidade in ('publica', 'diretoria'));
exception when duplicate_object then null; end $$;

-- Público (anon e qualquer sessão): só empreendimentos ativos E públicos.
drop policy if exists "Público vê empreendimentos ativos" on public.empreendimentos;
create policy "Público vê empreendimentos ativos"
  on public.empreendimentos for select
  using (ativo_publico = true and visibilidade = 'publica');

drop policy if exists "Público vê unidades de empreendimentos ativos" on public.unidades;
create policy "Público vê unidades de empreendimentos ativos"
  on public.unidades for select
  using (
    exists (
      select 1 from public.empreendimentos e
      where e.id = empreendimento_id and e.ativo_publico = true and e.visibilidade = 'publica'
    )
  );
-- As policies "Staff vê todos empreendimentos/unidades" (usuários logados do
-- sistema) continuam valendo — o site restringe as tabelas "Só diretoria" a
-- admin_geral (src/lib/diretoria.ts).
