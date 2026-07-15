-- Intercaladas: data da 1ª intercalada + periodicidade em meses (campo livre).
-- As demais datas são calculadas (1ª data + meses × i) no Tabelas (contrato)
-- e expostas na API interna para o módulo Contratos preencher o contrato.
-- A coluna enum periodicidade_intercaladas continua existindo (semestrais/
-- anuais/personalizada) por compatibilidade; a fonte da verdade dos meses
-- passa a ser periodicidade_meses_intercaladas.
alter table propostas
  add column if not exists periodicidade_meses_intercaladas int,
  add column if not exists data_primeira_intercalada date;
