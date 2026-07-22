-- Permite que usuários autenticados (staff/admin) subam e atualizem arquivos
-- no bucket público 'empreendimentos' (imagem de capa, logo e folder em PDF).
-- Sem isso o botão de upload do admin falha por RLS ("new row violates
-- row-level security policy") — só colar a URL funcionava.
-- O bucket já é público para leitura; aqui liberamos apenas a escrita autenticada.
-- Rodar no SQL Editor do Supabase (idjzh).

drop policy if exists "staff sobe arquivos de empreendimentos" on storage.objects;
create policy "staff sobe arquivos de empreendimentos"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'empreendimentos');

drop policy if exists "staff atualiza arquivos de empreendimentos" on storage.objects;
create policy "staff atualiza arquivos de empreendimentos"
  on storage.objects for update to authenticated
  using (bucket_id = 'empreendimentos')
  with check (bucket_id = 'empreendimentos');
