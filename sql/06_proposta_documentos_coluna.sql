-- Guarda a lista de documentos que o corretor anexou à proposta (paths no
-- bucket privado 'proposta-documentos'). Rodar no SQL Editor do Supabase (idjzh).
alter table public.propostas
  add column if not exists documentos jsonb;
