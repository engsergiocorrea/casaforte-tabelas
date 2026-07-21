# Colar documentos do WhatsApp na proposta

## Objetivo
Permitir que o corretor **copie uma imagem** (WhatsApp Web/Desktop, navegador, Finder) e **cole** (⌘V / Ctrl+V) direto na área de documentos da proposta, entrando no mesmo fluxo dos arquivos selecionados.

## Comportamento anterior
- Apenas `<input type="file">` (explorador/galeria/câmera).
- Sem arrastar e soltar, sem miniatura (só o nome do arquivo), sem status por arquivo.
- Nome do arquivo no Storage derivava do **nome original** (podia conter dado pessoal).
- Limites só no cliente (40 MB/arquivo, corte silencioso em 6); servidor validava apenas o prefixo do caminho.

## Comportamento novo
- **Colar (⌘V / Ctrl+V)** imagens na área de documentos (desktop).
- **Arrastar e soltar** arquivos na mesma área.
- **Fila única** para todas as origens (`addFiles(files, source)`).
- **Miniatura**, origem ("Colado da área de transferência", "Selecionado do computador"…), tamanho, status e remoção por item.
- **Nomes opacos** no Storage: `documento-{uuid}.{ext}` — extensão vem da allowlist de MIME.
- **Limites centralizados** aplicados no cliente **e** revalidados no servidor.
- A IA **não** é acionada automaticamente: só no clique em **"Ler documentos com IA"**.

## Arquivos
**Criados**
- `src/lib/documentos-proposta.ts` — constantes, allowlist de MIME, nome seguro, formato do caminho, mensagens de erro.
- `docs/melhorias-tabelas/colar-documentos-whatsapp.md` — este documento.

**Alterados**
- `src/app/(public)/empreendimentos/[slug]/proposta/[unidadeId]/UploadDocumentosProposta.tsx` — fila única, colagem, drag & drop, preview, acessibilidade, feature flag.
- `src/app/api/extrair-documentos/route.ts` — revalidação de limites, formato do caminho e tipo.

## Fluxo de dados (inalterado no essencial — "storage-first")
```
Navegador (colar/arrastar/selecionar)
  → valida tipo, tamanho, quantidade
  → upload direto ao bucket privado `proposta-documentos`
     path: documentos/{sessionId}/documento-{uuid}.{ext}   (upsert: false)
  → POST /api/extrair-documentos { paths }        ← só caminhos, nunca base64
  → servidor valida caminho/limites, baixa com service role
  → Gemini File API (upload → generateContent → delete no finally)
  → { campos } → pré-preenche o formulário
```

## Validações
| Onde | O quê |
|---|---|
| Cliente | MIME na allowlist, arquivo vazio, tamanho por arquivo, tamanho do conjunto, quantidade |
| Servidor | quantidade, caminhos repetidos, **formato do caminho** (regex com uuid + extensão), tipo pela extensão controlada, arquivo vazio, tamanho por arquivo e do conjunto |

Limites (em `src/lib/documentos-proposta.ts`): **5 arquivos**, **40 MB por arquivo**, **80 MB no conjunto**.
Tipos aceitos: **JPEG, PNG, WEBP, PDF**. Rejeitados: GIF, SVG, HEIC, compactados, executáveis.

## Segurança e privacidade
- Bucket **privado**; o corretor não consegue ler de volta o que enviou.
- Nome do arquivo no Storage **não** usa nome/CPF/CRECI/unidade.
- Caminho é validado por **regex** no servidor (o navegador não pode apontar para qualquer lugar).
- `upsert: false` (não sobrescreve).
- Logs sem conteúdo de documento, sem PII e sem resposta bruta da IA — apenas mensagem de erro técnica no servidor.
- Colagem capturada **apenas** na área de documentos (não é listener global) — não interfere em colar texto nos campos.

## Acessibilidade
Área com `tabIndex={0}`, `role="group"` e `aria-label`; indicador visível **"Pronto para colar"** ao focar; erros com `role="alert"` e sucesso com `role="status"`; botões de remover com `aria-label`; estados não dependem só de cor.

## Compatibilidade
Colagem funciona onde o navegador expõe arquivos em `clipboardData.items` (Chrome/Edge/Safari desktop). Onde não houver, **o file picker e o drag & drop continuam funcionando** e nenhum erro técnico é exibido. No celular a colagem não é requisito — aparecem **Tirar foto**, **Galeria** e **Selecionar arquivo**.

## Limitações conhecidas (fases seguintes)
- Sem **rotação** de imagem.
- Sem **hash/dedup** (SHA-256) — duplicidade só é evitada por caminho repetido no envio.
- Sem validação de **magic bytes** no servidor (hoje o tipo vem do caminho controlado).
- Sem **metadados de confiança** da IA nem tela de revisão campo a campo (os campos são aplicados e o corretor confere no formulário).
- Sem **rate limit** dedicado e sem eventos de observabilidade.
- **Sem testes automatizados**: o projeto não tem vitest/jest/testing-library/playwright configurados.

## Rollback
Feature flag: `NEXT_PUBLIC_ENABLE_DOCUMENT_PASTE=false` desativa **apenas a colagem** (esconde as instruções e ignora o evento). Upload por seleção, drag & drop e leitura por IA continuam funcionando. **Não é necessária migration** — nada muda no banco. Para reverter por completo, `git revert` dos commits desta feature.

## Como usar (equipe)
1. Abra o documento no WhatsApp.
2. Copie a imagem.
3. Clique na área de documentos da proposta.
4. Pressione **⌘ + V** (Mac) ou **Ctrl + V** (Windows).
5. Confira a miniatura.
6. Marque a autorização do cliente.
7. Clique em **Ler documentos com IA**.
8. Revise os campos preenchidos.
