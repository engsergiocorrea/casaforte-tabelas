# Casa Forte | Tabelas de Vendas

Sistema de compartilhamento de tabelas de vendas para a Casa Forte Construtora e Incorporadora.

---

## Visão geral

Plataforma com duas partes:

**Site público** — corretores, clientes e investidores acessam a tabela de vendas atualizada de cada empreendimento, com filtros e download em PDF.

**Área administrativa** — equipe interna cadastra empreendimentos, gerencia unidades, registra vendas, acompanha o dashboard e gera relatórios.

---

## Stack

- **Next.js 14** (App Router + TypeScript)
- **Supabase** (PostgreSQL + Auth + Storage + RLS)
- **Tailwind CSS** (design system Casa Forte)
- **React Hook Form + Zod** (formulários e validação)
- **Recharts** (gráficos do dashboard)
- **@react-pdf/renderer** (geração de PDF no servidor)
- **Vercel** (deploy e CI/CD)

---

## Como rodar localmente

### 1. Pré-requisitos

- Node.js 18+
- npm ou pnpm
- Conta no Supabase (gratuita)
- Conta na Vercel (para deploy)

### 2. Clonar e instalar

```bash
git clone <repo>
cd casaforte-tabelas
npm install
```

### 3. Configurar o Supabase

#### 3.1 Criar o projeto

1. Acesse [supabase.com](https://supabase.com) e crie um novo projeto
2. Escolha a região **São Paulo (sa-east-1)** para melhor performance no Brasil
3. Anote a URL e as chaves API

#### 3.2 Criar o schema

No painel do Supabase, vá em **SQL Editor** e execute o arquivo:

```
sql/01_schema.sql
```

Isso cria todas as tabelas, enums, views, triggers, RLS e políticas de segurança.

#### 3.3 Configurar Storage

No Supabase Dashboard > Storage:

1. Crie um bucket chamado `empreendimentos` (público)
2. Crie um bucket chamado `unidades` (público)
3. Configure as políticas:

```sql
-- Leitura pública para imagens de empreendimentos
CREATE POLICY "Imagens públicas"
  ON storage.objects FOR SELECT
  USING (bucket_id IN ('empreendimentos', 'unidades'));

-- Upload apenas para usuários autenticados
CREATE POLICY "Upload autenticado"
  ON storage.objects FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Deleção apenas pelo dono ou admin
CREATE POLICY "Delete autenticado"
  ON storage.objects FOR DELETE
  USING (auth.role() = 'authenticated');
```

#### 3.4 Criar primeiro usuário admin

No Supabase Dashboard > Authentication > Users:

1. Clique em "Add user"
2. Informe e-mail e senha
3. Depois de criado, acesse o SQL Editor e execute:

```sql
UPDATE profiles
SET role = 'admin_geral', ativo = true
WHERE email = 'seu@email.com';
```

### 4. Variáveis de ambiente

```bash
cp .env.example .env.local
```

Edite `.env.local` com suas credenciais do Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. Iniciar o servidor de desenvolvimento

```bash
npm run dev
```

Acesse:
- **Site público**: http://localhost:3000
- **Admin**: http://localhost:3000/admin/login

---

## Como importar unidades via CSV

O sistema aceita importação em massa. Formato esperado:

```csv
unidade,bloco,pavimento,tipo,area_construida,area_total,quartos,suites,vagas,posicao,valor_imovel,percentual_sinal,quantidade_parcelas,quantidade_intercaladas,periodicidade_intercaladas,valor_chaves,percentual_chaves,status,observacoes_publicas
T-01,,Térreo,Apartamento,62.40,90.40,2,1,1,frente_mar,780000,10,60,2,semestrais,,20,disponivel,
T-02,A,1° Pav,Apartamento,58.80,58.80,2,1,1,lateral,690000,10,60,2,semestrais,,20,disponivel,
```

Na área admin, em **Empreendimentos > [empreendimento] > Unidades**, clique em "Importar CSV" e faça o upload.

### Campos obrigatórios no CSV

| Campo | Tipo | Valores aceitos |
|-------|------|-----------------|
| `unidade` | texto | qualquer |
| `valor_imovel` | número | ex: `780000` |
| `status` | enum | `disponivel`, `reservada`, `vendida`, `bloqueada`, `indisponivel` |

Todos os outros campos são opcionais.

---

## Estrutura de pastas

```
src/
├── app/
│   ├── (public)/                 # Site público (sem auth)
│   │   ├── page.tsx              # Listagem de empreendimentos
│   │   └── empreendimentos/
│   │       └── [slug]/
│   │           ├── page.tsx      # Tabela de vendas pública
│   │           └── download/
│   │               └── route.ts  # Geração de PDF
│   ├── admin/                    # Área administrativa
│   │   ├── layout.tsx            # Layout com sidebar
│   │   ├── login/page.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── empreendimentos/
│   │   ├── unidades/
│   │   ├── vendas/
│   │   ├── relatorios/
│   │   └── usuarios/
│   ├── api/                      # API routes
│   ├── globals.css
│   └── layout.tsx
├── components/
│   ├── public/                   # Componentes da área pública
│   │   └── TabelaPublica.tsx
│   ├── admin/                    # Componentes administrativos
│   │   ├── AdminSidebar.tsx
│   │   └── DashboardCharts.tsx
│   ├── ui/                       # Componentes genéricos reutilizáveis
│   └── pdf/
│       └── TabelaPDF.tsx         # Documento PDF
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # Cliente browser
│   │   └── server.ts             # Cliente servidor
│   └── utils.ts                  # Funções utilitárias
├── types/
│   └── index.ts                  # Tipos TypeScript
└── hooks/                        # Custom hooks
```

---

## Deploy na Vercel

### 1. Conectar o repositório

1. Acesse [vercel.com](https://vercel.com)
2. Clique em "New Project"
3. Importe o repositório do GitHub
4. Framework: **Next.js** (detectado automaticamente)

### 2. Configurar variáveis de ambiente

Na Vercel, em **Settings > Environment Variables**, adicione:

```
NEXT_PUBLIC_SUPABASE_URL     → sua URL do Supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY → chave anon do Supabase
SUPABASE_SERVICE_ROLE_KEY    → service role key (marcar como Secret)
NEXT_PUBLIC_APP_URL          → https://seudominio.com.br
```

### 3. Deploy

Clique em "Deploy". A Vercel faz build e publica automaticamente.

Para deploys futuros, basta fazer push para a branch `main`.

### 4. Domínio personalizado (opcional)

Em **Settings > Domains**, adicione seu domínio e configure o DNS conforme instruído.

---

## Permissões de usuário

| Role | Dashboard | Empreendimentos | Unidades | Vendas | Relatórios | Usuários |
|------|-----------|-----------------|----------|--------|------------|---------|
| Admin Geral | ✅ | ✅ criar/editar/excluir | ✅ | ✅ | ✅ | ✅ |
| Admin Comercial | ✅ | ✅ criar/editar | ✅ criar/editar | ✅ | ✅ | ❌ |
| Financeiro | ✅ | 👁 visualizar | 👁 visualizar | 👁 visualizar | ✅ | ❌ |
| Visualizador | ✅ | 👁 visualizar | 👁 visualizar | ❌ | 👁 visualizar | ❌ |

---

## Fluxo de uso

### Cadastrar um empreendimento

1. Admin > Empreendimentos > Novo empreendimento
2. Preencher dados, fazer upload de imagens
3. Salvar — o sistema cria automaticamente as configurações da tabela pública

### Cadastrar unidades

Duas opções:
- **Manual**: Admin > Empreendimentos > [empreendimento] > Unidades > Nova unidade
- **Em massa**: Admin > Empreendimentos > [empreendimento] > Importar CSV

### Publicar para corretores

1. No empreendimento, ativar "Exibir no site público"
2. Copiar o link: `https://seusite.com/empreendimentos/nome-do-empreendimento`
3. Compartilhar por WhatsApp, e-mail, etc.

### Registrar uma venda

1. Admin > Unidades > [unidade] > Alterar status para "Vendida"
2. Preencher dados do comprador, corretor, valores
3. O status da unidade é atualizado automaticamente na tabela pública

---

## Variáveis de ambiente de produção

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...  # SECRET — nunca expor
NEXT_PUBLIC_APP_URL=https://seusite.com.br
```

---

## Suporte e evolução

### Funcionalidades do MVP

- [x] Login administrativo
- [x] Cadastro de empreendimentos
- [x] Cadastro de unidades
- [x] Tabela pública com filtros
- [x] Alteração de status da unidade
- [x] Download da tabela em PDF
- [x] Dashboard com KPIs e gráficos

### Próximas versões

- [ ] Relatórios avançados com exportação CSV
- [ ] Importação CSV de unidades
- [ ] Reservas com controle de validade
- [ ] Ranking de corretores
- [ ] Histórico de alterações por unidade
- [ ] Notificações de reservas vencidas
- [ ] Assinatura de contratos via DocuSign/ClickSign

---

© Casa Forte Construtora e Incorporadora
