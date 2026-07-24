-- ITEM 3 da revisão de segurança — Fechar o VAZAMENTO de PII das propostas.
-- Rodar no SQL Editor do Supabase (idjzh).
--
-- ⚠️ ORDEM: rode este SQL SOMENTE DEPOIS que o deploy da rota /api/propostas
-- estiver no ar. Antes disso, a tela antiga ainda envia proposta via anon e
-- este revoke a quebraria.
--
-- Contexto (testado ao vivo): a chave pública lia TODAS as propostas
-- (comprador1_cpf, rg, email, telefone, nascimento...). Agora o envio passa por
-- rota server-side (service role), então a anon não precisa mais tocar nesta
-- tabela. Admins logados (authenticated) continuam vendo via RLS existente.

revoke all on table public.propostas from anon;

-- (Opcional) Conferência:
--   select privilege_type from information_schema.role_table_grants
--   where grantee = 'anon' and table_name = 'propostas';
