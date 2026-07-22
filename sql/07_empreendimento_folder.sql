-- Folder (material/brochura) por empreendimento, exibido com destaque na tabela
-- pública para o corretor baixar. Fica no bucket público 'empreendimentos'.
-- Rodar no SQL Editor do Supabase (idjzh).
alter table public.empreendimentos
  add column if not exists folder_url text;
