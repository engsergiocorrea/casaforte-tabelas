-- ============================================================
-- Casa Forte | Tabelas de Vendas
-- Schema PostgreSQL completo para Supabase
-- ============================================================

-- ============================================================
-- EXTENSIONS
-- ============================================================
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm"; -- Para busca textual

-- ============================================================
-- ENUMS
-- ============================================================

create type user_role as enum (
  'admin_geral',
  'admin_comercial',
  'financeiro',
  'visualizador'
);

create type empreendimento_status as enum (
  'pre_lancamento',
  'lancamento',
  'em_obras',
  'entregue',
  'encerrado'
);

create type empreendimento_tipo as enum (
  'casas',
  'apartamentos',
  'studios',
  'lotes',
  'misto'
);

create type indice_correcao as enum (
  'INCC',
  'INCC-M',
  'IPCA',
  'IGP-M',
  '1_mais_igpm',
  '1_mais_ipca',
  'outro'
);

create type unidade_status as enum (
  'disponivel',
  'reservada',
  'vendida',
  'bloqueada',
  'indisponivel'
);

create type unidade_posicao as enum (
  'lateral',
  'frente_mar',
  'nascente',
  'poente',
  'terreo',
  'rooftop',
  'outra'
);

create type periodicidade_intercaladas as enum (
  'semestrais',
  'anuais',
  'personalizada'
);

create type status_contrato as enum (
  'aguardando_contrato',
  'contrato_enviado',
  'contrato_assinado',
  'distrato'
);

create type reserva_status as enum (
  'ativa',
  'vencida',
  'convertida',
  'cancelada'
);

-- ============================================================
-- PROFILES (usuários do sistema)
-- ============================================================
create table profiles (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid references auth.users(id) on delete cascade not null unique,
  nome          text not null,
  email         text not null unique,
  telefone      text,
  role          user_role not null default 'visualizador',
  ativo         boolean not null default true,
  avatar_url    text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ============================================================
-- EMPREENDIMENTOS
-- ============================================================
create table empreendimentos (
  id                        uuid primary key default uuid_generate_v4(),
  nome                      text not null,
  slug                      text not null unique,
  localizacao               text,
  cidade                    text not null,
  estado                    char(2) not null,
  descricao_curta           text,
  descricao_completa        text,
  imagem_capa_url           text,
  logo_url                  text,
  planta_url                text,
  status                    empreendimento_status not null default 'lancamento',
  tipo                      empreendimento_tipo not null default 'apartamentos',
  indice_ate_entrega        indice_correcao not null default 'INCC-M',
  indice_apos_entrega       indice_correcao not null default '1_mais_igpm',
  observacoes_publicas      text,
  observacoes_internas      text,
  parcelas_padrao           int not null default 60,
  percentual_sinal_padrao   numeric(5,2) not null default 20.00,
  percentual_chaves_padrao  numeric(5,2) not null default 20.00,
  percentual_intercaladas_padrao numeric(5,2) default 10.00,
  ativo_publico             boolean not null default true,
  data_prevista_entrega     date,
  created_by                uuid references profiles(id),
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

create index idx_empreendimentos_slug on empreendimentos(slug);
create index idx_empreendimentos_ativo on empreendimentos(ativo_publico);
create index idx_empreendimentos_status on empreendimentos(status);

-- ============================================================
-- UNIDADES
-- ============================================================
create table unidades (
  id                          uuid primary key default uuid_generate_v4(),
  empreendimento_id           uuid references empreendimentos(id) on delete cascade not null,
  unidade                     text not null,
  bloco                       text,
  pavimento                   text,
  setor                       text,
  tipo                        text,
  categoria                   text,
  area_construida             numeric(10,2),
  area_privativa_externa      numeric(10,2),
  area_privativa_total        numeric(10,2),
  area_terreno                numeric(10,2),
  area_total                  numeric(10,2),
  quartos                     int,
  suites                      int,
  banheiros                   int,
  vagas                       int,
  posicao                     unidade_posicao,
  descricao                   text,
  -- Valores financeiros
  valor_imovel                numeric(14,2),
  percentual_sinal            numeric(5,2),
  valor_sinal                 numeric(14,2),
  quantidade_parcelas         int,
  valor_parcela               numeric(14,2),
  quantidade_intercaladas     int,
  periodicidade_intercaladas  periodicidade_intercaladas,
  valor_intercalada           numeric(14,2),
  valor_total_intercaladas    numeric(14,2),
  valor_chaves                numeric(14,2),
  percentual_chaves           numeric(5,2),
  -- Status e exibição
  status                      unidade_status not null default 'disponivel',
  destaque                    boolean not null default false,
  cor_destaque                text,
  observacoes_publicas        text,
  observacoes_internas        text,
  -- Dados de venda/reserva
  comprador_nome              text,
  comprador_documento         text,
  corretor_responsavel        text,
  data_reserva                date,
  data_venda                  date,
  -- Auditoria
  created_by                  uuid references profiles(id),
  updated_by                  uuid references profiles(id),
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now(),

  unique(empreendimento_id, unidade, bloco)
);

create index idx_unidades_empreendimento on unidades(empreendimento_id);
create index idx_unidades_status on unidades(status);
create index idx_unidades_pavimento on unidades(empreendimento_id, pavimento);
create index idx_unidades_bloco on unidades(empreendimento_id, bloco);

-- ============================================================
-- VENDAS
-- ============================================================
create table vendas (
  id                    uuid primary key default uuid_generate_v4(),
  unidade_id            uuid references unidades(id) on delete restrict not null,
  empreendimento_id     uuid references empreendimentos(id) on delete restrict not null,
  comprador_nome        text not null,
  comprador_documento   text,
  corretor_responsavel  text,
  data_venda            date not null,
  valor_venda           numeric(14,2) not null,
  valor_sinal           numeric(14,2),
  valor_parcelas        numeric(14,2),
  valor_intercaladas    numeric(14,2),
  valor_chaves          numeric(14,2),
  forma_pagamento       text,
  comissao              numeric(14,2),
  status_contrato       status_contrato not null default 'aguardando_contrato',
  observacoes           text,
  created_by            uuid references profiles(id),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index idx_vendas_empreendimento on vendas(empreendimento_id);
create index idx_vendas_data on vendas(data_venda);
create index idx_vendas_corretor on vendas(corretor_responsavel);

-- ============================================================
-- RESERVAS
-- ============================================================
create table reservas (
  id                    uuid primary key default uuid_generate_v4(),
  unidade_id            uuid references unidades(id) on delete restrict not null,
  empreendimento_id     uuid references empreendimentos(id) on delete restrict not null,
  interessado_nome      text not null,
  interessado_contato   text,
  corretor_responsavel  text,
  data_reserva          date not null default current_date,
  validade_reserva      date not null,
  status                reserva_status not null default 'ativa',
  observacoes           text,
  created_by            uuid references profiles(id),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index idx_reservas_unidade on reservas(unidade_id);
create index idx_reservas_validade on reservas(validade_reserva);
create index idx_reservas_status on reservas(status);

-- ============================================================
-- CONFIGURAÇÕES DA TABELA PÚBLICA
-- ============================================================
create table configuracoes_tabela (
  id                          uuid primary key default uuid_generate_v4(),
  empreendimento_id           uuid references empreendimentos(id) on delete cascade not null unique,
  mostrar_unidades_vendidas   boolean not null default true,
  mostrar_valores_reservadas  boolean not null default false,
  mostrar_valores_vendidas    boolean not null default false,
  colunas_visiveis            jsonb not null default '["unidade","bloco","pavimento","area_construida","area_total","quartos","posicao","valor_imovel","valor_sinal","quantidade_parcelas","valor_parcela","valor_intercalada","valor_chaves","status"]'::jsonb,
  ordenar_por                 text not null default 'pavimento',
  agrupar_por                 text,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

-- ============================================================
-- AUDIT LOGS
-- ============================================================
create table audit_logs (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid references profiles(id),
  acao            text not null,
  tabela          text not null,
  registro_id     uuid,
  dados_anteriores jsonb,
  dados_novos     jsonb,
  ip_address      inet,
  created_at      timestamptz not null default now()
);

create index idx_audit_logs_tabela on audit_logs(tabela, registro_id);
create index idx_audit_logs_user on audit_logs(user_id);
create index idx_audit_logs_created on audit_logs(created_at desc);

-- ============================================================
-- FUNÇÕES UTILITÁRIAS
-- ============================================================

-- Auto-update updated_at
create or replace function handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Trigger para cada tabela com updated_at
create trigger t_profiles_updated_at
  before update on profiles
  for each row execute function handle_updated_at();

create trigger t_empreendimentos_updated_at
  before update on empreendimentos
  for each row execute function handle_updated_at();

create trigger t_unidades_updated_at
  before update on unidades
  for each row execute function handle_updated_at();

create trigger t_vendas_updated_at
  before update on vendas
  for each row execute function handle_updated_at();

create trigger t_reservas_updated_at
  before update on reservas
  for each row execute function handle_updated_at();

create trigger t_configuracoes_tabela_updated_at
  before update on configuracoes_tabela
  for each row execute function handle_updated_at();

-- Auto-criar configurações ao criar empreendimento
create or replace function create_configuracoes_on_empreendimento()
returns trigger language plpgsql as $$
begin
  insert into configuracoes_tabela (empreendimento_id)
  values (new.id)
  on conflict (empreendimento_id) do nothing;
  return new;
end;
$$;

create trigger t_auto_configuracoes
  after insert on empreendimentos
  for each row execute function create_configuracoes_on_empreendimento();

-- Auto-criar perfil ao criar usuário auth
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (user_id, nome, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end;
$$;

create trigger t_new_user_profile
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================
-- VIEWS ÚTEIS
-- ============================================================

-- Resumo de unidades por empreendimento
create or replace view vw_resumo_empreendimento as
select
  e.id,
  e.nome,
  e.slug,
  e.status,
  e.cidade,
  e.estado,
  count(u.id)                                               as total_unidades,
  count(u.id) filter (where u.status = 'disponivel')       as disponiveis,
  count(u.id) filter (where u.status = 'vendida')          as vendidas,
  count(u.id) filter (where u.status = 'reservada')        as reservadas,
  count(u.id) filter (where u.status = 'bloqueada')        as bloqueadas,
  sum(u.valor_imovel)                                       as vgv_total,
  sum(u.valor_imovel) filter (where u.status = 'vendida')  as vgv_vendido,
  sum(u.valor_imovel) filter (where u.status = 'disponivel') as vgv_disponivel,
  round(
    100.0 * count(u.id) filter (where u.status = 'vendida') / nullif(count(u.id), 0), 1
  )                                                         as percentual_vendido,
  avg(u.valor_imovel) filter (where u.status = 'vendida')  as ticket_medio
from empreendimentos e
left join unidades u on u.empreendimento_id = e.id
group by e.id, e.nome, e.slug, e.status, e.cidade, e.estado;

-- Dashboard geral
create or replace view vw_dashboard as
select
  count(distinct e.id)                                           as total_empreendimentos,
  count(u.id)                                                    as total_unidades,
  count(u.id) filter (where u.status = 'disponivel')            as total_disponiveis,
  count(u.id) filter (where u.status = 'vendida')               as total_vendidas,
  count(u.id) filter (where u.status = 'reservada')             as total_reservadas,
  sum(u.valor_imovel)                                            as vgv_total,
  sum(u.valor_imovel) filter (where u.status = 'vendida')       as vgv_vendido,
  sum(u.valor_imovel) filter (where u.status = 'disponivel')    as vgv_disponivel,
  sum(v.valor_venda) filter (
    where date_trunc('month', v.data_venda) = date_trunc('month', current_date)
  )                                                              as vendas_mes_valor,
  count(v.id) filter (
    where date_trunc('month', v.data_venda) = date_trunc('month', current_date)
  )                                                              as vendas_mes_qtd,
  avg(v.valor_venda)                                            as ticket_medio_vendas,
  round(
    100.0 * count(u.id) filter (where u.status = 'vendida') / nullif(count(u.id), 0), 1
  )                                                              as percentual_vendido_geral
from empreendimentos e
left join unidades u on u.empreendimento_id = e.id and e.ativo_publico = true
left join vendas v on v.empreendimento_id = e.id;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table profiles enable row level security;
alter table empreendimentos enable row level security;
alter table unidades enable row level security;
alter table vendas enable row level security;
alter table reservas enable row level security;
alter table configuracoes_tabela enable row level security;
alter table audit_logs enable row level security;

-- Helper: obter role do usuário logado
create or replace function get_user_role()
returns user_role language sql security definer stable as $$
  select role from profiles where user_id = auth.uid()
$$;

-- Helper: checar se é admin
create or replace function is_admin()
returns boolean language sql security definer stable as $$
  select exists(
    select 1 from profiles
    where user_id = auth.uid()
    and role in ('admin_geral', 'admin_comercial')
    and ativo = true
  )
$$;

-- ============================================================
-- POLICIES: profiles
-- ============================================================
create policy "Usuários veem o próprio perfil"
  on profiles for select
  using (user_id = auth.uid());

create policy "Admin geral vê todos perfis"
  on profiles for select
  using (get_user_role() = 'admin_geral');

create policy "Usuários atualizam o próprio perfil"
  on profiles for update
  using (user_id = auth.uid());

create policy "Admin geral gerencia perfis"
  on profiles for all
  using (get_user_role() = 'admin_geral');

-- ============================================================
-- POLICIES: empreendimentos
-- ============================================================
-- Público pode ver empreendimentos ativos
create policy "Público vê empreendimentos ativos"
  on empreendimentos for select
  using (ativo_publico = true);

-- Admins e financeiro veem todos
create policy "Staff vê todos empreendimentos"
  on empreendimentos for select
  using (get_user_role() in ('admin_geral', 'admin_comercial', 'financeiro', 'visualizador'));

-- Admins podem criar/editar
create policy "Admins gerenciam empreendimentos"
  on empreendimentos for insert
  with check (get_user_role() in ('admin_geral', 'admin_comercial'));

create policy "Admins editam empreendimentos"
  on empreendimentos for update
  using (get_user_role() in ('admin_geral', 'admin_comercial'));

-- Só admin geral pode excluir
create policy "Admin geral exclui empreendimentos"
  on empreendimentos for delete
  using (get_user_role() = 'admin_geral');

-- ============================================================
-- POLICIES: unidades
-- ============================================================
-- Público vê unidades de empreendimentos ativos
create policy "Público vê unidades de empreendimentos ativos"
  on unidades for select
  using (
    exists (
      select 1 from empreendimentos e
      where e.id = empreendimento_id and e.ativo_publico = true
    )
  );

-- Staff vê todas
create policy "Staff vê todas unidades"
  on unidades for select
  using (get_user_role() is not null);

-- Admins comerciais gerenciam unidades
create policy "Admins gerenciam unidades"
  on unidades for insert
  with check (get_user_role() in ('admin_geral', 'admin_comercial'));

create policy "Admins editam unidades"
  on unidades for update
  using (get_user_role() in ('admin_geral', 'admin_comercial'));

create policy "Admin geral exclui unidades"
  on unidades for delete
  using (get_user_role() = 'admin_geral');

-- ============================================================
-- POLICIES: vendas
-- ============================================================
create policy "Staff financeiro e admin veem vendas"
  on vendas for select
  using (get_user_role() in ('admin_geral', 'admin_comercial', 'financeiro', 'visualizador'));

create policy "Admins registram vendas"
  on vendas for insert
  with check (get_user_role() in ('admin_geral', 'admin_comercial'));

create policy "Admins editam vendas"
  on vendas for update
  using (get_user_role() in ('admin_geral', 'admin_comercial'));

create policy "Admin geral exclui vendas"
  on vendas for delete
  using (get_user_role() = 'admin_geral');

-- ============================================================
-- POLICIES: reservas
-- ============================================================
create policy "Staff vê reservas"
  on reservas for select
  using (get_user_role() in ('admin_geral', 'admin_comercial', 'financeiro', 'visualizador'));

create policy "Admins gerenciam reservas"
  on reservas for all
  using (get_user_role() in ('admin_geral', 'admin_comercial'));

-- ============================================================
-- POLICIES: configuracoes_tabela
-- ============================================================
create policy "Público vê config de empreendimentos ativos"
  on configuracoes_tabela for select
  using (
    exists (
      select 1 from empreendimentos e
      where e.id = empreendimento_id and e.ativo_publico = true
    )
  );

create policy "Admins gerenciam configurações"
  on configuracoes_tabela for all
  using (get_user_role() in ('admin_geral', 'admin_comercial'));

-- ============================================================
-- POLICIES: audit_logs
-- ============================================================
create policy "Admin geral vê audit logs"
  on audit_logs for select
  using (get_user_role() = 'admin_geral');

create policy "Sistema insere audit logs"
  on audit_logs for insert
  with check (true); -- controlado pela aplicação
