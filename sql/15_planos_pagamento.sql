-- Planos de pagamento por unidade (21/11/2026) — ex.: WAHOO com 48x e 60x.
-- planos_pagamento = lista de planos alternativos:
--   [{ "nome": "48x", "valor_sinal": 163050, "percentual_sinal": 15,
--      "quantidade_parcelas": 48, "valor_parcela": 11322.92,
--      "quantidade_intercaladas": 8, "periodicidade_intercaladas": "semestrais",
--      "valor_intercalada": 47556.25, "valor_chaves": 0 }, …]
-- Vazio/null = unidade com um plano só (colunas de sempre). Quando há planos,
-- as colunas de sempre guardam o 1º plano (compatível com proposta/contrato).
-- Idempotente. Aplicar no Supabase (idjzh) → SQL Editor.

alter table public.unidades add column if not exists planos_pagamento jsonb;

-- A chave pública (anon) lê unidades por coluna (sql/12): libera a nova.
grant select (planos_pagamento) on public.unidades to anon;
