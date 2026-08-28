-- 13_proposta_endereco_nacionalidade.sql
-- Campos que faltavam na proposta para o contrato sair pronto (sem preencher
-- manualmente na conferência): endereço (CEP autofill via ViaCEP), nacionalidade,
-- naturalidade dos compradores/cônjuge, e a data da 1ª parcela mensal.
-- Idempotente. Rodar no SQL editor do Supabase (idjzh).

ALTER TABLE propostas
  ADD COLUMN IF NOT EXISTS comprador1_cep           text,
  ADD COLUMN IF NOT EXISTS comprador1_endereco      text,
  ADD COLUMN IF NOT EXISTS comprador1_nacionalidade text,
  ADD COLUMN IF NOT EXISTS comprador1_naturalidade  text,
  ADD COLUMN IF NOT EXISTS conjuge_cep              text,
  ADD COLUMN IF NOT EXISTS conjuge_endereco         text,
  ADD COLUMN IF NOT EXISTS conjuge_nacionalidade    text,
  ADD COLUMN IF NOT EXISTS conjuge_naturalidade     text,
  ADD COLUMN IF NOT EXISTS comprador2_cep           text,
  ADD COLUMN IF NOT EXISTS comprador2_endereco      text,
  ADD COLUMN IF NOT EXISTS comprador2_nacionalidade text,
  ADD COLUMN IF NOT EXISTS comprador2_naturalidade  text,
  ADD COLUMN IF NOT EXISTS data_primeira_parcela    date;
