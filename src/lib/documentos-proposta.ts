// Regras compartilhadas (cliente + servidor) dos documentos anexados à proposta.
// Funções puras — sem dependência de browser ou de Node.

export const MAX_DOCUMENT_FILES = 5
export const MAX_DOCUMENT_FILE_SIZE_BYTES = 40 * 1024 * 1024 // 40 MB por arquivo
export const MAX_DOCUMENT_BATCH_SIZE_BYTES = 80 * 1024 * 1024 // 80 MB no conjunto

// Allowlist real de tipos. `image/*` do input do browser aceita HEIC/GIF/SVG —
// por isso a validação de verdade é esta, não o atributo accept.
export const MIME_EXTENSION_MAP = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
} as const

export type AllowedDocumentMime = keyof typeof MIME_EXTENSION_MAP
export const ALLOWED_DOCUMENT_MIME_TYPES = Object.keys(MIME_EXTENSION_MAP) as AllowedDocumentMime[]

export function isAllowedDocumentMime(mime: string | undefined | null): mime is AllowedDocumentMime {
  return !!mime && (ALLOWED_DOCUMENT_MIME_TYPES as string[]).includes(mime)
}

export type DocumentInputSource = 'paste' | 'drag-drop' | 'file-picker' | 'camera' | 'gallery'

export const SOURCE_LABEL: Record<DocumentInputSource, string> = {
  'paste': 'Colado da área de transferência',
  'drag-drop': 'Arrastado para a área',
  'file-picker': 'Selecionado do computador',
  'camera': 'Capturado pela câmera',
  'gallery': 'Selecionado da galeria',
}

/**
 * Nome seguro para o Storage. NUNCA usa o nome original (pode conter nome do
 * comprador, CPF etc.) — gera um identificador opaco. A extensão vem da
 * allowlist de MIME, não da extensão informada pelo navegador.
 */
export function createSafeDocumentFilename(mime: string, uuid: string): string {
  const ext = isAllowedDocumentMime(mime) ? MIME_EXTENSION_MAP[mime] : 'bin'
  return `documento-${uuid}.${ext}`
}

/** Caminho no bucket. O servidor revalida este formato (ver validateDocumentPath). */
export function buildDocumentPath(sessionId: string, filename: string): string {
  return `documentos/${sessionId}/${filename}`
}

const PATH_RE = /^documentos\/[0-9a-f-]{36}\/documento-[0-9a-f-]{36}\.(jpg|png|webp|pdf)$/i

/** Valida o formato do caminho — impede que o navegador aponte para qualquer lugar. */
export function isValidDocumentPath(path: string): boolean {
  return PATH_RE.test(path)
}

export function formatBytes(n: number): string {
  return n < 1024 * 1024 ? `${Math.round(n / 1024)} KB` : `${(n / 1048576).toFixed(1)} MB`
}

/** Mensagens de erro padronizadas (sem detalhe técnico). */
export const DOC_ERRORS = {
  semImagemNoClipboard: 'Nenhuma imagem foi encontrada na área de transferência.',
  formatoInvalido: 'Formato não permitido. Envie PDF, JPG, PNG ou WEBP.',
  formatoColado: 'A imagem copiada não está em um formato permitido.',
  limiteQuantidade: `Você pode adicionar no máximo ${MAX_DOCUMENT_FILES} documentos.`,
  limiteArquivo: `Cada arquivo pode ter no máximo ${Math.round(MAX_DOCUMENT_FILE_SIZE_BYTES / 1048576)} MB.`,
  limiteConjunto: 'O conjunto de documentos ultrapassa o limite permitido.',
  arquivoVazio: 'O documento parece estar vazio ou corrompido.',
  falhaUpload: 'Não foi possível enviar o documento.',
  falhaLeitura: 'Não foi possível ler os documentos. Tente novamente.',
} as const
