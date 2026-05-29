# Casa Forte — Contexto Completo para Claude Code

## SOBRE O PROJETO
Sistema web imobiliário para a **Casa Forte Construtora e Incorporadora**.
Funcionalidades: tabelas de vendas públicas para corretores/clientes, área administrativa completa e fluxo de propostas de compra.

**URL de produção:** `tabelas.casaforteinc.com.br`
**Repositório:** `github.com/engsergiocorrea/casaforte-tabelas`

---

## STACK

| Componente | Tecnologia |
|-----------|------------|
| Framework | Next.js 15 (App Router) |
| Linguagem | TypeScript |
| Estilização | **CSS inline obrigatório** (Tailwind NÃO compila na Vercel) |
| Banco | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Storage | Supabase Storage (bucket `empreendimentos`, público) |
| Deploy | Vercel (auto-deploy via GitHub push na branch `main`) |
| Domínio | Hostinger → CNAME para Vercel |

### ⚠️ REGRAS CRÍTICAS DE IMPLEMENTAÇÃO

1. **NUNCA usar classes Tailwind** — o compilador não funciona na Vercel neste projeto. Usar sempre `style={{}}` inline ou `globals.css` com CSS puro.
2. **Next.js 15 — params assíncronos:**
   - Server components: `const { id } = await params`
   - Client components: `useParams()` do `next/navigation`
3. **`@react-pdf/renderer` não funciona** no serverless da Vercel — usar HTML com `window.print()`
4. **RLS desabilitado** em todas as tabelas (`DISABLE ROW LEVEL SECURITY` + `GRANT ALL`)
5. **Middleware desabilitado** (matcher vazio) — auth feita no `admin/layout.tsx` client-side
6. **Criação de usuários:** trigger de auto-perfil removido — criar perfil manualmente após `signUp`

---

## CREDENCIAIS E IDs

```
Supabase Project ID: idjzhzqvfhtfycvmfoen
Supabase URL: https://idjzhzqvfhtfycvmfoen.supabase.co
Supabase Anon Key: (está nas env vars da Vercel como NEXT_PUBLIC_SUPABASE_ANON_KEY)
Supabase Service Role: (está nas env vars da Vercel como SUPABASE_SERVICE_ROLE_KEY)

GitHub: github.com/engsergiocorrea/casaforte-tabelas
Vercel Project: casaforte-tabelas

UMÁ Milagres ID: 450b9f7b-080a-4c94-9647-6f662854720e
WhatsApp Casa Forte: 5582991017208
Logo URL: https://idjzhzqvfhtfycvmfoen.supabase.co/storage/v1/object/public/empreendimentos/logosemfundo%20casa%20forte.png
```

---

## DESIGN SYSTEM

```
Vermelho principal:  #E8390E
Vermelho escuro:     #B8290A
Charcoal (sidebar):  #2A2A2A
Fundo da página:     #F5F3F0
Borda padrão:        #DDD9D3
Borda leve:          #ECEAE6

Status disponível:   bg #dcfce7  color #15803d
Status reservada:    bg #fef3c7  color #92400e
Status vendida:      bg #fee2e2  color #b91c1c
Status indisponível: bg #f3f4f6  color #6b7280
```

**Padrão de card:**
```tsx
<div style={{background:'white',borderRadius:'12px',border:'1px solid #DDD9D3',padding:'24px'}}>
```

**Padrão de botão primário:**
```tsx
<button style={{padding:'10px 20px',background:'#E8390E',color:'white',border:'none',borderRadius:'8px',fontSize:'14px',fontWeight:'500',cursor:'pointer'}}>
```

---

## ESTRUTURA DE PASTAS

```
src/
  app/
    (public)/
      page.tsx                        ✅ Homepage — lista empreendimentos
      empreendimentos/[slug]/
        page.tsx                      ✅ Tabela pública com filtros
        download/route.ts             ✅ HTML para impressão/PDF
        proposta/[unidadeId]/
          page.tsx                    ✅ Formulário de proposta
    admin/
      layout.tsx                      ✅ Sidebar + proteção de rotas
      login/page.tsx                  ✅ Login
      dashboard/page.tsx              ✅ KPIs + gráficos
      empreendimentos/
        page.tsx                      ✅ Listagem
        novo/page.tsx                 ✅ Cadastro
        [id]/editar/page.tsx          ✅ Edição com upload de imagem
        [id]/unidades/
          page.tsx                    ✅ Listagem de unidades
          nova/page.tsx               ✅ Nova unidade
          importar/page.tsx           ✅ Importar CSV
      unidades/
        page.tsx                      ✅ Todas as unidades
        [id]/editar/page.tsx          ✅ Editar unidade
      vendas/
        page.tsx                      ✅ Listagem
        nova/page.tsx                 ✅ Registrar venda
        [id]/editar/page.tsx          ✅ Editar venda
      relatorios/page.tsx             ✅ Relatórios consolidados
      usuarios/page.tsx               ✅ Gestão de usuários
      propostas/
        page.tsx                      ✅ Listagem de propostas
        [id]/
          page.tsx                    ✅ Detalhes + aprovação
          PropostaAcoes.tsx           ✅ Botões aprovar/recusar/cancelar
          pdf/route.ts                ✅ HTML proposta para impressão
  components/
    public/
      TabelaPublica.tsx               ✅ Tabela com filtros e botão proposta
  lib/
    supabase/client.ts                ✅
    supabase/server.ts                ✅
    utils.ts                          ✅
  types/index.ts                      ✅
```

---

## SCHEMA DO BANCO DE DADOS

### Tabela `empreendimentos`
```sql
id uuid PRIMARY KEY DEFAULT uuid_generate_v4()
nome text NOT NULL
slug text UNIQUE NOT NULL
cidade text, estado text, localizacao text
descricao_curta text
status text -- pre_lancamento | lancamento | em_obras | entregue | encerrado
tipo text -- apartamentos | casas | studios | lotes | misto
imagem_capa_url text
logo_url text
indice_ate_entrega text -- INCC | INCC-M | IPCA | IGP-M | outro
indice_apos_entrega text -- 1_mais_igpm | 1_mais_ipca | IPCA | IGP-M | outro
parcelas_padrao int DEFAULT 60
percentual_sinal_padrao numeric DEFAULT 10
percentual_chaves_padrao numeric DEFAULT 20
data_prevista_entrega date
observacoes_publicas text
observacoes_internas text
ativo_publico boolean DEFAULT true
created_at timestamptz DEFAULT now()
updated_at timestamptz DEFAULT now()
```

### Tabela `unidades`
```sql
id uuid PRIMARY KEY DEFAULT uuid_generate_v4()
empreendimento_id uuid REFERENCES empreendimentos NOT NULL
unidade text NOT NULL
bloco text
pavimento text -- Térreo | 1º Pavimento | 2º Pavimento | Frente Mar - Térreo | Frente Mar - 1º Pavimento | Frente Mar - 2º Pavimento
tipo text, categoria text
area_construida numeric, area_privativa_externa numeric
area_total numeric, area_terreno numeric
quartos int, suites int, banheiros int, vagas int
posicao text -- frente_mar | lateral | nascente | poente | terreo | rooftop | outra
valor_imovel numeric
percentual_sinal numeric DEFAULT 10
valor_sinal numeric
quantidade_parcelas int DEFAULT 60
valor_parcela numeric
quantidade_intercaladas int DEFAULT 10
periodicidade_intercaladas text DEFAULT 'semestrais'
valor_intercalada numeric
percentual_chaves numeric DEFAULT 20
valor_chaves numeric
status text DEFAULT 'disponivel' -- disponivel | reservada | vendida | bloqueada | indisponivel
comprador_nome text, corretor_responsavel text
data_reserva date, data_venda date
observacoes_publicas text, observacoes_internas text
destaque boolean DEFAULT false
cor_destaque text
```

### Tabela `propostas`
```sql
id uuid PRIMARY KEY DEFAULT uuid_generate_v4()
unidade_id uuid REFERENCES unidades NOT NULL
empreendimento_id uuid REFERENCES empreendimentos NOT NULL
-- Comprador 1
comprador1_nome text NOT NULL
comprador1_cpf text, comprador1_rg text
comprador1_profissao text, comprador1_email text, comprador1_telefone text
comprador1_nascimento date
comprador1_estado_civil text -- solteiro | casado | divorciado | viuvo | uniao_estavel
-- Cônjuge (preenchido se casado/união estável)
conjuge_nome text, conjuge_cpf text, conjuge_rg text
conjuge_profissao text, conjuge_email text, conjuge_telefone text
conjuge_nascimento date
-- Comprador 2 (opcional)
comprador2_nome text, comprador2_cpf text, comprador2_rg text
comprador2_profissao text, comprador2_email text, comprador2_telefone text
comprador2_nascimento date, comprador2_estado_civil text
-- Corretor
corretor_nome text, corretor_cpf_cnpj text, corretor_creci text
corretor_email text, corretor_telefone text, imobiliaria_nome text
-- Pagamento
segue_tabela boolean DEFAULT true
valor_proposto numeric
valor_sinal numeric, valor_parcela numeric
quantidade_parcelas int, quantidade_intercaladas int
periodicidade_intercaladas text
valor_intercalada numeric, valor_total_intercaladas numeric
valor_chaves numeric
observacoes_pagamento text
-- Status
status_proposta text DEFAULT 'pendente' -- pendente | aprovada | recusada | cancelada
observacoes text
created_at timestamptz DEFAULT now()
updated_at timestamptz DEFAULT now()
```

### Tabela `vendas`
```sql
id uuid PRIMARY KEY DEFAULT uuid_generate_v4()
empreendimento_id uuid REFERENCES empreendimentos
unidade_id uuid REFERENCES unidades
comprador_nome text, comprador_documento text
corretor_responsavel text
data_venda date
valor_venda numeric, valor_sinal numeric
valor_parcelas numeric, valor_intercaladas numeric, valor_chaves numeric
forma_pagamento text, comissao numeric
status_contrato text DEFAULT 'aguardando_contrato'
-- aguardando_contrato | contrato_enviado | contrato_assinado | distrato
observacoes text
```

### Tabela `profiles`
```sql
id uuid PRIMARY KEY DEFAULT uuid_generate_v4()
user_id uuid REFERENCES auth.users
nome text, email text, telefone text
role text DEFAULT 'visualizador'
-- admin_geral | admin_comercial | financeiro | visualizador
ativo boolean DEFAULT true
```

### Tabela `configuracoes_tabela`
```sql
id uuid PRIMARY KEY DEFAULT uuid_generate_v4()
empreendimento_id uuid REFERENCES empreendimentos
colunas_visiveis text[]
agrupar_por text -- ex: 'pavimento'
ordenar_por text
mostrar_unidades_vendidas boolean DEFAULT true
mostrar_valores_reservadas boolean DEFAULT false
mostrar_valores_vendidas boolean DEFAULT false
```

### Views
```sql
-- vw_resumo_empreendimento: totais por empreendimento
-- Colunas: id, nome, cidade, total_unidades, disponiveis, reservadas, vendidas,
--          vgv_total, vgv_vendido, vgv_disponivel, percentual_vendido, ticket_medio

-- vw_dashboard: dados consolidados globais
```

### Trigger — Aprovação de Proposta
```sql
-- Quando proposta aprovada → unidade vira 'reservada'
-- Quando proposta cancelada/recusada → unidade volta para 'disponivel'
CREATE OR REPLACE FUNCTION atualizar_unidade_por_proposta()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status_proposta = 'aprovada' AND OLD.status_proposta != 'aprovada' THEN
    UPDATE unidades SET status = 'reservada' WHERE id = NEW.unidade_id;
  END IF;
  IF NEW.status_proposta IN ('cancelada', 'recusada') AND OLD.status_proposta NOT IN ('cancelada', 'recusada') THEN
    UPDATE unidades SET status = 'disponivel' WHERE id = NEW.unidade_id;
  END IF;
  RETURN NEW;
END;
$$;
```

---

## COMPONENTES PRINCIPAIS

### admin/layout.tsx — Sidebar + Auth
```tsx
'use client'
// Verifica sessão via supabase.auth.getSession()
// Se não autenticado e não está em /admin/login → redireciona para /admin/login
// Sidebar com: logo Casa Forte, nav links, botão sair
// NAV: Dashboard, Empreendimentos, Unidades, Vendas, Relatórios, Propostas, Usuários
```

### TabelaPublica.tsx — Tabela Pública
```tsx
// Agrupamento por pavimento com ordem customizada:
const ORDEM_PAVIMENTOS = [
  'Térreo', '1º Pavimento', '2º Pavimento',
  'Frente Mar - Térreo', 'Frente Mar - 1º Pavimento', 'Frente Mar - 2º Pavimento',
]
// Botão "📋 Proposta" na coluna final apenas para unidades 'disponivel'
// Valores formatados com 2 casas decimais
// Sem min-width — tabela responsiva
```

---

## FLUXO DE PROPOSTA

```
1. Corretor acessa tabela pública
2. Clica em "📋 Proposta" na unidade desejada
3. Preenche formulário em /empreendimentos/[slug]/proposta/[unidadeId]
4. Somatório validado em tempo real (deve = valor proposto)
5. Ao enviar: salva no banco → tela de sucesso
6. Tela de sucesso: botão WhatsApp + botão PDF
7. Admin recebe proposta em /admin/propostas
8. Admin aprova → unidade vira 'reservada' (trigger automático)
9. Admin recusa/cancela → unidade volta para 'disponivel'
```

---

## UPLOAD DE IMAGENS

```tsx
// Bucket: 'empreendimentos' (público no Supabase Storage)
// Path: {empreendimento_id}-{campo}.{ext}
// Ex: 450b9f7b-capa.jpg

const supabase = createClient()
await supabase.storage.from('empreendimentos').upload(path, file, { upsert: true })
const { data } = supabase.storage.from('empreendimentos').getPublicUrl(path)
setForm(f => ({ ...f, [field]: data.publicUrl }))
```

---

## GERAÇÃO DE PDF/IMPRESSÃO

```tsx
// Rota: /admin/propostas/[id]/pdf/route.ts
// Retorna HTML estilizado com botão de impressão
// window.print() com @media print escondendo o botão
// Logo com filter: brightness(0) invert(1) para fundo escuro

return new NextResponse(html, {
  headers: { 'Content-Type': 'text/html; charset=utf-8' }
})
```

---

## DADOS CADASTRADOS — UMÁ Milagres

```
ID: 450b9f7b-080a-4c94-9647-6f662854720e
Slug: uma-milagres
Cidade: São Miguel dos Milagres, AL
Total: 74 unidades
Disponíveis: 30 | Reservadas: 8 | Vendidas: 36
VGV Total: ~R$ 24.655.730,00

Estrutura de pavimentos:
- Lateral Térreo: L1-L10, R1-R10
- Lateral 1º Pavimento: L101-L106, R101-R106
- Lateral 2º Pavimento: L201-L211, R201-R211
- Frente Mar Térreo: A01-A04, B01-B04
- Frente Mar 1º Pavimento: A101, A102, B101, B102
- Frente Mar 2º Pavimento: A201-A204, B201-B204

Configuração: agrupar_por = 'pavimento'
Índice: INCC-M até entrega, 1% + IGP-M após
```

---

## O QUE ESTÁ FUNCIONANDO ✅

- [x] Site público com tabela de vendas em produção
- [x] Agrupamento por pavimento com ordem customizada
- [x] Botão "Proposta" visível para unidades disponíveis
- [x] Formulário de proposta completo (comprador, cônjuge, 2º comprador, corretor, pagamento)
- [x] Validação do somatório de pagamentos em tempo real
- [x] Notificação via WhatsApp após envio de proposta
- [x] PDF/impressão da proposta com logo Casa Forte
- [x] Área admin completa (dashboard, empreendimentos, unidades, vendas, relatórios, usuários, propostas)
- [x] Aprovação/recusa/cancelamento de propostas com trigger automático de status da unidade
- [x] Upload de imagem diretamente para Supabase Storage
- [x] Importação de unidades via CSV
- [x] Domínio tabelas.casaforteinc.com.br funcionando

---

## O QUE FALTA IMPLEMENTAR 🔲

- [ ] **Dashboard** — gráficos Recharts não estão renderizando (componente DashboardCharts.tsx precisa revisão)
- [ ] **Proteção real de rotas por role** — hoje qualquer usuário autenticado vê tudo; implementar verificação de `role` para páginas sensíveis
- [ ] **Notificação por email** quando proposta é recebida (alternativa ao WhatsApp)
- [ ] **Histórico de status** da proposta (log de mudanças)
- [ ] **Editar proposta** após envio (página admin)
- [ ] **Filtros na listagem de propostas** (por status, empreendimento, data)
- [ ] **Página de novo empreendimento** — adicionar upload de imagem (igual ao editar)
- [ ] **Página pública do empreendimento** — melhorar visual com imagem de capa grande
- [ ] **Configurações da tabela** — interface admin para configurar colunas visíveis, agrupamento, etc.

---

## PROBLEMAS CONHECIDOS E SOLUÇÕES

| Problema | Solução |
|---------|---------|
| Tailwind não compila na Vercel | CSS inline em todos os componentes |
| `@react-pdf/renderer` falha no serverless | HTML com `window.print()` |
| Next.js 15 params assíncronos | `use(params)` em server, `useParams()` em client |
| RLS bloqueando operações | DISABLE RLS + GRANT ALL em todas as tabelas |
| Loop de redirect no login | Middleware vazio, auth no layout client-side |
| `window.open` bloqueado pelo browser | `<a href>` em vez de JS para WhatsApp |
| Datas vazias causam erro no Postgres | `field || null` antes de inserir |
| Rafael (dev) atualizou React 18→19 | `"overrides": {"react": "^18.3.1"}` no package.json |

---

## VARIÁVEIS DE AMBIENTE (Vercel)

```env
NEXT_PUBLIC_SUPABASE_URL=https://idjzhzqvfhtfycvmfoen.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

---

## DEPLOY

- Push para `main` no GitHub → Vercel faz deploy automático
- Build command: `npm run build`
- Node version: >= 20.9.0
- Domínio customizado: `tabelas.casaforteinc.com.br` (CNAME na Hostinger apontando para Vercel)

