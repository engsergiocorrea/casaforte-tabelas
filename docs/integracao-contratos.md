# Integração Tabelas → Contratos (API interna)

Preparação para o futuro módulo **Contratos** consumir propostas do Tabelas sem
acoplar-se ao schema interno.

## Supabase usado pelo Tabelas

```text
idjzhzqvfhtfycvmfoen   (https://idjzhzqvfhtfycvmfoen.supabase.co)
```

⚠️ É o **mesmo banco do Obras/RDO** (compartilhado). **Não** é o do
Portal/Compras (`cqvehpucomvzletqcyxg`).

## Tabelas comerciais

`empreendimentos` · `unidades` · `propostas` · `vendas` · `reservas` ·
`configuracoes_tabela` (+ views `vw_resumo_empreendimento`, `vw_dashboard`).

A `propostas` é a fonte para gerar contrato. Relacionamentos: proposta →
`unidade_id` → `empreendimento_id`. O **comprador é embutido** na proposta
(`comprador_nome`, `comprador_documento`) — **não** há FK para `clientes`/Portal.

`status_proposta` ∈ `pendente | aprovada | recusada | cancelada`.

## Endpoints internos (somente leitura)

Todos exigem `Authorization: Bearer <TABELAS_INTERNAL_API_KEY>` — sem header ou
chave inválida → `401`; variável ausente → `500` (`TABELAS_INTERNAL_API_KEY
ausente`). Validados em `src/lib/internal-api/auth.ts`; leitura via service role
(`src/lib/internal-api/db.ts`).

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/internal/propostas` | Lista. Filtros: `status` (padrão **aprovada**), `empreendimento_id`, `unidade_id`, `limit` (máx. 500). Campos resumidos. |
| GET | `/api/internal/propostas/[id]` | Detalhe completo p/ contrato (empreendimento, unidade, comprador, cônjuge, corretor, pagamento). `404` se não existir. |
| GET | `/api/internal/unidades/[id]` | Dados da unidade. `404` se não existir. |
| GET | `/api/internal/empreendimentos/[id]` | Dados do empreendimento. `404` se não existir. |

### Campos retornados (detalhe da proposta)
- **empreendimento**: id, nome, slug.
- **unidade**: id, codigo, tipologia, area_privativa, area_externa, valor_imovel, status.
- **comprador_principal** (`comprador1_*`): nome, cpf, rg, profissao, email,
  telefone, nascimento, estado_civil.
- **comprador_adicional** (`comprador2_*`): mesmos campos (segundo comprador,
  quando houver).
- **conjuge**: nome, cpf, rg, profissao, email, telefone, nascimento.
- **corretor**: nome, cpf_cnpj, creci, email, telefone, imobiliaria_nome.
- **pagamento**: valor_imovel, valor_proposto, segue_tabela, valor_sinal,
  mensais_quantidade/valor/total, intercaladas_quantidade/valor/total/periodicidade,
  chaves_valor, observacoes_pagamento. (`*_total` são calculados: quantidade ×
  valor.)
- **Não** são expostas observações internas da proposta.

## Como o Contratos deve consumir

1. Buscar proposta aprovada via `GET /api/internal/propostas?status=aprovada` e
   o detalhe em `GET /api/internal/propostas/[id]`.
2. Ler o **comprador embutido** (nome + documento).
3. (Futuro) Conferir no **Portal** (`cqvehpucomvzletqcyxg`) se já existe cliente
   com aquele CPF/CNPJ:
   - se **não** existir, criar cliente no Portal;
   - se existir, completar dados faltantes;
   - vincular o contrato ao cliente do Portal.
4. Gerar o contrato com os dados de proposta + unidade + empreendimento +
   pagamento.

> A integração com o Portal (passo 3) **não** é feita nesta etapa — apenas
> documentada. Esta etapa não inicia o módulo Contratos.

## Variável de ambiente (cadastrar no Vercel do casaforte-tabelas)

```env
TABELAS_INTERNAL_API_KEY=
```
A chave nunca é logada. Enquanto ausente, os endpoints retornam `500` seguro.
