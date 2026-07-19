-- Permite que o corretor (não autenticado, público) suba documentos no bucket
-- privado 'proposta-documentos' — usado na leitura por IA que pré-preenche a
-- proposta. A leitura dos arquivos é feita só server-side (service_role); o
-- corretor NÃO consegue ler o que subiu. Rodar no SQL Editor do Supabase (idjzh).

drop policy if exists "corretor sobe documentos de proposta" on storage.objects;
create policy "corretor sobe documentos de proposta"
  on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'proposta-documentos');
