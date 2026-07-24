-- ITEM 2 da revisão de segurança — Fechar acesso indevido da CHAVE PÚBLICA (anon).
-- Rodar no SQL Editor do Supabase (idjzh).
--
-- Contexto (testado ao vivo): a chave pública (que fica no JS do site) hoje
-- consegue LER todos os 'profiles' (e-mail/telefone/papel da equipe) e INSERIR;
-- e consegue INSERIR em 'empreendimentos'. Isto remove esses acessos.
--
-- Seguro porque:
--  - A leitura pública de empreendimentos (marketing) É MANTIDA (só tiramos escrita).
--  - Admins logados usam a role 'authenticated' (não 'anon') — não são afetados.
--  - As rotas server-side usam a service role — não são afetadas.
--  - profiles só é lido no app por admin logado (authenticated) e por rotas
--    server-side (service role); nunca pela anon.

-- profiles: a chave pública não deve ler nem escrever nada aqui.
revoke all on table public.profiles from anon;

-- empreendimentos: leitura pública OK; escrita por anon não.
revoke insert, update, delete on table public.empreendimentos from anon;

-- (Opcional) Conferência rápida dos grants restantes para a role anon:
--   select table_name, privilege_type
--   from information_schema.role_table_grants
--   where grantee = 'anon' and table_name in ('profiles','empreendimentos')
--   order by table_name, privilege_type;
