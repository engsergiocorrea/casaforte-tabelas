// ============================================================
// Casa Forte | Tipos TypeScript
// ============================================================

export type UserRole = 'admin_geral' | 'admin_comercial' | 'financeiro' | 'visualizador'

export type EmpreendimentoStatus =
  | 'pre_lancamento'
  | 'lancamento'
  | 'em_obras'
  | 'entregue'
  | 'encerrado'

export type EmpreendimentoTipo =
  | 'casas'
  | 'apartamentos'
  | 'studios'
  | 'lotes'
  | 'misto'

export type IndiceCorrecao =
  | 'INCC'
  | 'INCC-M'
  | 'IPCA'
  | 'IGP-M'
  | '1_mais_igpm'
  | '1_mais_ipca'
  | 'outro'

export type UnidadeStatus =
  | 'disponivel'
  | 'reservada'
  | 'vendida'
  | 'bloqueada'
  | 'indisponivel'

export type UnidadePosicao =
  | 'lateral'
  | 'frente_mar'
  | 'nascente'
  | 'poente'
  | 'terreo'
  | 'rooftop'
  | 'outra'

export type PeriodicidadeIntercaladas = 'semestrais' | 'anuais' | 'personalizada'
export type StatusContrato =
  | 'aguardando_contrato'
  | 'contrato_enviado'
  | 'contrato_assinado'
  | 'distrato'

export type ReservaStatus = 'ativa' | 'vencida' | 'convertida' | 'cancelada'

// ============================================================
// ENTIDADES PRINCIPAIS
// ============================================================

export interface Profile {
  id: string
  user_id: string
  nome: string
  email: string
  telefone?: string
  role: UserRole
  ativo: boolean
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface Empreendimento {
  id: string
  nome: string
  slug: string
  localizacao?: string
  cidade: string
  estado: string
  descricao_curta?: string
  descricao_completa?: string
  imagem_capa_url?: string
  logo_url?: string
  planta_url?: string
  status: EmpreendimentoStatus
  tipo: EmpreendimentoTipo
  indice_ate_entrega: IndiceCorrecao
  indice_apos_entrega: IndiceCorrecao
  observacoes_publicas?: string
  observacoes_internas?: string
  parcelas_padrao: number
  percentual_sinal_padrao: number
  percentual_chaves_padrao: number
  percentual_intercaladas_padrao?: number
  ativo_publico: boolean
  data_prevista_entrega?: string
  created_by?: string
  created_at: string
  updated_at: string
}

export interface Unidade {
  id: string
  empreendimento_id: string
  unidade: string
  bloco?: string
  pavimento?: string
  setor?: string
  tipo?: string
  categoria?: string
  area_construida?: number
  area_privativa_externa?: number
  area_privativa_total?: number
  area_terreno?: number
  area_total?: number
  quartos?: number
  suites?: number
  banheiros?: number
  vagas?: number
  posicao?: UnidadePosicao
  descricao?: string
  valor_imovel?: number
  percentual_sinal?: number
  valor_sinal?: number
  quantidade_parcelas?: number
  valor_parcela?: number
  quantidade_intercaladas?: number
  periodicidade_intercaladas?: PeriodicidadeIntercaladas
  valor_intercalada?: number
  valor_total_intercaladas?: number
  valor_chaves?: number
  percentual_chaves?: number
  status: UnidadeStatus
  destaque: boolean
  cor_destaque?: string
  observacoes_publicas?: string
  observacoes_internas?: string
  comprador_nome?: string
  comprador_documento?: string
  corretor_responsavel?: string
  data_reserva?: string
  data_venda?: string
  created_by?: string
  updated_by?: string
  created_at: string
  updated_at: string
}

export interface Venda {
  id: string
  unidade_id: string
  empreendimento_id: string
  comprador_nome: string
  comprador_documento?: string
  corretor_responsavel?: string
  data_venda: string
  valor_venda: number
  valor_sinal?: number
  valor_parcelas?: number
  valor_intercaladas?: number
  valor_chaves?: number
  forma_pagamento?: string
  comissao?: number
  status_contrato: StatusContrato
  observacoes?: string
  created_by?: string
  created_at: string
  updated_at: string
}

export interface Reserva {
  id: string
  unidade_id: string
  empreendimento_id: string
  interessado_nome: string
  interessado_contato?: string
  corretor_responsavel?: string
  data_reserva: string
  validade_reserva: string
  status: ReservaStatus
  observacoes?: string
  created_by?: string
  created_at: string
  updated_at: string
}

export interface ConfiguracaoTabela {
  id: string
  empreendimento_id: string
  mostrar_unidades_vendidas: boolean
  mostrar_valores_reservadas: boolean
  mostrar_valores_vendidas: boolean
  colunas_visiveis: string[]
  ordenar_por: string
  agrupar_por?: string
  created_at: string
  updated_at: string
}

// ============================================================
// VIEWS / AGREGAÇÕES
// ============================================================

export interface ResumoEmpreendimento {
  id: string
  nome: string
  slug: string
  status: EmpreendimentoStatus
  cidade: string
  estado: string
  total_unidades: number
  disponiveis: number
  vendidas: number
  reservadas: number
  bloqueadas: number
  vgv_total: number
  vgv_vendido: number
  vgv_disponivel: number
  percentual_vendido: number
  ticket_medio: number
}

export interface DashboardData {
  total_empreendimentos: number
  total_unidades: number
  total_disponiveis: number
  total_vendidas: number
  total_reservadas: number
  vgv_total: number
  vgv_vendido: number
  vgv_disponivel: number
  vendas_mes_valor: number
  vendas_mes_qtd: number
  ticket_medio_vendas: number
  percentual_vendido_geral: number
}

// ============================================================
// FORMULÁRIOS
// ============================================================

export type EmpreendimentoForm = Omit<
  Empreendimento,
  'id' | 'created_at' | 'updated_at' | 'created_by'
>

export type UnidadeForm = Omit<
  Unidade,
  'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'
>

export type VendaForm = Omit<Venda, 'id' | 'created_at' | 'updated_at' | 'created_by'>
export type ReservaForm = Omit<Reserva, 'id' | 'created_at' | 'updated_at' | 'created_by'>

// ============================================================
// HELPERS DE DISPLAY
// ============================================================

export const STATUS_LABELS: Record<UnidadeStatus, string> = {
  disponivel: 'Disponível',
  reservada: 'Reservada',
  vendida: 'Vendida',
  bloqueada: 'Bloqueada',
  indisponivel: 'Indisponível',
}

export const STATUS_COLORS: Record<UnidadeStatus, string> = {
  disponivel: '#16a34a',
  reservada: '#d97706',
  vendida: '#dc2626',
  bloqueada: '#6b7280',
  indisponivel: '#9ca3af',
}

export const EMPREENDIMENTO_STATUS_LABELS: Record<EmpreendimentoStatus, string> = {
  pre_lancamento: 'Pré-lançamento',
  lancamento: 'Lançamento',
  em_obras: 'Em obras',
  entregue: 'Entregue',
  encerrado: 'Encerrado',
}

export const INDICE_LABELS: Record<IndiceCorrecao, string> = {
  INCC: 'INCC',
  'INCC-M': 'INCC-M',
  IPCA: 'IPCA',
  'IGP-M': 'IGP-M',
  '1_mais_igpm': '1% + IGP-M',
  '1_mais_ipca': '1% + IPCA',
  outro: 'Outro',
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin_geral: 'Administrador Geral',
  admin_comercial: 'Admin. Comercial',
  financeiro: 'Financeiro',
  visualizador: 'Visualizador',
}

export const COLUNAS_DISPONIVEIS = [
  { key: 'unidade', label: 'Unidade' },
  { key: 'bloco', label: 'Bloco' },
  { key: 'pavimento', label: 'Pavimento' },
  { key: 'setor', label: 'Setor' },
  { key: 'tipo', label: 'Tipo' },
  { key: 'area_construida', label: 'Área Construída' },
  { key: 'area_privativa_externa', label: 'Área Priv. Externa' },
  { key: 'area_total', label: 'Área Total' },
  { key: 'area_terreno', label: 'Área do Terreno' },
  { key: 'quartos', label: 'Quartos' },
  { key: 'suites', label: 'Suítes' },
  { key: 'vagas', label: 'Vagas' },
  { key: 'posicao', label: 'Posição' },
  { key: 'valor_imovel', label: 'Valor do Imóvel' },
  { key: 'valor_sinal', label: 'Entrada / Sinal' },
  { key: 'quantidade_parcelas', label: 'Parcelas' },
  { key: 'valor_parcela', label: 'Valor Parcela' },
  { key: 'valor_intercalada', label: 'Intercaladas' },
  { key: 'valor_chaves', label: 'Chaves' },
  { key: 'status', label: 'Status' },
]
