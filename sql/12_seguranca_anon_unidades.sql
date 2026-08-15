-- ITEM 4 da revisão de segurança — Proteger a tabela 'unidades' da chave pública.
-- Rodar no SQL Editor do Supabase (idjzh) DEPOIS que o deploy do código estiver
-- no ar (o site passou a pedir só as colunas públicas, então o grant abaixo não
-- quebra a leitura pública).
--
-- Contexto (testado ao vivo): a chave pública lia TODAS as colunas de unidades,
-- incluindo comprador_nome, comprador_documento, corretor_responsavel,
-- observacoes_internas e datas de venda — e ainda conseguia INSERIR.

-- 1) Escrita: a chave pública não deve inserir/alterar/excluir unidades.
revoke insert, update, delete on public.unidades from anon;

-- 2) Leitura: só as colunas públicas (esconde dados de comprador, corretor,
--    datas de venda/reserva, observações internas e auditoria).
revoke select on public.unidades from anon;
grant select (
  id, empreendimento_id, unidade, bloco, pavimento, setor, tipo, categoria,
  area_construida, area_privativa_externa, area_privativa_total, area_terreno, area_total,
  quartos, suites, banheiros, vagas, posicao, descricao,
  valor_imovel, percentual_sinal, valor_sinal,
  quantidade_parcelas, valor_parcela, quantidade_intercaladas, periodicidade_intercaladas,
  valor_intercalada, valor_total_intercaladas, valor_chaves, percentual_chaves,
  status, destaque, cor_destaque, observacoes_publicas, created_at, updated_at
) on public.unidades to anon;
