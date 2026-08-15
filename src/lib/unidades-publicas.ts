// Colunas de 'unidades' seguras para exibição pública (lidas com a chave anon).
// Exclui dados sensíveis que NÃO devem vazar pela chave pública:
//   comprador_nome, comprador_documento, corretor_responsavel,
//   data_reserva, data_venda, observacoes_internas, created_by, updated_by.
// Usada nas telas/rotas públicas em vez de select('*'), casada com o grant por
// coluna no banco (sql/12) para a role anon.
export const COLUNAS_UNIDADE_PUBLICA = [
  'id', 'empreendimento_id', 'unidade', 'bloco', 'pavimento', 'setor', 'tipo', 'categoria',
  'area_construida', 'area_privativa_externa', 'area_privativa_total', 'area_terreno', 'area_total',
  'quartos', 'suites', 'banheiros', 'vagas', 'posicao', 'descricao',
  'valor_imovel', 'percentual_sinal', 'valor_sinal',
  'quantidade_parcelas', 'valor_parcela', 'quantidade_intercaladas', 'periodicidade_intercaladas',
  'valor_intercalada', 'valor_total_intercaladas', 'valor_chaves', 'percentual_chaves',
  'status', 'destaque', 'cor_destaque', 'observacoes_publicas', 'created_at', 'updated_at',
].join(',')
