-- Preço por m² do empreendimento (modo "tabela por m²").
-- Usado no Villa Maui (entregue): o valor de cada unidade = área × valor_m2,
-- com 20% de entrada e o saldo em financiamento bancário. A administração
-- edita SOMENTE o valor do m² e as áreas; o resto é calculado pelo sistema.
-- Rodar no SQL Editor do Supabase (idjzh).
alter table public.empreendimentos
  add column if not exists valor_m2 numeric(14,2);
